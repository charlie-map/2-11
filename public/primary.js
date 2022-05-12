$(document).ready(function() {
	if ($(".dropdown-noti").hasClass("logged-in-box"))
		setTimeout(function() {
			$(".dropdown-noti").addClass("slide-out");
		}, 4800);


	$("body").css("height", $("#all-content").outerHeight());

	if (logging_in == undefined || logging_in || loggedIn) {
		if (logging_in)
			$("#username").focus();

		if (loggedIn) {
			let set_width = $(document).outerWidth() - 460;
			set_width = set_width > 400 ? 400 : set_width;
			$("#leaderboard").css({
				width: set_width,
				left: "calc(50% + " + (430 * 0.5) + "px)"
			});

			let user_column_left = $(document).outerWidth() * 0.5 - 230;
			$(".user-column").css({
				left: user_column_left - $(".user-column").outerWidth()
			});
		}

		return;
	}
	$("#gender").parent().css({
		"margin-top": -1 * $(".gender-noti").outerHeight()
	});

	let img_width = $("#nice-image").outerWidth();

	$(".gender-noti").outerWidth(img_width - 8);

	$(".gender-noti").offset({
		left: $("#nice-image").offset().left + 4,
		top: $("#gender").offset().top - 40
	});

	$("#email").focus();
});

window.onresize = function() {
	if (loggedIn) {
		let set_width = $(document).outerWidth() - 460;
		set_width = set_width > 400 ? 400 : set_width;
		$("#leaderboard").css({
			width: set_width,
			left: "calc(50% + " + (430 * 0.5) + "px)"
		});

		let user_column_left = $(document).outerWidth() * 0.5 - 230;
		$(".user-column").css({
			left: user_column_left - $(".user-column").outerWidth()
		});
	}

	if (logging_in == undefined || logging_in)
		return;

	$("#gender").parent().css({
		"margin-top": -1 * $(".gender-noti").outerHeight()
	});

	let img_width = $("#nice-image").outerWidth();

	$(".gender-noti").outerWidth(img_width - 8);

	$(".gender-noti").offset({
		left: $("#nice-image").offset().left + 4,
		top: $("#gender").offset().top - 40
	});
}

$("#new-game").click(function() {
	metaPoints = 0, points = 0;
	endGame = 0;
	opacityEndRoller = 60

	$("#new-game").text("New game");

	$("#current-score").text("0");

	setup(1);
});

function checkUserRankLeaderboard(newMetaPoints) {
	needLeaderboardCheck = 0;
	activelyMovingLeaderboardRank = 1;
	let personal_user = $(".personal-user-points").parent().parent();

	let upper_sibling_check = $(personal_user).prev();
	let sib_to_switch = null;
	while (!$(upper_sibling_check).is(personal_user) && upper_sibling_check && upper_sibling_check.length) {
		if (parseInt($(upper_sibling_check).find(".leaderboard-entry-score").text(), 10) >= newMetaPoints)
			break;

		sib_to_switch = upper_sibling_check;
		upper_sibling_check = $(upper_sibling_check).is(":first-child") ? null : $(upper_sibling_check).prev();
	}

	if (sib_to_switch) {
		$(sib_to_switch).css("z-index", 1);
		$(sib_to_switch).addClass("swapping");
		$(personal_user).css("z-index", 2);
		$(personal_user).addClass("swapping");

		let space_diff = $(personal_user).offset().top - $(sib_to_switch).offset().top;

		$(personal_user).css({
			"margin-top": -2 * space_diff,
			"margin-bottom": space_diff
		});
		$(sib_to_switch).css({
			"margin-top": space_diff
		});

		setTimeout(function(animation_data) {
			$(animation_data[0]).removeClass("swapping");
			$(animation_data[1]).removeClass("swapping");

			$(animation_data[0]).css({
				"margin-top": 0,
				"margin-bottom": 0
			});
			$(animation_data[1]).css({
				"margin-top": 0
			});

			let personal_username = $(animation_data[0]).find(".leaderboard-entry-username").html();
			let other_username = $(animation_data[1]).find(".leaderboard-entry-username").html();
			$(animation_data[0]).find(".leaderboard-entry-username").html(other_username);
			$(animation_data[1]).find(".leaderboard-entry-username").html(personal_username);

			$(animation_data[0]).find(".leaderboard-entry-score").removeClass("personal-user-points");
			$(animation_data[1]).find(".leaderboard-entry-score").addClass("personal-user-points");

			let personal_score = $(animation_data[0]).find(".leaderboard-entry-score").text();
			let other_score = $(animation_data[1]).find(".leaderboard-entry-score").text();

			$(animation_data[0]).find(".leaderboard-entry-score").text(other_score);
			$(animation_data[1]).find(".leaderboard-entry-score").text(personal_score);

			// $.get("/updated-leaderboards", (res) => {
			// 	let l_boards = JSON.parse(res);


			// });
			activelyMovingLeaderboardRank = 0;
		}, 800, [personal_user, sib_to_switch]);
	}

	activelyMovingLeaderboardRank = 0;
}

