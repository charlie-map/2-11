const WEEK_DAYS = [
	"Sun",
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat"
];
const TOTAL_GAME_BAR = {
	100: "max",
	75: "up-mid",
	50: "down-mid",
	25: "min"
};

const Meta = {
	/**
	 * Sends xhr request using the passed params
	 *
	 * @params { Object } params:
	 *  - type: type of request (GET, POST, etc.)
	 *  - url: where to send request ("/example")
	 *  - data: data to send (if needed)
	 *  - responseHandle: handle given response (using Meta.xhr.reponseJSON, etc.)
	 *  - success: callback on successful finish
	 *  - failure: callback on failing finish
	 *  - headers { Object }: any number of xhr headers to pass in ("Content-Type": "application/json", etc.)
	 */
	xhr: {
		responseJSON: (xhr) => { return JSON.parse(xhr.response) },
		responseText: (xhr) => { return xhr.responseText },

		send: function (params) {
			let xhr = new XMLHttpRequest();

			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4) {
					// handle error
					if (xhr.status != 200) return params.failure(xhr.response);

					if (!params.success) return;
					params.success(params.responseHandle ? params.responseHandle(xhr) :
						Meta.xhr.responseText(xhr));
				}
			};

			xhr.onerror = params.failure;

			xhr.open(params.type, params.url, true);

			xhr.withCredentials = true;

			if (params.headers) {
				let headers = Object.keys(params.headers);
				for (let h = 0; h < headers.length; h++)
					xhr.setRequestHeader(headers[h], params.headers[headers[h]]);
			}

			xhr.send(params.data);
		}
	},

	GetGenericError: (_e) => {
		let dropdown = $(".dropdown-noti");

		$(dropdown).removeClass("logged-in-box");
		$(dropdown).removeClass("logged-out-box");
		$(dropdown).addClass("error");

		$(dropdown).html(`
          <p class="barlow">An error has occured. Please try again</p>
        `);

		$(dropdown).removeClass("slide-out");

		setTimeout(function () {
			$(".dropdown-noti").addClass("slide-out");
		}, 4800);
	},

	leaderboardUsers: {},
	/**
	 * Builds the profile of the user someone clicks on
	 * Uses the profile component built into index.mustache
	 *
	 * @params { Number } full decides if this should build the entire profile
	 *  or the subcomponent to display in the leaderboard tab
	 * @params { Element } this the element that someone clicks (represents user)
	 *
	 * @returns { String } constructs profile modal
	 */
	BuildProfile: async function (full) {
		// ensure empty profile tab
		let profile = document.querySelector(".profile");

		let usernameElement = this == window ?
			document.getElementById("leaderboard").
				querySelector(".leaderboard-entry-score.personal-user-points").
				parentNode.querySelector(".leaderboard-entry-username")
			: this;

		let isSelf = this.querySelector("#leaderboard-personal") ? 1 : 0;

		let allInnerText = this.innerText;
		let username = isSelf ? allInnerText.substring(0,
			allInnerText.length - this.querySelector("#leaderboard-personal").innerText.length) :
			allInnerText;
		let rank = parseInt(this.parentNode.parentNode.querySelector(".leaderboard-entry-rank").innerText, 10);

		let profileTabPromise = SetupProfileTab(profile, isSelf ? this.innerHTML : username, rank);
		profile.classList.add("show");

		// use username to gather data from server:
		const res = Meta.leaderboardUsers[username] ?? await new Promise((r) => {
			Meta.xhr.send({
				type: "GET",
				url: "/user/" + username,

				responseHandle: Meta.xhr.responseJSON,
				success: r,
			});
		});

		Meta.leaderboardUsers[username] = res;

		profile.querySelector("#current-score").innerHTML = res.currentScore;
		profile.querySelector("#best-score").innerHTML = res.bestScore;

		profile.querySelector("#current-score").style.filter = "none";
		profile.querySelector("#best-score").style.filter = "none";

		let currentDateInfo = res.currentDate;
		let currentDate = new Date(
			currentDateInfo.y,
			currentDateInfo.m,
			currentDateInfo.d,
			currentDateInfo.h,
			currentDateInfo.min,
			currentDateInfo.s,
			currentDateInfo.mil
		);

		let profileStatPosition = profile.querySelectorAll(".profile-stats-recent-inner");
		await profileTabPromise;

		let datesShown = 7;
		for (let i = datesShown - 1; i >= 0; i--) {
			profileStatPosition[i].querySelector("p").innerHTML = WEEK_DAYS[currentDate.getDay()];

			let datePercentage = res.maxTotalGames ? res.totalGames[i] / res.maxTotalGames : 0;

			let profileStatBar = profileStatPosition[i].querySelector(".bar");
			if (datePercentage > 0.9) { // max
				profileStatBar.classList.add("max");
			} else if (datePercentage >= 0.7) { // up-mid
				profileStatBar.classList.add("up-mid");
			} else if (datePercentage >= 0.4) { // down-mid
				profileStatBar.classList.add("down-mid");
			} else if (datePercentage > 0.1) { // min
				profileStatBar.classList.add("min");
			} // otherwise add nothing

			currentDate = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth(),
				currentDate.getDate() - 1,
				currentDate.getHours(),
				currentDate.getMinutes(),
				currentDate.getSeconds(),
				currentDate.getMilliseconds()
			);
		}
	}
};

function SetupProfileTab(profile, username, rank) {
	// .leaderboard-entry-rank -> 0
	let leaderboardEntryRank = profile.querySelector(".leaderboard-entry-rank");
	for (let removeRank = 1; removeRank <= 20; removeRank++)
		leaderboardEntryRank.classList.remove(
			"rank-color" + removeRank,
		);
	if (rank <= 20) {
		leaderboardEntryRank.classList.remove("rank-color-1");
		leaderboardEntryRank.classList.add(rank ? "rank-color" + rank : "rank-color-1");
	} else {
		leaderboardEntryRank.classList.add("rank-color-1");
	}
	leaderboardEntryRank.innerHTML = rank;

	// .leaderboard-entry-username -> Loading
	profile.querySelector(".leaderboard-entry-username").innerHTML = username;

	profile.querySelector("#current-score").style.filter = "blur(0.2em)";
	profile.querySelector("#best-score").style.filter = "blur(0.2em)";

	let dayStats = profile.querySelectorAll(".profile-stats-recent-inner");
	for (let dsSet = 0; dsSet < dayStats.length; dsSet++) {
		dayStats[dsSet].querySelector(".bar").classList.remove("max", "up-mid", "down-mid", "min");
	}

	return new Promise(resolve => {
		setTimeout(resolve, 170);
	});
}