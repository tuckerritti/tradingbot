const axios = require('axios');
const mongoose = require('mongoose');

const config = require('./config');

mongoose.connect(config.DB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

const Simulated = mongoose.model('Simulated', new mongoose.Schema({
	btc_balance: Number,
	usd_balance: Number
}));

Simulated.findOne({}, function (err, balances) {
	if (!balances) Simulated.create({btc_balance: 0, usd_balance: 1000}, function (err) {
		if (err) throw new Error(err);

		console.log("Setup database tables.");
	})
})

function discord_webhook(type, quantity, btc_balance, usd_balance, btc_price) {
	if (!config.SIMULATED_DISCORD_WEBHOOK) return;

	const currency = (type === "buy") ? "BTC" : "USD";

	let msg = "";
	msg += "--\n";
	msg += `Placed a ${type} order for ${quantity} ${currency}\n`;
	msg += "\n";
	msg += `BTC Price: ${btc_price}\n`;
	msg += `BTC Balance: ${btc_balance}\n`;
	msg += `USD Balance: ${usd_balance}\n`;

	axios.post(config.SIMULATED_DISCORD_WEBHOOK, {
		content: msg
	})
}

/**
 * Get balances
 *
 * @param {function} callback Balance callback
 */
function get_balances(callback) {
	Simulated.findOne({}, function (err, balances) {
		if (err) return callback(err);

		axios.get('https://api.coinbase.com/v2/prices/spot?currency=USD').then(result => {
			callback(null, balances.usd_balance, balances.btc_balance, result.data.data.amount);
		}).catch(err => {
			callback(err);
		})
	})
}

exports.handleSignal = function (type, callback) {
	get_balances(function (err, usd_balance, btc_balance, btc_price) {
		if (err) return callback(err);

		if (type === "buy" && usd_balance > 0) {
			const quantity = usd_balance / btc_price;

			Simulated.findOneAndUpdate({}, {usd_balance: 0, btc_balance: quantity}, function (err) {
				if (err) return callback(err);

				discord_webhook(type, quantity, btc_balance, usd_balance, btc_price);
				callback(null);
			})
		} else if (type === "sell" && btc_balance > 0) {
			const quantity = btc_balance * btc_price;

			Simulated.findOneAndUpdate({}, {usd_balance: quantity, btc_balance: 0}, function (err) {
				if (err) return callback(err);

				discord_webhook(type, quantity, btc_balance, usd_balance, btc_price);
				callback(null);
			})
		} else {
			callback(null);
		}
	})
}