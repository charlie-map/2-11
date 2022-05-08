$("#new-game").click(function() {
	metaPoints = 0, points = 0;
	endGame = 0;
	opacityEndRoller = 60

	$("#current-score").text("0");

	setup();
});