require("dotenv").config({
	path: __dirname + "/.env"
});

const fs = require("fs");

const express = require("express");
const mustache = require("mustache-express");
const bodyParser = require("body-parser");

/* PASSWORD SAFETY & AUTH */
const bcrypt = require("bcrypt");
const saltRounds = 10;
const cookieParser = require('cookie-parser');
const {
	v4: uuidv4
} = require('uuid');

const email_validator = require("email-validator");
const date_validator = require("validate-date");

const boardJS = require("./boardMove.js");

const mysql = require('mysql2');

fs.readFile("allEmailEnds.txt", "utf8", (err, content) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}

	let emailEndTemp = {};
	content.split("\n").forEach(i => {
		emailEndTemp[i] = 1;
	});

	allEmailEnds = emailEndTemp;
});

const app = express();

const connection = mysql.createConnection({
	host: process.env.HOST,
	database: process.env.DATABASE,
	user: process.env.USERNAME,
	password: process.env.PASSWORD
});

function loggedIn(req, res, next) {
	if (!req.cookies.user_id || !req.cookies.auth_token)
		return res.redirect("/");

	connection.query("SELECT authToken, tokenDeath FROM auth WHERE user_id=?", req.cookies.user_id, (err, authToken) => {
		if (err)
			return res.render("error", {
				error
			});

		if (authToken.length && authToken[0].authToken == req.cookies.auth_token && authToken[0].tokenDeath > 0) {
			connection.query("UPDATE auth SET tokenDeath=2629800000 WHERE user_id=?", [req.cookies.user_id], (err) => {
				if (err) {
					console.log(err);
					return res.redirect("/");
				}

				return next();
			});
		} else
			res.redirect("/");
	});
}

app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser());

app.use((err, req, res, next) => {
	console.log("ERROR OCCURRED: ", err);

	res.render("error", {
		error: err
	});
});

app.set('views', __dirname + "/views");
app.set('view engine', 'mustache');
app.engine('mustache', mustache());

function default_login_check(req, res, next) {
	if (!req.cookies.user_id || !req.cookies.auth_token)
		return next();

	connection.query("SELECT authToken, tokenDeath FROM auth WHERE user_id=?", req.cookies.user_id, (err, authToken) => {
		if (err)
			return res.render("error", {
				error
			});

		if (authToken.length && authToken[0].authToken == req.cookies.auth_token && authToken[0].tokenDeath > 0) {
			connection.query("UPDATE auth SET tokenDeath=2629800000 WHERE user_id=?", [req.cookies.user_id], (err) => {
				if (err) {
					console.error(err);
					return next();
				}

				return res.redirect("/l");
			});
		} else
			next();
	});
}

app.get("/", default_login_check, (req, res, next) => {
	res.render("index", {
		LOGGED_IN: false,
		WINS: 0,
		LEADERBOARD_OPEN: 0,
		DARKMODE: "\"\"",
		DARKMODE_ACTIVE: 0,
		BEST_BLOCK: 2,
		BEST_SCORE: 0,
		CURRENT_SCORE: 0,
		LEADERBOARD_PROPERTY: "Best score"
	});
});

function leaderboardSort(lb, low, high) {
	if (low >= high) return;

	let findpivot = low - 1;
	for (let j = low; j < high; j++) {
		if (lb[j].wins == 0 || lb[j].totalGames == 0)
			return leaderboardSort(lb, low, j - 1);

		if (lb[high].wins == 0 || lb[high].totalGames == 0)
			return leaderboardSort(lb, low, high - 1);

		if ((lb[j].wins / lb[j].totalGames) > (lb[high].wins / lb[high].totalGames)) {
			findpivot++;

			let swapbuffer = lb[j];
			lb[j] = lb[findpivot];
			lb[findpivot] = swapbuffer;
		}
	}

	findpivot++;

	let swapbuffer = lb[high];
	lb[high] = lb[findpivot];
	lb[findpivot] = swapbuffer;

	leaderboardSort(lb, low, findpivot - 1);
	leaderboardSort(lb, findpivot + 1, high);
}

let properties = {
	0: "bestScore",
	1: "bestBlock",
	2: "wins",
	3: "averageScore",

	"bestScore": 0,
	"bestBlock": 1,
	"wins": 2,
	"averageScore": 3,
	"percentWins": 4
};

