const server = require(".");
const { TwitterApi } = require("twitter-api-v2");
var cron = require("node-cron");
const fs = require("fs");

const client = new TwitterApi(process.env.TWITTER_BEARER);
const dbpath = "/data/pool.json";

let db = {};
if (!fs.existsSync(dbpath)) {
  fs.writeFileSync(dbpath, JSON.stringify({}));
}

const database = () => {
  return JSON.parse(fs.readFileSync(dbpath));
};

// add new wallet to the address pool
const addWallet = (address, username) => {
  fs.writeFileSync(
    dbpath,
    JSON.stringify({ ...database(), [address]: username })
  );
};

// run server
server();

async function tweetTransfer(address) {
  const username = database()[address];
  try {
    await client.v1.tweet(
      `The 🔥🥔 NFT has been transferred to ${
        username ? "@" + username : address
      }\n\nYou have 24 hours to transfer 🔥🥔 NFT to another address.\n\nJoin the Hot Potato NFT game: ${landing}`
    );
  } catch (e) {
    console.log(e);
  }
}

// check every minute for new replies
cron.schedule("* * * * *", async () => {
  try {
    const query = await client.search("(to:hotpotatogg)");
    console.log(query);
    // TODO: add new addresses to pool
    // addWallet(query..., query....);
  } catch (e) {
    console.log(e);
  }
});

module.exports = {
  tweetTransfer,
  database,
  addWallet,
};
