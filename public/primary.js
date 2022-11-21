let LEADERBOARD_USERS;
// isOpening: decides whether "in-frame" should be added
// 1 for adding "in-frame" class
// 0 for not adding "in-frame" class
function LeaderboardPositionCheck(isOpening) {
	let bodyWidth = $("body").outerWidth(false);

	if (bodyWidth < 1225) {
		let leaderboardEntries = $("#leaderboard").children().length;

		$(".ultra-meta-leaderboard-holder").css({
			position: "relative",
			left: "0px",
			"border-bottom": leaderboardEntries > 4 ? "solid 1px grey" : "none"
		});

		$(".meta-leaderboard-holder").css({
			width: "calc(100% + 34px)",
			"margin-left": "-34px",
			height: 52 * leaderboardEntries + (leaderboardEntries > 0 ? 102 : 0) + "px",
			"max-height": "246px"
		});
		$("#leaderboard").css({
			height: 52 * leaderboardEntries + "px",
			top: "34px",
			"padding-left": "68px",
			width: "400px"
			// "padding-bottom": leaderboardEntries > 1 ? "34px" : "0px"
		});

		if (!isOpening) {
			$("#how-to-play").css({
				"margin-top": (leaderboardEntries < 4 ? "-68px" : "0px")
			});

			return;
		}

		$("#page-body").after($(".ultra-meta-leaderboard-holder"));

		$(".leaderboard-entry").addClass("in-frame");
		$("#how-to-play").css({
			"margin-top": (leaderboardEntries < 4 ? "-68px" : "0px")
		});

		$($("#how-to-play").children("p")[0]).css({
			"margin-top": "0px"
		});
		$("#leaderboard").last().css({ "margin-bottom": "0 !important" })
		$(".user-personal-low").css({
			"margin-top": "6px",
			"padding-left": "34px",
			width: $($(".leaderboard-entry")[0]).outerWidth(false)
		});
	} else {
		$(".ultra-meta-leaderboard-holder").removeAttr("style");
		$(".meta-leaderboard-holder").removeAttr("style");
		$("#leaderboard").removeAttr("style");

		$("#how-to-play").css({
			"margin-top": "0px"
		});

		$(".user-personal-low").removeAttr("style");

		$(".leaderboard-property-choices").after($(".ultra-meta-leaderboard-holder"));

		let set_width = $(document).outerWidth(false) - 460;
		set_width = set_width > 400 ? 400 : set_width;
		$("#leaderboard").css({
			width: set_width
		});
		$(".user-personal-low").css({
			width: set_width - 8
		});
		$(".meta-leaderboard-holder").css({
			width: $(document).outerWidth(false)
		});
		$(".ultra-meta-leaderboard-holder").css({
			left: "calc(50% + " + (300 * 0.5) + "px)"
		});

		let user_column_left = $(document).outerWidth(false) * 0.5 - 230;
		$(".user-column").css({
			left: user_column_left - $(".user-column").outerWidth(false)
		});
	}
}

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
			if (darkmode) {
				darkmodeOn();
				if (!$(".switch").is(":checked"))
					$(".switch").click();
			} else {
				darkmodeOff();
				if ($(".switch").is(":checked"))
					$(".switch").click();
			}

			Meta.xhr.send({
				type: "GET",
				url: "/updated-leaderboard",

				responseHandle: Meta.xhr.responseJSON,

				success: res => {
					let set_width = $(document).outerWidth(false) - 460;
					set_width = set_width > 400 ? 400 : set_width;
					$("#leaderboard").css({
						width: set_width
					});
					$(".user-personal-low").css({
						width: set_width - 8
					});
					$(".meta-leaderboard-holder").css({
						width: $(document).outerWidth(false)
					});
					$(".ultra-meta-leaderboard-holder").css({
						left: "calc(50% + " + (300 * 0.5) + "px)"
					});

					if (!wantsLeaderboardOpen) {
						$("#leaderboard").html("");
						$(".leaderboard-scrollbar").hide();
					} else {
						$(".leaderboard-entry").addClass("fade-in");
						$(".leaderboard-tab").addClass("open");
						$(".leaderboard-tab").find("rect").attr("fill", "#ddcee2");
						$(".user-personal-low").addClass("fade-in");

						let normalHeight = 19;
						let checkHeight = $("#leaderboard-shown-property").outerHeight(false);

						if (checkHeight > normalHeight) {
							$(".leaderboard-property-choice-hider").addClass("large");
						}

						$(".leaderboard-tab rect").attr("fill", darkmode ? "#37243d" : "#ddcee2");
					}

					isInLeaderboardFrame();
					LeaderboardPositionCheck(1);
					LEADERBOARD_USERS = res.users;
				}
			})

			let user_column_left = $(document).outerWidth(false) * 0.5 - 230;
			$(".user-column").css({
				left: user_column_left - $(".user-column").outerWidth(false)
			});

			$(".leaderboard-property-choices").css({
				"margin-bottom": -1 * $(".leaderboard-property-choices").outerHeight(false)
			});

			$(".leaderboard-property-choices").outerWidth(400);
			$(".leaderboard-property-choices").offset({
				left: $(".leaderboard-current-property").offset().left + 113,
				top: $(".leaderboard-current-property").offset().top
			});
		}

		return;
	} else
		$("#email").focus();
});

