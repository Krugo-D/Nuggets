import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  Nuggets,
  Nuggets__factory,
  IERC20,
  IERC20__factory,
} from "../../typechain-types";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("Nuggets", function () {
  let nuggets: Nuggets;
  let owner: ethers.Signer;
  let user: ethers.Signer;
  let liquidator: ethers.Signer;
  let signers: ethers.Signer[];
  let stETH: IERC20;

  const stETHAddress = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";
  const whaleAddress = "0x338F3EC014d7edACb98506881d1E18Dc00980fdC"; // whale address with lots of stETH

  beforeEach(async function () {
    signers = await ethers.getSigners();
    owner = signers[0];
    user = signers[1];
    liquidator = signers[2];

    const nuggetsFactory = (await ethers.getContractFactory(
      "Nuggets",
      owner
    )) as Nuggets__factory;

    nuggets = await nuggetsFactory.deploy();
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
    await nuggets.setEthPriceInUsd(ethers.utils.parseEther("1800"));
  });

  it("Should mint Nuggets worth half the amount of the USD value of deposited stETH", async function () {
    const stEthAmount = ethers.utils.parseEther("10"); // user deposits 10 stETH
    await stETH.connect(user).approve(nuggets.address, stEthAmount);
    await nuggets.connect(user).mint(stEthAmount);
    const ethPriceInUsd = await nuggets.ethPriceInUsd();
    const expectedNuggets = stEthAmount.mul(ethPriceInUsd).div(2); // minted NGT = 2 * stETH * ethPriceInUsd
    expect(await nuggets.balanceOf(await user.getAddress())).to.equal(
      expectedNuggets
    );
  });

  it("Should allow users to liquidate undercollateralised positions", async function () {
    const stEthAmount = ethers.utils.parseEther("10"); // user deposits 10 stETH
    await stETH.connect(user).approve(nuggets.address, stEthAmount);
    await nuggets.connect(user).mint(stEthAmount);

    // Set price to $500 per ETH, making the position undercollateralized
    await nuggets.setEthPriceInUsd(ethers.utils.parseEther("500"));

    // Liquidator tries to liquidate the user's position
    await nuggets.connect(liquidator).liquidate(await user.getAddress());

    expect(await nuggets.balanceOf(await user.getAddress())).to.equal(0); // user's Nuggets balance should be 0 after liquidation
    expect(await stETH.balanceOf(await liquidator.getAddress())).to.be.gt(0); // liquidator should have received some stETH
  });
});
