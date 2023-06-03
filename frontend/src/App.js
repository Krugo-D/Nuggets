import React, { useEffect, useState } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import "./styles.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

// Your contract ABI
import nuggetsArtifact from "./abi/Nuggets.sol/Nuggets.json";
const contractABI = nuggetsArtifact.abi;
const CONTRACT_ADDRESS = "0xb04CB6c52E73CF3e2753776030CE85a36549c9C2";

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
    const collateralRatio = await nuggetsContract.methods
      .COLLATERAL_RATIO()
      .call();
    const stETHPrice = await nuggetsContract.methods
      .getStethPriceInUsd()
      .call();
    const goldPrice = await nuggetsContract.methods.getGoldPriceInUsd().call();

    setStETHBalance(web3.utils.fromWei(stETHBalance, "ether"));
    setStETHLocked(web3.utils.fromWei(stETHLocked, "ether"));
    setNuggetsMinted(web3.utils.fromWei(nuggetsMinted, "ether"));
    setCollateralRatio(collateralRatio);
    setStETHPrice(web3.utils.fromWei(stETHPrice.toString(), "ether"));
    setGoldPrice(web3.utils.fromWei(goldPrice.toString(), "ether"));
  };

  useEffect(() => {
    if (nuggetsContract && account) {
      fetchContractData();
    }
  }, [nuggetsContract, account]);

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col xs lg="2">
          <Button onClick={account ? disconnectWallet : connectWallet}>
            {account ? "Disconnect Wallet" : "Connect Wallet"}
          </Button>
        </Col>
      </Row>

      {account && (
        <>
          <Row>
            <Col>
              <Card>
                <Card.Header>Account</Card.Header>
                <Card.Body>
                  <Card.Title>{account}</Card.Title>
                  <Card.Text>
                    stETH Balance: {stETHBalance} <br />
                    stETH Locked: {stETHLocked} <br />
                    Nuggets Borrowed: {nuggetsMinted}
                  </Card.Text>
                </Card.Body>
                <Card.Body>
                  <InputGroup className="mb-3">
                    <FormControl
                      placeholder="Amount"
                      aria-label="Amount"
                      aria-describedby="basic-addon2"
                      type="number"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={handleMaxBorrow}>
                      Max
                    </Button>
                    <Button variant="outline-primary" onClick={handleBorrow}>
                      Borrow
                    </Button>
                  </InputGroup>
                </Card.Body>
                <Card.Body>
                  <InputGroup className="mb-3">
                    <FormControl
                      placeholder="Amount"
                      aria-label="Amount"
                      aria-describedby="basic-addon2"
                      type="number"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={handleMaxRedeem}>
                      Max
                    </Button>
                    <Button variant="outline-primary" onClick={handleRedeem}>
                      Redeem
                    </Button>
                  </InputGroup>
                </Card.Body>
              </Card>
            </Col>
            <Col>
              <Card>
                <Card.Header>Oracles</Card.Header>
                <Card.Body>
                  <Card.Text>
                    stETH Price in USD: {stETHPrice} <br />
                    Gold Price in USD: {goldPrice}
                  </Card.Text>
                </Card.Body>
              </Card>
              <Card>
                <Card.Header>Contract</Card.Header>
                <Card.Body>
                  <Card.Title>{CONTRACT_ADDRESS}</Card.Title>
                  <Card.Text>Collateral Ratio: {collateralRatio}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>{isLoading && <Col>Transaction is being processed...</Col>}</Row>
        </>
      )}
    </Container>
  );
}

export default App;
