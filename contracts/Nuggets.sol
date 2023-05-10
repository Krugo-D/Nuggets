// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IEthOracle {
    function update() external;
    function consult(address token, uint amountIn) external view returns (uint amountOut);
}

contract Nuggets is ERC20, Ownable {
    IERC20 public stETH = IERC20(0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84);
    address public WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IEthOracle public ethOracle;

    uint256 public constant COLLATERAL_RATIO = 200;
    uint256 public constant LIQUIDATION_RATIO = 150;
    uint256 public constant LIQUIDATION_FEE = 5;

    event EthPriceUpdated(uint256 priceInUsd);

    mapping(address => uint256) public collateral;

    constructor(IEthOracle _ethOracle) ERC20("Nuggets", "NGT") {
        ethOracle = _ethOracle;
    }


    function getEthPriceInUsd() public returns (uint256) {
        // Try to update the EthOracle price
        try ethOracle.update() {} catch {}
    
        // Get the price from EthOracle, assuming it returns price of 1 Ether in USD with 18 decimals
        // Use the address of the WETH token
        uint256 priceInUsd = ethOracle.consult(WETH, 1 ether);
        emit EthPriceUpdated(priceInUsd);
    
        return priceInUsd;
    }

    function mint(uint256 stEthAmount) external {
        uint256 ethPriceInUsd = getEthPriceInUsd();
        uint256 nuggetsAmount = calculateNuggetsAmount(stEthAmount, ethPriceInUsd);
        stETH.transferFrom(msg.sender, address(this), stEthAmount);
        collateral[msg.sender] += stEthAmount;
        _mint(msg.sender, nuggetsAmount);
    }

    function burn(uint256 nuggetsAmount) external {
        uint256 ethPriceInUsd = getEthPriceInUsd();
        uint256 stEthAmount = calculateStEthAmount(nuggetsAmount, ethPriceInUsd);
        require(collateral[msg.sender] >= stEthAmount, "Insufficient collateral");
        stETH.transfer(msg.sender, stEthAmount);
        collateral[msg.sender] -= stEthAmount;
        _burn(msg.sender, nuggetsAmount);
    }

    function liquidate(address account) external {
        uint256 ethPriceInUsd = getEthPriceInUsd();
        uint256 nuggetsAmount = balanceOf(account);
        require(collateral[account] * ethPriceInUsd * 100 < balanceOf(account) * COLLATERAL_RATIO, "Cannot liquidate");
        uint256 liquidationReward = nuggetsAmount * LIQUIDATION_FEE / 100;
        stETH.transfer(msg.sender, collateral[account]);
        collateral[account] = 0;
        _burn(account, nuggetsAmount);
        _mint(msg.sender, liquidationReward);
    }

    function calculateNuggetsAmount(uint256 stEthAmount, uint256 ethPriceInUsd) public pure returns (uint256) {
        return stEthAmount * ethPriceInUsd / 2;
    }

    function calculateStEthAmount(uint256 nuggetsAmount, uint256 ethPriceInUsd) public pure returns (uint256) {
        return nuggetsAmount * 2 / ethPriceInUsd;
    }
}
