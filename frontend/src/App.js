import React, { useEffect, useState } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import "./styles.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

// Import your components
import Header from "./components/Header";
import Account from "./components/Account";
import Oracles from "./components/Oracles";
import Contract from "./components/Contract";
import Loading from "./components/Loading";

// Your contract ABI
import nuggetsArtifact from "./abi/Nuggets.sol/Nuggets.json";
const contractABI = nuggetsArtifact.abi;
const CONTRACT_ADDRESS = "0x1c39BA375faB6a9f6E0c01B9F49d488e101C2011";

// Load the IERC20 artifact
const IERC20Artifact = require("./abi/IERC20.sol/IERC20.json");

// Your stETH contract address
const STETH_CONTRACT_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

function App() {
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [nuggetsContract, setNuggetsContract] = useState(null);
  const [stETHContract, setStETHContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stETHBalance, setStETHBalance] = useState(0);
  const [stETHLocked, setStETHLocked] = useState(0);
  const [nuggetsMinted, setNuggetsMinted] = useState(0);
  const [liquidationRatio, setLiquidationRatio] = useState(0);
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

    const stETHContract = new web3Instance.eth.Contract(
      IERC20Artifact.abi,
      STETH_CONTRACT_ADDRESS
    );

    setAccount(accounts[0]);
    setWeb3(web3Instance);
    setNuggetsContract(contract);
    setStETHContract(stETHContract);
  };

  const disconnectWallet = () => {
    web3Modal.clearCachedProvider();
    setAccount(null);
    setWeb3(null);
    setNuggetsContract(null);
    setStETHContract(null);
  };

  const handleMaxBorrow = () => {
    setBorrowAmount(stETHBalance);
  };

  const handleMaxRedeem = () => {
    setRedeemAmount(nuggetsMinted);
  };

  const handleBorrow = async () => {
    if (nuggetsContract && account && stETHContract) {
      setIsLoading(true);
      try {
        const borrowAmountInWei = web3.utils.toWei(borrowAmount, "ether");
        const approveTransaction = await stETHContract.methods
          .approve(CONTRACT_ADDRESS, borrowAmountInWei)
          .send({ from: account });

        if (approveTransaction) {
          const borrowTransaction = await nuggetsContract.methods
            .borrow(borrowAmountInWei)
            .send({ from: account });

          if (borrowTransaction) {
            fetchContractData();
            setBorrowAmount(0); // Reset the borrowAmount field
          }
        }
      } catch (error) {
        console.error("Error borrowing: ", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRedeem = async () => {
    if (nuggetsContract && account) {
      setIsLoading(true);
      try {
        const redeemAmountInWei = web3.utils.toWei(redeemAmount, "ether");
        const redeemTransaction = await nuggetsContract.methods
          .repay(redeemAmountInWei)
          .send({ from: account });

        if (redeemTransaction) {
          fetchContractData();
          setRedeemAmount(0); // Reset the redeemAmount field
        }
      } catch (error) {
        console.error("Error redeeming: ", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchContractData = async () => {
    const stETHBalance = await stETHContract.methods.balanceOf(account).call();
    const stETHLocked = await nuggetsContract.methods
      .collateral(account)
      .call();
    const nuggetsMinted = await nuggetsContract.methods
      .balanceOf(account)
      .call();
    const liquidationRatio = await nuggetsContract.methods
      .LIQUIDATION_RATIO()
      .call();
    const stETHPrice = await nuggetsContract.methods
      .getStethPriceInUsd()
      .call();
    const goldPrice = await nuggetsContract.methods.getGoldPriceInUsd().call();

    setStETHBalance(web3.utils.fromWei(stETHBalance, "ether"));
    setStETHLocked(web3.utils.fromWei(stETHLocked, "ether"));
    setNuggetsMinted(web3.utils.fromWei(nuggetsMinted, "ether"));
    setLiquidationRatio(liquidationRatio);
    setStETHPrice(web3.utils.fromWei(stETHPrice.toString(), "ether"));
    setGoldPrice(web3.utils.fromWei(goldPrice.toString(), "ether"));
  };

  useEffect(() => {
    if (nuggetsContract && account) {
      fetchContractData();
    }
  }, [nuggetsContract, account]);

  return (
    <div className="align-items-center">
      <Container className="shadow-lg p-3 mb-5 bg-white rounded">
        <Row className="justify-content-md-center mb-3">
          <Col xs={12} md={8} lg={6}>
            <Header
              account={account}
              connectWallet={connectWallet}
              disconnectWallet={disconnectWallet}
            />
          </Col>
        </Row>

        {account && (
          <>
            <Row>
              <Col xs={12} md={6}>
                <Account
                  account={account}
                  stETHBalance={stETHBalance}
                  stETHLocked={stETHLocked}
                  nuggetsMinted={nuggetsMinted}
                  borrowAmount={borrowAmount}
                  setBorrowAmount={setBorrowAmount}
                  handleMaxBorrow={handleMaxBorrow}
                  handleBorrow={handleBorrow}
                  redeemAmount={redeemAmount}
                  setRedeemAmount={setRedeemAmount}
                  handleMaxRedeem={handleMaxRedeem}
                  handleRedeem={handleRedeem}
                />
              </Col>
              <Col xs={12} md={6}>
                <Oracles stETHPrice={stETHPrice} goldPrice={goldPrice} />
                <Contract
                  CONTRACT_ADDRESS={CONTRACT_ADDRESS}
                  liquidationRatio={liquidationRatio}
                />
              </Col>
            </Row>
            <Row>
              <Loading isLoading={isLoading} />
            </Row>
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
