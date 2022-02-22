const { ThirdwebSDK } = require("@thirdweb-dev/sdk");

const sdk = new ThirdwebSDK(process.env.RPC_URL);
const nftContract = sdk.getNFTCollection(
  "0xE0Ed2e05589aacd9E7AAAc642B78fa4B6bEc43fD"
);

module.exports = { nftContract };
