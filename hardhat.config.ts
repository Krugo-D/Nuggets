import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/2a230ae89c534f9ca95b815000910bc5",
        blockNumber: 17221015,
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.0",
      },
      {
        version: "0.6.6",
      },
    ],
  },
};

export default config;
