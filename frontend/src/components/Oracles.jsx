// Oracles.js
import React from "react";

const Oracles = ({ stETHPrice, goldPrice }) => {
  return (
    <div className="mb-3">
      <h2>Oracles</h2>
      <p>
        stETH Price in USD: {stETHPrice} <br />
        Gold Price in USD: {goldPrice}
      </p>
    </div>
  );
};

export default Oracles;
