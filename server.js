const express = require('express');
const mustache = require('mustache-express');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
	extended: false
}));

app.set('views', __dirname + "/views");
app.set('view engine', 'mustache');
app.engine('mustache', mustache());

app.get("/", (req, res) => {
	res.render("index");
});

app.listen("2048", () => {
	console.log("server go vroom");
});