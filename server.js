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
	console.log("try log", req.session);

	if (!req.session.user_id || !req.session.auth_token)
		return res.redirect("/login");

	connection.query("SELECT authToken FROM auth WHERE user_id=?", req.session.user_id, (err, authToken) => {
		if (err) {
			return next(err);
		}

		if (authToken[0].authToken == req.session.auth_token)
			return next();
		else
			return res.redirect("/login");
	});
}

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
	extended: false
}));

app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use((err, req, res, next) => {
	console.log("ERROR OCCURRED: ", err);

	res.render("error", { error: err });
});

app.set('views', __dirname + "/views");
app.set('view engine', 'mustache');
app.engine('mustache', mustache());

app.get("/", (req, res, next) => {
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

	if (!body.username || !body.username.length)
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

				let internal_board = [0, 1, 2, 3];
				let placeBoardX = internal_board.map(x => {
					return new Promise((resolve, reject) => {
						connection.query("INSERT INTO boardX (id, user_id) VALUES (?, ?)", [4 * u_id + x, u_id], async (err) => {
							if (err) reject(err);

							try {
								let placeBoardY = internal_board.map(y => {
									return new Promise((inner_resolve, inner_reject) => {
										connection.query("INSERT INTO boardY (id, boardX_id) VALUES (?, ?)", [4 * (4 * u_id + x) + y, 4 * u_id + x], (err) => {
											if (err) return inner_reject(err);

											return inner_resolve();
										});
									});
								});

								await Promise.all(placeBoardY);

								resolve();
							} catch (error) {
								return reject(error);
							}
						})
					});
				});

				await Promise.all(placeBoardX);

				let newUUID = uuidv4();

				connection.query("INSERT INTO auth (user_id, authToken, tokenDeath) VALUES (?, ?, ?);",
					[u_id, newUUID, new Date(new Date().getTime() + 86400000)], (err) => {
					if (err)
						return next(err);

					req.session.id = u_id;
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

app.post("/login", (req, res) => {
	console.log("login", req.body);
});

app.get("/dashboard", loggedIn, (req, res) => {

});

app.listen("2048", () => {
	console.log("server go vroom");
});