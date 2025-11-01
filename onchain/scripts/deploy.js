const hre = require("hardhat");

async function main() {
  const Ba2048 = await hre.ethers.getContractFactory("Ba2048");
  const game = await Ba2048.deploy();

  await game.waitForDeployment();

  console.log("✅ Ba2048 deployed to:", await game.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
