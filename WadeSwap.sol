pragma solidity >=0.4.22 <0.5.17;
import "./Token.sol";
contract EthSwap {
  string public name = "EthSwap Instant Exchange";
  Token public token;

	// redemption rate for ether to tokens
	uint public rate = 1000;

	event TokenPurchased(
		address account,
		address token,
		uint amount,
		uint rate);
	event TokenSold(
		address account,
		address token,
		uint amount,
		uint rate);

	constructor(Token _token) public {
		token = _token;
		}

	function buyTokens() public payable{
		
		//amount of eth * redemption rate =  number of tokens to buy
		uint tokenAmount = msg.value * rate;
		
		require(token.balanceOf(address(this)) >= tokenAmount);
		
		token.transfer(msg.sender, tokenAmount);
		emit TokenPurchased(msg.sender, address(token), tokenAmount, rate);
		}

		
		// perform sale
		function sellTokens(uint _amount) public {
		
		
				uint etherAmount = _amount / rate;
				require(address(this).balance >= etherAmount);
				require(token.balanceOf(msg.sender) >= _amount);
				
				//tokens sent / rate = eth to return
				token.transferFrom(msg.sender, address(this), _amount);
				    msg.sender.transfer(etherAmount);
				emit TokenSold(msg.sender, address(token), etherAmount, rate);
		
		
		}
}