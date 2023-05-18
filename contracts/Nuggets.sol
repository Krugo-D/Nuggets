// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Nuggets is ERC20, Ownable {
    IERC20 public stETH;
    AggregatorV3Interface public stEthPriceFeed;
    AggregatorV3Interface public goldPriceFeed;

    uint256 public constant COLLATERAL_RATIO = 200;
    uint256 public constant LIQUIDATION_RATIO = 150;
    uint256 public constant LIQUIDATION_FEE = 5;

    event StethPriceUpdated(uint256 priceInUsd);

    mapping(address => uint256) public collateral;

    constructor(address _stETHAddress, address _stEthPriceFeedAddress, address _goldPriceFeedAddress) ERC20("Nuggets", "NGT") {
        stETH = IERC20(_stETHAddress);

        // Chainlink price feed for stETH/USD and Gold/USD
        stEthPriceFeed = AggregatorV3Interface(_stEthPriceFeedAddress);
        goldPriceFeed = AggregatorV3Interface(_goldPriceFeedAddress);
    }

    function getStethPriceInUsd() public view returns (uint256) {
        (, int price,,,) = stEthPriceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        return uint256(price) * 1e10;
    }

    function getGoldPriceInUsd() public view returns (uint256) {
        (, int price,,,) = goldPriceFeed.latestRoundData();
        require(price > 0, "Invalid price feed");
        return uint256(price) * 1e10;
    }

    function borrow(uint256 stEthAmount) external {
        uint256 stEthPriceInUsd = getStethPriceInUsd();
        uint256 goldPriceInUsd = getGoldPriceInUsd();

        uint256 nuggetsAmount = calculateNuggetsAmount(stEthAmount, stEthPriceInUsd, goldPriceInUsd);

        stETH.transferFrom(msg.sender, address(this), stEthAmount);
        collateral[msg.sender] += stEthAmount;

        _mint(msg.sender, nuggetsAmount);
    }

    function repay(uint256 nuggetsAmount) external {
        require(collateral[msg.sender] > 0, "No collateral to repay");

        stETH.transfer(msg.sender, collateral[msg.sender]);
        collateral[msg.sender] = 0;

        _burn(msg.sender, nuggetsAmount);
    }

    function liquidate(address account) external {
        uint256 stEthPriceInUsd = getStethPriceInUsd();
        uint256 nuggetsAmount = balanceOf(account);

        require(collateral[account] * stEthPriceInUsd * 100 < nuggetsAmount * COLLATERAL_RATIO, "Cannot liquidate");

        uint256 liquidationReward = nuggetsAmount * LIQUIDATION_FEE / 100;
        uint256 accountCollateral = collateral[account];

        // Transfer collateral to liquidator and remove it from borrower
        stETH.transfer(msg.sender, accountCollateral);
        collateral[account] = 0;

        // Burn borrower's Nuggets
        _burn(account, nuggetsAmount);

        // Mint liquidation reward for liquidator
        _mint(msg.sender, liquidationReward);
    }

    function calculateNuggetsAmount(uint256 stEthAmount, uint256 stEthPriceInUsd, uint256 goldPriceInUsd) public pure returns (uint256) {
        // Calculate the value of the stETH deposit in terms of gold
        uint256 stEthValueInGold = stEthAmount * stEthPriceInUsd / goldPriceInUsd;
        return stEthValueInGold;
    }
}