let propertiesUI = {
	0: "Best score",
	1: "Best block",
	2: "Wins",
	3: "Average score",
	4: "% wins"
}

function getPropertyValue(currentProperty, obj) {
	if (currentProperty <= 3)
		return currentProperty == 3 ? Math.round(obj[properties[currentProperty]]) : obj[properties[currentProperty]];

	if (currentProperty == 4) {
		if (obj.wins == 0 && obj.totalGames > 0)
			return "0%";
		else if (obj.totalGames == 0)
			return "No games";

		return (Math.round((obj.wins / obj.totalGames) * 100)) + "%";
	}
}

// for leaderboard
let propertiesSQL = {
	0: "bestScore DESC",
	1: "bestBlock DESC",
	2: "wins DESC", // (getting 2048)
	3: "averageScore DESC",
	4: "wins DESC, totalGames ASC" // % wins
}

app.get("/l", loggedIn, (req, res, next) => {
	connection.query(`SELECT id, username, darkmode, game.*, streak.* FROM user INNER JOIN game
		ON user.id=game.user_id INNER JOIN streak ON
		user.id=streak.user_id WHERE user.id=?`, req.cookies.user_id, async (err, user_data) => {
		if (err || !user_data || !user_data.length) return res.render("error");

		// update streak
		try {
			await streakUpdate(user_data[0]);
		} catch (error) {
			return next(error);
		}

		connection.query(`SELECT username, currentScore, bestScore, bestBlock, wins, averageScore,
			totalGames FROM game INNER JOIN user ON user.id=game.user_id ORDER BY ${propertiesSQL[user_data[0].leaderboardProperty]}`,
			(err, users) => {
				if (err || !users) return res.render("error", {
					error: err
				});

				let userBoardOpen;
				let onLeaderboard = 0,
					user_special_rank = 0;
				let u_dat = user_data[0];
				let leaderboardIndex = [];

				if (u_dat.leaderboardProperty == 4)
					leaderboardSort(users, 0, users.length - 1);

				for (let i = 0; i < users.length; i++) {
					if (i >= 20) {
						if (!onLeaderboard && users[i].username == u_dat.username) {
							user_special_rank = i + 1;

							break;
						}

						continue;
					}
					let u = users[i];
					let newU = {};

					newU.rank = i + 1;
					newU.score = getPropertyValue(u_dat.leaderboardProperty, u);

					newU.username = u.username + (u.username == u_dat.username ? " <span id='leaderboard-personal' class='is-taken'>(you)</span>" : "");

					if (u.username == u_dat.username) {
						onLeaderboard = 1;
						user_special_rank = i;
						newU.personal_user = "personal-user-points";
					}

					leaderboardIndex.push(newU);
				}

				res.render("index", {
					LOGGED_IN: true,
					USERNAME: u_dat.username,

					DARKMODE_ACTIVE: u_dat.darkmode,
					DARKMODE: u_dat.darkmode == 1 ? "darkmode" : "",

					LEADERBOARD_OPEN: u_dat.leaderboardOpen,
					LEADERBOARD_PROPERTY: propertiesUI[u_dat.leaderboardProperty],
					LARGE_LEADERBOARD_PROPERTY: u_dat.leaderboardProperty == 3 ? true : false,
					LEADERBOARD: leaderboardIndex,

					USER_SPECIAL: onLeaderboard ? false : true,
					USER_RANK: user_special_rank,
					USER_SPECIAL_SCORE: getPropertyValue(u_dat.leaderboardProperty, u_dat),

					CURRENT_SCORE: u_dat.currentScore,
					BEST_BLOCK: u_dat.bestBlock,
					BEST_SCORE: u_dat.bestScore,

					AVERAGE_SCORE: u_dat.averageScore,

					WINS: u_dat.wins,
					GIVE_UPS: u_dat.giveUps,
					KILLED_BY_2: u_dat.killedBy2,
					KILLED_BY_4: u_dat.killedBy4,
					KILLED_BY_8: u_dat.killedBy8,
					TOTAL_GAMES: u_dat.totalGames,

					LAST_LOGIN: u_dat.lastLogin,

					CURRENT_STREAK: u_dat.currentStreak,
					STREAK_FIRE: u_dat.currentStreak >= 3 ? true : false,
					BEST_STREAK: u_dat.bestStreak,
				});
			});
	});
});

