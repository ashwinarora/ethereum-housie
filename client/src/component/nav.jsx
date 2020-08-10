import React from 'react'
import { Link } from 'react-router-dom'
import './nav.css'

function NavBar() {
    return(
        <nav className="nav-bar">
            <div className="links">
            <Link to="/" className="nav-links">Housie</Link>
            </div>
        </nav>
    )
}

export default NavBar