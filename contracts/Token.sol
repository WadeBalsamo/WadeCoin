pragma solidity >=0.4.22 <0.5.17;

contract Token {
    string public name = "WadeCoin";
    string public symbol = "WADE";
    uint256 public decimals = 18;
    uint256 public totalSupply;

    uint256 public lastBurnTime;
    address public deployer;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Burn(address indexed burner, uint256 amount);

    constructor() public {
        totalSupply = 75000 * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
        lastBurnTime = block.timestamp;
        deployer = msg.sender;
    }

    function burnWeekly() public {
        require(block.timestamp >= lastBurnTime + 604800, "Burn cooldown: 7 days have not elapsed");
        uint256 burnAmount = 40 * (10 ** decimals);
        require(balanceOf[deployer] >= burnAmount, "Insufficient deployer balance to burn");
        balanceOf[deployer] -= burnAmount;
        totalSupply -= burnAmount;
        lastBurnTime = block.timestamp;
        emit Burn(deployer, burnAmount);
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}