app.get("/leaderboard-property/:lbprop", loggedIn, (req, res, next) => {
	let propNum = properties[req.params.lbprop];

	if (propNum == undefined)
		return res.send("1");

	connection.query("UPDATE game SET leaderboardProperty=? WHERE user_id=?", [propNum, req.cookies.user_id], (err) => {
		if (err) return next(err);

		return res.send("0-" + propertiesUI[propNum]);
	});
});

app.get("/updated-leaderboard", (req, res, next) => {
	connection.query("SELECT username, leaderboardOpen, leaderboardProperty FROM user INNER JOIN game ON user.id=game.user_id WHERE id=?", req.cookies.user_id, (err, user_data) => {
		if (err) return next(err);

		connection.query(`SELECT username, bestScore, bestBlock, wins, averageScore, totalGames FROM game INNER JOIN user ON user.id=game.user_id ORDER BY ${propertiesSQL[user_data[0].leaderboardProperty]}`, (err, users) => {
			if (err || !users) return next(err);

			let userBoardOpen;
			let u_dat = user_data[0];
			let leaderboardIndex = [];

			let onLeaderboard = 0
			let lowUser = null;

			if (u_dat.leaderboardProperty == 4)
				leaderboardSort(users, 0, users.length - 1);

			for (let i = 0; i < users.length; i++) {
				if (i >= 20) {
					if (!onLeaderboard && users[i].username == u_dat.username) {
						lowUser = {};
						lowUser.rank = i + 1;
						lowUser.username = u_dat.username;
						lowUser.score = getPropertyValue(u_dat.leaderboardProperty, users[i]);

						break;
					}

					continue;
				}
				let u = users[i];
				let newU = {};

				newU.rank = i + 1;
				newU.score = getPropertyValue(u_dat.leaderboardProperty, u);

				newU.username = u.username + (u.username == u_dat.username ? " <span id='leaderboard-personal' class='is-taken'>(you)</span>" : "");

				if (u.username == u_dat.username) {
					onLeaderboard = 1;
					user_special_rank = i;
					newU.personal_user = "personal-user-points";
				}

				leaderboardIndex.push(newU);
			}

			res.json({
				leaderboardOpen: u_dat.leaderboardOpen ? true : false,
				leaderboardIndex,
				lowUser
			});
		});
	});
});

app.get("/toggle-leaderboard/:onoff", loggedIn, (req, res, next) => {
	let toggleStatus = req.params["onoff"];

	connection.query("UPDATE game SET leaderboardOpen=? WHERE user_id=?", [toggleStatus, req.cookies.user_id], (err) => {
		if (err) return next(err);

		res.send("");
	});
});

app.get("/darkmode/:onoff", loggedIn, (req, res, next) => {
	let toggleStatus = req.params["onoff"];

	connection.query("UPDATE user SET darkmode=? WHERE id=?", [toggleStatus, req.cookies.user_id], (err) => {
		if (err) return next(err);

		res.send("");
	});
});

app.get("/previous-board", loggedIn, (req, res, next) => {
	connection.query("SELECT wholeBoard FROM current_board WHERE user_id=?", req.cookies.user_id,
		(err, board) => {
			if (err) return res.json(null);

			board = JSON.parse(board[0].wholeBoard);
			if (boardJS.canMove(board)) return res.json(board);
			res.json(null);
		});
});

/**
	* Takes two new game positions from user and initializes the user board
	* 
	* @params { Array } piece array of two objects that represent that two new blocks:
	*/
const allowed_new_blocks = {
	2: 1,
	4: 1,
	8: 1
};
/**
	*/
app.post("/new-game", loggedIn, async (req, res, next) => {
	if (!req.body.piece)
		return res.end("1");

	let pieces = req.body.piece

	if (pieces.length != 2)
		return res.end("1");

	if (!allowed_new_blocks[pieces[0].num] ||
		!allowed_new_blocks[pieces[1].num])
		return res.end("2");

	let newBoard = boardJS.buildBoard(pieces);

	// TODO: save old board and update game
	try {
		await Promise.all([
			new Promise((resolve, reject) => {
				connection.query(`UPDATE current_board SET wholeBoard=?, startTime=? WHERE user_id=?`,
					[JSON.stringify(newBoard), new Date(), req.cookies.user_id], (complete) => {
						if (complete) reject(complete);
						resolve();
					})
			}),
			new Promise((resolve, reject) => {
				connection.query(`UPDATE game SET currentScore=0 WHERE user_id=?`,
					[req.cookies.user_id], (complete) => {
						if (complete) reject(complete);
						resolve();
					})
			})
		]);
	} catch (e) {
		console.error(e);
		res.send("1");
		return res.end();
	}

	res.send("0");
	res.end();
});

