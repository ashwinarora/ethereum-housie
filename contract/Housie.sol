pragma solidity ^0.4.25;

import "./ownable.sol";

contract Housie is Ownable{
    
    enum State {setup, play, end}
    
    struct Game{
        uint ticketPrice;
        uint numberOfPlayers;
        uint totalEscrow;
        State state;
    }
    
    mapping(uint => Game) Games;
    uint numberOfGames;
    
    event NewGameCreated(uint gameId);
    event PlayerJoinedGame(uint gameId, address joinee);
    event GameEnded(uint gameId);
    
    modifier hasValue() {
        require(msg.value > 0, "Ether required");
        _;
    }
    modifier gameExists(uint _gameId){
        require(_gameId <= numberOfGames, "Invalid Game Id, No such game exists");
        _;
    }
    modifier isGameSetup(uint _gameId){
      require(Games[_gameId].state == State.setup, "Game is already started. Please try again.");
      _;
    }
    
    function getNumberOfGames() view public returns (uint) {
        return numberOfGames;
    } 
    
    constructor() public {

    }
    
    /// @notice Allows players to create a new game
    /// @dev new game is generated and values are initialized
    /// @return the ID of the game is returned
    function newGame(uint256 _ticketPrice) external onlyOwner returns(uint){
        ++numberOfGames;
        Game storage game = Games[numberOfGames];
        game.ticketPrice = _ticketPrice;
        game.state = State.setup;
        emit NewGameCreated(numberOfGames);
        return numberOfGames;
    }
    
    function joinGame(uint _gameId) payable external hasValue gameExists(_gameId) isGameSetup(_gameId) returns(bool success) {
        Game storage game = Games[_gameId];
        require(msg.value == game.ticketPrice, "Invalid amount of Ether sent");
        ++game.numberOfPlayers;
        game.totalEscrow += msg.value;
        emit PlayerJoinedGame(_gameId, msg.sender);
        return true;
    }
    
    function gameEnd(uint _gameId, address _fullHouse) external onlyOwner returns(bool){
        Game storage game = Games[_gameId];
        _fullHouse.transfer(game.totalEscrow);
        return true;
    }
    
    // function gameEnd2(uint _gameId, address _fullHouse) external onlyOwner returns(bool){
    //     Game storage game = Games[_gameId];
    //     uint rowPayout = game.totalEscrow / 5;
    //     uint fullHousePayout = 2 * rowPayout;
    //     _fullHouse.transfer(fullHousePayout);
    //     // _row1.transfer(rowPayout);
    //     // _row2.transfer(rowPayout);
    //     // _row3.transfer(rowPayout);
    //     game.state = State.end;
    //     return true;
    // }
    
    function startGame(uint _gameId) external onlyOwner gameExists(_gameId) isGameSetup(_gameId) returns(bool) {
        Game storage game = Games[_gameId];
        game.state = State.play;
        return true;
    }
    
}