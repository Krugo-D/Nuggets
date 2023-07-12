// Header.js
import React from "react";
import Button from "react-bootstrap/Button";

const Header = ({ account, connectWallet, disconnectWallet }) => {
  return (
    <div className="text-center">
      <Button onClick={account ? disconnectWallet : connectWallet}>
        {account ? "Disconnect Wallet" : "Connect Wallet"}
      </Button>
    </div>
  );
};

export default Header;
