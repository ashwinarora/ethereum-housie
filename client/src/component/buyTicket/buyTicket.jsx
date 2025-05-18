import React, {useState, useEffect} from 'react'
import {Redirect , useHistory} from 'react-router-dom'
import './buyTicket.css'
import Timer from '../timer';
import spinner from  '../spinner.gif'

function BuyTicket(props) {
  const history = useHistory()
  const nintyArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]
  const [missingNumbers, setMissingNumbers] = useState(0)
  const [isMetamaskError, setMetamaskError] = useState(false)
  const [isWaiting, setWaiting] = useState(false)
  const [errorMessage, setErrorMessage] = useState()

  useEffect(() => {
    console.log(props)
    if(!props.contractAddress){
      history.push('/')
    }
  }, [props, history])

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

  async function joinGame() {
    setWaiting(true)
    setMissingNumbers(0)
    setMetamaskError(false)
    try {
      await props.joinGame()
      history.push('/game-play')
    } catch (error) {
      if(error.message === "not enough numbers"){
        setWaiting(false)
        setMissingNumbers(error.missingNumbers)
      } else if(error.code === 4001) {
        setWaiting(false)
        setMetamaskError(true)
        setErrorMessage('Please confirm the transaction in Metamask Popup')
      } else if(error.code === -32602){
        setWaiting(false)
        setMetamaskError(true)
        setErrorMessage('Metamask Error: Please make sure metamask is connected.')
      }
      else {
        console.log(error)
      }
    }
  }

  return (
    <div className="buy-ticket">
      <div className="upperdeck">
        <div id="user-ticket">
          <div id="your-ticket">
            Your Ticket(15 numbers)
          </div>
          <div id="ticket-display">
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
          {/* <div id="blank-space"></div> */}
          <div id="buy-ticket-container">
            <button className="buy-ticket-button" onClick={joinGame} >Buy Ticket!</button>
          </div>
          <div id="buy-error">
            <div id="count-error" className={`${!missingNumbers ? 'hidden': ''}`}>Please select {missingNumbers} more number{missingNumbers > 1 ? 's' : ''}</div>
            <div className={`${!isMetamaskError ? 'hidden' : ''}`}>{errorMessage}</div>
            <img className={`${!isWaiting ? 'hidden' : '' }`} width="25%" height="auto" src={spinner} style={{objectFit: "cover"}} alt="Loading..." ></img>
          </div>
        </div>
      </div>
      <div className="lowerdeck">
        <div>
          Select numbers for your Ticket
        </div>
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