const http = require("http");

const express = require("express");
const Sentry = require("@sentry/node")
const bodyParser = require("body-parser");

const robinhood = require("./robinhood");
const simulated = require("./simulated");
const coinbase = require("./coinbase");
const config = require("./config");

// Set up express
const app = express();

// Initialize Sentry
if (config.PRODUCTION) Sentry.init({dsn: config.SENTRY_DSN});

// Initialize bodyParser
app.use(bodyParser.json());

app.post('/', (req, res, next) => {
	if (req.body.pass !== config.SHARED_SECRET) return res.status(401).send("401");

	let type = (req.body.direction === 1) ? "buy" : "sell";

	if (config.ROBINHOOD_ENABLED === "true") {
		robinhood.handleSignal(type, function (err) {
			if (err) {
				Sentry.captureException(err);
				console.error(err);
			}
		});
	}

	if (config.SIMULATED_ENABLED === "true") {
		simulated.handleSignal(type, function (err) {
			if (err) {
				Sentry.captureException(err);
				console.error(err);
			}
		});
	}

	if (config.COINBASE_ENABLED === "true") {
		coinbase.handleSignal(type, function (err) {
			if (err) {
				if (err.response?.status === 400) {
					const error = JSON.stringify(err.response.data);

					console.error(error);
					Sentry.captureException(error);
					return;
				} else {
					console.error(err);
					Sentry.captureException(err);
					return;
				}
			}

			res.send("success");
		})
	}
})

const server = http.createServer(app);

server.listen(config.PORT, function () {
	console.log("HTTP Server started on port " + config.PORT);
});