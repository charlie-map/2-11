
function LeaderboardPositionCheck() {
    let leaderboardEntries = $("#leaderboard").children().length;

    $(".ultra-meta-leaderboard-holder").css({
        position: "relative",
        left: "0px",
        "border-bottom": leaderboardEntries > 4 ? "solid 1px grey" : "none"
    });

    $(".meta-leaderboard-holder").css({
        width: "100%",
        "margin-left": "-34px",
        height: 62 * leaderboardEntries + (leaderboardEntries > 0 ? 102 : 0) + "px",
    });
    $("#leaderboard").css({
        height: 62 * leaderboardEntries + "px",
        top: "60px",
        "padding-left": "100px",
        width: "100%"
        // "padding-bottom": leaderboardEntries > 1 ? "34px" : "0px"
    });

    $("#page-body").after($(".ultra-meta-leaderboard-holder"));

    $(".leaderboard-entry").addClass("in-frame");
    $("#leaderboard").last().css({
        "margin-bottom": "0 !important"
    })
    $(".user-personal-low").css({
        "margin-top": "6px",
        "padding-left": "34px",
        width: $($(".leaderboard-entry")[0]).outerWidth(false)
    });
}

$(document).ready(function () {
    if ($(".dropdown-noti").hasClass("logged-in-box"))
        setTimeout(function () {
            $(".dropdown-noti").addClass("slide-out");
        }, 4800);


    $("body").css("height", $("#all-content").outerHeight());

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
                LeaderboardPositionCheck();
                LEADERBOARD_USERS = res.users;
            },

            failure: Meta.GetGenericError
        });

        $(".leaderboard-entry-username").click(Meta.BuildProfile);

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

        setTimeout(function (animation_data) {
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


let stillChangingLeaderboard = 0;
// boardClose: decide if leaderboard-property-choice-hider should close
async function leaderboardCreate(Lboard, boardClose) {
    if ($(Lboard).hasClass("open")) {
        if (postMoveSync.length)
            await SyncMoves();

        $(Lboard).find("rect").attr("fill", $(Lboard).hasClass("darkmode") ? "#37243d" : "#ddcee2");
        $(".user-personal-low").addClass("fade-in");
        if ($("body").outerWidth(false) < 1225)
            LeaderboardPositionCheck(1);

        stillChangingLeaderboard = 1;
        Meta.xhr.send({
            type: "GET",
            url: "/updated-leaderboard",

            responseHandle: Meta.xhr.responseJSON,
            success: res => {
                LEADERBOARD_USERS = res.leaderboardIndex;

                if (boardClose) {
                    $(".leaderboard-property-choice-hider").addClass("open");

                    $(".leaderboard-scrollbar").show();
                }

                if (res.lowUser) {
                    $(".user-personal-low").find(".leaderboard-entry-rank").text(res.lowUser.rank);
                    $(".user-personal-low").find(".leaderboard-entry-score").text(res.lowUser.score);
                } else
                    $(".user-personal-low").removeClass("fade-in");

                for (let i = 0; i < LEADERBOARD_USERS.length; i++) {
                    setTimeout(function (in_dat) {
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
                            setTimeout(function () {
                                isInLeaderboardFrame();

                                $(".leaderboard-scrollbar-position").css({
                                    height: "calc(100% * " + ($("#leaderboard").outerHeight(false) / $("#leaderboard").prop("scrollHeight")) + ")"
                                });

                                $(".leaderboard-entry-username").click(Meta.BuildProfile);

                                stillChangingLeaderboard = 0;
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
        stillChangingLeaderboard = 1;

        $(Lboard).find("rect").attr("fill", $(Lboard).hasClass("darkmode") ? "#37243d" : "#ddcee2");
        $(".user-personal-low").removeClass("fade-in");
        if (boardClose) {
            $(Lboard).find("rect").attr("fill", "none");
            $(".leaderboard-property-choice-hider").removeClass("open");
        }

        let delete_child = $("#leaderboard").children("div");

        for (let i = delete_child.length - 1; i >= 0; i--) {
            setTimeout(function (e) {
                $(e).removeClass("fade-in");
                $(e).addClass("fade-out");

                setTimeout(function (e) {
                    $(e).remove();

                    if ($("body").outerWidth(false) < 1225) {
                        LeaderboardPositionCheck(0);
                    }
                }, 800, e);
            }, map(i, delete_child.length - 1, 0, 0, delete_child.length - 1) * 60, $(delete_child[i]));

            if (i == 0) setTimeout(function () {
                stillChangingLeaderboard = 0;
            }, 800);
        }

        Meta.xhr.send({
            type: "GET",
            url: "/toggle-leaderboard/0"
        });
    }
}


$(".leaderboard-property-choices").mouseenter(function () {
    $("body").off("click", leaderboardCloser);
}).mouseleave(function () {
    if ($(".leaderboard-property-choices").hasClass("select"))
        $("body").on("click", leaderboardCloser);
});

$(".leaderboard-current-property").click(function () {
    $(".leaderboard-property-choices").toggleClass("select");
    if ($(".leaderboard-property-choices").hasClass("select")) {
        $(".dropdown-property-choice").addClass("open");

        setTimeout(function () {
            $("body").on("click", leaderboardCloser);
        }, 100);
    } else {
        $(".dropdown-property-choice").removeClass("open");

        $("body").off("click", leaderboardCloser);
    }
});

$(".leaderboard-pick").click(async function () {
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

                setTimeout(function () {
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

$(".meta-leaderboard-holder").scroll(function () {
    isInLeaderboardFrame();
});
