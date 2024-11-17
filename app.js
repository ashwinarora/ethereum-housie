var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet')
var axios = require('axios')

require('dotenv').config()

const PORT = process.env.PORT || 5001

var Web3 = require('web3')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.use(helmet());

const server = app.listen(PORT, () => {
  console.log("Listening on PORT: " + PORT);
});
const io = require('socket.io')(server);

// if(process.env.RAILWAY_ENVIRONMENT_NAME === 'production'){
//   console.log("in production")
//   app.use(express.static('client/build'))
//   app.get('*', (req,res) => {
//     res.sendfile(path.resolve(__dirname, 'client', 'build', 'index.html'))
//   })
// } else {
//   app.use(express.static(path.join(__dirname, 'public')));
// }

if (process.env.RAILWAY_ENVIRONMENT_NAME === 'production') {
  app.use(express.static('client/build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}
 
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//--------------------------------------------

const contractAbi = require('./contractData')
const web3 = new Web3("https://data-seed-prebsc-2-s2.bnbchain.org:8545")
web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
const contractAddress = "0x4EfE0866A22cF8062efAEF973E50B534B14133D7"
let contract = new web3.eth.Contract(contractAbi, contractAddress)
const address = '0xE3C455Da5824bb6E41686c824A7dDCc815fe38B0'

const state = {
  ready: 'ready', // before first player has joined
  setup: 'setup', // after first player has joined and timer is started
  play: 'play', // timer has ended
  end: 'end' // game has ended
}

let networkId
let gameNumber
let gasIncrement = 0

const games = []

setupContract()

async function setupContract() {
  networkId = await web3.eth.net.getId()
  gameNumber = await contract.methods.getNumberOfGames().call()
  console.log(`gameNumber=${gameNumber}`)
}

function orderOfNumbers() {
  const arr = [];
  while (arr.length < 90) {
    const r = Math.floor(Math.random() * 90) + 1;
    if (arr.indexOf(r) === -1) arr.push(r);
  }
  return arr
}

async function getEthPrice() {
  try {
    const { data } = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD')
    const ethPrice =  parseFloat( 10 * (1 / data.USD)).toFixed(4) // ethPrice = 10 usd
    return ethPrice
  } catch (error) {
    console.log(error)
  }
}

async function createNewGame() {
  try {
    const tx = contract.methods.newGame((ethPrice * 10**18).toString(10))
    let gas = await tx.estimateGas({from: address});
    // gas = gas + gasIncrement
    console.log(`gas=${gas}`)
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();
    const nonce = await web3.eth.getTransactionCount(address);
    const txData = {
      from: address,
      to: contract.options.address,
      data: data,
      gas,
      gasPrice,
      nonce
    };
    const receipt = await web3.eth.sendTransaction(txData);
    const gameId = parseInt(receipt.logs[0].data)
    const transactionHash = receipt.transactionHash
    return {gameId, transactionHash}
  } catch (error) {
    console.log('new game transaction errored')
    throw error
  }
}


async function createNewGame_old() {
  games.push({
    state: state.ready,
  })
  let ethPrice
  let gameId
  try {
    const { data } = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD')
    ethPrice = parseFloat( 10 * (1 / data.USD)).toFixed(4)// ethPrice = 10 usd
    console.log(`ethPrice=${ethPrice}`)
  } catch (error) {
    console.log(error)
  }

  try {
    const tx = contract.methods.newGame((ethPrice * 10**18).toString(10))
    let gas = await tx.estimateGas({from: address});
    // gas = gas + gasIncrement
    console.log(`gas=${gas}`)
    const gasPrice = await web3.eth.getGasPrice();
    const data = tx.encodeABI();
    const nonce = await web3.eth.getTransactionCount(address);
    const txData = {
      from: address,
      to: contract.options.address,
      data: data,
      gas,
      gasPrice,
      nonce
    };
  
    const receipt = await web3.eth.sendTransaction(txData);
    gameId = parseInt(receipt.logs[0].data)
    console.log(`gameId=${parseInt(receipt.logs[0].data)}`)
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    // games.push({
    //   gameId: gameId,
    //   escrow: ethPrice,
    //   state: state.ready,
    //   timer: 90000,
    //   contractAddress: process.env.CONTRACT_ADDRESS,
    //   contractAbi: contractAbi,
    //   players: []
    // })
    games[games.length -1 ] = {
      gameId: gameId,
      escrow: ethPrice,
      state: state.ready,
      timer: 90000,
      contractAddress: process.env.CONTRACT_ADDRESS,
      contractAbi: contractAbi,
      players: []
    }
    // gasIncrement++
  } catch (error) {
    console.log('!!!!!!')
    console.log(error)
    // throw error
  }
}

let transactionPromise

io.on('connection', (socket) => {
  socket.on('request-game-data', async (data) => {
    console.log('Housie: NEW GAME REQUEST')
    // socket.emit('game-data', "your game data#####")
    if(!(games[games.length - 1]) || (games[games.length -1].state === state.play) || (games[games.length -1].state === state.end) ){
      try {
        transactionPromise = createNewGame_old()
        await transactionPromise

        // const ethPrice = await getEthPrice();
        if(games[games.length -1]){
          if(games[games.length -1].gameId){
            console.log(`emiting game data - ${data.socketId}`)
            socket.emit('game-data', games[games.length - 1])
          }
        }
      } catch (error) {
        console.log('!!!!!!')
        console.log(error) 
      }      
    } else {
      await transactionPromise
      socket.emit('game-data', games[games.length - 1])
    }
  })

  socket.on('game-joined', (data) => {
    const gameIndex = data.gameId - gameNumber - 1 // index of the games array
    console.log(`data.gameId=${data.gameId}`)
    console.log(`gameIndex${gameIndex}`)
    // console.log(games[gameIndex])
    socket.join(gameIndex)
    if(games[gameIndex].players.length === 0){
      games[gameIndex].players.push({
        socketId: data.socketId,
        playerAddress: data.playerAddress,
        ticket: data.ticket
      })
      transactionPromise = null
      games[gameIndex].state = state.setup
      try {
        // io.to(gameIndex).emit('first-player-joined', {socketId: data.socketId, gameState: games[gameIndex].state})
        io.emit('first-player-joined', {firstPlayerSocketId: data.socketId, gameState: games[gameIndex].state})
      } catch (error) {
        console.log(error)
      }
      const t = setInterval( () => {
        games[gameIndex].timer -= 1000
        if(games[gameIndex].timer <= 0){
          clearInterval(t)
          games[gameIndex].state = state.play
          io.to(gameIndex).emit('begin-game', {gameState: games[gameIndex].state})
          const nums = orderOfNumbers()
          let i = 0
          const tt = setInterval( () => {
            io.to(gameIndex).emit('new-number', nums[i])
            console.log(`number send= ${nums[i]}`)
            i++;
            if( i >= 90 || (games[gameIndex].state == state.end)) {
              console.log(`stopping sending numbers= ${i}`)
              clearInterval(tt)
            }
          }, 1000)
        }
      },1000)
    } else {
      games[gameIndex].players.push({
        socketId: data.socketId,
        playerAddress: data.playerAddress,
        ticket: data.ticket
      })
    }
    console.log('ticket confirmation line 198')
    io.to(gameIndex).emit('ticket-confirmation', {address: data.playerAddress})
  })

  socket.on('game-won', async (data) => {
    const gameIndex = data.gameId - gameNumber - 1 // index of the games array
    if(games[gameIndex].state === state.end) return
    games[gameIndex].state = state.end
    console.log(`Game Won, ${data.playerAddress}`)
    const id = data.gameId
    const playerAddress = data.playerAddress
    const amt = games[gameIndex].escrow * games[gameIndex].players.length
    io.to(gameIndex).emit('game-over', {socketId: data.socketId})
    // try {
    //   const tx = await web3.eth.sendTransaction({from: address, to:playerAddress, value: web3.utils.toWei(amt, 'ether')})
    //   console.log(tx)
    // } catch (error) {
    //   console.log(error)
    // }
    try {
      const tx = contract.methods.gameEnd(id, playerAddress)
      const gas = await tx.estimateGas({from: address});
      const gasPrice = await web3.eth.getGasPrice();
      const data = tx.encodeABI();
      const nonce = await web3.eth.getTransactionCount(address);
      const txData = {
        from: address,
        to: contract.options.address,
        data: data,
        gas,
        gasPrice,
        nonce
      };    
      const receipt = await web3.eth.sendTransaction(txData);
      console.log(`Game end Transaction hash: ${receipt.transactionHash}`);
    } catch (error) {
      console.log(error)
    }
  })
  
})



module.exports = app;

/* Rough notes
31485957222547002965592896112208672472574545410244409416298869655371806684874
84801875899405486937029902710782621651880054895970939277174430588210583553177
1 eth = x usd
1/x eth =  usd

class Game {
  constructor(ticketPrice) {
    // create new game
    // set game id
    // set participant sockets
    // set ticket price
    // set number of participants
    // set 90 array
    // game state
    this.usdPrice = ticketPrice
    this.gameState = state.ready
    console.log(this.usdPrice)
    this.newGame()
  }
  newGame = async () => {
    try {
      const { data } = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD')
      this.ethPrice = parseFloat( this.usdPrice * (1 / data.USD)).toFixed(4)
      console.log(this.ethPrice)
    } catch (error) {
      console.log(error)
    }

    try {
      // const tx = await contract.methods.newGame(this.ethPrice * 10**18).send({from: address})
      // console.log(tx)  
      const tx = contract.methods.newGame((this.ethPrice * 10**18).toString(10))
      const gas = await tx.estimateGas({from: address});
      const gasPrice = await web3.eth.getGasPrice();
      const data = tx.encodeABI();
      const nonce = await web3.eth.getTransactionCount(address);
      const txData = {
        from: address,
        to: contract.options.address,
        data: data,
        gas,
        gasPrice,
        nonce
      };
    
      const receipt = await web3.eth.sendTransaction(txData);
      this.gameId = parseInt(receipt.logs[0].data)
      // console.log(parseInt(receipt.logs[0].data))
      console.log(`Transaction hash: ${receipt.transactionHash}`);
      gameNumber++  
    } catch (error) {
      console.log(error)  
    } 
  }

}
*/


