// Account.js
import React from "react";
import Button from "react-bootstrap/Button";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

const Account = ({
  account,
  stETHBalance,
  stETHLocked,
  nuggetsMinted,
  borrowAmount,
  setBorrowAmount,
  handleMaxBorrow,
  handleBorrow,
  redeemAmount,
  setRedeemAmount,
  handleMaxRedeem,
  handleRedeem,
}) => {
  return (
    <div className="mb-3">
      <h2>Account</h2>
      <p>
        Address: {account} <br />
        stETH Balance: {stETHBalance} <br />
        stETH Locked: {stETHLocked} <br />
        Nuggets Borrowed: {nuggetsMinted}
      </p>
      <InputGroup className="mb-3">
        <FormControl
          placeholder="Amount"
          aria-label="Amount"
          aria-describedby="basic-addon2"
          type="number"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
        />
        <Button variant="outline-secondary" onClick={handleMaxBorrow}>
          Max
        </Button>
        <Button variant="outline-primary" onClick={handleBorrow}>
          Borrow
        </Button>
      </InputGroup>
      <InputGroup className="mb-3">
        <FormControl
          placeholder="Amount"
          aria-label="Amount"
          aria-describedby="basic-addon2"
          type="number"
          value={redeemAmount}
          onChange={(e) => setRedeemAmount(e.target.value)}
        />
        <Button variant="outline-secondary" onClick={handleMaxRedeem}>
          Max
        </Button>
        <Button variant="outline-primary" onClick={handleRedeem}>
          Redeem
        </Button>
      </InputGroup>
    </div>
  );
};

export default Account;
