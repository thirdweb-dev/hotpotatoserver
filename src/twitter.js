const { TwitterApi } = require("twitter-api-v2");
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
});
const db = require("./db");
const { ethers } = require("ethers");

async function tweetTransfer(address) {
  const username = db.fetchUsername(address);
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

async function verifyTweet(tweetId) {
  const tweet = await client.v1.singleTweet(tweetId);
  console.log("processing tweet", tweet.full_text);
  const ensRegex =
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
  let addresses = tweet.full_text.match(ensRegex) || [];
  if (addresses.length == 0) {
    const regex = /0x[a-fA-F0-9]{40}/;
    addresses = tweet.full_text.match(regex) || [];
  }
  if (addresses.length == 0) {
    throw new Error("No address found");
  } else {
    let address = addresses[0];
    if (address.endsWith(".eth")) {
      address = await ethers
        .getDefaultProvider(process.env.MAINNET_RPC_URL)
        .resolveName(address);
    }
    if (!ethers.utils.isAddress(address)) {
      throw new Error("Invalid address");
    }
    if (db.fetchUsername(address)) {
      throw new Error("Address already verified");
    } else {
      db.addWallet(address, tweet.user.screen_name);
    }
    return addresses[0];
  }
}
async function tweetLoser(address) {
  const username = db.fetchUsername(address);
  try {
    await client.v1.tweet(
      `The 🔥🥔 NFT blasted because ${
        username ? "@" + username : address
      } failed to transfer it in time. New round will start soon!\n\nJoin the Hot Potato NFT game: ${landing}`
    );
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  tweetTransfer,
  tweetLoser,
  verifyTweet,
  client,
};
