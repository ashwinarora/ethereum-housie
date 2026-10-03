/**
 * Everything in the client that leads to the developer or to the normal deployment.
 *
 * Only noContact.js may import this file, and it does so behind the build-time flag, so
 * this file and everything reachable only through it (components, stylesheets, images) is
 * left out of a no-contact build. Add new contact content here. See README "No-contact mode".
 */
export { default as Footer } from './component/Footer'
export { default as DeveloperLink } from './component/DeveloperLink'

/** The normal deployment's Socket.IO server. */
export const SOCKET_URL = 'https://ethhousie.com/'
