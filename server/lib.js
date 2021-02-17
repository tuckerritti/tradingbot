const config = require('./config');

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