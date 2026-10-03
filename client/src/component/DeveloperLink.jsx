import React from 'react'
import './developerLink.css'

// The portfolio link in the nav bar. Normal builds only: import it through ../contact.js.
function DeveloperLink() {
    return (
        <a id="dev" className="nav-links" href="https://ashwinarora.com/" target="_blank" rel="noreferrer">
            <div id="port">
                <div>
                    Developer Portfolio
                </div>
                <svg style={{width: "2rem", height: "2rem"}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </div>
        </a>
    )
}

export default DeveloperLink
