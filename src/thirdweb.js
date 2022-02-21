const { ThirdwebSDK } = require("@thirdweb-dev/sdk");

const sdk = new ThirdwebSDK(process.env.RPC_URL);
const nftContract = sdk.getNFTCollection(
  "0xE0Ed2e05589aacd9E7AAAc642B78fa4B6bEc43fD"
);

// add transfer listener on the contract
nftContract.addTransferEventListener((from, to, tokenId) => {
  console.log("New Transfer!", from, to, tokenId);
});

module.exports = { nftContract };
