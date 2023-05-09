import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { EthOracle } from "../typechain/EthOracle";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("EthOracle", function () {
  let ethOracle: EthOracle;

  const factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // UniswapV2 factory address on mainnet
  const tokenA = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // WETH address on mainnet
  const tokenB = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI address on mainnet

  beforeEach(async function () {
    const EthOracleFactory = await ethers.getContractFactory("EthOracle");
    ethOracle = (await EthOracleFactory.deploy(
      factory,
      tokenA,
      tokenB
    )) as EthOracle;
    await ethOracle.deployed();
  });

  it("Should successfully deploy and set initial state", async function () {
    expect(ethOracle.address).to.properAddress;

    // Sort the tokens to match the contract's sorting
    const [sortedTokenA, sortedTokenB] = [tokenA, tokenB].sort();

    // Compare the addresses in lower case
    expect((await ethOracle.token0()).toLowerCase()).to.equal(
      sortedTokenA.toLowerCase()
    );
    expect((await ethOracle.token1()).toLowerCase()).to.equal(
      sortedTokenB.toLowerCase()
    );
  });

  it("Should not update if period not elapsed", async function () {
    await expect(ethOracle.update()).to.be.revertedWith(
      "EthOracle: PERIOD_NOT_ELAPSED"
    );
  });

  it("Should return 0 for consult before first update", async function () {
    const amountIn = ethers.utils.parseEther("1");
    const amountOut = await ethOracle.consult(tokenA, amountIn);
    expect(amountOut).to.equal(0);
  });

  it("Should return a number for consult after first update", async function () {
    // Assuming that the test environment can fast forward time
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]); // Add 24 hours
    await ethers.provider.send("evm_mine", []); // Mine the next block

    await ethOracle.update();

    const amountIn = ethers.utils.parseEther("1");
    const amountOut = await ethOracle.consult(tokenA, amountIn);
    expect(amountOut).to.not.equal(0);
  });
});
