require("dotenv").config();
const tw = require("./src/thirdweb");
const twitter = require("./src/twitter");
const db = require("./src/db");
const utils = require("./src/utils");
var cron = require("node-cron");
const express = require("express");
var cors = require("cors");
const app = express();
const port = 3000;

const MAX_TIME_MS = 24 * 60 * 60 * 1000;

app.use(cors());

// add transfer listener on the contract
tw.nftContract.addTransferEventListener((from, to, tokenId) => {
  console.log("New Transfer!", from, to, tokenId);
  if (tokenId.toNumber() === db.currentRound()) {
    db.recordTransfer(to);
  }
  // TODO send tweet and mention user
  // twitter.tweetTransfer(to);
});

// check every minute for new replies
cron.schedule("* * * * *", async () => {
  try {
    // TODO use round number as the token ID
    const round = db.currentRound();
    const currentOwner = (await tw.nftContract.get(round)).owner;
    console.log(`Round: ${round} | Current Potato owner: ${currentOwner}`);

    // Check time since last transfer, end the game if more than 24h have passed
    const lastTransferTime = new Date(db.lastTransferTime()).getTime();
    if (lastTransferTime > 0) {
      const timePassed = Date.now() - lastTransferTime;
      console.log("Held the Potato for", utils.msToTime(timePassed));
      if (timePassed > MAX_TIME_MS) {
        // TODO tweet the looser person saying it's their fault we lost
        console.log("Round ended!");
        db.endGame();
      }
    }

    // TODO fetch twitter responses, add to wallets db
    //const query = await twitter.client.search("(to:hotpotatogg)");
    //console.log(query);
    // TODO: add new addresses to pool
    // db.addWallet(query..., query....);
  } catch (e) {
    console.log(e);
  }
});

// ENDPOINTS

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/state", (req, res) => {
  res.json(db.gameState());
});

app.post("/import", (req, res) => {
  // TODO read body
  // TODO write to disk
});

app.listen(port, () => {
  console.log("server running on 3000");
});
