/**
 * No-contact mode: the one place the client learns about it.
 *
 * `NO_CONTACT=true` in the build environment produces a deployment with no way to reach
 * the developer: no credit footer, no portfolio link, no connection to the normal site.
 * Unset, or any other value, is the normal site. scripts/react-scripts.js passes the
 * variable to Create React App as REACT_APP_SHOWCASE, which webpack replaces with a
 * literal at build time.
 *
 * The `if` below must test that literal directly. webpack then follows only the live
 * branch, so contact.js and all it imports never enter a no-contact bundle. A test on an
 * imported constant such as NO_CONTACT is resolved too late for that: the code would ship.
 *
 * Take contact UI from the exports below and render it only if it is there
 * (`{Footer && <Footer />}`). See README "No-contact mode".
 */
export const NO_CONTACT = process.env.REACT_APP_SHOWCASE === 'true'

let contact = null
if (process.env.REACT_APP_SHOWCASE === 'true') {
  require('./noContact.css')
} else {
  contact = require('./contact')
}

/** The credit footer, or null. */
export const Footer = contact && contact.Footer

/** The portfolio link in the nav bar, or null. */
export const DeveloperLink = contact && contact.DeveloperLink

/** Where the Socket.IO server is. undefined means this page's own origin. */
export const SOCKET_URL = contact ? contact.SOCKET_URL : undefined
