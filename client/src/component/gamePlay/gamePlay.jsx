import React, {useEffect} from 'react'
import { useHistory } from 'react-router-dom'
import './gamePlay.css'

function GamePlay(props) {
  const history = useHistory()

  const nintyArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]

  useEffect( () => {
    if(props.gameOver){
      history.push('/game-over')
    }
  }, [props.gameOver])


  return (
    <div className="game-play">
      <div className="upperdeck">
        <div className="ticket-display">
            {
              props.ticket.map( (item, index) => {
                if(item < 10){
                  if(props.numbers.indexOf(item) === -1){
                    return (
                      <div key={index} className={`ticket-${index} number-box`}>0{item}</div>
                    )
                  } else {
                    return (
                      <div key={index} className={`ticket-${index} number-box yellow-number`}>0{item}</div>
                    )
                  }                  
                } else {
                  if(props.numbers.indexOf(item) === -1){
                    return (
                      <div key={index} className={`ticket-${index} number-box`}>{item}</div>
                    )
                  } else {
                    return (
                      <div key={index} className={`ticket-${index} number-box yellow-number`}>{item}</div>
                    )
                  }
                  // return (
                  //   <div key={index} className={`ticket-${index} number-box`}>{item}</div>
                  // )
                }
              })
            }
        </div>
        <div className="top-number">
          {props.numbers[props.numbers.length -1]}
        </div>
      </div>
      <div className="lowerdeck">
        <div className="all-numbers">
          {
            nintyArray.map((index) => {
              return (
                <Number key={index} value={index} numbers={props.numbers} />
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

function Number(props) {
  if (props.value < 10) {
    if(props.numbers.indexOf(props.value) === -1){
      return (
        <div className="number-box number-hover" onClick={() => {props.pushTicket(props.value)}} >0{props.value}</div>
      )
    } else {
      return (
        <div className="number-box yellow-number" onClick={() => {props.spliceTicket(props.value)}} >0{props.value}</div>
      )
    }
    
  } else {
    if(props.numbers.indexOf(props.value) === -1){
      return (
        <div className="number-box number-hover" onClick={() => {props.pushTicket(props.value)}} >{props.value}</div>
      )
    } else {
      return (
        <div className="number-box yellow-number" onClick={() => {props.spliceTicket(props.value)}} >{props.value}</div>
      )
    }
  }

}

export default GamePlay