const { ThirdwebSDK } = require("@thirdweb-dev/sdk");

const sdk = new ThirdwebSDK(process.env.POLYGON_RPC_URL);
//const sdk = new ThirdwebSDK(process.env.RPC_URL);
// const mumbaiContract = "0xE0Ed2e05589aacd9E7AAAc642B78fa4B6bEc43fD";
const polygonContract = "0xBaCE9e183C5815C95ad246432190e16FB066a48B";
const nftContract = sdk.getNFTCollection(polygonContract);

module.exports = { nftContract };
