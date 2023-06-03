import { ethers } from "hardhat";
import { readFileSync } from "fs";

async function main() {
  const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  console.log("Sending stETH from the whale account to:", recipient);

  const networkName = process.env.HARDHAT_NETWORK || "hardhat";

  const config = JSON.parse(
    readFileSync(`configs/${networkName}-config.json`, "utf8")
  );

  // Define the stETH whale address and the amount to send
  const whaleAddress = config.StethWhaleAddress;
  const amountToSend = ethers.utils.parseEther("10"); // Sending 1000 stETH tokens

  // Impersonate the whale account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleAddress],
  });

  // Get a new signer instance for the impersonated account
  const whaleSigner = ethers.provider.getSigner(whaleAddress);

  // Attach the whale account to the stETH contract
  const stethFromWhale = await ethers.getContractAt(
    "IERC20",
    config.StethTokenAddress,
    whaleSigner
  );

  // Make the transfer
  const tx = await stethFromWhale.transfer(recipient, amountToSend);

  // Wait for the transaction to be mined
  await tx.wait();

  console.log(
    `Sent ${ethers.utils.formatEther(amountToSend)} stETH to ${recipient}`
  );

  // Stop impersonating the whale account
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [whaleAddress],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
