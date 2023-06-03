import React, { useEffect, useState } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";

// Your contract ABI
import nuggetsArtifact from "./abi/Nuggets.sol/Nuggets.json";
const contractABI = nuggetsArtifact.abi;

const CONTRACT_ADDRESS = "0xb04CB6c52E73CF3e2753776030CE85a36549c9C2";

function App() {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [nuggetsContract, setNuggetsContract] = useState(null);
  const [stETHBalance, setStETHBalance] = useState(0); // Added
  const [stETHLocked, setStETHLocked] = useState(0);
  const [nuggetsMinted, setNuggetsMinted] = useState(0);
  const [collateralRatio, setCollateralRatio] = useState(0);
  const [stETHPrice, setStETHPrice] = useState(0);
  const [goldPrice, setGoldPrice] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [redeemAmount, setRedeemAmount] = useState(0);
  const web3Modal = new Web3Modal();

  const connectWallet = async () => {
    const provider = await web3Modal.connect();
    const web3Instance = new Web3(provider);
    const accounts = await web3Instance.eth.getAccounts();
    const contract = new web3Instance.eth.Contract(
      contractABI,
      CONTRACT_ADDRESS
    );

    setAccount(accounts[0]);
    setWeb3(web3Instance);
    setNuggetsContract(contract);
  };

  const disconnectWallet = () => {
    web3Modal.clearCachedProvider();
    setAccount(null);
    setWeb3(null);
    setNuggetsContract(null);
  };

  const handleBorrow = async () => {
    if (nuggetsContract && account) {
      // Load the IERC20 artifact
      const IERC20Artifact = require("./abi/IERC20.sol/IERC20.json");

      // Instantiate a new contract instance for the stETH token contract
      const stETHContract = new web3.eth.Contract(
        IERC20Artifact.abi,
        "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
      );

      // Convert the borrow amount to WEI
      const borrowAmountInWei = web3.utils.toWei(borrowAmount, "ether");

      // Approve the Nuggets contract to spend the stETH tokens
      const approveTx = await stETHContract.methods
        .approve(CONTRACT_ADDRESS, borrowAmountInWei)
        .send({ from: account });

      // Once the approve transaction has confirmed, trigger the borrow function
      if (approveTx.status) {
        await nuggetsContract.methods
          .borrow(borrowAmountInWei)
          .send({ from: account });
      }
    }
  };

  const handleRedeem = async () => {
    if (nuggetsContract && account) {
      // Convert the redeem amount to WEI
      const redeemAmountInWei = web3.utils.toWei(redeemAmount, "ether");

      // Call the repay function with the redeem amount in Wei
      await nuggetsContract.methods
        .repay(redeemAmountInWei)
        .send({ from: account });
    }
  };

  useEffect(() => {
    if (nuggetsContract && account) {
      const fetchContractData = async () => {
        const stETHBalance = await nuggetsContract.methods
          .getStethBalance(account)
          .call();
        const stETHLocked = await nuggetsContract.methods
          .collateral(account)
          .call();
        const nuggetsMinted = await nuggetsContract.methods
          .balanceOf(account)
          .call();
        const collateralRatio = await nuggetsContract.methods
          .COLLATERAL_RATIO()
          .call();
        const stETHPrice = await nuggetsContract.methods
          .getStethPriceInUsd()
          .call();
        const goldPrice = await nuggetsContract.methods
          .getGoldPriceInUsd()
          .call();

        setStETHBalance(web3.utils.fromWei(stETHBalance, "ether"));
        setStETHLocked(web3.utils.fromWei(stETHLocked, "ether"));
        setNuggetsMinted(web3.utils.fromWei(nuggetsMinted, "ether"));
        setCollateralRatio(collateralRatio);
        setStETHPrice(web3.utils.fromWei(stETHPrice.toString(), "ether"));
        setGoldPrice(web3.utils.fromWei(goldPrice.toString(), "ether"));
      };

      fetchContractData();
    }
  }, [nuggetsContract, account]);

  return (
    <div>
      <button onClick={account ? disconnectWallet : connectWallet}>
        {account ? "Disconnect Wallet" : "Connect Wallet"}
      </button>
      {account && (
        <div>
          <h2>Account: {account}</h2>
          <h2>stETH Balance: {stETHBalance}</h2> {/* Added */}
          <h2>stETH Locked: {stETHLocked}</h2>
          <h2>Nuggets Minted: {nuggetsMinted}</h2>
          <h2>Collateral Ratio: {collateralRatio}</h2>
          <h2>stETH Price in USD: {stETHPrice}</h2>
          <h2>Gold Price in USD: {goldPrice}</h2>
          <div>
            <h2>Borrow Nuggets</h2>
            <input
              type="number"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
            />
            <button onClick={handleBorrow}>Borrow</button>
          </div>
          <div>
            <h2>Redeem Nuggets</h2>
            <input
              type="number"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
            />
            <button onClick={handleRedeem}>Redeem</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
