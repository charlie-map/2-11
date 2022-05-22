require('dotenv').config({ path: __dirname + "/.env" });
const mysql = require('mysql2');

const connection = mysql.createConnection({
	host: process.env.HOST,
	database: process.env.DATABASE,
	user: process.env.USERNAME,
	password: process.env.PASSWORD
});

connection.query("SELECT * FROM auth;", async (err, a) => {
	if (err) {
		console.error(err);
		return process.exit();
	}

	let promiseA = a.map((item, index) => {
		return new Promise((resolve, reject) => {
			if (item.tokenDeath < -2000000) {
				connection.query("DELETE FROM auth WHERE user_id=?", item.user_id, (err) => {
					if (err) return reject(err);

					return resolve();
				});
			} else {
				connection.query("UPDATE auth SET tokenDeath=? WHERE user_id=?", [item.tokenDeath - 60000, item.user_id], (err) => {
					if (err) return reject(err);

					return resolve();
				});
			}
		});
	});

	try {
		await Promise.all(promiseA);

		connection.close();
		process.exit();
	} catch (error) {
		console.error(err);

		conneciton.close();
		process.exit();
	}
});
