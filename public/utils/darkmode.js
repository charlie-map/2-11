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
		.leaderboard-entry-rank, .profile`).addClass("darkmode");
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

    // Buttons or links
    $("button, a, #page-meta-link-back").addClass("darkmode");

    if ($(".leaderboard-tab").hasClass("open")) {
        $(".leaderboard-tab rect").attr("fill", "#37243d");
    }
}

function darkmodeOff() {
    $(`body, .user-column, .column-tab.leaderboard-tab,
		.leaderboard-current-property, .leaderboard-shown-property,
		.dropdown-property-choice, .leaderboard-property-choice-hider,
		.leaderboard-property-choices, .ultra-meta-leaderboard-holder,
		.leaderboard-entry-rank, .profile`).removeClass("darkmode");

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
