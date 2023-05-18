import React, { useEffect, useState } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";

// Your contract ABI
import contractABI from "..public/contracts/Nuggets.sol";

const CONTRACT_ADDRESS = "Your_Contract_Address";

function App() {
  const [account, setAccount] = useState(null);
  const [nuggetsContract, setNuggetsContract] = useState(null);
  const [stETHLocked, setStETHLocked] = useState(0);
  const [nuggetsMinted, setNuggetsMinted] = useState(0);
  const [collateralRatio, setCollateralRatio] = useState(0);
  const [web3Modal, setWeb3Modal] = useState(null);

  useEffect(() => {
    const web3Modal = new Web3Modal();
    setWeb3Modal(web3Modal);
  }, []);

  const connectWallet = async () => {
    const provider = await web3Modal.connect();
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const nuggetsContract = new web3.eth.Contract(
      contractABI,
      CONTRACT_ADDRESS
    );
    setAccount(accounts[0]);
    setNuggetsContract(nuggetsContract);
  };

  useEffect(() => {
    if (account && nuggetsContract) {
      fetchContractData();
    }
  }, [account, nuggetsContract]);

  const fetchContractData = async () => {
    const stETHLocked = await nuggetsContract.methods
      .collateral(account)
      .call();
    const nuggetsMinted = await nuggetsContract.methods
      .balanceOf(account)
      .call();
    const collateralRatio = await nuggetsContract.methods
      .COLLATERAL_RATIO()
      .call();

    setStETHLocked(web3.utils.fromWei(stETHLocked));
    setNuggetsMinted(web3.utils.fromWei(nuggetsMinted));
    setCollateralRatio(collateralRatio);
  };

  return (
    <div>
      <button onClick={connectWallet}>Connect Wallet</button>
      <div>stETH Locked: {stETHLocked}</div>
      <div>Nuggets Minted: {nuggetsMinted}</div>
      <div>Collateral Ratio: {collateralRatio}</div>
    </div>
  );
}

export default App;
