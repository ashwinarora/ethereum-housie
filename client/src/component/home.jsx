import React from 'react'
import { Link } from 'react-router-dom'
import './home.css'
import Timer from './timer.jsx'
import spinner from  './spinner.gif'

function Home(props) {
    return (
        <div className="home">
            <div className="game-info">
                <div className="game-heading">Welcome To Housie!</div>
                {
                    (!props.gameEscrow)
                    ? 
                    <>
                        <img width="30%" height="50%" src={spinner} style={{objectFit: "cover"}} alt="Loading..." ></img>
                        <div>New Game is being created, please wait.</div>
                    </>
                    :
                    <>
                        <div className="price-timer">
                            <div className="ticket-price">
                                <span>Ticket Price</span>
                                <span>{`${props.gameEscrow} ETH`}</span>
                                <span>~</span>
                                <span>10 USD</span>
                            </div>
                            <div className="game-timer">
                                {
                                    (props.gameState === 'ready')
                                    ?
                                    <Timer time={props.timer} />
                                    :
                                    <Timer time={props.timer} />
                                }
                            </div>
                        </div>
                        <div className="game-button">
                            <Link id="ticket-button" to="/buy-ticket">
                                <span style={{paddingBottom:"4px", paddingRight:"10px"}}>Get Your Ticket!</span>
                                <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                                </svg>
                            </Link>
                        </div>
                    </>
                }
                
            </div>
        </div>
    )
}

export default Home