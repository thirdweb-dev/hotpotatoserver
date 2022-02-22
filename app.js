require("dotenv").config();
const bodyParser = require("body-parser");
const tw = require("./src/thirdweb");
const twitter = require("./src/twitter");
const db = require("./src/db");
const utils = require("./src/utils");
var cron = require("node-cron");
const express = require("express");
var cors = require("cors");
const e = require("express");
const app = express();
const port = 3000;

const MAX_TIME_MS = 24 * 60 * 60 * 1000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// add transfer listener on the contract
tw.nftContract.addTransferEventListener(async (from, to, tokenId) => {
  console.log("New Transfer!", from, to, tokenId);
  if (tokenId.toNumber() === db.currentRound()) {
    db.recordTransfer(to);
  }
  await twitter.tweetTransfer(to);
});

// check every minute for new replies
cron.schedule("* * * * 1", async () => {
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
        await twitter.tweetLoser(currentOwner);
        console.log("Round ended!");
        db.endGame();
      }
    }
  } catch (e) {
    console.log(e);
  }
});


cron.schedule("1 * * * * *", async () => {
  console.log("Checking for new tweets");
  const query = await twitter.client.search("(hotpotatogg)").catch((e) => {
    console.log(e);
  });
  const checked = db.checkedReplies();
  const tweetIds = query.data.data
    .map((tweet) => tweet.id)
    .filter((id) => !checked.includes(id));
  console.log("New tweets:", tweetIds);
  if (tweetIds.length > 0) {
    console.log("New tweets!", tweetIds);
    // commented until we get elevated access
    // const tweets = await twitter.client.v1
    //   .tweets(tweetIds)
    //   .then((tweets) => {

    // tweets.forEach((tweet) => {
    tweetIds
      .forEach(async (tweet) => {
        console.log("New tweet!", tweet);
        //console.log(tweet.user.screen_name);
        //db.addCheckedReply(tweet.id_str);
        db.addCheckedReply(tweet);
        console.log("Checked replies:", tweet);
        await twitter.verifyTweet(tweet)
      })
      // })
      .catch((e) => console.log(e));
    console.log(tweetIds);
  }
});

// ENDPOINTS

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/state", (req, res) => {
  res.json(db.gameState());
});

app.get("/potatonft", (req, res) => {
  const transferCount = db.transferCount();
  const lastTransferTime = db.lastTransferTime();
  let image;
  if (lastTransferTime == 0) {
    // game ended or not started
    image = "img/cold-potato.gif";
  } else {
    if (transferCount < 50) {
      image = "img/hotpotato1.gif";
    } else if (transferCount < 100) {
      image = "img/hotpotato2.gif";
    } else if (transferCount < 500) {
      image = "img/hotpotato3.gif";
    }
  }
  res.sendFile(image, { root: __dirname });
});

app.get("/exists", (req, res) => {
  if (db.wallets()[req.query.address]) {
    res.json({ exists: true });
    return;
  }
  res.json({ exists: false });
});

app.get("/eligible", (req, res) => {
  if (db.eligibleForTransfer(req.query.address)) {
    res.json({ eligible: true });
    return;
  }
  res.json({ eligible: false });
});

app.post("/import", (req, res) => {
  // TODO read body
  // TODO write to disk
});

app.post("/addwallet", async (req, res) => {
  console.log(req.body);
  try {
    const id = req.body.tweetId;
    console.log(id);
    await twitter.verifyTweet(id);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, reason: e.message });
  }
});

app.listen(port, () => {
  console.log("server running on 3000");
});
