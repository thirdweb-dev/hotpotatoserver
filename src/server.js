const express = require("express");
const app = express();
const port = 3000;

// map from address to twitter handle

// SDK event listener
// listens on transfer:
// - increments transfer count
// - calls tweetTransfer() from transfer event

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/import", (req, res) => {
  // TODO read body
  // TODO write to disk
});

app.listen(3000, () => {
  console.log("server running on 3000");
});
