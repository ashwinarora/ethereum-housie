var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// var helmet = require('helmet')
var axios = require('axios')

require('dotenv').config()

const PORT = process.env.PORT || 5000

var Web3 = require('web3')

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

var app = express();
// app.use(helmet());

const server = app.listen(PORT, () => {
  console.log("Listening on PORT: " + PORT);
});
const io = require('socket.io')(server);

if(process.env.NODE_ENV === 'production'){
  app.use(express.static('client/build'))
  app.get('*', (req,res) => {
    res.sendfile(path.resolve(__dirname, 'client', 'build', 'index.html'))
  })
}

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

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
const web3 = new Web3(process.env.INFURA_KEY)
web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);
let contract = new web3.eth.Contract(contractAbi, process.env.CONTRACT_ADDRESS)
const address = '0x9428dB8E96608b58C6d13699c18f4232B897cB8c'

const state = {
  ready: 'ready',
  setup: 'setup',
  play: 'play',
  end: 'end'
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

async function createNewGame() {
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
    games.push({
      gameId: gameId,
      escrow: ethPrice,
      state: state.ready,
      timer: 90000,
      contractAddress: process.env.CONTRACT_ADDRESS,
      contractAbi: contractAbi,
      players: []
    })
    // gasIncrement++
  } catch (error) {
    console.log('!!!!!!')
    console.log(error)  
  } 
}

io.on('connection', (socket) => {
  socket.on('request-game-data', async () => {
    // socket.emit('game-data', "your game data#####")
    if(!(games[games.length - 1]) || (games[games.length -1].state === state.play) || (games[games.length -1].state === state.end) ){
      try {
        await createNewGame()
        if(games[games.length -1]){
          if(games[games.length -1].gameId){
            console.log('emiting game data')
            socket.emit('game-data', games[games.length -1])
          }
        }
      } catch (error) {
        console.log('line 152')
        console.log(error) 
      }      
    } else {
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
      try {
        io.to(gameIndex).emit('first-player-joined')
      } catch (error) {
        console.log(error)
      }
      games[gameIndex].state = state.setup
      const t = setInterval( () => {
        games[gameIndex].timer -= 1000
        if(games[gameIndex].timer <= 0){
          clearInterval(t)
          io.to(gameIndex).emit('begin-game')
          games[gameIndex].state = state.play
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
    }
    games[gameIndex].players.push({
      socketId: data.socketId,
      playerAddress: data.playerAddress,
      ticket: data.ticket
    })
    console.log('ticket confirmation line 198')
    io.to(gameIndex).emit('ticket-confirmation', {address: data.playerAddress})
  })

  socket.on('game-won', async (data) => {
    const gameIndex = data.gameId - gameNumber - 1 // index of the games array
    games[gameIndex].state = state.end
    console.log(`Game Won, ${data.playerAddress}`)
    const id = data.gameId
    const playerAddress = data.playerAddress
    const amt = games[gameIndex].escrow * games[gameIndex].players.length
    io.to(gameIndex).emit('game-over')
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


