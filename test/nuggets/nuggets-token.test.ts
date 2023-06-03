import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  Nuggets,
  Nuggets__factory,
  IERC20,
  IERC20__factory,
} from "../../typechain-types";
import { readFileSync } from "fs";
import { join } from "path";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("Nuggets", function () {
  let nuggets: Nuggets;
  let owner: ethers.Signer;
  let user: ethers.Signer;
  let liquidator: ethers.Signer;
  let signers: ethers.Signer[];
  let stETH: IERC20;
  let link: IERC20;
  let config: any;

  beforeEach(async function () {
    signers = await ethers.getSigners();
    owner = signers[0];
    user = signers[1];
    liquidator = signers[2];

    const networkName = process.env.HARDHAT_NETWORK || "hardhat";

    config = JSON.parse(
      readFileSync(
        join(__dirname, `../../configs/${networkName}-config.json`),
        "utf8"
      )
    );

    const NuggetsContract = await ethers.getContractFactory("Nuggets");
    nuggets = await NuggetsContract.deploy(
      config.StethTokenAddress,
      config.ChainlinkStethPriceFeedAddress,
      config.ChainlinkGoldPriceFeedAddress
    );
    await nuggets.deployed();

    stETH = IERC20__factory.connect(config.StethTokenAddress, owner);
    link = IERC20__factory.connect(config.ChainlinkTokenAddress, owner);

    // Impersonate stETH whale account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [config.StethWhaleAddress],
    });

    const stEthWhale = ethers.provider.getSigner(config.StethWhaleAddress);
    const stEthAmount = ethers.utils.parseEther("1000"); // 1000 stETH

    // Transfer stETH from whale to user
    await stETH
      .connect(stEthWhale)
      .transfer(await user.getAddress(), stEthAmount);

    // Stop impersonating stETH whale account
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [config.StethWhaleAddress],
    });

    // Impersonate Chainlink whale account
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [config.ChainlinkWhaleAddress],
    });

    const chainlinkWhale = ethers.provider.getSigner(
      config.ChainlinkWhaleAddress
    );
    const linkAmount = ethers.utils.parseEther("1000"); // 1000 LINK

    // Transfer LINK from Chainlink whale to Nuggets contract
    await link.connect(chainlinkWhale).transfer(nuggets.address, linkAmount);

    // Stop impersonating Chainlink whale account
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [config.ChainlinkWhaleAddress],
    });
  });

  it("Should allow users to borrow Nuggets", async function () {
    const stEthAmount = ethers.utils.parseEther("10"); // user deposits 10 stETH
    await stETH.connect(user).approve(nuggets.address, stEthAmount);
    await nuggets.connect(user).borrow(stEthAmount);

    expect(await nuggets.balanceOf(await user.getAddress())).to.be.gt(0); // user should have borrowed some Nuggets
  });

  it("Should allow users to repay Nuggets and get their collateral back", async function () {
    const stEthAmount = ethers.utils.parseEther("10"); // user deposits 10 stETH
    await stETH.connect(user).approve(nuggets.address, stEthAmount);
    await nuggets.connect(user).borrow(stEthAmount);

    const nuggetsAmount = await nuggets.balanceOf(await user.getAddress()); // get the amount of borrowed Nuggets

    await nuggets.connect(user).repay(nuggetsAmount); // user repays all borrowed Nuggets

    expect(await nuggets.balanceOf(await user.getAddress())).to.equal(0); // user's Nuggets balance should be 0 after repayment
    expect(await stETH.balanceOf(await user.getAddress())).to.be.gt(0); // user should have received their stETH back
  });

  /*
  it("Should allow liquidators to liquidate undercollateralised positions", async function () {
    // for this test we need a mock oracle where we can manipulate the stETH price
  });
  */

  it("Should prevent liquidation of adequately collateralised positions", async function () {
    const stEthAmount = ethers.utils.parseEther("10"); // user deposits 10 stETH
    await stETH.connect(user).approve(nuggets.address, stEthAmount);
    await nuggets.connect(user).borrow(stEthAmount);

    // Liquidator tries to liquidate a correctly collateralised position
    await expect(
      nuggets.connect(liquidator).liquidate(await user.getAddress())
    ).to.be.revertedWith(
      "Cannot liquidate a sufficiently collateralised position"
    );
  });
});
