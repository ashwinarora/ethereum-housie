import React, {useEffect} from 'react'
import {useHistory} from 'react-router-dom'
import Timer from './timer'
import spinner from  './spinner.gif'
import './waiting.css'

function Waiting(props) {
    // useEffect( () => {
    //     console.log(props)
    //     if(!props.isWinner){
    //         history.push('/')
    //     }
    // }, [])

    return (
        <div className="waiting">
            <div className="wait-info">
                {
                    // props.winner >= 15 ?
                    // <h2>Congratulation, You have Won! Your winnings will be transfered soon.</h2> :
                    // <h2>Game Over, Better Luck Next Time.</h2>

                    props.isWinner ?
                    <h2>Congratulation, You have Won! Your winnings will be transfered soon.</h2> :
                    <h2>Game Over, Better Luck Next Time.</h2>
                }
            </div>
        </div>
    )
}

export default Waiting