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
	// moveDirection = 1
	moveLeft: function(board) {
		let bestBlock = 2;
		let points = 0;

		for (let y = 0; y < 4; y++) {
			let prevNum = 0;
			let maxMoveLeft = 0;

			for (let x = 0; x < 4; x++) {
				if (!board[x][y]) {
					maxMoveLeft++;
					continue;
				}

				if (board[x][y].num == prevNum) { // merge
					maxMoveLeft++;

					points += board[x][y].num * 2;
					board[x][y].merging = 1;
					board[x][y].itemToMerge = board[x - maxMoveLeft][y];

					prevNum = 0;
				} else
					prevNum = board[x][y].num;

				if (x == x - maxMoveLeft)
					continue;

				board[x - maxMoveLeft][y] = board[x][y];
				board[x][y] = null;
			}
		}

		return points;
	}

	// moveDirection = 2
	moveUp: function(board) {
		let bestBlock = 2;
		let points = 0;

		for (let x = 0; x < 4; x++) {
			let prevNum = 0;
			let maxMoveUp = 0;

			for (let y = 0; y < 4; y++) {
				if (!board[x][y]) {
					maxMoveUp++;
					continue;
				}

				if (board[x][y].num == prevNum) { // merge
					maxMoveUp++;

					points += board[x][y].num * 2;
					board[x][y].merging = 1;
					board[x][y].itemToMerge = board[x][y - maxMoveUp];

					prevNum = 0;
				} else
					prevNum = board[x][y].num;

				if (y == y - maxMoveUp)
					continue;

				board[x][y - maxMoveUp] = board[x][y];
				board[x][y] = null;
			}
		}

		return points;
	}

	// moveDirection = 3
	moveRight: function(board) {
		let bestBlock = 2;
		let points = 0;

		for (let y = 0; y < 4; y++) {
			let prevNum = 0;
			let maxMoveRight = 0;

			for (let x = 3; x >= 0; x--) {
				if (!board[x][y]) {
					maxMoveRight++;
					continue;
				}

				if (board[x][y].num == prevNum) { // merge
					maxMoveRight++;

					points += board[x][y].num * 2;
					board[x][y].merging = 1;
					board[x][y].itemToMerge = board[x + maxMoveRight][y];

					prevNum = 0;
				} else
					prevNum = board[x][y].num;

				if (x == x + maxMoveRight)
					continue;

				board[x + maxMoveRight][y] = board[x][y];
				board[x][y] = null;
			}
		}

		return points;
	}

	// moveDirection = 4
	moveDown: function(board) {
		let bestBlock = 2;
		let points = 0;

		for (let x = 0; x < 4; x++) {
			let prevNum = 0;
			let maxMoveDown = 0;

			for (let y = 3; y >= 0; y--) {
				if (!board[x][y]) {
					maxMoveDown++;
					continue;
				}

				if (board[x][y].num == prevNum) { // merge
					maxMoveDown++;

					points += board[x][y].num * 2;
					board[x][y].merging = 1;
					board[x][y].itemToMerge = board[x][y + maxMoveDown];

					prevNum = 0;
				} else
					prevNum = board[x][y].num;

				if (y == y + maxMoveDown)
					continue;

				board[x][y + maxMoveDown] = board[x][y];
				board[x][y] = null;
			}
		}

		return points;
	}
};