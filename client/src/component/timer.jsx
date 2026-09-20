import React from 'react'

function Timer(props) {
    if(props.time <= 60){
        return(
            <span className="timer timer-urgent">
                {Math.floor((props.time % (1000 * 60 * 60)) / (1000 * 60))}m {Math.floor((props.time % (1000 * 60)) / 1000)}s
            </span>
        )
    } else {
        return(
            <span className="timer">
                {Math.floor((props.time % (1000 * 60 * 60)) / (1000 * 60))}m {Math.floor((props.time % (1000 * 60)) / 1000)}s
            </span>
        )
    }
}

export default Timer