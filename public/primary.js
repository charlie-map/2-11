$("#new-game").click(function() {
	endGame = 0;
	opacityEndRoller = 60

	$("#current-score").text("0");

	setup();
});