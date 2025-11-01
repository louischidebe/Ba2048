// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Ba2048 - Minimal 2048 game contract for Base Sepolia (testnet)
/// @notice Stores per-player games (board hash, score) and an on-chain top-10 leaderboard.
/// @dev Moves are committed by submitting the hash of the new board state plus scoreDelta.
///      Full board contents are not stored (to save gas); emit events for moves so off-chain viewers can index them.
contract Ba2048 {
    address public owner;
    uint256 public nextGameId;
    uint256 public constant LEADERBOARD_SIZE = 10;

    event GameCreated(uint256 indexed gameId, address indexed player, bytes32 boardHash);
    event MoveMade(uint256 indexed gameId, address indexed player, bytes32 boardHash, uint8 direction, uint32 scoreDelta, uint32 totalScore);
    event GameEnded(uint256 indexed gameId, address indexed player, uint32 finalScore);
    event LeaderboardUpdated(address indexed player, uint32 score);

    struct Game {
        address player;
        bytes32 boardHash; // keccak256(serialized board)
        uint32 totalScore;
        uint32 moves;
        bool active;
    }

    struct LeaderEntry {
        address player;
        uint32 score;
    }

    mapping(uint256 => Game) public games;
    mapping(address => uint32) public bestScoreOf; // player's best known score (onchain)
    LeaderEntry[LEADERBOARD_SIZE] public leaderboard; // fixed-size top-N

    constructor() {
        owner = msg.sender;
        nextGameId = 1;
    }

    /// @notice Create a new game session for the message sender.
    /// @param initialBoardHash keccak256 hash of initial board (client-side serialized)
    /// @return gameId assigned to the new game
    function createGame(bytes32 initialBoardHash) external returns (uint256) {
        uint256 gid = nextGameId++;
        games[gid] = Game({
            player: msg.sender,
            boardHash: initialBoardHash,
            totalScore: 0,
            moves: 0,
            active: true
        });
        emit GameCreated(gid, msg.sender, initialBoardHash);
        return gid;
    }

    /// @notice Submit a move for an existing game. Caller must be the game's player.
    /// @param gameId the game session id
    /// @param newBoardHash keccak256 hash of the updated board after this move
    /// @param direction encoded as 0=up,1=right,2=down,3=left
    /// @param scoreDelta points gained by this move (sum of merged tiles)
    function makeMove(uint256 gameId, bytes32 newBoardHash, uint8 direction, uint32 scoreDelta) external {
        Game storage g = games[gameId];
        require(g.active, "game not active");
        require(g.player == msg.sender, "not game player");
        require(direction <= 3, "invalid direction");

        g.boardHash = newBoardHash;
        g.moves += 1;

        // add score delta (watch overflow - using uint32 is safe for game 2048 scores)
        unchecked {
            g.totalScore += scoreDelta;
        }

        emit MoveMade(gameId, msg.sender, newBoardHash, direction, scoreDelta, g.totalScore);

        // update player's best known score & leaderboard if improved
        if (g.totalScore > bestScoreOf[msg.sender]) {
            bestScoreOf[msg.sender] = g.totalScore;
            _updateLeaderboard(msg.sender, g.totalScore);
            emit LeaderboardUpdated(msg.sender, g.totalScore);
        }
    }

    /// @notice End the game (player calls this when finished or abandoned)
    function endGame(uint256 gameId) external {
        Game storage g = games[gameId];
        require(g.active, "not active");
        require(g.player == msg.sender, "not game player");
        g.active = false;
        emit GameEnded(gameId, msg.sender, g.totalScore);
    }

    /// @notice Fetch the leaderboard as two parallel arrays (players and scores).
    function getLeaderboard() external view returns (address[] memory players, uint32[] memory scores) {
        players = new address[](LEADERBOARD_SIZE);
        scores = new uint32[](LEADERBOARD_SIZE);
        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            players[i] = leaderboard[i].player;
            scores[i] = leaderboard[i].score;
        }
        return (players, scores);
    }

    /// @dev internal: update fixed-size leaderboard with a simple insertion (descending).
    function _updateLeaderboard(address player, uint32 score) internal {
        // If player already on leaderboard and score not higher than previous, do nothing
        int256 existingIndex = -1;
        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            if (leaderboard[i].player == player) {
                existingIndex = int256(i);
                break;
            }
        }

        if (existingIndex >= 0) {
            uint256 idx = uint256(existingIndex);
            if (score <= leaderboard[idx].score) {
                // no improvement
                return;
            }
            // remove existing entry (we'll re-insert in correct position)
            for (uint256 j = idx; j + 1 < LEADERBOARD_SIZE; j++) {
                leaderboard[j] = leaderboard[j + 1];
            }
            leaderboard[LEADERBOARD_SIZE - 1] = LeaderEntry(address(0), 0);
        }

        // find insert position (first index with score < new score)
        uint256 insertAt = LEADERBOARD_SIZE;
        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            if (leaderboard[i].score < score) {
                insertAt = i;
                break;
            }
        }
        if (insertAt == LEADERBOARD_SIZE) {
            // not in top N
            return;
        }

        // shift down to make room
        for (uint256 j = LEADERBOARD_SIZE - 1; j > insertAt; j--) {
            leaderboard[j] = leaderboard[j - 1];
        }
        leaderboard[insertAt] = LeaderEntry(player, score);
    }

    // Admin helper to wipe leaderboard (owner only)
    function clearLeaderboard() external {
        require(msg.sender == owner, "only owner");
        for (uint256 i = 0; i < LEADERBOARD_SIZE; i++) {
            leaderboard[i] = LeaderEntry(address(0), 0);
        }
    }
}
