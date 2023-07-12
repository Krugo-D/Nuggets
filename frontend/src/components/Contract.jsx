// Contract.js
import React from "react";

const Contract = ({ CONTRACT_ADDRESS, liquidationRatio }) => {
  return (
    <div className="mb-3">
      <h2>Contract</h2>
      <p>
        Address: {CONTRACT_ADDRESS} <br />
        Liquidation Ratio: {liquidationRatio}
      </p>
    </div>
  );
};

export default Contract;
