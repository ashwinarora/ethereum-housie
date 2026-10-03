// Runs `react-scripts <command>` (start or build) for the mode that NO_CONTACT selects.
// See README "No-contact mode" at the repository root.
//
// Create React App passes only REACT_APP_* variables to the client, so NO_CONTACT is
// handed on as REACT_APP_SHOWCASE. It is always set, to "true" or "false": webpack then
// sees a literal in both modes and keeps one branch of the test in src/noContact.js.
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const command = process.argv[2]
const noContact = process.env.NO_CONTACT === 'true'

const env = { ...process.env, REACT_APP_SHOWCASE: String(noContact) }
// Source maps hold the original source, including the code a no-contact build leaves out.
if (noContact) env.GENERATE_SOURCEMAP = 'false'

const reactScripts = require.resolve('react-scripts/bin/react-scripts.js')
const result = spawnSync(process.execPath, [reactScripts, command, '--openssl-legacy-provider'], { stdio: 'inherit', env })
if (result.status !== 0) process.exit(result.status === null ? 1 : result.status)

if (command === 'build' && noContact) {
  const file = path.join(__dirname, '..', 'build', 'index.html')
  fs.writeFileSync(file, noContactHtml(fs.readFileSync(file, 'utf8')))
  console.log('No-contact build: index.html is noindex and its Content-Security-Policy names no other site.')
}

/** index.html for a no-contact build. Throws if the page no longer has the tags it rewrites. */
function noContactHtml(html) {
  // public/index.html allows images from the developer's own site; here only this site's.
  let policies = 0
  html = html.replace(/(<meta http-equiv="Content-Security-Policy" content=")([^"]*)(")/g, (tag, open, policy, close) => {
    policies += 1
    return open + policy.replace(/\s+https?:\/\/[^\s;"]+/g, '') + close
  })
  if (policies !== 1) throw new Error(`Expected one Content-Security-Policy meta tag in build/index.html, found ${policies}`)

  if (!html.includes('<title>')) throw new Error('Expected a <title> in build/index.html')
  return html.replace('<title>', '<meta name="robots" content="noindex, nofollow"><title>')
}
