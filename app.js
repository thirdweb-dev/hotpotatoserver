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
    db.recordTransfer(from, to);
  }
  await twitter.tweetTransfer(to);
});

const checkForEndOfRound = async () => {
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
};

const searchForTweets = async () => {
  try {
    console.log("Checking for new tweets");
    const query = await twitter.client.v1.mentionTimeline();
    if (query.tweets.length > 0) {
      query.tweets.forEach(async (tweet) => {
        try {
          if (!db.checkedReplies().includes(tweet.id)) {
            db.addCheckedReply(tweet.id);
            twitter.extractAddressAndRecordUser(
              tweet.full_text,
              tweet.user.screen_name
            );
          }
        } catch (e) {
          console.log("Error extracting address from", tweet.full_text);
        }
      });
    }
  } catch (e) {
    console.log(e);
  }
};

// Do work every minute
cron.schedule("* * * * *", async () => {
  checkForEndOfRound();
  searchForTweets();
});

// ENDPOINTS

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/state", (req, res) => {
  res.json(db.gameState());
});

app.get("/players", (req, res) => {
  const playersWithTwitterHandles = db.currentPlayers().map((playerData) => {
    const twitter = db.wallets()[playerData.address];
    return { ...playerData, twitterHandle: twitter };
  });
  res.json(playersWithTwitterHandles);
});

const getActiveNFT = () => {
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
  return image;
};

app.get("/potatonft", (req, res) => {
  const image = getActiveNFT();
  res.set("Cache-control", "public, max-age=300");
  res.sendFile(image, { root: __dirname });
});

app.get("/image/:token", (req, res) => {
  const token = parseInt(req.params.token);
  const currentRound = db.currentRound();
  let image;
  if (token == currentRound) {
    image = getActiveNFT();
    res.set("Cache-control", "public, max-age=300");
  } else {
    image = "img/cold-potato.gif";
    if (token > currentRound) {
      res.set("Cache-control", "public, max-age=300");
    } else {
      res.set("Cache-control", "public, max-age=31536000");
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

app.get("/hasplayed", (req, res) => {
  if (db.hasAlreadyPlayed(req.query.address)) {
    res.json({ played: true });
    return;
  }
  res.json({ played: false });
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

app.get("/playerState", async (req, res) => {
  const address = req.query.address;
  const player = await db.playerState(address);
  res.json(player);
});

app.listen(port, () => {
  console.log("server running on 3000");
});
