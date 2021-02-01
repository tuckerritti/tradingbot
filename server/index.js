const http = require('http');

const axios = require('axios');
const express = require('express');
const Sentry = require('@sentry/node')
const {CoinbasePro} = require('coinbase-pro-node');
const bodyParser = require("body-parser");

const config = require('./config');

// Set up express
const app = express();

// Set up coinbase pro
const client = new CoinbasePro({
	apiKey: config.API_KEY,
	apiSecret: config.API_SECRET,
	passphrase: config.PASSPHRASE,
	useSandbox: true
});

// Initialize Sentry
if (config.PRODUCTION) Sentry.init({dsn: config.SENTRY_DSN});

// Initialize bodyParser
app.use(bodyParser.json());

// Set ids
let btc_id;
let usd_id;
client.rest.account.listAccounts().then(result => {
	btc_id = result.find(e => e.currency === "BTC").id;
	usd_id = result.find(e => e.currency === "USD").id;

	set_balances(function () {});
})

let btc_balance;
let usd_balance;
function set_balances(callback) {
	let count = 0;
	let error = false;

	client.rest.account.getAccount(btc_id).then(result => {
		btc_balance = parseFloat(result.balance);

		get_callback();
	}).catch(err => {
		get_callback(err);
	})

	client.rest.account.getAccount(usd_id).then(result => {
		usd_balance = parseFloat(result.balance).toFixed(2);

		get_callback();
	}).catch(err => {
		get_callback(err)
	})

	function get_callback(err) {
		count++;

		if (!error && err) {
			error = true;
			callback(err);
		} else if (!error && count === 2) {
			callback(null)
		}
	}
}

function discord_webhook(msg) {
	axios.post('https://discord.com/api/webhooks/805682700752519178/SxmRyFldwtWcD7tmCktOCya8TUy7ZmnKTprKseP_33dLSNU0biQN44qLP3NCkymf2PhO', {
		content: msg
	})
}

const validIps = ["52.89.214.238", "34.212.75.30", "54.218.53.128", "52.32.178.7"];
app.post('/', (req, res, next) => {
	if (!validIps.includes(req.ip) && config.PRODUCTION) return res.status(401);

	set_balances(function (err) {
		if (err) {
			Sentry.captureException(err);
			console.error(err);
			return;
		}

		let type = (req.body.direction === 1) ? 'buy' : 'sell';

		if ((type === "buy" && usd_balance > 0) || (type === "sell" && btc_balance > 0)) {
			client.rest.order.placeOrder({
				type: 'market',
				side: type,
				product_id: 'BTC-USD',
				size: (type === "sell") ? btc_balance : null,
				funds: (type === "buy") ? usd_balance : null
			}).then(response => {
				let msg = "--";
				msg += "Ordered a " + type + " order for " + ((type === "buy") ? usd_balance : btc_balance) + ((type === "buy") ? " $" : " BTC") + "\n";
				if (type === "buy") msg += "\nCurrent Profit so far: `" + (usd_balance - config.INITIAL_INVESTMENT);

				discord_webhook(msg)
				console.log(msg);
			}).catch(err => {
				Sentry.captureException(err);
				console.error(err);
			})
		} else {
			let msg = "--";
			msg += "Not enough funds to " + type + ".\n";
			msg += "BTC Balance: " + btc_balance + "\n";
			msg += "USD Balance: " + usd_balance;

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