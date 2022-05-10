$(document).ready(function() {
	$("#gender").parent().css({
		"margin-top": -1 * $(".gender-noti").outerHeight()
	});

	let img_width = $("#nice-image").outerWidth();

	$(".gender-noti").outerWidth(img_width - 8);

	$(".gender-noti").offset({
		left: $("#nice-image").offset().left + 4,
		top: $("#gender").offset().top - 40
	});
});

window.resize = function() {
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
	$(".gender-noti").addClass("select");
	$("#password-container").addClass("select");
});

$("#gender").focusout(function() {
	$(".gender-noti").removeClass("select");
	$("#password-container").removeClass("select");
});

$(".gender-pick").click(function() {
	$("#gender").attr("value", $(this).attr("value"));
	$("#gender").addClass("is-clear");
});

$("#register").click(function() {

});