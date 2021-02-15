const http = require('http');

const express = require('express');
const Sentry = require('@sentry/node')
const bodyParser = require("body-parser");

const robinhood = require('./robinhood');
const simulated = require('./simulated');
const config = require('./config');

// Set up express
const app = express();

// Initialize Sentry
if (config.PRODUCTION) Sentry.init({dsn: config.SENTRY_DSN});

// Initialize bodyParser
app.use(bodyParser.json());

app.post('/', (req, res, next) => {
	if (req.body.pass !== config.SHARED_SECRET) return res.status(401).send("401");

	let type = (req.body.direction === 1) ? 'buy' : 'sell';

		robinhood.handleSignal(type, function (err, btc_price) {
			if (err) {
				Sentry.captureException(err);
				console.error(err);
				return;
			}

			simulated.handleSignal(type, btc_price, function (err) {
				if (err) {
					Sentry.captureException(err);
					console.error(err);
					return;
				}

				res.send("success");
			});
		});
})

const server = http.createServer(app);

server.listen(config.PORT, function () {
	console.log("HTTP Server started on port " + config.PORT);
});