import { HardhatUserConfig, task } from "hardhat/config";
import {
  copyFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  existsSync,
  writeFileSync,
} from "fs";
import { resolve, join } from "path";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import * as dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config(); // Load environment variables from .env file

task(
  "compile",
  "Compiles the entire project, building all artifacts",
  async (args, hre, runSuper) => {
    await runSuper(args); // this runs the original compile task

    const artifactDirectory = resolve(__dirname, "./artifacts/contracts");
    const destinationDirectory = resolve(__dirname, "./frontend/src/abi");

    const copyFilesRecursive = (
      sourceDirectory: string,
      destinationDirectory: string
    ) => {
      readdirSync(sourceDirectory).forEach((file) => {
        const sourceFile = join(sourceDirectory, file);
        const destinationFile = join(destinationDirectory, file);

        if (statSync(sourceFile).isDirectory()) {
          if (!existsSync(destinationFile)) {
            mkdirSync(destinationFile, { recursive: true });
          }
          copyFilesRecursive(sourceFile, destinationFile);
        } else {
          copyFileSync(sourceFile, destinationFile);
        }
      });
    };

    copyFilesRecursive(artifactDirectory, destinationDirectory);

    console.log(`Copied contract artifacts to ${destinationDirectory}`);
  }
);

// Create an ethers.Wallet instance for each account derived from the mnemonic
const accounts = ethers.Wallet.fromMnemonic(
  process.env.MNEMONIC || ""
).privateKey;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.INFURA_URL_MAINNET || "", // Load from environment variable
        blockNumber: 17221015,
      },
    },
    localhost: {
      forking: {
        url: process.env.INFURA_URL_MAINNET || "", // Load from environment variable
        blockNumber: 17221015,
      },
    },
    ropsten: {
      url: process.env.INFURA_URL_ROPSTEN || "", // Load from environment variable
      accounts: [accounts], // use derived accounts
    },
    // Add other networks here
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