const moveBoard = {
	1: boardJS.moveLeft,
	2: boardJS.moveUp,
	3: boardJS.moveRight,
	4: boardJS.moveDown
};
/**
	* Moves game the given number of moves forward and gives a user responses based on that
	* 
	* @params { Array } array of moves that have occured
	*  - either left (1), up (2), right (3), or down (4) 
	*
	* @returns { Number } status move-game result:
	*  - 0: success
	*  - 1: failed
	*  - 2: invalid board, reset on client side
	*  - 3: game over, reset on client side
	*/
app.post("/move-game", loggedIn, (req, res, next) => {
	let move = req.body.move;
	if (!move) return res.send("1");

	connection.query(`SELECT currentScore, bestScore, averageScore, bestBlock, totalGames, game_id, wholeBoard,
		startTime FROM game INNER JOIN current_board ON game.user_id=current_board.user_id
		WHERE game.user_id=?`, req.cookies.user_id, (err, gameState) => {
		if (err || !gameState || !gameState.length) return next(err);

		let game = gameState[0];
		// check that we can move the board
		game.wholeBoard = JSON.parse(game.wholeBoard);
		if (!boardJS.canMove(game.wholeBoard))
			// send back error response
			return res.send("1");

		for (let play = 0; play < move.length; play++) {
			let boardDiffs = moveBoard[move[play].move](game.wholeBoard, game.bestBlock);

			if (boardDiffs.error) {
				// something is wrong with their board
				// let the frontend know so it resets
				return res.send("2");
			}

			game.currentScore += boardDiffs.points;
			game.currBestBlock = boardDiffs.bestBlock;
			game.bestBlock = game.bestBlock < boardDiffs.bestBlock ? boardDiffs.bestBlock : game.bestBlock;
			game.bestScore = game.bestScore < game.currentScore ? game.currentScore : game.bestScore;

			// place in new block
			let newPiece = move[play].piece;

			if (newPiece) {
				if (game.wholeBoard[newPiece.x][newPiece.y] || !allowed_new_blocks[newPiece.num])
					return res.send("2");

				game.wholeBoard[newPiece.x][newPiece.y] = newPiece.num;
			}

			if (!boardJS.canMove(game.wholeBoard))
				return game_over(req, res, game, newPiece.num);
		}

		connection.query("UPDATE game SET currentScore=?, bestScore=?, bestBlock=? WHERE user_id=?",
			[game.currentScore, game.bestScore, game.bestBlock, req.cookies.user_id]);
		connection.query("UPDATE current_board SET wholeBoard=? WHERE user_id=?", [JSON.stringify(game.wholeBoard), req.cookies.user_id]);

		res.send("0");
	});
});

function game_over(req, res, game, killerPiece) {
	connection.query("INSERT INTO board_history VALUES (?, ?, ?, ?, ?, ?);",
		[req.cookies.user_id, game.game_id, JSON.stringify(game.wholeBoard), game.currentScore, game.startTime, new Date],
		async (err) => {
			console.log(err);
			if (err) return res.send("1");

			game.totalGames += 1;
			let newAverageScore = game.averageScore / game.totalGames + game.currentScore / game.totalGames;
			await Promise.all([
				new Promise(resolve => {
					connection.query(`UPDATE game SET currentScore=?, bestBlock=?, averageScore=?,
				totalGames=?, wins=(SELECT wins FROM game WHERE user_id=?)+?,
				${killerPiece ? `killedBy${killerPiece}=(SELECT killedBy${killerPiece} FROM
					game WHERE user_id=?)+1 ` : `giveUps=(SELECT giveUps FROM
					game WHERE user_id=?)+1`} WHERE user_id=?`,
					[0, game.bestBlock, newAverageScore, game.totalGames,
						req.cookies.user_id, game.currBestBlock >= 2048, req.cookies.user_id, req.cookies.user_id
					], resolve);
				}),
				new Promise(resolve => {
					connection.query(`UPDATE current_board SET game_id=?, wholeBoard=?, startTime=?
						WHERE user_id=?`, [uuidv4(), null, null, req.cookies.user_id], resolve);
				})
			]);

			return res.send("3");
		});
}

