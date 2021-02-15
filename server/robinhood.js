const axios = require('axios');
const {v4: uuid} = require('uuid');
const User = require('algotrader').Robinhood.User;

const lib = require('./lib');
const config = require('./config');

function discord_webhook(type, quantity, btc_balance, usd_balance, btc_price, btc_buffer) {
	if (!config.ROBINHOOD_DISCORD_WEBHOOK) return;

	const currency = (type === "buy") ? "USD" : "BTC";

	let msg = "";
	msg += "--\n";
	msg += `Placed a ${type} order for ${quantity} ${currency}\n`;
	msg += "\n";
	msg += `BTC Price: ${btc_price}\n`;
	msg += `BTC Buffer Price: ${btc_buffer}\n`;
	msg += `BTC Balance: ${btc_balance}\n`;
	msg += `USD Balance: ${usd_balance}\n`;

	axios.post(config.ROBINHOOD_DISCORD_WEBHOOK, {
		content: msg
	})
}

const myUser = new User(config.USERNAME, config.PASSWORD, config.DEVICE_TOKEN, {
	doNotSaveToDisk: true,
	serializedUserFile: null
});

function getMFA() {
	return new Promise((resolve) => {
		resolve(lib.getOTPCode());
	})
}

function authenticate(callback) {
	myUser.authenticate(config.PASSWORD, getMFA).then(() => {
		callback(null);
	}).catch(err => {
		callback(err);
	})
}

// Authenticate with robinhood
authenticate(function (err) {
	if (err) {
		console.error(err);
		process.exit(1)
	}
})

/**
 * Get balances of balances
 *
 * @param {function} callback Balance callback
 */
function get_balances(callback) {
	myUser.getBalances().then(result => { // Get buying power
		const buyingPower = lib.truncate2(result.buyingPower);

		axios.get("https://nummus.robinhood.com/holdings/", {
			headers: {
				"Authorization": "Bearer " + myUser.getAuthToken()
			}
		}).then(holdings => {
			const btc_balance = lib.truncate8(holdings.data.results.find(e => e.currency.code === "BTC").quantity);

			axios.get("https://api.robinhood.com/marketdata/forex/quotes/BTCUSD/", {
				headers: {
					"Authorization": "Bearer " + myUser.getAuthToken()
				}
			}).then(result => {
				const btc_price = lib.truncate2(result.data.mark_price);

				callback(null, buyingPower, btc_balance, btc_price);
			})
		}).catch(err => {
			callback(err);
		})
	}).catch(err => {
		callback(err);
	})
}

function create_order(order, callback) {
	axios.post("https://nummus.robinhood.com/orders/", JSON.stringify(order), {
		headers: {
			"Authorization": "Bearer " + myUser.getAuthToken(),
			"Content-Type": "application/json"
		}
	}).then(() => {
		callback(null);
	}).catch(err => {
		callback(err);
	})
}

exports.handleSignal = function (type, callback) {
	get_balances(function (err, usd_balance, btc_balance, btc_price) {
		if (err) return callback(err);

		let enough_balance = false;

		// On buy order, buy all except for buffer
		if (type === "buy" && (usd_balance > (usd_balance * 0.01))) enough_balance = true;

		// On sell order, sell all bitcoin
		if (type === "sell" && lib.truncate8(btc_balance) > 0) enough_balance = true;

		let order = {
			type: "market",
			time_in_force: "gtc",
			currency_pair_id: "3d961844-d360-45fc-989b-f6fca761d511",
			ref_id: uuid()
		}

		if (enough_balance && type === "buy") {
			// Set bitcoin's price with a 1% increase as a buffer
			order.price = lib.truncate2(btc_price * 1.01);

			// Buy the maximum amount of bitcoin possible with the buffer
			order.quantity = lib.truncate8(usd_balance / order.price);

			// Set order type
			order.side = "buy";
		} else if (enough_balance && type === "sell") {
			// Set bitcoin's price with a 5% decrease as a buffer
			order.price = lib.truncate2(btc_price * 0.95);

			// Sell the maximum amount of bitcoin
			order.quantity = lib.truncate8(btc_balance);

			// Set order type
			order.side = "sell";
		} else {
			callback(null);
			return;
		}

		create_order(order, function (err) {
			if (err) return callback(err);

			discord_webhook(type, order.quantity, btc_balance, usd_balance, btc_price, order.price);
			callback(null);
		})
	})
}