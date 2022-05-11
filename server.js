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

function loggedIn(req, next) {
	if (!req.session.user_id || !req.session.auth_token)
		return 0;

	try {
		return new Promise((resolve, reject) => {
			connection.query("SELECT authToken FROM auth WHERE user_id=?", req.session.user_id, (err, authToken) => {
				if (err) reject(err);

				if (authToken.length && authToken[0].authToken == req.session.auth_token)
					resolve(1);
				else
					resolve(0);
			});
		});
	} catch (error) {
		next(error);
	}
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

app.get("/", async (req, res, next) => {
	if (await loggedIn(req, next)) {
		connection.query(`SELECT game.*, streak.currentStreak, streak.bestStreak, streak.lastLogin FROM game INNER JOIN streak ON
			game.user_id=streak.user_id WHERE id=?`, req.session.user_id, (err, user_data) => {
			if (err || !user_data || !user_data.length) return res.render("error");

			let u_dat = user_data[0];
			res.render("index.mustache", {
				LOGGED_IN: true,
				USERNAME: req.session.username,

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
	} else
		res.render("index");
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
						if (err) return next(err);

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

					res.send("0");
					return;
				});
			});
		});
});

app.get("/login", (req, res) => {
	res.render("login-signup", {
		LOG_OR_SIGN: "Login",
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
	connection.query("SELECT id, password FROM user WHERE " + email_or_username + "=?", req.body.username_email, (err, user_password) => {
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

					res.send("0");
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