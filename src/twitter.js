const { TwitterApi } = require("twitter-api-v2");
const client = new TwitterApi(process.env.TWITTER_BEARER);
const db = require("./db");

const landing = "https://hotpotato.vercel.app/";

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
  client,
};