app.post("/game-over", loggedIn, (req, res, next) => {
	if (!req.body.killerPiece) return res.send("1");
	let killerPiece = parseInt(req.body.killerPiece, 10);
	if (!allowed_new_blocks[killerPiece] && killerPiece != 0) return res.send("2");

	connection.query(`SELECT currentScore, bestScore, averageScore, bestBlock, totalGames, game_id, wholeBoard,
		startTime FROM game INNER JOIN current_board ON game.user_id=current_board.user_id
		WHERE game.user_id=?`, req.cookies.user_id, (err, gameState) => {
		if (err || !gameState || !gameState.length) return next(err);

		game_over(req, res, gameState[0], killerPiece);
	});
});

app.get("/username-available/:username", (req, res, next) => {
	let username = req.params.username;

	if (!username || !username.length)
		return res.send("0");

	connection.query("SELECT id FROM user WHERE username=?;", [username], (err, is_user) => {
		if (err || !is_user) return next(err);

		if (is_user.length)
			return res.send("0");
		else
			return res.send("1");
	});
});

app.get("/email-available/:email", (req, res, next) => {
	let email = req.params.email;

	if (!email || !email.length)
		return res.send("0");

	connection.query("SELECT id FROM user WHERE email=?;", [email], (err, is_user) => {
		if (err || !is_user) return next(err);

		if (is_user.length)
			return res.send("0");
		else
			return res.send("1");
	});
});

app.get("/signup", (req, res) => {
	res.render("login-signup", {
		LOG_OR_SIGN: "Signup",
		LOGGED_IN: false,
		LOGGING_IN: false
	});
});


function hard_email_validate(email) {
	if (!email_validator.validate(email)) return 0;

	if (!allEmailEnds[email.split("@")[1]]) return 0;

	return 1;
}
/*
	invalid codes:

	0: bad email
	1: bad username (empty)
	2: bad password (empty)
	3: bad gender (empty)
	4: bad birthday

	returns a comma delimited string
	if email and password were bad:

	0,2
*/
function signup_valid(body) {
	let invalid_response = "";

	if (!hard_email_validate(body.email))
		invalid_response += "0,";

	if (!body.username || !body.username.length || body.username.includes("@"))
		invalid_response += "1,";

	if (!body.password || !body.password.length)
		invalid_response += "2,";

	return invalid_response;
}

// status messages:
// 0 - no errors
// 1 - errors
app.post("/signup", async (req, res, next) => {
	let signup_validator;
	if ((signup_validator = signup_valid(req.body)).length) {
		return res.json({
			error: "1-" + signup_validator
		});
	}

	let encryptPass = await new Promise((resolve, reject) => {
		bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
			if (err) return next(err);

			resolve(hash);
		});
	});

	connection.query("INSERT INTO user (username, email, password, joindate) VALUES(?, ?, ?, NOW());",
		[req.body.username, req.body.email, encryptPass], (err) => {
			if (err) return next(err);

			connection.query("SELECT id FROM user WHERE username=? AND email=?", [req.body.username, req.body.email], async (err, newUserID) => {
				if (err || !newUserID || !newUserID.length) return next(err);

				let u_id = parseInt(newUserID[0].id);

				await new Promise((resolve, reject) => {
					connection.query("INSERT INTO streak (user_id, lastLogin, currentStreak, bestStreak) VALUES (?, ?, 1, 1)", [u_id, new Date()], (err) => {
						if (err) return next(err);

						resolve();
					});
				});

				await new Promise((resolve, reject) => {
					connection.query("INSERT INTO game (user_id) VALUES (?)", [u_id], (err) => {
						if (err) return next(err);

						resolve();
					});
				});

				let game_id = uuidv4();
				await new Promise((resolve, reject) => {
					connection.query("INSERT INTO current_board (user_id, startTime, game_id) VALUES (?, ?, ?)", [u_id, new Date(), game_id], (err) => {
						if (err) console.log(err);

						resolve();
					});
				});

				let newUUID = uuidv4();

				connection.query("INSERT INTO auth (user_id, authToken, tokenDeath) VALUES (?, ?, ?);",
					[u_id, newUUID, 2629800000], (err) => {
						if (err)
							return next(err);

						res.cookie("user_id", u_id, {
							maxAge: 2629800000,
							httpOnly: true
						});
						res.cookie("auth_token", newUUID, {
							maxAge: 2629800000,
							httpOnly: true
						});

						res.json({
							success: 1,
							best: 0,
							wholeBoard: null
						});
						return;
					});
			});
		});
});

