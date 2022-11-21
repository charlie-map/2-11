const allowed_blocks = {
	2: 1,
	4: 1,
	8: 1,
	16: 1,
	32: 1,
	64: 1,
	128: 1,
	256: 1,
	512: 1,
	1024: 1,
	2048: 1,
	4096: 1,
	8192: 1,
	16384: 1,
	32768: 1,
	65536: 1,
	131072: 1
};

module.exports = {
	buildBoard: function(piece, size = 4) {
		let newBoard = [];

		let piece0 = piece[0];
		let piece1 = piece[1];

		for (let setBoardX = 0; setBoardX < size; setBoardX++) {
			newBoard[setBoardX] = [];

			for (let setBoardY = 0; setBoardY < size; setBoardY++) {
				if (piece0.x == setBoardX && piece0.y == setBoardY) {
					newBoard[setBoardX][setBoardY] = piece0.num;

					continue;
				} else if (piece1.x == setBoardX && piece1.y == setBoardY) {
					newBoard[setBoardX][setBoardY] = piece1.num;

					continue;
				}

				newBoard[setBoardX][setBoardY] = null;
			}
		}

		return newBoard;
	},

	canMove: function(board) {
		// check for empty cell:
		let rowPrevNum = [0, 0, 0, 0];

		for (let x = 0; x < 4; x++) {
			let prevNum = 0;

			for (let y = 0; y < 4; y++) {
				if (!board[x][y]) 
					return 1; // found a place to move

				if (prevNum == board[x][y])
					return 1; // found
				else
					prevNum = board[x][y];

				if (rowPrevNum[y] == board[x][y])
					return 1; // found
				else
					rowPrevNum[y] = board[x][y];
			}
		}

		return 0;
	},

	// moveDirection = 1
	moveLeft: function(board, bestBlock) {
		let points = 0;

		for (let y = 0; y < 4; y++) {
			let prevNum = 0;
			let maxMoveLeft = 0;

			for (let x = 0; x < 4; x++) {
				if (!board[x][y]) {
					maxMoveLeft++;
					continue;
				}

				if (!allowed_blocks[board[x][y]])
					return { error: 1 };

				if (board[x][y] == prevNum) { // merge
					maxMoveLeft++;

					board[x][y] *= 2;
					bestBlock = bestBlock < board[x][y] ? board[x][y] : bestBlock;
					points += board[x][y];

					prevNum = 0;
				} else
					prevNum = board[x][y];

				if (x == x - maxMoveLeft)
					continue;

				board[x - maxMoveLeft][y] = board[x][y];
				board[x][y] = null;
			}
		}

		return {
			bestBlock,
			points
		};
	},

	// moveDirection = 2
	moveUp: function(board, bestBlock) {
		let points = 0;

		for (let x = 0; x < 4; x++) {
			let prevNum = 0;
			let maxMoveUp = 0;

			for (let y = 0; y < 4; y++) {
				if (!board[x][y]) {
					maxMoveUp++;
					continue;
				}

				if (!allowed_blocks[board[x][y]])
					return { error: 1 };

				if (board[x][y] == prevNum) { // merge
					maxMoveUp++;

					board[x][y] *= 2;
					bestBlock = bestBlock < board[x][y] ? board[x][y] : bestBlock;
					points += board[x][y];

					prevNum = 0;
				} else
					prevNum = board[x][y];

				if (y == y - maxMoveUp)
					continue;

				board[x][y - maxMoveUp] = board[x][y];
				board[x][y] = null;
			}
		}

		return {
			bestBlock,
			points
		};
	},

	// moveDirection = 3
	moveRight: function(board, bestBlock) {
		let points = 0;

		for (let y = 0; y < 4; y++) {
			let prevNum = 0;
			let maxMoveRight = 0;

			for (let x = 3; x >= 0; x--) {
				if (!board[x][y]) {
					maxMoveRight++;
					continue;
				}

				if (!allowed_blocks[board[x][y]])
					return { error: 1 };

				if (board[x][y] == prevNum) { // merge
					maxMoveRight++;

					board[x][y] *= 2;
					bestBlock = bestBlock < board[x][y] ? board[x][y] : bestBlock;
					points += board[x][y];

					prevNum = 0;
				} else
					prevNum = board[x][y];

				if (x == x + maxMoveRight)
					continue;

				board[x + maxMoveRight][y] = board[x][y];
				board[x][y] = null;
			}
		}

		return {
			bestBlock,
			points
		};
	},

	// moveDirection = 4
	moveDown: function(board, bestBlock) {
		let points = 0;

		for (let x = 0; x < 4; x++) {
			let prevNum = 0;
			let maxMoveDown = 0;

			for (let y = 3; y >= 0; y--) {
				if (!board[x][y]) {
					maxMoveDown++;
					continue;
				}

				if (!allowed_blocks[board[x][y]])
					return { error: 1 };

				if (board[x][y] == prevNum) { // merge
					maxMoveDown++;

					board[x][y] *= 2;
					bestBlock = bestBlock < board[x][y] ? board[x][y] : bestBlock;
					points += board[x][y];

					prevNum = 0;
				} else
					prevNum = board[x][y];

				if (y == y + maxMoveDown)
					continue;

				board[x][y + maxMoveDown] = board[x][y];
				board[x][y] = null;
			}
		}

		return {
			bestBlock,
			points
		};
	}
};