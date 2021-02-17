const axios = require('axios');
const {CoinbasePro} = require('coinbase-pro-node');

const lib = require('./lib');
const config = require('./config');

function discord_webhook(type, usd_balance, btc_balance) {
	if (!config.DISCORD_WEBHOOK) return;

	let msg = "";
	msg += "--\n";

	if (type === "buy") {
		msg += `Placed a buy order for ${usd_balance} USD`;
	} else {
		msg += `Placed a sell order for ${btc_balance} BTC`;
	}

	axios.post(config.DISCORD_WEBHOOK, {
		content: msg
	})
}

// Set up coinbase pro
const client = new CoinbasePro({
	apiKey: config.API_KEY,
	apiSecret: config.API_SECRET,
	passphrase: config.PASSPHRASE,
	useSandbox: true
});

// Set ids
let btc_id;
let usd_id;
client.rest.account.listAccounts().then(result => {
	btc_id = result.find(e => e.currency === "BTC").id;
	usd_id = result.find(e => e.currency === "USD").id;
})

/**
 * Get balances of balances
 *
 * @param {function} callback Balance callback
 */
function get_balances(callback) {
	client.rest.account.getAccount(btc_id).then(result => {
		btc_balance = result.balance;

		client.rest.account.getAccount(usd_id).then(result => {
			usd_balance = Number(result.balance.toString().slice(0, (result.balance.indexOf(".")) + 3));

			callback(null, lib.truncate8(btc_balance), lib.truncate2(usd_balance));
		}).catch(err => {
			callback(err);
		})
	}).catch(err => {
		callback(err);
	})
}

exports.handleSignal = function (type, callback) {
	get_balances(function (err, btc_balance, usd_balance) {
		if (err) return callback(err);

		// Make sure accounts have enough
		if ((type === "buy" && usd_balance > 1) || (type === "sell" && btc_balance > 0)) {
			// Set up order
			let order = {
				type: 'market',
				side: type,
				product_id: 'BTC-USD'
			}

			// Add price to order
			if (type === "sell") {
				order.size = btc_balance + "";
			} else {
				order.funds = usd_balance + "";
			}

			// Place order
			client.rest.order.placeOrder(order).then(() => {
				discord_webhook(type, usd_balance, btc_balance);

				callback(null);
			}).catch(err => {
				callback(err);
			})
		} else {
			callback(null);
		}
	})
}