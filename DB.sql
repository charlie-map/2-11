DROP DATABASE IF EXISTS 2_11;
CREATE DATABASE 2_11;

USE 2_11;

CREATE TABLE user ( 
	id INT AUTO_INCREMENT,

	username VARCHAR(255) NOT NULL UNIQUE,
	email VARCHAR(511) NOT NULL UNIQUE,
	wantsEmail TINYINT NOT NULL DEFAULT 1,

	password VARCHAR(60) NOT NULL,

	joindate DATE NOT NULL,

	PRIMARY KEY(id)
);

CREATE TABLE auth (
	user_id INT,

	authToken VARCHAR(36) NOT NULL,
	tokenDeath BIGINT NOT NULL DEFAULT 86400000,

	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE streak (
	user_id INT,

	lastLogin DATETIME NOT NULL,

	currentStreak INT NOT NULL DEFAULT 0,
	bestStreak INT NOT NULL DEFAULT 0,

	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE game (
	user_id INT,

	leaderboardOpen INT NOT NULL DEFAULT 0,
	leaderboardProperty INT NOT NULL DEFAULT 0,
	/*
		leaderboarProperty is used for defining what the leaderboard is currently sorted on

		0: bestScore
		1: bestBlock
		2: wins (getting 2048)
		3: % win
		4: averageScore
	*/

	currentScore INT NOT NULL DEFAULT 0,
	bestBlock INT NOT NULL DEFAULT 2,
	bestScore INT NOT NULL DEFAULT 0,

	averageScore FLOAT NOT NULL DEFAULT 0,

	wins INT NOT NULL DEFAULT 0,
	giveUps INT NOT NULL DEFAULT 0,
	killedBy2 INT NOT NULL DEFAULT 0,
	killedBy4 INT NOT NULL DEFAULT 0,
	killedBy8 INT NOT NULL DEFAULT 0,
	totalGames INT NOT NULL DEFAULT 0,

	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE current_board (
	user_id INT NOT NULL,

	game_id VARCHAR(36) NOT NULL DEFAULT 0,

	wholeBoard TEXT,
	startTime DATETIME,

	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE board_history (
	user_id INT NOT NULL,

	wholeBoard TEXT,

	score INT NOT NULL,

	startTime DATETIME,
	endTime DATETIME,

	FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

/*
	USER INFORMATION:
	CREATE USER 'USERNAME'@'localhost' IDENTIFIED BY 'PASSWORD';
	GRANT SELECT, INSERT, UPDATE ON 2_11.* TO 'USERNAME'@'localhost';
	FLUSH PRIVILEGES
*/