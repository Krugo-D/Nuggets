import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  Nuggets,
  Nuggets__factory,
  IERC20,
  IERC20__factory,
  EthOracle,
  EthOracle__factory,
} from "../../typechain-types";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("Nuggets", function () {
  let nuggets: Nuggets;
  let ethOracle: EthOracle;
  let owner: ethers.Signer;
  let user: ethers.Signer;
  let liquidator: ethers.Signer;
  let signers: ethers.Signer[];
  let stETH: IERC20;

  const stETHAddress = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
  const whaleAddress = "0x338F3EC014d7edACb98506881d1E18Dc00980fdC"; // whale address with lots of stETH
  const WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"; // address of the WETH token
  const UniswapV2FactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"; // address of the Uniswap V2 Factory

  beforeEach(async function () {
    signers = await ethers.getSigners();
    owner = signers[0];
    user = signers[1];
    liquidator = signers[2];

    const ethOracleFactory = (await ethers.getContractFactory(
      "EthOracle",
      owner
    )) as EthOracle__factory;

    ethOracle = await ethOracleFactory.deploy(
      UniswapV2FactoryAddress,
      stETHAddress,
      WETHAddress
    );
    await ethOracle.deployed();

    const nuggetsFactory = (await ethers.getContractFactory(
      "Nuggets",
      owner
    )) as Nuggets__factory;

    nuggets = await nuggetsFactory.deploy(ethOracle.address);
    await nuggets.deployed();

    stETH = IERC20__factory.connect(stETHAddress, ethers.provider);

    // Impersonate whale account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [whaleAddress],
    });

    const whale = ethers.provider.getSigner(whaleAddress);
    const stEthAmount = ethers.utils.parseEther("1000"); // 1000 stETH

    // Transfer stETH from whale to user
    await stETH.connect(whale).transfer(await user.getAddress(), stEthAmount);

    // Stop impersonating whale account
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [whaleAddress],
    });

    // Set price to $1800 per ETH
    await nuggets.getEthPriceInUsd();
  });

  it("Should mint Nuggets worth half the amount of the USD value of deposited stETH", async function () {
    const stEthAmount = ethers.utils.parseEther("10"); // user deposits 10 stETH
    await stETH.connect(user).approve(nuggets.address, stEthAmount);
    await nuggets.connect(user).mint(stEthAmount);

    // Call getEthPriceInUsd and retrieve the price from the EthPriceUpdated event
    const tx = await nuggets.getEthPriceInUsd();
    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === "EthPriceUpdated");
    const ethPriceInUsd = event?.args?.[0];

    const expectedNuggets = stEthAmount.mul(ethPriceInUsd).div(2); // minted NGT = 2 * stETH * ethPriceInUsd
    expect(await nuggets.balanceOf(await user.getAddress())).to.equal(
      expectedNuggets
    );
  });

  /*
  it("Should allow users to liquidate undercollateralised positions", async function () {
    const stEthAmount = ethers.utils.parseEther("10"); // user deposits 10 stETH
    await stETH.connect(user).approve(nuggets.address, stEthAmount);
    await nuggets.connect(user).mint(stEthAmount);

    // Set price to $500 per ETH, making the position undercollateralized
    

    // Liquidator tries to liquidate the user's position
    await nuggets.connect(liquidator).liquidate(await user.getAddress());

    expect(await nuggets.balanceOf(await user.getAddress())).to.equal(0); // user's Nuggets balance should be 0 after liquidation
    expect(await stETH.balanceOf(await liquidator.getAddress())).to.be.gt(0); // liquidator should have received some stETH
  });
  */
});