window.addEventListener("keydown", function(e) {
	if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
		e.preventDefault();
	}
}, false);

$("#go-to-title").click(function(e) {
	e.preventDefault();

	$("html, body").animate({
		scrollTop: -200
	}, "slow");
});

$("#go-to-how-to").click(function(e) {
	e.preventDefault();

	$("html, body").animate({
		scrollTop: $(document).height()
	}, "slow");
});

$("#gender").focus(function() {
	$(".gender-noti").addClass("select");
	$("#password-container").addClass("select");
});

$(".floating-label input").focusout(function() {
	if ($(this).val().length) {
		$(this).parent().removeClass("invalid");
	}
});

$("#gender").focusout(function() {
	$(".gender-noti").removeClass("select");
	$("#password-container").removeClass("select");
});

$(".gender-pick").click(function() {
	$("#gender").attr("value", $(this).attr("value"));

	$("#big-ol-form").validate().element("#gender");
	$("#gender").addClass("color");
	$("#gender").parent().removeClass("invalid");

	$("#birthday").focus();
});

$("#username").focus(function() {
	$("#username").removeClass("taken");
	$("#username-taken").removeClass("is-taken");
});

$("#username").focusout(function() {
	if (logging_in)
		return;

	let username = $("#username").val();

	if (!username.length)
		return;

	if (username.includes("@")) {
		$("#username-taken").html("no @ in username");
		$("#username-taken").addClass("is-taken");
		invalidate($("#username"));

		return;
	}

	$.get("/username-available/" + username, (res) => {
		if (res == "0") { // username taken
			invalidate($("#username"));

			$("#username-taken").html("taken");
			$("#username-taken").addClass("is-taken");
			$("#username").addClass("taken");
		} else {
			$("#username-taken").removeClass("is-taken");
			$("#username").removeClass("taken");
		}
	});
});

$("#email").focus(function() {
	$("#email").removeClass("taken");
	$("#email-taken").removeClass("is-taken");
});

$("#email").focusout(function() {
	if (logging_in)
		return;

	let email = $("#email").val();

	if (!email.length)
		return;

	$.get("/email-available/" + email, (res) => {
		if (res == "0") { // email taken
			invalidate($("#email"));

			$("#email-taken").addClass("is-taken");
			$("#email").addClass("taken");
		} else {
			$("#email-taken").removeClass("is-taken");
			$("#email").removeClass("taken");
		}
	});
});

function invalidate(el) {
	$(el).parent().addClass("invalid");
	$(el).removeClass("valid");
}

function stringBoardToVisual(mainDiv, fullBoard) {
	for (let y = 3; y >= 0; y--) {
		$(mainDiv).prepend(`<div class="board-display-row row-${y}"></div>`);

		let current_row = $(mainDiv).children(`.row-${y}`);
		for (let x = 0; x < 4; x++) {
			if (fullBoard[x][y])
				current_row.append(`
				<div class="column-tab best-square bs-${fullBoard[x][y].num} column-${x}">
					<div class="best-num">${fullBoard[x][y].num}</div>
				</div>`);
			else
				current_row.append(`<div class="column-tab best-square bs-0 column-${x}"></div>`);
		}
	}
}

