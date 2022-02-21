const fs = require("fs");

const dbpath = "./pool.json";
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

module.exports = {
  database,
  addWallet,
};
