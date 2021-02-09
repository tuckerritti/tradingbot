const http = require('http');

const axios = require('axios');
const express = require('express');
const Sentry = require('@sentry/node')
const bodyParser = require("body-parser");
const otpauth = require('otpauth');
const {v4: uuid} = require('uuid');

const robinhood = require('algotrader').Robinhood;
const User = robinhood.User;

const config = require('./config');

// Set up express
const app = express();

// Initialize Sentry
if (config.PRODUCTION) Sentry.init({dsn: config.SENTRY_DSN});

let totp = new otpauth.TOTP({
	issuer: 'Robinhood',
	label: 'Robinhood',
	algorithm: 'SHA1',
	digits: 6,
	period: 30,
	secret: config.OTP_CODE
});

const myUser = new User(config.USERNAME, config.PASSWORD, config.DEVICE_TOKEN, {
	doNotSaveToDisk: true,
	serializedUserFile: null
});

function getMFA() {
	return new Promise((resolve, reject) => {
		resolve(totp.generate());
	})
}

function authenticate(callback) {
	myUser.authenticate(config.PASSWORD, getMFA).then(() => {
		callback(null);
	}).catch(err => {
		callback(err);
	})
}

authenticate(function (err) {
	if (err) {
		console.error(err);
		process.exit(1)
	}
})

function truncate8(string) {
	return string.toString().match(/^-?\d+(?:\.\d{0,8})?/)[0]
}

function truncate2(string) {
	return string.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]
}

// Initialize bodyParser
app.use(bodyParser.json());

function set_balances(callback) {
	myUser.getBalances().then(result => { // Get buying power

		axios.get("https://nummus.robinhood.com/holdings/", {
			headers: {
				"Authorization": "Bearer " + myUser.getAuthToken()
			}
		}).then(holdings => {
			const btc_balance = holdings.data.results.find(e => e.currency.code === "BTC").quantity;

			axios.get("https://api.robinhood.com/marketdata/forex/quotes/BTCUSD/", {
				headers: {
					"Authorization": "Bearer " + myUser.getAuthToken()
				}
			}).then(price => {
				callback(null, result.buyingPower, btc_balance, price.data.mark_price);
			})
		}).catch(err => {
			callback(err);
		})
	}).catch(err => {
		callback(err);
	})
}


function discord_webhook(msg) {
	if (!config.DISCORD_WEBHOOK) return;

	axios.post(config.DISCORD_WEBHOOK, {
		content: msg
	})
}

app.post('/', (req, res, next) => {
	if (req.body.pass !== config.SHARED_SECRET) return res.status(401).send("401");

	// Set balances of accounts
	set_balances(function (err, usd_balance, btc_balance, btc_price) {
		if (err) {
			Sentry.captureException(err);
			console.error(err);
			return;
		}

		// Set type of order
		let type = (req.body.direction === 1) ? 'buy' : 'sell';

		// Make sure accounts have enough
		if ((type === "buy" && truncate2(usd_balance) > (config.INITIAL_INVESTMENT * 0.01)) || (type === "sell" && truncate8(btc_balance) > 0)) {
			let quantity;

			if (type === "buy") {
				let calculated_btc_price = btc_price * 1.01;

				quantity = usd_balance / calculated_btc_price;
			} else {
				quantity = btc_balance;
			}

			let data = {
				price: truncate2((type === "buy") ? btc_price * 1.01 : btc_price * 0.95),
				type: "market",
				time_in_force: "gtc",
				quantity: truncate8(quantity),
				side: type,
				currency_pair_id: "3d961844-d360-45fc-989b-f6fca761d511",
				ref_id: uuid()
			};

			axios.post("https://nummus.robinhood.com/orders/", JSON.stringify(data), {
				headers: {
					"Authorization": "Bearer " + myUser.getAuthToken(),
					"Content-Type": "application/json"
				}
			}).then(() => {
				let msg = "";
				msg += "--\n";
				msg += "Placed a " + type + " order for `" + truncate8((type === "buy") ? usd_balance / btc_price : btc_balance) + " BTC` at `" + truncate2(btc_price) + "`\n";
				if (type === "buy" ) msg += "\n";
				if (type === "buy" ) msg += "Current profit so far: `" + truncate2(usd_balance - config.INITIAL_INVESTMENT) + "`";

				discord_webhook(msg);
				console.log(msg);
			}).catch(err => {
				Sentry.captureException(err);
				console.error(err);
			})
		} else {
			let msg = "";
			msg += "--\n";
			msg += "Not enough funds to " + type + ".\n";
			msg += "USD Balance: `" + truncate2(usd_balance) + "`.\n";
			msg += "BTC Balance: `" + truncate8(btc_balance) + "`.";

			discord_webhook(msg);
			console.log(msg);
		}

		res.send("success");
	})
})

const server = http.createServer(app);

server.listen(config.PORT, function () {
	console.log("HTTP Server started on port " + config.PORT);
});