function differentNumbers(board1, board2) {
	for (let x = 0; x < 4; x++) {
		for (let y = 0; y < 4; y++) {
			if (board1[x][y] && board2[x][y]) {
				if (board1[x][y].num != board2[x][y].num)
					return 1;
			} else if (board1[x][y])
				return 1;
			else if (board2[x][y])
				return 1
		}
	}

	return 0;
}

let res_buffer;
$("#register").click(function(e) {
	e.preventDefault();

	if (logging_in) {
		let invalids = 0;
		let username_or_email = $("#username").val();
		if (!username_or_email.length) {
			invalids++;
			invalidate($("#username"));
		}
		let password = $("#password").val();
		if (!password.length) {
			invalids++;
			invalidate($("#password"));
		}

		$.post("/login", {
			username_email: username_or_email,
			password
		}, (res) => {
			if (!res.success) {
				// error
				return;
			}

			let currentLocalBoard = localStorage.getItem("saved2-11Board");
			let currentLocalScore = localStorage.getItem("savedCurr2-11Score");

			let JSONcurrentLocalBoard = JSON.parse(currentLocalBoard);
			let JSONres_board = JSON.parse(res.board);
			if (!currentLocalBoard || !res.board || !differentNumbers(JSONcurrentLocalBoard, JSONres_board)) {
				localStorage.setItem("savedBest2-11Score", res.bestScore);
				window.location.href = window.location.href.split("/")[0] + "/l";
				return;
			}

			stringBoardToVisual($("#local-board"), JSONcurrentLocalBoard);
			stringBoardToVisual($("#remote-board"), JSONres_board);

			// choose which board to continue with
			$("#choose-board-username").text(res.username);
			$("#choose-board").addClass("fix-conflict");

			res_buffer = res;
		});
	} else {
		let invalids = 0;

		let email = $("#email").val();
		if (!email.length || $("#email").hasClass("taken")) {
			invalids++;
			invalidate($("#email"));
		}

		let username = $("#username").val();
		if (!username.length || $("#username").hasClass("taken")) {
			invalids++;
			invalidate($("#username"));
		}
		let password = $("#password").val();
		if (!password.length) {
			invalids++;
			invalidate($("#password"));
		}

		let gender = $("#gender").val();
		if (!gender.length) {
			invalids++;
			invalidate($("#gender"));
		}
		let birthday = $("#birthday").val();
		if (!birthday.length) {
			invalids++;
			invalidate($("#birthday"));
		}

		if (invalids)
			return;

		$.post("/signup", {
			email,
			username,
			password,
			gender,
			birthdate: birthday
		}, (res) => {
			if (res.success) {
				localStorage.setItem("savedBest2-11Score", 0);
				localStorage.setItem("savedCurr2-11Score", 0);
				localStorage.setItem("saved2-11Board", null);
				window.location.href = window.location.href.split("/")[0] + "/l";

				return;
			}

			let errorNumbers = res.split("-")[1];

			let errorNumberSplit = errorNumbers.split(",");
			let formInputs = {
				"0": $("#email"),
				"1": $("#username"),
				"2": $("#password"),
				"3": $("#gender"),
				"4": $("#birthday")
			}

			for (let i = 0; i < errorNumberSplit.length; i++) {
				invalidate(formInputs[errorNumberSplit[i]]);
			}
		});
	}
});

$("#choose-local-board").click(function() {
	$.post("/save-game", {
		board: localStorage.getItem("saved2-11Board"),
		currentScore: "83e0a301" + localStorage.getItem("savedCurr2-11Score")
	}, (res) => {
		localStorage.setItem("savedBest2-11Score", res_buffer.bestScore);
		window.location.href = window.location.href.split("/")[0] + "/l";
	});
});

$("#choose-remote-board").click(function() {
	localStorage.setItem("saved2-11Board", res_buffer.board);
	localStorage.setItem("savedCurr2-11Score", res_buffer.currentScore);
	localStorage.setItem("savedBest2-11Score", res_buffer.bestScore);

	window.location.href = window.location.href.split("/")[0] + "/l";
});