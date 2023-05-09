import { ethers, run } from "hardhat";

async function main() {
  await run("compile");

  const factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  const token0 = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const token1 = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  const EthOracleFactory = await ethers.getContractFactory("EthOracle");
  const ethOracle = await EthOracleFactory.deploy(factory, token0, token1);

  console.log("Deploying EthOracle...");
  await ethOracle.deployed();

  console.log("EthOracle deployed to:", ethOracle.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
