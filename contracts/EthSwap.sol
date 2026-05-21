pragma solidity >=0.4.22 <0.5.17;

import "./Token.sol";

contract WadeCoinExchange {
    string public name = "WadeCoin Exchange";
    Token public token;
    uint256 public rate = 10;

    event TokenPurchased(
        address indexed buyer,
        address indexed token,
        uint256 amount,
        uint256 rate
    );

    event TokenSold(
        address indexed seller,
        address indexed token,
        uint256 amount,
        uint256 rate
    );

    constructor(Token _token) public {
        token = _token;
    }

    function buyTokens() public payable {
        uint256 tokenAmount = msg.value * rate;
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient token reserve");
        token.transfer(msg.sender, tokenAmount);
        emit TokenPurchased(msg.sender, address(token), tokenAmount, rate);
    }

    function sellTokens(uint256 _amount) public {
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient token balance");
        uint256 etherAmount = _amount / rate;
        require(address(this).balance >= etherAmount, "Insufficient ETH reserve");
        token.transferFrom(msg.sender, address(this), _amount);
        msg.sender.transfer(etherAmount);
        emit TokenSold(msg.sender, address(token), _amount, rate);
    }
}
