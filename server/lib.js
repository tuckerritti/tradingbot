const otpauth = require('otpauth');

const config = require('./config');

/**
 * Get OTP code for robinhood
 *
 * @returns {number} OTP Code
 */
exports.getOTPCode = function () {
	let totp = new otpauth.TOTP({
		issuer: 'Robinhood',
		label: 'Robinhood',
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: config.OTP_CODE
	});

	return totp.generate();
}

/**
 * Truncate a decimal to 2 places
 *
 * @param {number} number Float to truncate
 * @returns {number} Truncated Float
 */
exports.truncate2 = function (number) {
	return parseFloat(number.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0]);
}

/**
 * Truncate a decimal to 8 places
 *
 * @param {number} number Float to truncate
 * @returns {number} Truncated Float
 */
exports.truncate8 = function (number) {
	return parseFloat(number.toString().match(/^-?\d+(?:\.\d{0,8})?/)[0]);
}