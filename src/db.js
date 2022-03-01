const { ethers } = require("ethers");
const fs = require("fs");
const { nftContract } = require("./thirdweb");
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
  return wallets()[ethers.utils.getAddress(address)];
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

const playerState = async (address) => {
  const hasPlayed = hasAlreadyPlayed(address);
  const isEligible = eligibleForTransfer(address);
  const username = fetchUsername(address);
  const isRegistered = hasRegistered(address);
  const isOwner =
    (await nftContract.get(currentRound())).owner.toLowerCase() ===
    address.toLowerCase();
  return {
    hasPlayed,
    isEligible,
    username,
    isRegistered,
    isOwner,
  };
};

const eligibleForTransfer = (address) => {
  const players = currentPlayers();
  return (
    players.filter(
      (player) => player.address.toLowerCase() === address.toLowerCase()
    ).length === 0 && wallets()[address] !== undefined
  );
};

const eligibleWallets = () => {
  const walletList = Object.keys(wallets());
  const eligible = walletList.filter((walletList) =>
    eligibleForTransfer(walletList)
  );
  return eligible;
};

const randomWallet = () => {
  const eligible = eligibleWallets();
  const random = Math.floor(Math.random() * eligible.length);
  return eligible[random];
};

const hasAlreadyPlayed = (address) => {
  const players = currentPlayers();
  return (
    players.filter(
      (player) => player.address.toLowerCase() === address.toLowerCase()
    ).length > 0
  );
};

const hasRegistered = (address) => {
  const walletList = wallets();
  return walletList[ethers.utils.getAddress(address)] !== undefined;
};

const lastOwner = () => {
  if (currentPlayers().length === 0) {
    return undefined;
  }
  return currentPlayers()[currentPlayers().length - 1].address;
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
    JSON.stringify({
      ...wallets(),
      [ethers.utils.getAddress(address)]: username,
    })
  );
};

// record every NFT transfer
const recordTransfer = (from, to) => {
  // record player address if not already
  const owners = currentPlayers();

  // if already played this round, ignore
  if (owners.filter((owner) => owner.address === to).length > 0) {
    return;
  }

  // record time held for previous owner
  for (var i = 0; i < owners.length; i++) {
    const owner = owners[i];
    if (owner.address === from) {
      const timeTransfered = owner.transferedAt;
      if (timeTransfered > 0) {
        owner.timeSpent = Date.now() - timeTransfered;
      }
      break;
    }
  }

  owners.push({
    address: to,
    transferedAt: Date.now(),
    timeSpent: 0,
  });

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
  lastOwner,
  currentRound,
  currentPlayers,
  lastTransferTime,
  gameState,
  addWallet,
  recordTransfer,
  transferCount,
  endGame,
  fetchUsername,
  eligibleForTransfer,
  hasAlreadyPlayed,
  checkedReplies,
  addCheckedReply,
  playerState,
  eligibleWallets,
  randomWallet,
};
