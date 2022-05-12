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
		BEST_BLOCK: 2
	});
});

app.get("/l", loggedIn, (req, res, next) => {
	connection.query(`SELECT username, game.*, streak.currentStreak, streak.bestStreak, streak.lastLogin FROM user INNER JOIN game
		ON user.id=game.user_id INNER JOIN streak ON
		user.id=streak.user_id WHERE user.id=?`, req.session.user_id, (err, user_data) => {
		if (err || !user_data || !user_data.length) return res.render("error");

		connection.query(`SELECT bestScore, leaderboardOpen, username FROM game INNER JOIN user ON user.id=game.user_id ORDER BY bestScore DESC LIMIT 20`, (err, users) => {
			if (err || !users) return res.render("error", { error: err });

			let u_dat = user_data[0];
			users.forEach((u, i) => {
				u.rank = i + 1;

				if (u.username == u_dat.username) {
					u.personal_user = "personal-user-points";
					u.username += " <span id='leaderboard-personal' class='is-taken'>(you)</span>";
				}
			});

			res.render("index", {
				LOGGED_IN: true,
				USERNAME: u_dat.username,

				LEADERBOARD: users,

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
				BEST_STREAK: u_dat.bestStreak,
			});
		});
	});
});

app.get("/updated-leaderboard", loggedIn, (req, res, next) => {
	connection.query("SELECT username FROM user WHERE id=?", req.session.user_id, (err, user_data) => {
		if (err) return next(err);

		connection.query(`SELECT bestScore, leaderboardOpen, username FROM game INNER JOIN user ON user.id=game.user_id ORDER BY bestScore DESC LIMIT 20`, (err, users) => {
			if (err || !users) return next(err);

			let u_dat = user_data[0];
			let wantsLeaderboardOpen = 0;
			users.forEach((u, i) => {
				u.rank = i + 1;

				if (u.username == u_dat.username) {
					wantsLeaderboardOpen = u.leaderboardOpen;
					u.personal_user = "personal-user-points";
					u.username += " <span id='leaderboard-personal' class='is-taken'>(you)</span>";
				}
			});

			res.json({
				leaderboardOpen: wantsLeaderboardOpen,
				users
			});
		});
	});
});

app.get("/toggle-leaderboard", loggedIn, (req, res, next) => {
	
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

	if (!body.gender || !body.gender.length)
		invalid_response += "3,";

	if (!body.birthday || !body.birthday.length) {
		invalid_response += "4";

		return invalid_response;
	}

	if (!date_validator(body.birthday, responseType="boolean"))
		invalid_response += "4";

	return invalid_response;
}

// status messages:
// 0 - no errors
// 1 - errors
app.post("/signup", async (req, res, next) => {
	let signup_validator;
	if (!(signup_validator = signup_valid(req.body)).length) {
		res.send("1-" + signup_validator);
		return;
	}

	let encryptPass = await new Promise((resolve, reject) => {
		bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
			if (err) return next(err);

			resolve(hash);
		});
	});

	let split_birthdate = req.body.birthdate.split("/");
	let adjust_birthdate = split_birthdate[2] + "-" + split_birthdate[1] + "-" + split_birthdate[0];
	connection.query("INSERT INTO user (username, email, password, birthdate, gender, joindate) VALUES(?, ?, ?, ?, ?, NOW());",
		[req.body.username, req.body.email, encryptPass, adjust_birthdate,
		req.body.gender], (err) => {
			if (err) return next(err);

			connection.query("SELECT id FROM user WHERE username=? AND email=?", [req.body.username, req.body.email], async (err, newUserID) => {
				if (err || !newUserID || !newUserID.length) return next(err);

				let u_id = parseInt(newUserID[0].id);

				await new Promise((resolve, reject) => {
					connection.query("INSERT INTO streak (user_id, lastLogin) VALUES (?, NOW())", u_id, (err) => {
						if (err) return next(err);

						resolve();
					});
				});

				await new Promise((resolve, reject) => {
					connection.query("INSERT INTO game (user_id) VALUES (?)", u_id, (err) => {
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
	connection.query(`SELECT id, username, password, bestScore, currentScore, wholeBoard FROM user INNER JOIN
		game ON user.id=game.user_id INNER JOIN current_board ON user.id=current_board.user_id WHERE ${email_or_username}=?`, req.body.username_email, (err, user_password) => {
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
					[newUUID, user_password[0].id], (err) => {
					if (err)
						return next(err);

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