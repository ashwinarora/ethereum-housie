# Housie

Multiplayer Housie (Bingo) played for a ticket price held in escrow by a smart contract on BSC testnet. Players pick 15 numbers, pay for the ticket through MetaMask, and the server draws a number every second until one ticket is complete; the contract pays the winner.

## Layout

| Path | Contents |
| --- | --- |
| `app.js` | Express 4 + Socket.IO 2 server. Creates games on the contract with the server wallet, keeps them in memory, draws the numbers, and serves the built client |
| `noContact.js` | Server side of [no-contact mode](#no-contact-mode) |
| `client/` | Create React App client (React 16, web3, socket.io-client) |
| `contract/Housie.sol`, `contractData.js` | The contract and its ABI |
| `scripts/check-no-contact.mjs` | `npm run check:no-contact` |

## Run it

```bash
npm install                 # server
npm run install-client      # client
npm run build               # client/build
npm start                   # node app.js, on $PORT or 5001
```

The server reads these variables (a `.env` file in the root works too):

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on. Default 5001 |
| `PRIVATE_KEY` | Key of the server wallet that creates and ends games. Required, except in no-contact mode |
| `CONTRACT_ADDRESS` | The contract's address, sent to players so that they can buy a ticket |
| `RAILWAY_ENVIRONMENT_NAME` | Set by Railway. `production` makes the server serve `client/build`; with any other value it serves Socket.IO only |
| `NO_CONTACT` | `true` selects [no-contact mode](#no-contact-mode) |

**Run only one normal server.** A game's place in the server's memory is derived from its id on the contract, counted from the moment the server started, and every transaction comes from the one server wallet. A second server on the same contract breaks that numbering for both and competes for the wallet's nonce.

For work on the client alone, `cd client && npm start` serves it on port 3000. It connects to the live server, whose address is in `client/src/contact.js`.

On Railway the build command is `npm run railway-build` and the start command is `node app.js`.

## No-contact mode

This repo builds two deployments from the same branch. The only difference between them is one environment variable, set for the build and for the server:

| `NO_CONTACT` | Deployment | Result |
| --- | --- | --- |
| unset, or anything but `true` | `ethhousie.com` | The normal site |
| `true` | `showcase.ethhousie.com` | Identical, except a visitor has no way to contact me or find my contact details |

In no-contact mode the client has no credit footer (the "Developed By" line, my logo, LinkedIn and GitHub links), no "Developer Portfolio" link in the nav bar, no mention of my other sites in its Content-Security-Policy, and no source maps. The page is `noindex, nofollow`, in a meta tag and in an `X-Robots-Tag` header on every response. All of it is decided when the client is built, so the contact content is absent from the JavaScript, the CSS and the image files rather than hidden.

A no-contact server does not run the game. Because only one server may (see above), it serves the no-contact client and relays `/socket.io`, long-polling and WebSocket, to the normal server. It needs no wallet key, signs nothing and never calls the contract or the price API. The no-contact client connects to the origin it was loaded from, so the normal server's address never reaches the browser.

### Where it lives

| File | Role |
| --- | --- |
| `client/src/noContact.js` | **The client flag.** Exports `NO_CONTACT`, and the contact UI (`Footer`, `DeveloperLink`) and `SOCKET_URL`, which are `null`/`undefined` in no-contact mode. The only place the client learns which deployment it is |
| `client/src/contact.js` | Everything in the client that leads to me or to the normal site. Imported only by `noContact.js`, behind the flag, so it and whatever only it imports stay out of a no-contact build |
| `client/src/noContact.css` | Loaded in no-contact mode only: gives the pages the space the fixed footer used |
| `client/scripts/react-scripts.js` | Runs `react-scripts start` or `build`. Passes `NO_CONTACT` on as `REACT_APP_SHOWCASE`, the only form Create React App exposes to the client. In no-contact mode it also turns source maps off and rewrites `build/index.html` (robots meta tag, Content-Security-Policy) |
| `noContact.js` | **The server flag.** Exports `NO_CONTACT`, the `X-Robots-Tag` middleware, the Socket.IO relay and the normal server's address |
| `app.js` | Uses `noContact.js` to serve the client, relay Socket.IO and skip the game engine |
| `scripts/check-no-contact.mjs` | `npm run check:no-contact` |

### Rules for future changes

1. **Anything that leads to me goes through `client/src/contact.js`**: a link, a handle, my name or logo, an address of one of my normal sites. Put it in a component of its own, export that from `contact.js`, re-export it from `noContact.js` and render it as `{Footer && <Footer />}`. Do not import such a component from anywhere else: one direct import puts it back in the no-contact bundle.
2. **Do not gate content on the `NO_CONTACT` constant.** `{!NO_CONTACT && <a href="…">}` hides the link but can leave its text in the bundle, because webpack decides which modules to include before that constant is known. Only the test on `process.env.REACT_APP_SHOWCASE` in `noContact.js` removes code, and it removes whole modules. Use `NO_CONTACT` for behaviour and for wording that has no contact detail in either form.
3. **Images and stylesheets follow their component.** Import them from the component that `contact.js` exports and they are left out with it. `Footer.css` is the exception: it has only layout rules and is imported by `App.js`, which keeps the normal build's stylesheet byte-for-byte what it was.
4. **Never send the normal server's address to the browser.** It lives in `noContact.js` at the root and in `client/src/contact.js`, nowhere else. A no-contact client must only ever talk to its own origin.
5. **The no-contact server must never run the game engine**, and no second normal server may be started: see "Run only one normal server".
6. **If the layout changes, check both modes.** `client/src/noContact.css` assumes pages are `margin-top: 10vh; min-height: 80vh` with a fixed footer below them.
7. **Run `npm run check:no-contact` before pushing.** It builds the client with `NO_CONTACT=true`, starts the server in no-contact mode without a wallet key and with a stand-in for the normal server, requests `/`, an unknown route, `/robots.txt`, `/manifest.json`, every file in `client/build` and the Socket.IO endpoint, and fails on email addresses, `mailto:`, `tel:`, Calendly, Telegram, WhatsApp, LinkedIn, X/Twitter, Discord, my GitHub, my name, the credit copy, hosting domains, source maps, the normal domains of my sites, or a missing `noindex`. It scans text, not pixels: look at new images yourself. There is no CI in this repo, so this is the check.

The script's allowlist has one entry, for the Ethereum networks' node-discovery records that web3 ships (`enrtree://<key>@all.mainnet.ethdisco.net`), which look like email addresses. Every entry is a hole in the check: add one only for third-party text, match its surroundings, and say why.

### Deploying it

Set `NO_CONTACT=true` on the service and deploy the default branch with the same build and start commands as the normal service. Nothing else is required: no `PRIVATE_KEY`, no `CONTRACT_ADDRESS`, and the Railway environment may have any name.

One optional variable exists for testing, and is ignored unless `NO_CONTACT=true`:

| Variable | Purpose |
| --- | --- |
| `NO_CONTACT_BACKEND_URL` | The server to relay Socket.IO to, instead of the normal one. Point it at a local Socket.IO 2 server to try the mode without touching live games |

To try it locally:

```bash
NO_CONTACT=true npm run build
NO_CONTACT=true NO_CONTACT_BACKEND_URL=http://localhost:5002 PORT=5001 npm start
```

Without `NO_CONTACT_BACKEND_URL` the local server relays to the live one, and opening the page asks it for a game like any visitor would.
