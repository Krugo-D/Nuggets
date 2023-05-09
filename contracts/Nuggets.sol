// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Nuggets is ERC20, Ownable {
    IERC20 public stETH = IERC20(0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84);
    uint256 public ethPriceInUsd;
    uint256 public constant COLLATERAL_RATIO = 200;
    uint256 public constant LIQUIDATION_RATIO = 150;
    uint256 public constant LIQUIDATION_FEE = 5;

    mapping(address => uint256) public collateral;

    constructor() ERC20("Nuggets", "NGT") {}

    function setEthPriceInUsd(uint256 price) external onlyOwner {
        ethPriceInUsd = price;
    }

    function mint(uint256 stEthAmount) external {
        uint256 nuggetsAmount = calculateNuggetsAmount(stEthAmount);
        stETH.transferFrom(msg.sender, address(this), stEthAmount);
        collateral[msg.sender] += stEthAmount;
        _mint(msg.sender, nuggetsAmount);
    }

    function burn(uint256 nuggetsAmount) external {
        uint256 stEthAmount = calculateStEthAmount(nuggetsAmount);
        require(collateral[msg.sender] >= stEthAmount, "Insufficient collateral");
        stETH.transfer(msg.sender, stEthAmount);
        collateral[msg.sender] -= stEthAmount;
        _burn(msg.sender, nuggetsAmount);
    }

    function liquidate(address account) external {
        uint256 nuggetsAmount = balanceOf(account);
        require(collateral[account] * ethPriceInUsd * 100 < balanceOf(account) * COLLATERAL_RATIO, "Cannot liquidate");
        uint256 liquidationReward = nuggetsAmount * LIQUIDATION_FEE / 100;
        stETH.transfer(msg.sender, collateral[account]);
        collateral[account] = 0;
        _burn(account, nuggetsAmount);
        _mint(msg.sender, liquidationReward);
    }

    function calculateNuggetsAmount(uint256 stEthAmount) public view returns (uint256) {
        return stEthAmount * ethPriceInUsd / 2;
    }

    function calculateStEthAmount(uint256 nuggetsAmount) public view returns (uint256) {
        return nuggetsAmount * 2 / ethPriceInUsd;
    }
}
