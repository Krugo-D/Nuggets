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

    uint256 public minBorrowRatio = 200;
    uint256 public liquidationRatio = 150;
    uint256 public liquidationFee = 5;
    uint256 public constant stabilityFee = 1; 

    event StethPriceUpdated(uint256 priceInUsd);

    struct Vault {
        uint256 collateral;
        uint256 debt;
        uint256 stabilityFeeLastPaid;
    }

    mapping(address => Vault[]) public vaults;

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

    function createVault(uint256 stEthAmount) external {
        stETH.transferFrom(msg.sender, address(this), stEthAmount);
        Vault memory newVault;
        newVault.collateral = stEthAmount;
        newVault.debt = 0;
        newVault.stabilityFeeLastPaid = block.timestamp;
        vaults[msg.sender].push(newVault);
    }

    function addCollateral(uint256 vaultId, uint256 stEthAmount) external {
        require(vaults[msg.sender][vaultId].collateral > 0, "Vault does not exist");
        stETH.transferFrom(msg.sender, address(this), stEthAmount);
        vaults[msg.sender][vaultId].collateral += stEthAmount;
    }

    function removeCollateral(uint256 vaultId, uint256 stEthAmount) external {
        require(vaults[msg.sender][vaultId].collateral >= stEthAmount, "Not enough collateral in vault");
        stETH.transfer(msg.sender, stEthAmount);
        vaults[msg.sender][vaultId].collateral -= stEthAmount;
    }

    function borrow(uint256 vaultId, uint256 nuggetsAmount) external {
        require(vaults[msg.sender][vaultId].collateral > 0, "No collateral to borrow against");
        uint256 stEthPriceInUsd = getStethPriceInUsd();
        uint256 goldPriceInUsd = getGoldPriceInUsd();
        // Check if the collateral in the vault is at least worth twice as much USD than the nuggetsAmount is worth in USD
        require(vaults[msg.sender][vaultId].collateral * stEthPriceInUsd >= nuggetsAmount * goldPriceInUsd * minBorrowRatio / 100, "Insufficient collateral");
        vaults[msg.sender][vaultId].debt += nuggetsAmount;
        _mint(msg.sender, nuggetsAmount);
    }

    function repay(uint256 vaultId, uint256 nuggetsAmount) external {
        require(vaults[msg.sender][vaultId].collateral > 0, "No collateral to repay");
        // Calculate stability fee
        uint256 timeElapsed = block.timestamp - vaults[msg.sender][vaultId].stabilityFeeLastPaid;
        uint256 stabilityDebt = vaults[msg.sender][vaultId].debt * stabilityFee / 100 * timeElapsed / 365 days;
        // Transfer stability fee from borrower
        _transfer(msg.sender, address(0), stabilityDebt);
        uint256 collateralAfterFee = vaults[msg.sender][vaultId].collateral - stabilityDebt;
        stETH.transfer(msg.sender, collateralAfterFee);
        vaults[msg.sender][vaultId].collateral = 0;
        vaults[msg.sender][vaultId].debt -= nuggetsAmount;
        _burn(msg.sender, nuggetsAmount);
    }

    function liquidate(address account, uint256 vaultId) external {
        uint256 stEthPriceInUsd = getStethPriceInUsd();
        uint256 nuggetsAmount = vaults[account][vaultId].debt;
        require(vaults[account][vaultId].collateral * stEthPriceInUsd * 100 < nuggetsAmount * liquidationRatio, "Cannot liquidate a sufficiently collateralised position");
        uint256 accountCollateral = vaults[account][vaultId].collateral;
        uint256 liquidationReward = accountCollateral * liquidationFee / 100;
        accountCollateral -= liquidationReward;
        // Transfer the liquidation reward to the liquidator
        stETH.transfer(msg.sender, liquidationReward);
        // Return the remaining collateral to the account that owns the vault
        stETH.transfer(account, accountCollateral);
        vaults[account][vaultId].collateral = 0;
        // Burn borrower's Nuggets
        _burn(account, nuggetsAmount);
    }

    function getStethBalance(address account) public view returns (uint256) {
        return stETH.balanceOf(account);
    }
}
