import React, {useEffect} from 'react'
import { Link } from 'react-router-dom'
import './home.css'
import Timer from './timer.jsx'
import spinner from  './spinner.gif'

function Home(props) {
    useEffect(() => {
        props.requestNewGame()
        console.log(props)
    }, [props])

    useEffect(() => {
        if(props.timer <= 0){
            props.requestNewGame()
            console.log(props)
        }
    }, [props.timer, props])

    return (
        <div className="home">
            <div className="game-info">
                <div className="game-heading">Welcome To Housie!</div>
                {   
                    !(props.metamask.length)
                    ?
                    <div id="metamaskDiv">
                        <button id="metamaskButton" onClick={props.setupWeb3}>
                            Connect to Metamask
                            <svg id="linkIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </button>
                    </div>
                    :
                    ((!props.timer)
                    ? 
                    <>
                        <img width="25%" height="auto" src={spinner} style={{objectFit: "cover"}} alt="Loading..." ></img>
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
                                    <>
                                        <Timer time={props.timer} />
                                        <div className="countdown">Countdown will start after the first player joins.</div>
                                    </>
                                    :
                                    <>
                                        <Timer time={props.timer} />
                                        <div className="countdown">Countdown has started. Join before it ends.</div>
                                    </>
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
                    </>)
                }
            </div>
        </div>
    )
}

export default Home