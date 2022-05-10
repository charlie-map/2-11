require('dotenv').config();

const express = require('express');
const mustache = require('mustache-express');
const bodyParser = require('body-parser');

/* PASSWORD SAFETY */
const bcrypt = require('bcrypt');
const saltRounds = 10;

const mysql = require('mysql2');

const app = express();

const connection = mysql.createConnection({
	host: process.env.HOST,
	database: process.env.DATABASE,
	user: process.env.USERNAME,
	password: process.env.PASSWORD
});

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
	extended: false
}));

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

app.get("/available/:type/:username", (req, res, next) => {
	let availability_TBchecked = req.params.type;
	let username = req.params.username;

	connection.query("SELECT id FROM user WHERE ?=?;", [availability_TBchecked, username], (err, is_user) => {
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

app.post("/signup", async (req, res, next) => {
	console.log("signup", req.body);

	let encryptPass = await new Promise((resolve, reject) => {
		bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
			if (err) return next(err);

			resolve(hash);
		});
	});
	connection.query("INSERT INTO user (username, email, password, birthdate, gender, joindate) VALUES(?, ?, ?, ?, ?, ?);",
		req.body.username, req.body.email, encryptPass, req.body.birthdate,
		req.body.gender, req.body.joindate, (err) => {
			if (err) return next(err);

			connection.query("SELECT id FROM user WHERE username=? AND email=?", [req.body.username, req.body.email], async (err, newUserID) => {
				if (err || !newUserID || !newUserID.length) return next(err);

				let u_id = newUserID[0].id;

				await new Promise((resolve, reject) => {
					connection.query("INSERT INTO streak (user_id, lastLogin) VALUES (?, CURRDATE())", u_id, (err) => {
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
						connection.query("INSERT INTO BoardX (id, user_id) VALUES (?, ?)", [4 * user_id + x, user_id], async (err) => {
							if (err) reject(err);

							try {
								let placeBoardY = internal_board.map(y => {
									return new Promise((inner_resolve, inner_reject) => {
										connection.query("INSERT INTO boardY (id, boardX_id) VALUES (?, ?)", [4 * (4 * user_id + x) + y, 4 * user_id + x], (err) => {
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

				res.send("0");
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

app.listen("2048", () => {
	console.log("server go vroom");
});