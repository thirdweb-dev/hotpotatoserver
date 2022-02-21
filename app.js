const express = require("express");
const app = express();
const port = 3000;

// map from address to twitter handle

// SDK event listener
// listens on transfer:
// - increments transfer count
// - calls twitter bot to mention with infor from transfer event

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/import", (req, res) => {
  // TODO read body
  // TODO write to disk
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
