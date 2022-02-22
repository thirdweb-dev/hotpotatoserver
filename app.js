require("dotenv").config();
const tw = require("./src/thirdweb");
const twitter = require("./src/twitter");
const db = require("./src/db");
var cron = require("node-cron");
const server = require("./src/server");

// add transfer listener on the contract
tw.nftContract.addTransferEventListener((from, to, tokenId) => {
  console.log("New Transfer!", from, to, tokenId);
  // TODO check its the right token id
  db.recordTransfer(to);
  // TODO send tweet and mention user
});

// check every minute for new replies
cron.schedule("* * * * *", async () => {
  try {
    const nft = await tw.nftContract.get(0);
    console.log("CRON TIME", nft);
    //const query = await twitter.client.search("(to:hotpotatogg)");
    //console.log(query);
    // TODO: add new addresses to pool
    // db.addWallet(query..., query....);
  } catch (e) {
    console.log(e);
  }
});
