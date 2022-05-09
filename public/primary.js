$("#new-game").click(function() {
	metaPoints = 0, points = 0;
	endGame = 0;
	opacityEndRoller = 60

	$("#new-game").text("New game");

	$("#current-score").text("0");

	setup(1);
});

window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);

$("#go-to-title").click(function(e) {
	e.preventDefault();

	$("html, body").animate({ scrollTop: -200 }, "slow");
});

$("#go-to-how-to").click(function(e) {
	e.preventDefault();

	$("html, body").animate({ scrollTop: $(document).height() }, "slow");
});

$("#gender").focus(function() {
	let img_width = $("#nice-image").outerWidth();

	$(".gender-noti").outerWidth(img_width);
	$(".gender-noti").addClass("select");
	$("#password-container").addClass("select");

	$(".gender-noti").offset({
		left: $("#nice-image").offset().left,
		top: $("#gender").offset().top
	});
});

$("#gender").focusout(function() {
	$(".gender-noti").removeClass("select");
	$("#password-container").removeClass("select");
});