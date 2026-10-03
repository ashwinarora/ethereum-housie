// Builds the client with NO_CONTACT=true, runs the server in no-contact mode and fails if
// anything it serves leads to the developer. Run it with `npm run check:no-contact`.
// See README "No-contact mode".
//
// The server is started without a wallet key and with NO_CONTACT_BACKEND_URL pointed at a
// throwaway Socket.IO server that this script starts itself, so the check never touches
// the real backend. It then requests `/`, an unknown client route, `/robots.txt`,
// `/manifest.json`, every file in client/build and the Socket.IO endpoint (long-polling and
// WebSocket) over HTTP, and scans the headers and body of every response.
//
//   --no-build                    scan the existing client/build instead of rebuilding
//   CHECK_NO_CONTACT_PORT=4851    use this port and the next one instead of two free ports
import { execSync, spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import net from "node:net";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const client = join(root, "client");
const build = join(client, "build");
const require = createRequire(import.meta.url);

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The normal domains of the developer's sites. "showcase.ethhousie.com" contains
// "ethhousie.com", so the match excludes that prefix.
const NORMAL_DOMAINS = [
  "ashwinarora.com",
  "ashdex.app",
  "lizardpoisonspock.com",
  "hltools.tech",
  "ethtactoe.com",
  "socialnetwrk.in",
  "ethhousie.com",
];

const FORBIDDEN = [
  { name: "email address", pattern: /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi },
  { name: "mailto:", pattern: /mailto:/gi },
  { name: "tel:", pattern: /\btel:\+?\d/gi },
  { name: "calendly", pattern: /calendly/gi },
  { name: "t.me link", pattern: /(?<![a-z0-9.-])t\.me\//gi },
  { name: "wa.me link", pattern: /(?<![a-z0-9.-])wa\.me\//gi },
  { name: "telegram", pattern: /telegram/gi },
  { name: "whatsapp", pattern: /whatsapp/gi },
  { name: "linkedin", pattern: /linkedin/gi },
  { name: "x.com / twitter.com", pattern: /(?<![a-z0-9.-])(?:x|twitter)\.com/gi },
  { name: "github.com/ashwinarora", pattern: /github\.com\/ashwinarora/gi },
  { name: "discord", pattern: /discord/gi },
  { name: "my name", pattern: /ashwin|arora/gi },
  { name: "hosting domain", pattern: /railway\.app|herokuapp/gi },
  { name: "credit copy", pattern: /Developed By|Developer Portfolio/gi },
  { name: "my logo", pattern: /myLogo/gi },
  { name: "source map", pattern: /sourceMappingURL/gi },
  // The mode must not announce itself: the client variable is REACT_APP_SHOWCASE for this reason.
  { name: "the flag's own name", pattern: /no[-_ ]?contact/gi },
  ...NORMAL_DOMAINS.map((domain) => ({
    name: `normal domain ${domain}`,
    pattern: new RegExp(`(?<!showcase\\.)(?<![a-z0-9-])${escape(domain)}`, "gi"),
  })),
];

// Matches that are known not to lead to the developer. Each entry is a hole in the check:
// keep the list short, match the surrounding text and not just the hit, and say why.
// `context` is tested against the 60 characters either side of the hit.
const ALLOWED = [
  // web3 ships the Ethereum networks' public node-discovery records ("enrtree://<key>@<dns name>").
  // A node key at a DNS name, not a mailbox, and nothing of the developer's.
  { what: "email address", match: /^[A-Z2-7]+@all\.[a-z]+\.ethdisco\.net$/, context: /enrtree:\/\/[A-Z2-7]+@all\.[a-z]+\.ethdisco\.net/ },
];

/** File names that must not be in a no-contact build, whatever the files contain. */
const FORBIDDEN_FILES = [/\.map$/i, /myLogo/i];

const findings = [];
const fail = (where, what, match, context) => findings.push({ where, what, match, context });

function scan(where, text) {
  for (const { name, pattern } of FORBIDDEN) {
    for (const hit of text.matchAll(pattern)) {
      const context = text.slice(Math.max(0, hit.index - 60), hit.index + hit[0].length + 60);
      const allowed = ALLOWED.some((entry) => entry.what === name && entry.match.test(hit[0]) && entry.context.test(context));
      if (!allowed) fail(where, name, hit[0], context.replace(/\s+/g, " "));
    }
  }
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

function freePort() {
  return new Promise((done, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
}

/** One HTTP request. The body comes back as latin1 so that binary files can be scanned too. */
function get(port, path, headers = {}) {
  return new Promise((done, reject) => {
    const request = http.get({ host: "127.0.0.1", port, path, headers, agent: false }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () =>
        done({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString("latin1") }),
      );
    });
    request.setTimeout(10000, () => request.destroy(new Error(`timed out: GET ${path}`)));
    request.on("error", reject);
  });
}

/** Opens a WebSocket by hand and resolves with the 101 response and the first frame's text. */
function openWebSocket(port, path) {
  return new Promise((done, reject) => {
    const key = randomBytes(16).toString("base64");
    const request = http.request({
      host: "127.0.0.1",
      port,
      path,
      agent: false,
      headers: { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Version": "13", "Sec-WebSocket-Key": key },
    });
    request.setTimeout(10000, () => request.destroy(new Error("timed out: WebSocket upgrade")));
    request.on("error", reject);
    request.on("response", (response) => reject(new Error(`WebSocket upgrade answered HTTP ${response.statusCode}`)));
    request.on("upgrade", (response, socket, head) => {
      const accept = createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
      let received = head;
      const finish = () => {
        // An unmasked server frame: one byte of flags, one of length (under 126 here), then the text.
        if (received.length < 2 || received.length < 2 + (received[1] & 0x7f)) return;
        socket.destroy();
        done({ response, accept, frame: received.subarray(2, 2 + (received[1] & 0x7f)).toString("utf8") });
      };
      socket.on("data", (chunk) => {
        received = Buffer.concat([received, chunk]);
        finish();
      });
      socket.on("error", reject);
      finish();
    });
    request.end();
  });
}

function checkResponse(where, response, { html = false } = {}) {
  if (response.status !== 200) fail(where, "unexpected status", String(response.status));
  const robots = String(response.headers["x-robots-tag"] ?? "");
  if (!/noindex/i.test(robots) || !/nofollow/i.test(robots)) {
    fail(where, "missing header", "X-Robots-Tag: noindex, nofollow", `got ${JSON.stringify(robots)}`);
  }
  const head = Object.entries(response.headers).map(([name, value]) => `${name}: ${value}`).join("\n");
  scan(`${where} (headers)`, head);
  scan(where, response.body);
  if (html && !/<meta\s+name="robots"\s+content="noindex,\s*nofollow"/i.test(response.body)) {
    fail(where, "missing noindex", '<meta name="robots" content="noindex, nofollow">');
  }
}

// ---------------------------------------------------------------------------------------

if (!process.argv.includes("--no-build")) {
  if (!existsSync(join(client, "node_modules"))) {
    console.error("client/node_modules is missing. Run `npm run install-client` first.");
    process.exit(1);
  }
  // CI=false as in `railway-build`: lint warnings must not fail the build.
  execSync("npm run build", { cwd: client, stdio: "inherit", env: { ...process.env, NO_CONTACT: "true", CI: "false" } });
}
if (!existsSync(join(build, "index.html"))) {
  console.error("client/build/index.html is missing. Run without --no-build.");
  process.exit(1);
}

const basePort = Number(process.env.CHECK_NO_CONTACT_PORT) || 0;
const stubPort = basePort || (await freePort());
const serverPort = basePort ? basePort + 1 : await freePort();

// The throwaway backend: a real Socket.IO server, as the normal deployment runs.
let stubConnections = 0;
const stub = http.createServer((request, response) => {
  response.writeHead(404);
  response.end();
});
require("socket.io")(stub).on("connection", () => (stubConnections += 1));
await new Promise((done) => stub.listen(stubPort, "127.0.0.1", done));
const stubUrl = `http://127.0.0.1:${stubPort}`;
// The backend's address must stay on the server. In production that is a hosting domain,
// already forbidden above; here it is the stub.
FORBIDDEN.push({ name: "backend address", pattern: new RegExp(escape(`127.0.0.1:${stubPort}`), "g") });

// The server, with nothing in its environment but the flag: no wallet key, no contract
// address, no Railway environment name.
const env = { ...process.env, NO_CONTACT: "true", PORT: String(serverPort), NO_CONTACT_BACKEND_URL: stubUrl };
for (const name of ["PRIVATE_KEY", "CONTRACT_ADDRESS", "RAILWAY_ENVIRONMENT_NAME"]) delete env[name];
const server = spawn(process.execPath, ["app.js"], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
let serverLog = "";
server.stdout.on("data", (chunk) => (serverLog += chunk));
server.stderr.on("data", (chunk) => (serverLog += chunk));
let serverExit = null;
server.on("exit", (code) => (serverExit = code ?? 1));

let scanned = 0;
try {
  for (let attempt = 0; ; attempt += 1) {
    if (serverExit !== null) throw new Error(`the server exited with code ${serverExit}`);
    if (await get(serverPort, "/").then(() => true, () => false)) break;
    if (attempt === 100) throw new Error("the server did not start listening");
    await new Promise((done) => setTimeout(done, 100));
  }
  if (!serverLog.includes("no-contact mode")) fail("server log", "the server did not start in no-contact mode", serverLog.trim());

  // Pages. `/robots.txt` and unknown routes are answered with the app, as in normal mode.
  for (const path of ["/", "/some/unknown/route"]) checkResponse(`GET ${path}`, await get(serverPort, path), { html: true });
  for (const path of ["/robots.txt", "/manifest.json"]) checkResponse(`GET ${path}`, await get(serverPort, path));
  scanned += 4;

  // Every built file, as the server sends it.
  for (const file of walk(build)) {
    const path = `/${relative(build, file).split(sep).join("/")}`;
    for (const pattern of FORBIDDEN_FILES) {
      if (pattern.test(path)) fail(path, "file must not be in the build", path);
    }
    scan(`${path} (file name)`, path);
    checkResponse(`GET ${path}`, await get(serverPort, path), { html: path === "/index.html" });
    scanned += 1;
  }

  // Socket.IO through the proxy: the long-polling handshake, then a WebSocket.
  const polling = await get(serverPort, "/socket.io/?EIO=3&transport=polling", { Origin: `http://127.0.0.1:${serverPort}` });
  checkResponse("GET /socket.io/ (polling)", polling);
  if (!polling.body.includes('"sid"')) fail("GET /socket.io/ (polling)", "no Socket.IO handshake came through the proxy", polling.body.slice(0, 80));
  const socket = await openWebSocket(serverPort, "/socket.io/?EIO=3&transport=websocket");
  const upgradeHead = Object.entries(socket.response.headers).map(([name, value]) => `${name}: ${value}`).join("\n");
  scan("WebSocket /socket.io/ (headers)", upgradeHead);
  scan("WebSocket /socket.io/", socket.frame);
  if (socket.response.headers["sec-websocket-accept"] !== socket.accept || !socket.frame.includes('"sid"')) {
    fail("WebSocket /socket.io/", "no Socket.IO handshake came through the proxy", socket.frame.slice(0, 80));
  }
  if (stubConnections !== 2) fail("proxy", "the stand-in backend did not receive both Socket.IO connections", `${stubConnections} of 2`);
  scanned += 2;
} catch (error) {
  fail("check", "could not complete", error.message, serverLog.trim());
} finally {
  server.kill();
  stub.close();
}

if (findings.length > 0) {
  console.error(`\ncheck:no-contact FAILED: ${findings.length} finding(s)\n`);
  for (const finding of findings) {
    console.error(`  ${finding.where}: ${finding.what}: ${JSON.stringify(finding.match)}`);
    if (finding.context) console.error(`      …${finding.context}…`);
  }
  console.error("\nContact content belongs in client/src/contact.js (see client/src/noContact.js); the backend's address stays in noContact.js.");
  process.exit(1);
}

console.log(`check:no-contact passed: ${scanned} responses scanned (pages, every file in client/build, Socket.IO over polling and WebSocket)`);
process.exit(0);
