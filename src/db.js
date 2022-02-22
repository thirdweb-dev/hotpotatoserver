const fs = require("fs");

let dataFolder;
if (process.env.ZEET) {
  dataFolder = "/gameData/";
} else {
  dataFolder = "./data/";
}

// stores wallet -> twitter handle
const walletsFile = dataFolder + "wallets.json";
// stores current round + total transfer count + last timestamp for that round
const gameStats = dataFolder + "gameState.json";
// folder to store the players for a given round
const roundsInfoPaths = dataFolder + "round_infos/";
const repliesCheckedFile = dataFolder + "checked.json";

if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder);
}

if (!fs.existsSync(walletsFile)) {
  fs.writeFileSync(walletsFile, JSON.stringify({}));
}

if (!fs.existsSync(repliesCheckedFile)) {
  fs.writeFileSync(repliesCheckedFile, JSON.stringify([]));
}

if (!fs.existsSync(gameStats)) {
  fs.writeFileSync(
    gameStats,
    JSON.stringify({
      current_round: 0,
      transfer_count: 0,
      last_transfer_time: 0,
    })
  );
}
if (!fs.existsSync(roundsInfoPaths)) {
  fs.mkdirSync(roundsInfoPaths);
}

const wallets = () => {
  return JSON.parse(fs.readFileSync(walletsFile));
};

const fetchUsername = (address) => {
  return wallets()[address];
};

const checkedReplies = () => {
  return JSON.parse(fs.readFileSync(repliesCheckedFile));
};

const addCheckedReply = (id) => {
  const checked = checkedReplies();
  checked.push(id);
  fs.writeFileSync(repliesCheckedFile, JSON.stringify(checked));
};

let _gameState = JSON.parse(fs.readFileSync(gameStats));
const gameState = () => {
  return _gameState;
};

// the current round number
const currentRound = () => {
  return parseInt(gameState()["current_round"]);
};
// transfer Count for this round
const transferCount = () => {
  return gameState()["transfer_count"];
};
const lastTransferTime = () => {
  return gameState()["last_transfer_time"];
};

const currentPlayersFile = () => {
  const round = currentRound();
  const file = roundsInfoPaths + round + ".json";
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([]));
  }
  return file;
};

// the list of addresses that have held the NFT
const currentPlayers = () => {
  const file = currentPlayersFile();
  return JSON.parse(fs.readFileSync(file));
};

const eligibleForTransfer = (address) => {
  const players = currentPlayers();
  return !players.includes(address);
};

const writeGameState = (state) => {
  _gameState = {
    ...gameState(),
    ...state,
  };
  fs.writeFileSync(gameStats, JSON.stringify(_gameState));
};

// add new wallet to the address pool
const addWallet = (address, username) => {
  fs.writeFileSync(
    walletsFile,
    JSON.stringify({ ...wallets(), [address]: username })
  );
};

// record every NFT transfer
const recordTransfer = (address) => {
  // record player address if not already
  const owners = currentPlayers();
  // if already played this round, ignore
  if (owners.includes(address)) {
    return;
  }
  owners.push(address);
  fs.writeFileSync(currentPlayersFile(), JSON.stringify(owners));

  // increment transfer count
  const currentTransferCount = transferCount();
  writeGameState({
    transfer_count: currentTransferCount + 1,
    last_transfer_time: new Date().toISOString(),
  });
};

const endGame = () => {
  writeGameState({
    current_round: currentRound() + 1,
    transfer_count: 0,
    last_transfer_time: 0,
  });
};

module.exports = {
  wallets,
  currentRound,
  currentPlayers,
  lastTransferTime,
  gameState,
  addWallet,
  recordTransfer,
  endGame,
  fetchUsername,
  eligibleForTransfer,
  checkedReplies,
  addCheckedReply
};
