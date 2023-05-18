import { ethers } from "hardhat";
import { readFileSync } from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying the Nuggets contract with the account:",
    deployer.address
  );

  const networkName = process.env.HARDHAT_NETWORK || "hardhat";

  const config = JSON.parse(
    readFileSync(`configs/${networkName}-config.json`, "utf8")
  );

  const Nuggets = await ethers.getContractFactory("Nuggets");
  const nuggets = await Nuggets.deploy(
    config.StethAddress,
    config.ChainlinkStethPriceFeedAddress,
    config.ChainlinkGoldPriceFeedAddress
  );

  console.log("Nuggets contract deployed at:", nuggets.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
