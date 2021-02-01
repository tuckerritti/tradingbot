require('dotenv').config();

module.exports = {
	"PRODUCTION": process.env.NODE_ENV === "production",
	"PORT": 3000,
	"SENTRY_DSN": process.env.SENTRY_DSN,

	"API_KEY": process.env.API_KEY,
	"API_SECRET": process.env.API_SECRET,
	"PASSPHRASE": process.env.PASSPHRASE,
	"SANDBOX": process.env.SANDBOX
}