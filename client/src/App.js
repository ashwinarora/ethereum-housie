import React, { useState, useEffect } from 'react';
import Socket from 'socket.io-client'
import { BrowserRouter as Router, Switch, Route, useHistory } from 'react-router-dom'
import Web3 from 'web3'
import './App.css'
import NavBar from './component/nav'
import Home from './component/home'
import BuyTicket from './component/buyTicket/buyTicket'
import Waiting from './component/waiting'
import GamePlay from './component/gamePlay/gamePlay'
import Footer from './component/Footer'

const sampleTicket= [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

let socket
let web3
let contract
let account
let isFirstPlayer = false

function App() {
  const history = useHistory()  
  // const [web3, setWeb3] = useState({})
  let contract
  const nintyArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90]
  // const [gameData, setGameData] = useState({})
  const [gameEscrow, setGameEscrow] = useState()
  const [gameId, setGameId] = useState()
  const [gameState, setGameState] = useState()
  const [contractAddress, setContractAddress] = useState()
  const [contractAbi, setContractAbi] = useState()
  const [gameTimer, setGameTimer] = useState()
  // const [account, setAccount] = useState()
  const [intervalid, setIntervalId] = useState()
  const [gameArray, setGameArray] = useState(nintyArray)
  const [gameTicket, setGameTicket] = useState([])
  const [winner, setWinner] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  // const [isFirstPlayer, setIsFirstPlayer] = useState(false)

  const [numbers, setNumbers] = useState([])

  async function setupWeb3() {
    try {
      await window.ethereum.enable()
    } catch (error) {
      alert('Please reload and connect to Metamask')
    }
    web3 = new Web3(Web3.givenProvider)
    // setWeb3(new Web3(Web3.givenProvider))
    const accounts = await web3.eth.getAccounts()
    console.log(accounts[0])
    account = accounts[0]
    // setAccount(accounts[0])
  }

  function setupSocket(endpoint) {
    socket = Socket(endpoint)
  }

  useEffect(() => {
    setupWeb3()
    // setupSocket('https://ethereum-housie.herokuapp.com/')
    setupSocket('http://localhost:5000/')

    socket.on('game-data', (data) => {
      // setGameData(data)
      console.log(data)
      setGameEscrow(data.escrow)
      setGameId(data.gameId)
      setGameState(data.state)
      setContractAddress(data.contractAddress)
      setContractAbi(data.contractAbi)

      if (data.state === 'ready') {
        // setIsFirstPlayer(true)
        isFirstPlayer = true
        setGameTimer(data.timer)
      } else if( data.state === 'setup'){
        setGameTimer(data.timer)
        const t = window.setInterval(function(){
          setGameTimer(gameTimer => (gameTimer -= 1000))
        }, 1000)
        setIntervalId(t)
      }
    })

    socket.on('first-player-joined', () => {
      if(isFirstPlayer){
        console.log('first-player-joined')
        setGameState('setup')
        const t = window.setInterval(function(){
          setGameTimer(gameTimer => (gameTimer -= 1000))
        }, 1000)
        setIntervalId(t)
      }
    })

    socket.on('ticket-confirmation', (data) => {
      if(account == data.address){
        console.log('ticket-confirmation')
      }
    })

    socket.on('begin-game', () => {
      console.log('game begins')
    })

    socket.on('new-number', (data) => {
      // console.log(gameTicket)
      setNumbers( (numbers) => {
        return [...numbers, data]
      })
    })

    socket.on('game-over', () => {
      console.log('game-over')
      setGameOver(true)
    })

    socket.emit('request-game-data')

    return () => {
      console.log('Cleaning App.js')
      socket.off('game-data')
    }
  }, [])

  useEffect( () => {
    if(gameTicket.indexOf(numbers[numbers.length -1]) !== -1){
      setWinner( (winner) => (winner + 1)) 
    }
  }, [numbers])

  useEffect( () => {
    if(winner >= 15 ){
      console.log(`GAME-WON ${gameId} -- ${account} `)
      socket.emit('game-won' , {
        gameId: gameId,
        playerAddress: account
      })
    }
  }, [winner])

  useEffect(() => {
    if (gameTimer <= 0) {
      window.clearInterval(intervalid)
    }
  }, [gameTimer])

  function clearTicket() {
    setGameTicket([])
  }

  function setTicket(ticket){
    setGameTicket(ticket)
  }

  function pushTicket(n){
    if(gameTicket.length >= 15) return
    setGameTicket((gameTicket) => {
      return [ ...gameTicket, n].sort((a, b) => a - b)
    })
  }

  function spliceTicket(n){
    let ticket = [ ...gameTicket]
    const index = ticket.indexOf(n)
    ticket.splice(index, 1)
    setGameTicket(ticket)
  }

  function pushToPlay() {
    history.push('/game-play')
  }

  async function joinGame() {
    if(!(gameTicket.length === 15)) throw {message: "not enough numbers", missingNumbers: 15 - gameTicket.length}
    contract = new web3.eth.Contract(contractAbi, contractAddress)
    console.log(contract)
    try {
      const tx = await contract.methods.joinGame(gameId).send({
        from: account,
        value: web3.utils.toWei(gameEscrow.toString(), 'ether')
      })
      console.log(tx)
      try {
        console.log({gameId})
        socket.emit('game-joined', {
          gameId,
          socketId: socket.id,
          playerAddress: account,
          ticket: gameTicket,
        })
      } catch (error) {
        console.log('socket error')
        throw error
      }
    } catch (error) {
      // console.log(error)
      throw error
    }
  }

  return (
    <Router>
      <div className="App">
        <NavBar />
        <Switch>
          <Route path="/" exact render={(props) => (<Home {...props} gameEscrow={gameEscrow} gameState={gameState} timer={gameTimer} />)} />
          <Route path="/buy-ticket" exact render={(props) => (
            <BuyTicket {...props} 
              gameEscrow={gameEscrow} 
              gameState={gameState} 
              timer={gameTimer} 
              contractAddress={contractAddress} 
              contractAbi={contractAbi}  
              ticket={gameTicket}
              gameArray={gameArray} 
              clearTicket={clearTicket} 
              setTicket={setTicket} 
              pushTicket={pushTicket}
              spliceTicket={spliceTicket}
              joinGame={joinGame}
           />)}
          />
          <Route path="/game-over" exact render={(props) => (<Waiting {...props} winner={winner} />)} />
          <Route path="/game-play" exact render={(props) => (<GamePlay {...props} numbers={numbers} ticket={gameTicket} gameOver={gameOver} />)} />
        </Switch>
      <Footer />
      </div>
    </Router>
  );
}

export default App;