window.onresize = function() {
	if (loggedIn) {
		let set_width = $(document).outerWidth(false) - 460;
		set_width = set_width > 400 ? 400 : set_width;
		$("#leaderboard").css({
			width: set_width
		});
		$(".leaderboard-scrollbar-position").css({
			height: "calc(100% * " + ($("#leaderboard").outerHeight(false) / $("#leaderboard").prop("scrollHeight")) + ")"
		});
		$(".meta-leaderboard-holder").css({
			width: $(window).outerWidth(false),
			left: "calc(50% + " + (300 * 0.5) + "px)"
		});
		LeaderboardPositionCheck(1);
		isInLeaderboardFrame();

		let user_column_left = $(document).outerWidth(false) * 0.5 - 230;
		$(".user-column").css({
			left: user_column_left - $(".user-column").outerWidth(false)
		});

		$(".leaderboard-property-choices").css({
			"margin-bottom": -1 * $(".leaderboard-property-choices").outerHeight(false)
		});

		$(".leaderboard-property-choices").outerWidth(400);
		$(".leaderboard-property-choices").offset({
			left: $(".leaderboard-current-property").offset().left + 113,
			top: $(".leaderboard-current-property").offset().top
		});
	}

	if (logging_in == undefined || logging_in)
		return;
}

function darkmodeOn() {
	/*
		body
		.user-column
		.column-tab.leaderboard-tab
		.leaderboard-current-property
		.leaderboard-shown-property
		.dropdown-property-choice
		.leaderboard-property-choice-hider
	*/
	$(`body, .user-column, .column-tab.leaderboard-tab,
		.leaderboard-current-property, .leaderboard-shown-property,
		.dropdown-property-choice, .leaderboard-property-choice-hider,
		.leaderboard-property-choices, .ultra-meta-leaderboard-holder,
		.leaderboard-entry-rank`).addClass("darkmode");
	/*
		#column-best-square
		.best-sq-descript
		.best-num
		.column-tab.current-streak
		.current-streak-descript
		.curr-streak
	*/
	$(`#column-best-square, .best-sq-descript, .best-num, .column-tab.current-streak,
		.current-streak-descript, .curr-streak`).addClass("darkmode");
	/*
		.darkmode-status
		.active-darkmode
		.darkmode-wrapper
	*/
	$(`.darkmode-status, .active-darkmode, .darkmode-wrapper`).addClass("darkmode");
	/*
		.dropdown-noti

		#page-meta-info

		#new-game
		#how-to-play

		#go-to-title
	*/
	$(`.dropdown-noti, #page-meta-info, #new-game, #how-to-play, #go-to-how-to,
		#go-to-title, .final-tag a`).addClass("darkmode");

	$(".leaderboard-entry-rank").addClass("darkmode");

	if ($(".leaderboard-tab").hasClass("open")) {
		$(".leaderboard-tab rect").attr("fill", "#37243d");
	}
}

