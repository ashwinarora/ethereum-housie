/**
 * No-contact mode: the one place the server learns about it.
 *
 * `NO_CONTACT=true` in the environment produces a deployment with no way to reach the
 * developer: no credit footer, no portfolio link, nothing that names his other sites.
 * Unset, or any other value, is the normal site. See README "No-contact mode".
 *
 * A no-contact server runs no game engine. Games live in one server's memory and are
 * created by one wallet on one contract, so a second engine would corrupt both. It serves
 * the no-contact client and relays Socket.IO to the normal backend instead.
 *
 * Nothing in this file may be sent to the browser: BACKEND_URL names a host that also
 * serves the normal site.
 */
const NO_CONTACT = process.env.NO_CONTACT === 'true'

/** The normal deployment's backend. `NO_CONTACT_BACKEND_URL` overrides it (tests, staging). */
const BACKEND_URL = process.env.NO_CONTACT_BACKEND_URL || 'https://ethereum-housie-production.up.railway.app'

const ROBOTS = 'noindex, nofollow'

/** Express middleware: keeps every response of a no-contact deployment out of search engines. */
function noIndex(req, res, next) {
  res.setHeader('X-Robots-Tag', ROBOTS)
  next()
}

/**
 * Relays `/socket.io` (long-polling requests and the WebSocket upgrade) to BACKEND_URL.
 * Call it before any body parser or catch-all route is registered on `app`.
 */
function proxySocketIo(app, server) {
  const backendHost = new URL(BACKEND_URL).host
  // changeOrigin: the backend's router selects the service by Host header.
  const proxy = require('http-proxy').createProxyServer({ target: BACKEND_URL, changeOrigin: true })

  proxy.on('proxyRes', (proxyRes) => {
    // The backend must not introduce itself: drop any header that names it (a redirect, a cookie domain).
    for (const name of Object.keys(proxyRes.headers)) {
      if (String(proxyRes.headers[name]).includes(backendHost)) delete proxyRes.headers[name]
    }
    proxyRes.headers['x-robots-tag'] = ROBOTS
  })

  // The message can contain the backend's host name, so it goes to the log and never to the client.
  proxy.on('error', (err, req, res) => {
    console.log(`Socket.IO proxy error: ${err.message}`)
    if (res && typeof res.writeHead === 'function') {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain' })
      res.end('Bad gateway')
    } else if (res && typeof res.destroy === 'function') {
      res.destroy()
    }
  })

  app.use('/socket.io', (req, res) => {
    req.url = req.originalUrl // Express strips the mount path; the backend needs it
    proxy.web(req, res)
  })

  server.on('upgrade', (req, socket, head) => {
    if (/^\/socket\.io(\/|\?|$)/.test(req.url)) proxy.ws(req, socket, head)
    else socket.destroy()
  })
}

module.exports = { NO_CONTACT, BACKEND_URL, noIndex, proxySocketIo }
