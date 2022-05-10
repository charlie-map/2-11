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

	$("#birthday").focus();
});

$("#email").on('input', function() {
	if (logging_in)
		return;

	$.get("/available/email/" + this.value, (res) => {
		if (res == "0") { // username taken

		} else { // username not taken

		}
	});
});

$("#username").on('input', function() {
	if (logging_in)
		return;

	$.get("/available/username/" + this.value, (res) => {
		if (res == "0") { // username taken

		} else { // username not taken

		}
	});
});

function invalidate(el) {
	$(el).parent().addClass("invalid");
}

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

		console.log(username_or_email, password);
		$.post("/login", {
			username_email: username_or_email,
			password
		}, (res) => {

		});
	} else {
		let invalids = 0;

		let email = $("#email").val();
		if (!email.length) {
			invalids++;
			invalidate($("#email"));
		}

		let username = $("#username").val();
		if (!username.length) {
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

		console.log(email, username, password, gender, birthday);
		$.post("/signup", {
			email,
			username,
			password,
			gender,
			birthday
		}, (res) => {

		});
	}
});