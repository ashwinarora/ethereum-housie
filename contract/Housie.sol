pragma solidity ^0.4.25;

// Deployed contract = https://testnet.bscscan.com/address/0x4efe0866a22cf8062efaef973e50b534b14133d7#code


pragma solidity ^0.4.25;

/**
* @title Ownable
* @dev The Ownable contract has an owner address, and provides basic authorization control
* functions, this simplifies the implementation of "user permissions".
*/
contract Ownable {
  address private _owner;

  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
  * @dev The Ownable constructor sets the original `owner` of the contract to the sender
  * account.
  */
  constructor() internal {
    _owner = msg.sender;
    emit OwnershipTransferred(address(0), _owner);
  }

  /**
  * @return the address of the owner.
  */
  function owner() public view returns(address) {
    return _owner;
  }

  /**
  * @dev Throws if called by any account other than the owner.
  */
  modifier onlyOwner() {
    require(isOwner());
    _;
  }

  /**
  * @return true if `msg.sender` is the owner of the contract.
  */
  function isOwner() public view returns(bool) {
    return msg.sender == _owner;
  }

  /**
  * @dev Allows the current owner to relinquish control of the contract.
  * @notice Renouncing to ownership will leave the contract without an owner.
  * It will not be possible to call the functions with the `onlyOwner`
  * modifier anymore.
  */
  function renounceOwnership() public onlyOwner {
    emit OwnershipTransferred(_owner, address(0));
    _owner = address(0);
  }

  /**
  * @dev Allows the current owner to transfer control of the contract to a newOwner.
  * @param newOwner The address to transfer ownership to.
  */
  function transferOwnership(address newOwner) public onlyOwner {
    _transferOwnership(newOwner);
  }

  /**
  * @dev Transfers control of the contract to a newOwner.
  * @param newOwner The address to transfer ownership to.
  */
  function _transferOwnership(address newOwner) internal {
    require(newOwner != address(0));
    emit OwnershipTransferred(_owner, newOwner);
    _owner = newOwner;
  }
}


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