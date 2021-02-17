require('dotenv').config();

module.exports = {
	// General stuff
	"PRODUCTION": process.env.NODE_ENV === "production",
	"PORT": 3000,
	"SENTRY_DSN": process.env.SENTRY_DSN,
	"SHARED_SECRET": process.env.SHARED_SECRET,

	// Coinbase Stuff
	"API_KEY": process.env.API_KEY,
	"API_SECRET": process.env.API_SECRET,
	"PASSPHRASE": process.env.PASSPHRASE,
	"DISCORD_WEBHOOK": process.env.DISCORD_WEBHOOK
}