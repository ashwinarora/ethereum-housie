import React from 'react'

function Timer(props) {
    if(props.time <= 60){
        return(
            <span style={{color: "red"}}>
                {Math.floor((props.time % (1000 * 60 * 60)) / (1000 * 60))}m {Math.floor((props.time % (1000 * 60)) / 1000)}s
            </span>
        )
    } else {
        return(
            <span>
                {Math.floor((props.time % (1000 * 60 * 60)) / (1000 * 60))}m {Math.floor((props.time % (1000 * 60)) / 1000)}s
            </span>
        )
    }
}

export default Timer