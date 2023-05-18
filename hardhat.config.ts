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

task(
  "compile",
  "Compiles the entire project, building all artifacts",
  async (args, hre, runSuper) => {
    await runSuper(args); // this runs the original compile task

    const artifactDirectory = resolve(__dirname, "./artifacts/contracts");
    const destinationDirectory = resolve(
      __dirname,
      "./frontend/public/contracts"
    );

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
