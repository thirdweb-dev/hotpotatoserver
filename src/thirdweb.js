const { ThirdwebSDK } = require("@thirdweb-dev/sdk");

const sdk = new ThirdwebSDK(process.env.POLYGON_RPC_URL);
//const sdk = new ThirdwebSDK(process.env.RPC_URL);
// const mumbaiContract = "0xE0Ed2e05589aacd9E7AAAc642B78fa4B6bEc43fD";
const polygonContract = "0x2e060c85676Ba6B1D38737AC3e0B84Ff20e32Dee";
const nftContract = sdk.getNFTCollection(polygonContract);

module.exports = { nftContract };
