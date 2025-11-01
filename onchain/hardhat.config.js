require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { BASE_SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.19",
  networks: {
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: "PLACEHOLDER_KEY", // optional for verifying later
  },
};
