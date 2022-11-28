const week_days = [
	"Mon",
	"Tue",
	"Web",
	"Thu",
	"Fri",
	"Sat",
	"Sun"
];

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

		send: function(params) {
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

	GetGenericError: (e) => {
		let dropdown = $(".dropdown-noti");

		$(dropdown).removeClass("logged-in-box");
        $(dropdown).removeClass("logged-out-box");
        $(dropdown).addClass("error");

        $(dropdown).html(`
          <p class="barlow">An error has occured. Please try again</p>
        `);

        $(dropdown).removeClass("slide-out");

        setTimeout(function() {
			$(".dropdown-noti").addClass("slide-out");
		}, 4800);
	},

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
	BuildProfile: function(full) {
		// ensure empty profile tab
		let profile = document.querySelector(".profile");
		
		let isSelf = this.querySelector("#leaderboard-personal") ? 1 : 0;

		let allInnerText = this.innerText;
		let username = isSelf ? allInnerText.substring(0,
			allInnerText.length - this.querySelector("#leaderboard-personal").innerText.length) :
			allInnerText;
		let rank = this.parentNode.parentNode.querySelector(".leaderboard-entry-rank").innerText;

		SetupProfileTab(profile, username, rank);
		profile.classList.add("show");

		// use username to gather data from server:
		Meta.xhr.send({
			type: "GET",
			url: "/user/" + username,

			
		});
	}
};

function SetupProfileTab(profile, username, rank) {

	// .leaderboard-entry-rank -> 0
	let leaderboardEntryRank = profile.querySelector(".leaderboard-entry-rank");
	for (let removeRank = 1; removeRank <= 20; removeRank++)
		leaderboardEntryRank.classList.remove(
			"rank-color" + removeRank, 
		);
	if (rank) {
		leaderboardEntryRank.classList.remove("rank-color-1");
		leaderboardEntryRank.classList.add(rank ? "rank-color" + rank : "rank-color-1");
	} else {
		leaderboardEntryRank.classList.add("rank-color-1");
	}
	leaderboardEntryRank.innerHTML = rank;

	// .leaderboard-entry-username -> Loading
	profile.querySelector(".leaderboard-entry-username").innerHTML = username;

	// #current-score -> ...
	profile.querySelector("#current-score").innerHTML = "...";
	// #best-score -> ...
	profile.querySelector("#best-score").innerHTML = "...";

	let dayStats = profile.querySelector(".profile-stats-recent-inner");
	for (let dsSet = 0; dsSet < dayStats.length; dsSet++) {
		dayStats.querySelector("div").classList.remove("max", "up-mid", "down-mid", "min");

		dayStats.querySelector("div").classList.add("zero");

		dayStats.querySelector("p").innerHTML = "..";
	}
}