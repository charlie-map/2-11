require("dotenv").config();

const express = require("express");
const mustache = require("mustache-express");
const bodyParser = require("body-parser");

/* PASSWORD SAFETY & AUTH */
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const email_validator = require("email-validator");
const date_validator = require("validate-date");

const mysql = require('mysql2');

const app = express();

const connection = mysql.createConnection({
	host: process.env.HOST,
	database: process.env.DATABASE,
	user: process.env.USERNAME,
	password: process.env.PASSWORD
});

function loggedIn(req, res, next) {
	if (!req.session.user_id || !req.session.auth_token)
		return res.redirect("/");

	connection.query("SELECT authToken FROM auth WHERE user_id=?", req.session.user_id, (err, authToken) => {
		if (err) 
			return res.render("error", {
				error
			});

		if (authToken.length && authToken[0].authToken == req.session.auth_token)
			return next();
		else
			res.redirect("/");
	});
}

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: { 
		maxAge: 600000
	}
}))

app.use((err, req, res, next) => {
	console.log("ERROR OCCURRED: ", err);

	res.render("error", { error: err });
});

app.set('views', __dirname + "/views");
app.set('view engine', 'mustache');
app.engine('mustache', mustache());

app.get("/", (req, res, next) => {
	res.render("index", {
		LOGGED_IN: false,
		LEADERBOARD_OPEN: 0,
		BEST_BLOCK: 2,
		LEADERBOARD_PROPERTY: "Best score"
	});
});

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

		return (Math.round((obj.wins / obj.totalGames) * 100) / 100) + "%";
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
	connection.query(`SELECT id, username, game.*, streak.* FROM user INNER JOIN game
		ON user.id=game.user_id INNER JOIN streak ON
		user.id=streak.user_id WHERE user.id=?`, req.session.user_id, async (err, user_data) => {
		if (err || !user_data || !user_data.length) return res.render("error");

		// update streak
		try {
			console.log("streak update");
			await streakUpdate(user_data[0]);
		} catch (error) {
			return next(error);
		}

		connection.query(`SELECT username, bestScore, bestBlock, wins, averageScore, totalGames FROM game INNER JOIN user ON user.id=game.user_id ORDER BY ${propertiesSQL[user_data[0].leaderboardProperty]} LIMIT 20`, (err, users) => {
			if (err || !users) return res.render("error", { error: err });

			let userBoardOpen;
			let u_dat = user_data[0];
			let leaderboardIndex = users.map((u, i) => {
				let newU = {};

				newU.rank = i + 1;
				newU.score = getPropertyValue(u_dat.leaderboardProperty, u);

				newU.username = u.username + (u.username == u_dat.username ? " <span id='leaderboard-personal' class='is-taken'>(you)</span>" : "");

				if (u.username == u_dat.username)
					newU.personal_user = "personal-user-points";

				return newU;
			});

			res.render("index", {
				LOGGED_IN: true,
				USERNAME: u_dat.username,

				LEADERBOARD_OPEN: u_dat.leaderboardOpen,
				LEADERBOARD_PROPERTY: propertiesUI[u_dat.leaderboardProperty],
				LEADERBOARD: leaderboardIndex,

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

	connection.query("UPDATE game SET leaderboardProperty=? WHERE user_id=?", [propNum, req.session.user_id], (err) => {
		if (err) return next(err);

		return res.send("0-" + propertiesUI[propNum]);
	});
});

app.get("/updated-leaderboard", loggedIn, (req, res, next) => {
	connection.query("SELECT username, leaderboardOpen, leaderboardProperty FROM user INNER JOIN game ON user.id=game.user_id WHERE id=?", req.session.user_id, (err, user_data) => {
		if (err) return next(err);

		connection.query(`SELECT username, bestScore, bestBlock, wins, averageScore, totalGames FROM game INNER JOIN user ON user.id=game.user_id ORDER BY ${propertiesSQL[user_data[0].leaderboardProperty]} LIMIT 20`, (err, users) => {
			if (err || !users) return next(err);

			let userBoardOpen;
			let u_dat = user_data[0];
			let leaderboardIndex = users.map((u, i) => {
				let newU = {};

				newU.rank = i + 1;
				newU.score = getPropertyValue(u_dat.leaderboardProperty, u);

				newU.username = u.username + (u.username == u_dat.username ? " <span id='leaderboard-personal' class='is-taken'>(you)</span>" : "");

				if (u.username == u_dat.username)
					newU.personal_user = "personal-user-points";

				return newU;
			});

			res.json({
				leaderboardOpen: u_dat.leaderboardOpen ? true : false,
				leaderboardIndex
			});
		});
	});
});

app.get("/toggle-leaderboard/:onoff", loggedIn, (req, res, next) => {
	let toggleStatus = req.params["onoff"];

	connection.query("UPDATE game SET leaderboardOpen=? WHERE user_id=?", [toggleStatus, req.session.user_id], (err) => {
		if (err) return next(err);

		res.send("");
	});
});

app.post("/save-game", loggedIn, (req, res, next) => {
	if (!req.body.board || !req.body.currentScore)
		return res.send("1");

	let realCurrentScore = req.body.currentScore.substr(8);
	connection.query("SELECT bestScore FROM game WHERE user_id=?", req.session.user_id, (err, bestscore) => {
		if (err || !bestscore || !bestscore.length) return next(err);

		let newBestScore = bestscore[0].bestScore < realCurrentScore ? realCurrentScore : bestscore[0].bestScore;

		connection.query("UPDATE game SET bestScore=?, currentScore=? WHERE user_id=?", [newBestScore, realCurrentScore, req.session.user_id], (err) => {
			if (err) return next(err);

			connection.query("UPDATE current_board SET wholeBoard=? WHERE user_id=?", [req.body.board, req.session.user_id], (err) => {
				if (err) return next(err);

				res.send("0");
			});
		});
	});
});

let allowed_blocks = {
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
app.get("/update-best-block/:newblock", loggedIn, (req, res, next) => {
	if (!allowed_blocks[req.params["newblock"]])
		return res.send("1");

	connection.query("UPDATE game SET bestBlock=? WHERE user_id=?", [req.params["newblock"], req.session.user_id], (err) => {
		if (err) return next(err);

		return res.send("0");
	});
});

function computeNumFrom(num, end) {
	let endNum = 0, scale = 1;

	for (let getToNum = num; getToNum > end; getToNum -= (getToNum * 0.5)) {
		endNum += getToNum * scale;
		scale *= 2;
	}

	return endNum;
}

// guess minimum and maximum score asssuming that only
// 8's or 2's are spawned respectively:
function calculateScore(board) {
	let minScore = 0, maxScore = 0;
	let bestBlock = 2;

	for (let x = 0; x < board.length; x++) {
		for (let y = 0; y < board[x].length; y++) {
			bestBlock = bestBlock < board[x][y].num ? board[x][y].num : bestBlock;
			minScore += computeNumFrom(parseInt(board[x][y].num, 10), 8);
			maxScore += computeNumFrom(parseInt(board[x][y].num, 10), 2);
		}
	}

	return {
		min: minScore,
		max: maxScore,
		bestBlock
	};
}

app.post("/game-over", loggedIn, (req, res, next) => {
	if (!req.body.board || !req.body.score || !req.body.killerPiece) {
		return res.send("1");
	}

	let endBoard = JSON.parse(req.body.board);
	let scores = calculateScore(endBoard);

	let score = parseInt(req.body.score, 10);

	// score was tampered with
	if (score < scores.min || score > scores.max) {
		return res.send("2");
	}

	let killerPiece = parseInt(req.body.killerPiece, 10);
	killerPiece = killerPiece != 2 && killerPiece != 4 && killerPiece != 8 ? 2 : killerPiece;

	connection.query(`UPDATE game SET wins=(SELECT wins FROM game WHERE user_id=?)+?,
		giveUps=(SELECT giveUps FROM game WHERE user_id=?)+?,
		${killerPiece == 4 ? "killedBy4=(SELECT killedBy4 FROM game WHERE user_id=?)+1" :
		killerPiece == 8 ? "killedBy8=(SELECT killedBy8 FROM game WHERE user_id=?)+1" :
		"killedBy2=(SELECT killedBy2 FROM game WHERE user_id=?)+1"},
		totalGames=(SELECT totalGames FROM game WHERE user_id=?)+1 WHERE user_id=?`,
		[req.session.user_id, scores.bestBlock >= 2048 ? 1 : 0, req.session.user_id,
		scores.bestBlock < 2048 ? 1 : 0, req.session.user_id, req.session.user_id, req.session.user_id, req.session.user_id, req.session.user_id], (err) => {
			if (err) return next(err);

			connection.query(`INSERT INTO board_history (user_id, wholeBoard, score, startTime, endTime) VALUES
				(?, ?, ?, (SELECT startTime FROM current_board WHERE user_id=?), ?)`,
				[req.session.user_id, req.body.board, score, req.session.user_id, new Date()], async (err) => {
					if (err) return next(err);

					let prevAvgScore_totalGames;
					try {
						prevAvgScore_totalGames = await new Promise((resolve, reject) => {
							connection.query("SELECT averageScore, totalGames FROM game WHERE user_id=?", req.session.user_id, (err, avgScore) => {
								if (err || !avgScore || !avgScore.length) return reject(err);

								resolve({
									avS: avgScore[0].averageScore,
									tG: avgScore[0].totalGames
								});
							});
						});
					} catch (error) {
						return next(error);
					}
				
					connection.query("UPDATE game SET averageScore=? WHERE user_id=?",
						[((prevAvgScore_totalGames.avS * (prevAvgScore_totalGames.tG - 1)) / (prevAvgScore_totalGames.tG)) +
						(score / prevAvgScore_totalGames.tG), req.session.user_id], (err) => {
							if (err) return next(err);

							return res.send("0");
						});
				});
		});
});

app.get("/username-available/:username", (req, res, next) => {
	let username = req.params.username;

	if (!username || !username.length)
		return res.end("0");

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
		return res.end("0");

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

	if (!email_validator.validate(body.email))
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
		res.send("1-" + signup_validator);
		return;
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

				await new Promise((resolve, reject) => {
					connection.query("INSERT INTO current_board (user_id, startTime) VALUES (?, ?)", [u_id, new Date()], (err) => {
						if (err) console.log(err);

						resolve();
					});
				});

				let newUUID = uuidv4();

				connection.query("INSERT INTO auth (user_id, authToken, tokenDeath) VALUES (?, ?, ?);",
					[u_id, newUUID, new Date(new Date().getTime() + 86400000)], (err) => {
					if (err)
						return next(err);

					req.session.cookie.expires = false;
					req.session.user_id = u_id;
					req.session.auth_token = newUUID;

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
		if (currentDate.getMilliseconds() - lastLoginDate.getMilliseconds() < 86400000 && (dateDiff > 1 && dateDiff < 2))  {
			connection.query("UPDATE streak SET lastLogin=?, currentStreak=?, bestStreak=? WHERE user_id=?",
				[currentDate, user.currentStreak + 1, user.currentStreak + 1 > user.bestStreak ?
				user.currentStreak + 1 : user.bestStreak, user.id], (err) => {
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
	connection.query(`SELECT id, username, password, lastLogin, currentStreak, bestStreak, bestScore, currentScore, wholeBoard FROM user INNER JOIN
		streak ON user.id=streak.user_id INNER JOIN game ON user.id=game.user_id INNER JOIN current_board ON user.id=current_board.user_id WHERE ${email_or_username}=?`, req.body.username_email, (err, user_password) => {
		if (err || !user_password) return next(err);

		if (!user_password.length) {
			res.send("2");
			return;
		}

		bcrypt.compare(req.body.password, user_password[0].password, function(err, result) {
			if (err) return next(err);

			if (result) {
				let newUUID = uuidv4();

				connection.query("UPDATE auth SET authToken=? WHERE user_id=?;",
					[newUUID, user_password[0].id], async (err) => {
					if (err)
						return next(err);

					// update streak
					try {
						await streakUpdate(user_password[0]);
					} catch (error) {
						return next(error);
					}

					req.session.cookie.expires = false;
					req.session.user_id = user_password[0].id;
					req.session.auth_token = newUUID;

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
	console.log("server go vroom");
});