const { TwitterApi } = require("twitter-api-v2");
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_OAUTH_TOKEN,
  accessSecret: process.env.TWITTER_OAUTH_SECRET,
});
const db = require("./db");
const { ethers } = require("ethers");

const landing = "https://hotpotato.vercel.app/";

async function tweetTransfer(address) {
  const username = db.fetchUsername(address);
  try {
    await client.v1.tweet(
      `The 🔥🥔 NFT has been transferred to ${
        username ? "@" + username : address
      }\n\nYou have 24h to pass the 🔥🥔 NFT to another address.\n\nJoin the Hot Potato NFT game: ${landing}`
    );
  } catch (e) {
    console.log(e);
  }
}

async function verifyTweet(tweetId) {
  console.log(tweetId);
  const tweet = await client.v1.singleTweet(tweetId).catch((e) => {
    console.log(e);
  });
  console.log("processing tweet", tweet.full_text);
  return extractAddressAndRecordUser(tweet.full_text, tweet.user.screen_name);
}

async function extractAddressAndRecordUser(text, username) {
  const ensRegex =
    /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/;
  let addresses = text.match(ensRegex) || [];
  if (addresses.length == 0) {
    const regex = /0x[a-fA-F0-9]{40}/;
    addresses = text.match(regex) || [];
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
      console.log("Invalid address");
      return;
    }

    if (db.fetchUsername(address)) {
      console.log("Address already verified");
      return;
    }

    console.log("Added new player", username, address);
    db.addWallet(address, username);
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
  extractAddressAndRecordUser,
  client,
};
