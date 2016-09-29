/**
 * @module js-rtlsdr
 * @see {@link RTLSDR}
 * @example
 * const RTLSDR = require('js-rtlsdr').RTLSDR;
 * RTLSDR.open(0); // etc
 */
module.exports = {
	RTLSDR: require('./lib/api/'),
	librtlsdr: require('./lib/addon/')
};