function darkmodeOff() {
	$(`body, .user-column, .column-tab.leaderboard-tab,
		.leaderboard-current-property, .leaderboard-shown-property,
		.dropdown-property-choice, .leaderboard-property-choice-hider,
		.leaderboard-property-choices, .ultra-meta-leaderboard-holder,
		.leaderboard-entry-rank`).removeClass("darkmode");

	$(`#column-best-square, .best-sq-descript, .best-num, .column-tab.current-streak,
		.current-streak-descript, .curr-streak`).removeClass("darkmode");

	$(`.darkmode-status, .active-darkmode, .darkmode-wrapper`).removeClass("darkmode");

	$(`.dropdown-noti, #page-meta-info, #new-game, #how-to-play, #go-to-how-to,
		#go-to-title, .final-tag a`).removeClass("darkmode");

	$(".leaderboard-entry-rank").removeClass("darkmode");

	if ($(".leaderboard-tab").hasClass("open")) {
		$(".leaderboard-tab rect").attr("fill", "#ddcee2");
	}
}

$(".switch").click(function() {
	$(".active-darkmode").text($(this).is(":checked") ? "on" : "off");

	let checked = $(this).is(":checked");
	if (checked) {
		darkmodeOn();
	} else {
		darkmodeOff();
	}

	Meta.xhr.send({
		type: "GET",
		url: "/darkmode" + (checked ? 1 : 0)
	});
});

