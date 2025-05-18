import React from 'react'
import './waiting.css'

function Waiting(props) {
    return (
        <div className="waiting">
            <div className="wait-info">
                {
                    props.isWinner ?
                    <h2>Congratulation, You have Won! Your winnings will be transfered soon.</h2> :
                    <h2>Game Over, Better Luck Next Time.</h2>
                }
            </div>
        </div>
    )
}

export default Waiting