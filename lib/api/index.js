const rtlsdr = require ('../lib/addon/');
const EventEmitter = require('events');

class RTLSDR extends EventEmitter {
	constructor(deviceIndex) {
		this.deviceIndex = deviceIndex;
		this.device = rtlsdr.open(this.deviceIndex);
	}

	assertOpen() {
		if (!this.device) {
			throw new Error('device is closed');
		}
	}

	deviceIndex() {
		if (arguments.length > 0) {
			throw new Error('method does not accept arguments');
		}

		return this.deviceIndex;
	}

	close() {
		if (arguments.length > 0) {
			throw new Error('method does not accept arguments');
		}

		this.assertOpen();
		rtlsdr.close(this.device);
		delete this.device;
	}

	xtalFreq(rtlFreq, tunerFreqIfDifferent) {
		this.assertOpen();

		if (rtlFreq) {
			rtlsdr.set_xtal_freq(this.device, rtlFreq, tunerFreqIfDifferent || rtlFreq);
			return this;
		}

		return rtlsdr.get_xtal_freq(this.device);
	}

	usbStrings() {
		if (arguments.length > 0) {
			throw new Error('method does not accept arguments');
		}

		this.assertOpen();
		return rtlsdr.get_usb_strings(this.device);
	}

	readEEPROM(offset, length, callback) {
		this.assertOpen();

		setImmediate(() => {
			try {
				callback(null, rtlsdr.read_eeprom(this.device, offset, len));
			} catch (err) {
				callback(err);
			}
		});
	}

	writeEEPROM(buf, offset, length, callback) {
		this.assertOpen();

		setImmediate(() => {
			try {
				rtlsdr.write_eeprom(this.device, buf, offset, len);
				callback();
			} catch (err) {
				callback(err);
			}
		});
	}

	centerFreq(freq) {
		this.assertOpen();

		if (freq) {
			rtlsdr.set_center_freq(this.device, freq);
			return this;
		}

		return rtlsdr.get_center_freq(this.device);
	}

	freqCorrection(ppm) {
		this.assertOpen();

		if (ppm) {
			rtlsdr.set_freq_correction(this.device, ppm);
			return this;
		}

		return rtlsdr.get_freq_correction(this.device);
	}
}
