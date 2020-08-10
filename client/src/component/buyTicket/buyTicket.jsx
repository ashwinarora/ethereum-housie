import React from 'react'
import {Redirect , useHistory} from 'react-router-dom'
import './buyTicket.css'
import Timer from '../timer';

function BuyTicket(props) {
  const history = useHistory()
  const nintyArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]

  function ticketGenerate(a) {
    const arr = [...a];
    while (arr.length < 15) {
      const r = Math.floor(Math.random() * 90) + 1;
      if (arr.indexOf(r) === -1) arr.push(r);
    }
    arr.sort((a, b) => a - b)
    return arr
  }

  function autoGenerateTicket() {
    props.setTicket(ticketGenerate(props.ticket))
  }

  function clearTicket() {
    props.clearTicket()
  }

  function joinGame() {
    props.joinGame()
    history.push('/game-play')
  }

  return (
    <div className="buy-ticket">
      <div className="upperdeck">
        <div className="ticket-display">
          {
            props.ticket.map( (item, index) => {
              if(item < 10){
                return (
                  <div key={index} className={`ticket-${index} number-box`}>0{item}</div>
                )
              } else {
                return (
                  <div key={index} className={`ticket-${index} number-box`}>{item}</div>
                )
              }
            })
          }
        </div>
        <div className="timer-auto">
          {
            (props.gameState === 'ready')
            ?
            <Timer time={props.timer} />
            :
            <Timer time={props.timer} />
          }
          <button className="auto-button" onClick={autoGenerateTicket} >Auto-Generate</button>
          <button className="auto-button" onClick={clearTicket} >Clear Ticket</button>
        </div>
        <div className="buy-button">
          <button className="buy-ticket-button" onClick={joinGame} >Buy Ticket!</button>
        </div>
      </div>
      <div className="lowerdeck">
        <div className="all-numbers">
          {
            nintyArray.map((index) => {
              return (
                <Number key={index} value={index} ticket={props.ticket} pushTicket={props.pushTicket} spliceTicket={props.spliceTicket} />
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
    if(props.ticket.indexOf(props.value) === -1){
      return (
        <div className="number-box number-hover" onClick={() => {props.pushTicket(props.value)}} >0{props.value}</div>
      )
    } else {
      return (
        <div className="number-box yellow-number" onClick={() => {props.spliceTicket(props.value)}} >0{props.value}</div>
      )
    }
    
  } else {
    if(props.ticket.indexOf(props.value) === -1){
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

export default BuyTicket