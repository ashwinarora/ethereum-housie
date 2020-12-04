import React from 'react'
import { Link } from 'react-router-dom'
import './nav.css'

function NavBar() {
    return (
        <nav className="nav-bar">
            <div id="links">
                <Link to="/" id="heading" className="nav-links">Housie</Link>
            </div>
            <a id="dev" className="nav-links" href="https://ashwinarora.com/" target="_blank">
                <div id="port">
                    <div>
                        Developer Portfolio
                    </div>
                    <svg style={{width: "2rem", height: "2rem"}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
            </a>
        </nav>
    )
}

export default NavBar