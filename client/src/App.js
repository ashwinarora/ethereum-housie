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
  //winner is the number of numbers that have been crossed of
  const [winner, setWinner] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isWinner, setIsWinner] = useState(false)
  // const [isFirstPlayer, setIsFirstPlayer] = useState(false)
  const [metamask, setMetamask] = useState([])

  const [numbers, setNumbers] = useState([])

  async function setupWeb3() {
    try {
      const meta = await window.ethereum.enable()
      setMetamask(meta)
    } catch (error) {
      console.log(error)
      alert('Please reload and connect to Metamask')
    }
    web3 = new Web3(Web3.givenProvider)
    // setWeb3(new Web3(Web3.givenProvider))
    const accounts = await web3.eth.getAccounts()
    account = accounts[0]
    // setAccount(accounts[0])
  }

  useEffect( () => {
    console.log({metamask})
  }, [metamask])

  function setupSocket(endpoint) {
    socket = Socket(endpoint)
  }

  useEffect(() => {
    // setupWeb3()
    if(!socket) console.log('socket is falsey')

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

    socket.on('first-player-joined', (data) => {
      console.log('first player has joined')
      console.log({dataSocketId: data.firstPlayerSocketId, mySocket: socket.id})
      setGameState(data.gameState)
      const t = window.setInterval(function(){
        setGameTimer(gameTimer => (gameTimer -= 1000))
      }, 1000)
      setIntervalId(t)
      if(data.socketId === socket.id){
        console.log('you-are-first-player')
      }

      // if(data.firstPlayerSocketId === socket.id){
      //   console.log('you-are-first-player')
      // }
    })

    socket.on('ticket-confirmation', (data) => {
      if(account === data.address){
        console.log('ticket-confirmation')
      }
    })

    socket.on('begin-game', (data) => {
      console.log('game begins')
      setGameState(data.gameState)
    })

    socket.on('new-number', (data) => {
      // console.log(gameTicket)
      setNumbers( (numbers) => {
        return [...numbers, data]
      })
    })

    socket.on('game-over', (data) => {
      console.log('game-over')
      setGameOver(true)
      if(data.socketId === socket.id){
        console.log('you have won')
        setIsWinner(true)
      }
    })

    // requestNewGame()

    return () => {
      console.log('Cleaning App.js')
      socket.off('game-data')
    }
  }, [])

  async function isSocketConnected(){
    return new Promise( (resolve, reject) => {
      socket.on('connect', () => {
        resolve(socket.id)
      });
    })
  }

  async function requestNewGame() {
    // setupSocket('https://ethereum-housie.herokuapp.com/')
    // setupSocket('http://localhost:5001/')
    setupSocket('https://ethhousie.com/')
    const id = await isSocketConnected()
    console.log({id})
    try {
      console.log(`requesting game data - ${socket.id}`)
      await socket.emit('request-game-data', {socketId: socket.id})
    } catch (error) {
      throw error
    }
  }

  useEffect(() => {
    if(gameTicket.indexOf(numbers[numbers.length -1]) !== -1){
      setWinner( (winner) => (winner + 1)) 
    }
  }, [numbers, gameTicket])

  useEffect(() => {
    if(winner >= 15 ){
      console.log(`GAME-WON ${gameId} -- ${account} `)
      socket.emit('game-won' , {
        gameId: gameId,
        playerAddress: account,
        socketId: socket.id
      })
    }
  }, [winner, gameId, account])

  useEffect(() => {
    if (gameTimer <= 0) {
      window.clearInterval(intervalid)
    }
  }, [gameTimer, intervalid])

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
    if(!(gameTicket.length === 15)) throw new Error("not enough numbers")
    contract = new web3.eth.Contract(contractAbi, contractAddress)
    console.log(contract)
    console.log({socketid: socket.id})
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
      throw error
    }
  }

  return (
    <Router>
      <div className="App">
        <NavBar />
        <Switch>
          <Route path="/" exact render={(props) => (<Home {...props} setupWeb3={setupWeb3} gameEscrow={gameEscrow} gameState={gameState} timer={gameTimer} requestNewGame={requestNewGame} metamask={metamask} />)} />
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
          <Route path="/game-over" exact render={(props) => (<Waiting {...props} winner={winner} isWinner={isWinner} />)} />
          <Route path="/game-play" exact render={(props) => (
            <GamePlay {...props} 
              numbers={numbers} 
              ticket={gameTicket} 
              gameOver={gameOver} 
              timer={gameTimer} 
              gameState={gameState}
              winner={winner}
            />)}
          />
        </Switch>
      <Footer />
      </div>
    </Router>
  );
}

export default App;