$("#new-game").click(async function() {
	if (endGame == 0 && postMoveSync.length)
		await SyncMoves();

	Meta.xhr.send({
		type: "POST",
		url: "/game-over",

		data: JSON.stringify({ killerPiece: 0 }),
		headers: {
			"Content-Type": "application/json"
		}
	});

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
	let personal_user_rank = parseInt($(personal_user).children(".leaderboard-entry-rank") ?
		$(personal_user).children(".leaderboard-entry-rank").text() : 0, 10)

	if (personal_user_rank > 20) { // extended position, replace bottom of leaderboard
		$("#leaderboard .leaderboard-entry:last-child").find(".leaderboard-entry-score").text(newMetaPoints);
		$("#leaderboard .leaderboard-entry:last-child").find(".leaderboard-entry-username").html($(personal_user).find(".leaderboard-entry-username").html());
	
		$(personal_user).remove();
		personal_user = $("#leaderboard .leaderboard-entry:last-child");
		$(personal_user).find(".leaderboard-entry-score").addClass("personal-user-points");
	}

	let upper_sibling_check = $(personal_user).prev();
	let sib_to_switch = null;
	let number_of_spaces = 0;
	while (!$(upper_sibling_check).is(personal_user) && upper_sibling_check && upper_sibling_check.length) {
		if (parseInt($(upper_sibling_check).find(".leaderboard-entry-score").text(), 10) >= newMetaPoints) {
			number_of_spaces++;
			break;
		}

		sib_to_switch = upper_sibling_check;
		upper_sibling_check = $(upper_sibling_check).is(":first-child") ? null : $(upper_sibling_check).prev();
		number_of_spaces++;
	}

	if (sib_to_switch) {
		$(sib_to_switch).css("z-index", 1);
		$(sib_to_switch).addClass("swapping");
		$(sib_to_switch).addClass("in-frame");
		$(personal_user).css("z-index", 2);
		$(personal_user).addClass("swapping");
		$(personal_user).addClass("in-frame");

		let space_diff = $(personal_user).offset().top - $(sib_to_switch).offset().top;

		$(personal_user).css({
			"margin-top": -1 * (space_diff + (space_diff / number_of_spaces)),
			"margin-bottom": space_diff
		});
		$(sib_to_switch).css({
			"margin-top": space_diff / number_of_spaces
		});

		setTimeout(function(animation_data) {
			$(animation_data[0]).removeClass("swapping");
			$(animation_data[1]).removeClass("swapping");

			$(animation_data[0]).css({
				"margin-top": 0,
				"margin-bottom": "8px"
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

			activelyMovingLeaderboardRank = 0;

			isInLeaderboardFrame();
		}, 800, [personal_user, sib_to_switch]);
	} else
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

let logging_in_prev_username = "";
let logging_in_prev_password = "";

$("#username").focus(function() {
	if ($("#username").parent().hasClass("invalid") && logging_in) {
		logging_in_prev_username = $("#username").val();
	}

	$("#username").removeClass("taken");
	$("#username-taken").removeClass("is-taken");
	$("#username-email-unknown").removeClass("is-taken");
});

$("#password").focus(function() {
	if ($("#password").parent().hasClass("invalid") && logging_in) {
		logging_in_prev_password = $("#password").val();
	}
});

$("#username").focusout(function() {
	let username = $("#username").val();

	if (logging_in) {
		if (logging_in_prev_username.length && logging_in_prev_username == username) {
			invalidate($("#username"));
			$("#username-email-unknown").addClass("is-taken");
		} else if (logging_in_prev_password.length && logging_in_prev_password == $("#password").val()) {
			invalidate($("#password"));
			$("#login-password-invalid").addClass("is-taken");
		}

		return;
	}

	if (!username.length)
		return;

	if (username.includes("@")) {
		$("#username-taken").html("no @ in username");
		$("#username-taken").addClass("is-taken");
		invalidate($("#username"));

		return;
	}

	Meta.xhr.send({
		type: "GET",
		url: "/username-available/" + username,

		success: res => {
			if (res == "0") { // username taken
				invalidate($("#username"));
	
				$("#username-taken").html("taken");
				$("#username-taken").addClass("is-taken");
				$("#username").addClass("taken");
			} else {
				$("#username-taken").removeClass("is-taken");
				$("#username").removeClass("taken");
			}
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

	Meta.xhr.send({
		type: "GET",
		url: "/email-available/" + email,

		success: res => {
			if (res == "0") { // email taken
				invalidate($("#email"));
	
				$("#email-taken").addClass("is-taken");
				$("#email").addClass("taken");
			} else {
				$("#email-taken").removeClass("is-taken");
				$("#email").removeClass("taken");
			}
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
	let isDifferent = 0;
	let tilesBoard1 = 0, tilesBoard2 = 0;

	for (let x = 0; x < 4; x++) {
		if (!board1[x] && !board2[x])
			continue
		else if (board1[x]) {
			isDifferent = 1;
		} else if (board2[x]) {
			isDifferent = 1;
		}

		for (let y = 0; y < 4; y++) {
			if (board1[x] && board1[x][y] && board2[x] && board2[x][y]) {
				if (board1[x][y].num != board2[x][y].num)
					isDifferent = 1;
			} else if (board1[x] && board1[x][y]) {
				tilesBoard2++;
				isDifferent = 1;
			} else if (board2[x] && board2[x][y]) {
				tilesBoard1++;
				isDifferent = 1;
			}
		}
	}
	if (!tilesBoard1)
		return 0;
	else if (!tilesBoard2)
		return 0;

	return isDifferent;
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

		Meta.xhr.send({
			type: "POST",
			url: "/login",

			data: JSON.stringify({ username_email: username_or_email, password }),
			headers: {
				"Content-Type": "application/json"
			},

			responseHandle: Meta.xhr.responseJSON,
			success: res => {
				if (!res.success) {
					if (res == "1") { // invalid inputs
						let errorNumbers = res.split("-")[1];

						let errorNumberSplit = errorNumbers.split(",");
						let formInputs = {
							"0": $("#username"),
							"1": $("#password")
						}

						for (let i = 0; i < errorNumberSplit.length; i++) {
							invalidate(formInputs[errorNumberSplit[i]]);
						}
					} else if (res == "2") { // no user
						$("#username-email-unknown").addClass("is-taken");
						invalidate($("#username"));
					} else if (res == "3") { // incorrect password
						$("#login-password-invalid").addClass("is-taken");
						invalidate($("#password"));
					}
					// error
					return;
				}

				window.location.href = window.location.href.split("/")[0] + "/l";
			}
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

		if (invalids)
			return;

		Meta.xhr.send({
			type: "POST",
			url: "/signup",

			data: JSON.stringify({ email, username, password }),
			headers: {
				"Content-Type": "application/json"
			},

			responseHandle: Meta.xhr.responseJSON,
			success: res => {
				if (res.success) {
					window.location.href = window.location.href.split("/")[0] + "/l";

					return;
				}

				let errorNumbers = res.error.split("-")[1];

				let errorNumberSplit = errorNumbers.split(",");
				let formInputs = {
					"0": $("#email"),
					"1": $("#username"),
					"2": $("#password")
				}

				for (let i = 0; i < errorNumberSplit.length; i++) {
					invalidate(formInputs[errorNumberSplit[i]]);
				}
			}
		});
	}
});

// boardClose: decide if leaderboard-property-choice-hider should close
async function leaderboardCreate(Lboard, boardClose) {
	if ($(Lboard).hasClass("open")) {
		if (postMoveSync.length)
			await SyncMoves();

		$(Lboard).find("rect").attr("fill", $(Lboard).hasClass("darkmode") ? "#37243d" : "#ddcee2");
		$(".user-personal-low").addClass("fade-in");
		if ($("body").outerWidth(false) < 1225)
			LeaderboardPositionCheck(1);

		Meta.xhr.send({
			type: "GET",
			url: "/updated-leaderboard",

			responseHandle: Meta.xhr.responseJSON,
			success: res => {
				LEADERBOARD_USERS = res.leaderboardIndex;

				if (boardClose) {
					$(".leaderboard-property-choice-hider").addClass("open");
					$(".user-column").animate({
						height: "420px"
					}, 400);

					$(".leaderboard-scrollbar").show();
				}

				if (res.lowUser) {
					$(".user-personal-low").find(".leaderboard-entry-rank").text(res.lowUser.rank);
					$(".user-personal-low").find(".leaderboard-entry-score").text(res.lowUser.score);
				} else
					$(".user-personal-low").removeClass("fade-in");

				for (let i = 0; i < LEADERBOARD_USERS.length; i++) {
					setTimeout(function(in_dat) {
						let e = in_dat[0];

						$("#leaderboard").append(`
						<div class="leaderboard-entry fade-in in-frame">
							<div class="leaderboard-entry-rank rank-color${e.rank}">${e.rank}</div>
							<div class="leaderboard-entry-meta">
								<div class="leaderboard-entry-username">${e.username}</div>
								<div class="leaderboard-entry-score ${e.personal_user ? e.personal_user : ""}">${e.score}</div>
							</div>
						</div>
						`);

						if (in_dat[1] == LEADERBOARD_USERS.length - 1) {
							setTimeout(function() {
								isInLeaderboardFrame();
								
								$(".leaderboard-scrollbar-position").css({
									height: "calc(100% * " + ($("#leaderboard").outerHeight(false) / $("#leaderboard").prop("scrollHeight")) + ")"
								});
							}, 800);
						}

						if ($("body").outerWidth(false) < 1225)
							LeaderboardPositionCheck(1);
					}, i * 40, [LEADERBOARD_USERS[i], i]);
				}
			}
		})

		Meta.xhr.send({
			type: "GET",
			url: "/toggle-leaderboard/1"
		});
	} else {
		$(Lboard).find("rect").attr("fill", $(Lboard).hasClass("darkmode") ? "#37243d" : "#ddcee2");
		$(".user-personal-low").removeClass("fade-in");
		if (boardClose) {
			$(Lboard).find("rect").attr("fill", "none");
			$(".leaderboard-property-choice-hider").removeClass("open");
			$(".user-column").animate({
				height: "390px"
			}, 400);
		}

		let delete_child = $("#leaderboard").children("div");

		for (let i = delete_child.length - 1; i >= 0; i--) {
			setTimeout(function(e) {
				$(e).removeClass("fade-in");
				$(e).addClass("fade-out");

				setTimeout(function(e) {
					$(e).remove();

					if ($("body").outerWidth(false) < 1225)
						LeaderboardPositionCheck(0);
				}, 800, e);
			}, map(i, delete_child.length - 1, 0, 0, delete_child.length - 1) * 60, $(delete_child[i]));
		}

		Meta.xhr.send({
			type: "GET",
			url: "/toggle-leaderboard/0"
		});
	}
}

$(".leaderboard-tab").click(function() {
	$(this).toggleClass("open");
	leaderboardCreate($(this), 1);
});

function profileCloser() {
	if ($(".user-modal").hasClass("open")) {
		$(".user-modal").removeClass("open");
		$(".profile").find("path").attr("fill", "none");

		$("body").off("click", profileCloser);
	}
}

$(".user-modal").mouseenter(function() {
	$("body").off("click", profileCloser);
}).mouseleave(function() {
	if ($(".user-modal").hasClass("open"))
		$("body").on("click", profileCloser);
});

$(".profile").click(function() {
	$(this).toggleClass("open");

	if ($(this).hasClass("open")) {
		$(this).find("path").attr("fill", "#ddcee2");
		$(".user-modal").addClass("open");

		setTimeout(function() {
			$("body").on("click", profileCloser);
		}, 100);
	} else {
		$(this).find("path").attr("fill", "none");
		$(".user-modal").removeClass("open");

		$("body").off("click", profileCloser);
	}
});

function leaderboardCloser() {
	if ($(".leaderboard-property-choices").hasClass("select")) {
		$(".leaderboard-property-choices").removeClass("select");
		$(".dropdown-property-choice").removeClass("open");

		$("body").off("click", leaderboardCloser);
	}
}

$(".leaderboard-property-choices").mouseenter(function() {
	$("body").off("click", leaderboardCloser);
}).mouseleave(function() {
	if ($(".leaderboard-property-choices").hasClass("select"))
		$("body").on("click", leaderboardCloser);
});

$(".leaderboard-current-property").click(function() {
	$(".leaderboard-property-choices").toggleClass("select");
	if ($(".leaderboard-property-choices").hasClass("select")) {
		$(".dropdown-property-choice").addClass("open");

		setTimeout(function() {
			$("body").on("click", leaderboardCloser);
		}, 100);
	} else {
		$(".dropdown-property-choice").removeClass("open");

		$("body").off("click", leaderboardCloser);
	}
});

$(".leaderboard-pick").click(async function() {
	if ($(this).text() == $("#leaderboard-shown-property").text()) {
		$(".leaderboard-property-choices").removeClass("select");
		$(".dropdown-property-choice").removeClass("open");

		$("body").off("click", leaderboardCloser);

		return;
	}
	let leaderboardProperty = $(this).attr("lead-prop");

	if (postMoveSync.length) {
		await SyncMoves();
	}

	Meta.xhr.send({
		type: "GET",
		url: "/leaderboard-property/" + leaderboardProperty,

		success: res => {
			if (res == "1")
				return;

			activeLeaderboardProperty = res.split("-")[1];

			$("#leaderboard-shown-property").text(activeLeaderboardProperty);
			let normalHeight = 19;
			let checkHeight = $("#leaderboard-shown-property").outerHeight(false);

			if (checkHeight > normalHeight) {
				$(".leaderboard-property-choice-hider").addClass("large");
			} else
				$(".leaderboard-property-choice-hider").removeClass("large");

			let lTab = $(".leaderboard-tab");
			if ($(lTab).hasClass("open")) {
				$(lTab).removeClass("open")
				leaderboardCreate(lTab, 0);

				setTimeout(function() {
					$(lTab).addClass("open");
					leaderboardCreate(lTab, 0);
				}, 800);
			} else
				leaderboardCreate(lTab);

			$(".leaderboard-property-choices").removeClass("select");
			$(".dropdown-property-choice").removeClass("open");

			$("body").off("click", leaderboardCloser);
		}
	});
});

/* LEADERBOARD SCROLL */
function isScrolledIntoView(elem) {
	var docViewTop = $(window).scrollTop();
	var docViewBottom = docViewTop + $(".meta-leaderboard-holder").height();

	var elemTop = $(elem).offset().top;
	var elemBottom = elemTop + $(elem).height();

	return (elemBottom <= docViewBottom) && (elemTop >= docViewTop + ($(window).outerHeight(false) * 0.1));
}

function isInLeaderboardFrame() {
	if ($("body").outerWidth(false) < 1225)
		return;

	let leaderboardGroup = $("#leaderboard").children();

	for (let i = 0; i < leaderboardGroup.length; i++) {
		if (isScrolledIntoView($(leaderboardGroup[i])))
			$(leaderboardGroup[i]).addClass("in-frame");
		else {
			$(leaderboardGroup[i]).removeClass("in-frame");
			$(leaderboardGroup[i]).addClass("fade-out");
		}
	}
}

$(".meta-leaderboard-holder").scroll(function() {
	isInLeaderboardFrame();
});