app.get("/login", (req, res) => {
	res.render("login-signup", {
		LOG_OR_SIGN: "Login",
		LOGGED_IN: false,
		LOGGING_IN: true
	});
});

// https://www.codegrepper.com/code-examples/javascript/javascript+check+if+dates+are+a+day+apart
function getDifferenceInDays(date1, date2) {
	const diffInMs = Math.abs(date2 - date1);
	return diffInMs / (1000 * 60 * 60 * 24);
}

function streakUpdate(user) {
	return new Promise((resolve, reject) => {
		let lastLoginDate = new Date(user.lastLogin);
		let currentDate = new Date();

		let dateDiff = getDifferenceInDays(currentDate, lastLoginDate);
		if (currentDate.getMilliseconds() - lastLoginDate.getMilliseconds() < 2629800000 && (dateDiff > 1 && dateDiff < 2)) {
			connection.query("UPDATE streak SET lastLogin=?, currentStreak=?, bestStreak=? WHERE user_id=?",
				[currentDate, user.currentStreak + 1, user.currentStreak + 1 > user.bestStreak ?
					user.currentStreak + 1 : user.bestStreak, user.id
				], (err) => {
					if (err) return reject(err);

					resolve();
				})
		} else {
			connection.query("UPDATE streak SET lastLogin=?, currentStreak=? WHERE user_id=?",
				[currentDate, dateDiff <= 1 ? user.currentStreak : 1, user.id], (err) => {
					if (err) return reject(err);

					resolve();
				});
		}
	});
}

// status codes:
// 0: success
// 1: error with inputs (no email / no password)
// 2: could not find username
// 3: invalid password
app.post("/login", (req, res, next) => {
	if (!req.body.username_email || !req.body.password) {
		res.send("1-" + (req.body.username_email ? "" : "0,") + (req.body.password ? "" : "1,"));
		return;
	}

	let email_or_username = req.body.username_email.includes("@") ? "email" : "username";
	connection.query(`SELECT id, username, password, lastLogin, currentStreak, bestStreak, bestScore, currentScore, wholeBoard, authToken, tokenDeath FROM user INNER JOIN
		streak ON user.id=streak.user_id INNER JOIN game ON user.id=game.user_id INNER JOIN current_board ON user.id=current_board.user_id
		INNER JOIN auth ON user.id=auth.user_id WHERE ${email_or_username}=?`, req.body.username_email, (err, user_password) => {
		if (err || !user_password) return next(err);

		if (!user_password.length) {
			res.send("2");
			return;
		}

		bcrypt.compare(req.body.password, user_password[0].password, function(err, result) {
			if (err) return next(err);

			if (result) {
				let newUUID = user_password[0].tokenDeath > 0 ? user_password[0].authToken : uuidv4();

				connection.query("INSERT INTO auth (user_id, authToken) VALUES (?, ?) ON DUPLICATE KEY UPDATE authToken=?, tokenDeath=2629800000;",
					[user_password[0].id, newUUID, newUUID], async (err) => {
						if (err)
							return next(err);

						// update streak
						try {
							await streakUpdate(user_password[0]);
						} catch (error) {
							return next(error);
						}

						res.cookie("user_id", user_password[0].id, {
							maxAge: 2629800000,
							httpOnly: true
						});
						res.cookie("auth_token", newUUID, {
							maxAge: 2629800000,
							httpOnly: true
						});

						res.json({
							success: 1,
							username: user_password[0].username,
							bestScore: user_password[0].bestScore,
							currentScore: user_password[0].currentScore,
							board: user_password[0].wholeBoard
						});
						return;
					});
			} else
				return res.send("3");
		});
	});
});

app.listen("2048", () => {
	console.log("server go vroom: 2048");
});