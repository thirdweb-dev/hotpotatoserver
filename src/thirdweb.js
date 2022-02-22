const { ThirdwebSDK } = require("@thirdweb-dev/sdk");

const sdk = new ThirdwebSDK(process.env.POLYGON_RPC_URL);
const nftContract = sdk.getNFTCollection(
  "0xBaCE9e183C5815C95ad246432190e16FB066a48B"
);

module.exports = { nftContract };
