import React from 'react'
import { Link } from 'react-router-dom'
import './nav.css'
import { DeveloperLink } from '../noContact'

function NavBar() {
    return (
        <nav className="nav-bar">
            <div id="links">
                <Link to="/" id="heading" className="nav-links">Housie</Link>
            </div>
            {DeveloperLink && <DeveloperLink />}
        </nav>
    )
}

export default NavBar
