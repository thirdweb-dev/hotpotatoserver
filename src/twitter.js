const { TwitterApi } = require("twitter-api-v2");
const client = new TwitterApi(process.env.TWITTER_BEARER);

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

module.exports = {
  tweetTransfer,
  client,
};
