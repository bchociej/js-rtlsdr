const librtlsdr = require('../addon/');
const EventEmitter = require('events');

/** @private */
function simpleClone(obj) {
	const result = {};
	Object.keys(obj).forEach((key) => {
		result[key] = obj[key];
	});
	return result;
}

/**
 * EventEmitter abstraction of an RTLSDR device. Virtually all methods are subject to I/O-related exceptions.
 *
 * @param {Number} deviceIndex - the zero-based index of the device to open
 * @throws {TypeError} `deviceIndex` is not a number
 * @see {@link https://nodejs.org/api/events.html EventEmitter API} for information on how to consume events
 * @extends EventEmitter
 * @emits RTLSDR~data
 * @emits RTLSDR~error
 * @emits RTLSDR~done
 * @example <caption>Basic usage: setup and read RF samples for ~5 seconds</caption>
 * let device = new RTLSDR(0) // or RTLSDR.open(0)
 * 	.sampleRate(2.048e6) // 2.048 MS/s
 * 	.centerFreq(444e6)   // 444 MHz
 * 	.freqCorrection(40)  // 40 ppm
 * 	.on('data', (buffer) => { doSomething(buffer); })
 * 	.read();
 *
 * setTimeout(() => { device.cancel(); }, 5000);
 */
class RTLSDR extends EventEmitter {
	constructor(deviceIndex) {
		super();

		/**
		 * The index of the device for this instance.
		 * @private
		 * @const
		 * @name deviceIndex
		 * @memberof RTLSDR
		 * @instance
		 * @type {Number}
		 */
		Object.defineProperty(this, 'deviceIndex', { value: deviceIndex });

		/**
		 * The special handle object for the currently-open device.
		 * @private
		 * @name device
		 * @memberof RTLSDR
		 * @instance
		 * @type {?Object}
		 */
		Object.defineProperty(this, 'device', { writable: true });

		/**
		 * The last tuner gain mode setting
		 * @private
		 * @name lastGainMode
		 * @memberof RTLSDR
		 * @instance
		 * @type {?Number}
		 */
		Object.defineProperty(this, 'lastGainMode', { writable: true });

		/**
		 * The last bandwidth setting
		 * @private
		 * @name lastBandwidth
		 * @memberof RTLSDR
		 * @instance
		 * @type {?Boolean}
		 */
		Object.defineProperty(this, 'lastBandwidth', { writable: true });

		/**
		 * The latest IF gain settings
		 * @private
		 * @name _gains
		 * @memberof RTLSDR
		 * @instance
		 * @type {Object}
		 */
		Object.defineProperty(this, 'latestIFGains', { value: {} });

		/**
		 * The last testmode setting
		 * @private
		 * @name lastTestmode
		 * @memberof RTLSDR
		 * @instance
		 * @type {?Boolean}
		 */
		Object.defineProperty(this, 'lastTestmode', { writable: true });

		/**
		 * The last AGC mode setting
		 * @private
		 * @name lastAGC
		 * @memberof RTLSDR
		 * @instance
		 * @type {?Boolean}
		 */
		Object.defineProperty(this, 'lastAGC', { writable: true });

		this.device = librtlsdr.open(this.deviceIndex);
	}

	/**
	 * Ensure that the device is open.
	 * @throws {Error} the device is closed
	 */
	assertOpen() {
		if (!this.isOpen()) {
			throw new Error('device is closed');
		}
	}

	/**
	 * Get the zero-based index of the device represented by this instance.
	 * @return {Number} the zero-based index of the device
	 */
	deviceIndex() {
		return this.deviceIndex;
	}

	/**
	 * Determines if the device is open.
	 * @return {Boolean} whether the device is open
	 */
	isOpen() {
		return (this.device !== null && typeof this.device !== 'undefined');
	}

	/**
	 * Close the device (if it is open). Most other methods should not be called after calling this. Idempotent.
	 */
	destroy() {
		if (this.isOpen()) {
			librtlsdr.close(this.device);
			this.device = undefined;
		}
	}

	/**
	 * Crystal frequency(ies) of underlying hardware.
	 * @typedef {Object} RTLSDR~XtalFreqs
	 * @property {Number} rtl_freq - the frequency of the RTL device
	 * @property {Number} tuner_freq - the frequency of the tuner
	 */

	/**
	 * Get the device's crystal frequencies.
	 * @method RTLSDR#xtalFreq(1)
	 * @example
	 * dev.xtalFreq() // => { rtl_freq: 28800000, tuner_freq: 28800000 }
	 * @return {RTLSDR~XtalFreqs} current crystal frequencies
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's crystal frequency(ies).
	 * @method RTLSDR#xtalFreq(2)
	 * @param {Number} rtlFreq - the crystal frequency to set on the RTL device
	 * @param {Number} [tunerFreq=rtlFreq] - the crystal frequency to set on the tuner, if different
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `rtlFreq` is not a number
	 * @throws {TypeError} `tunerFreq` is not a number
	 */
	xtalFreq(rtlFreq, tunerFreq) {
		this.assertOpen();

		if (rtlFreq) {
			librtlsdr.set_xtal_freq(this.device, rtlFreq, tunerFreq || rtlFreq);
			return this;
		}

		return librtlsdr.get_xtal_freq(this.device);
	}

	/**
	 * Selected {@link http://www.beyondlogic.org/usbnutshell/usb5.shtml#StringDescriptors USB descriptor strings} as
	 * defined in the {@link http://www.beyondlogic.org/usbnutshell/usb5.shtml#DeviceDescriptors USB device descriptor}
	 * @typedef {Object} RTLSDR~USBStrings
	 * @property {String} vendor - the Manufacturer string (`iManufacturer` USB descriptor string)
	 * @property {String} product - the Product string (`iProduct` USB descriptor string)
	 * @property {String} serial - the Serial Number string (`iSerialNumber` USB descriptor string)
	 */

	/**
	 * Get the device's USB strings.
	 * @return {RTLSDR~USBStrings}
	 * @throws {Error} the device is closed
	 */
	usbStrings() {
		this.assertOpen();
		return librtlsdr.get_usb_strings(this.device);
	}

	/**
	 * Synchronously read the device's EEPROM
	 * @param {Number} offset - the offset to start reading from
	 * @param {Number} length - how many bytes to read
	 * @return {Buffer} the requested EEPROM bytes
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `offset` is not a number
	 * @throws {RangeError} `offset` is not 0-255
	 * @throws {TypeError} `length` (len) is not a number
	 * @throws {RangeError} `length` (len) is not 0-255
	 */
	readEEPROMSync(offset, length) {
		this.assertOpen();
		librtlsdr.read_eeprom(this.device, offset, length);
	}

	/**
	 * @callback RTLSDR~readEEPROMCallback
	 * @param {?Error} error - the error that occurred, if any
	 * @param {?Buffer} buffer - the requested EEPROM bytes
	 */

	/**
	 * Asynchronously read the device's EEPROM. Convenience wrapper via `setTimeout`.
	 * @param {Number} offset - as in {@link RTLSDR#readEEPROMSync}
	 * @param {Number} length - as in {@link RTLSDR#readEEPROMSync}
	 * @param {RTLSDR~readEEPROMCallback} callback - node-style callback to handle the result
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `offset` is not a number
	 * @throws {RangeError} `offset` is not 0-255
	 * @throws {TypeError} `length` (len) is not a number
	 * @throws {RangeError} `length` (len) is not 0-255
	 */
	readEEPROM(offset, length, callback) {
		setImmediate(() => {
			try {
				callback(null, this.readEEPROMSync(offset, length));
			} catch (err) {
				callback(err);
			}
		});
	}

	/**
	 * Synchronously write the device's EEPROM
	 * @param {Buffer} buf - the bytes to write
	 * @param {Number} offset - the offset to start writing at
	 * @param {Number} length - how many bytes to write
	 * @throws {Error} the device is closed
	 * @throws {TypeError} buf (data) is not a buffer
	 * @throws {TypeError} `offset` is not a number
	 * @throws {RangeError} `offset` is not 0-255
	 * @throws {TypeError} `length` (len) is not a number
	 * @throws {RangeError} `length` (len) is not 0-255
	 */
	writeEEPROMSync(buf, offset, length) {
		this.assertOpen();
		librtlsdr.write_eeprom(this.device, buf, offset, length);
	}

	/**
	 * @callback RTLSDR~writeEEPROMCallback
	 * @param {?Error} error - the error that occurred, if any
	 */

	/**
	 * Asynchronously write the device's EEPROM. Convenience wrapper via `setTimeout`.
	 * @param {Buffer} buf - the bytes to write
	 * @param {Number} offset - as in {@link RTLSDR#writeEEPROMSync}
	 * @param {Number} length - as in {@link RTLSDR#writeEEPROMSync}
	 * @param {RTLSDR~writeEEPROMCallback} callback - node-style callback to handle the result
	 * @throws {Error} the device is closed
	 * @throws {TypeError} buf (data) is not a buffer
	 * @throws {TypeError} `offset` is not a number
	 * @throws {RangeError} `offset` is not 0-255
	 * @throws {TypeError} `length` (len) is not a number
	 * @throws {RangeError} `length` (len) is not 0-255
	 */
	writeEEPROM(buf, offset, length, callback) {
		setImmediate(() => {
			try {
				this.writeEEPROM(buf, offset, length);
				callback();
			} catch (err) {
				callback(err);
			}
		});
	}

	/**
	 * Get the device's center frequency.
	 * @method RTLSDR#centerFreq(1)
	 * @return {Number} current center frequency, in integer Hz
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's center frequency.
	 * @method RTLSDR#centerFreq(2)
	 * @param {Number} freq - the center frequency to tune on the RTL device, in integer Hz
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `freq` is not a number
	 */
	centerFreq(freq) {
		this.assertOpen();

		if (freq) {
			librtlsdr.set_center_freq(this.device, freq);
			return this;
		}

		return librtlsdr.get_center_freq(this.device);
	}

	/**
	 * Get the device's frequency correction.
	 * @method RTLSDR#freqCorrection(1)
	 * @return {Number} current frequency correction, in integer parts per million (ppm)
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's frequency correction.
	 * @method RTLSDR#freqCorrection(2)
	 * @param {Number} ppm - the frequency correction to tune on the RTL device, in integer parts per million (ppm)
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `ppm` is not a number
	 */
	freqCorrection(ppm) {
		this.assertOpen();

		if (ppm) {
			librtlsdr.set_freq_correction(this.device, ppm);
			return this;
		}

		return librtlsdr.get_freq_correction(this.device);
	}

	/**
	 * Get a string representing the type of tuner onboard the device.
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L172 tuner types enum in librtlsdr}
	 * @return {?String} the tuner type enum string, which might be `"RTLSDR_TUNER_UNKNOWN"` or `null`
	 * @throws {Error} the device is closed
	 */
	tunerType() {
		this.assertOpen();
		return librtlsdr.get_tuner_type();
	}

	/**
	 * Get the list of gains supported by the tuner.
	 * @return {Number[]} list of gains in centibels (cB), i.e. tenths of decibels (0.1 dB)
	 * @throws {Error} the device is closed
	 */
	tunerGains() {
		this.assertOpen();
		return librtlsdr.get_tuner_gains(this.device);
	}

	/**
	 * Convenience method to get the supported tuner gain closest to the input number.
	 * @param {Number} gain - the desired gain in centibels (cB), i.e. tenths of decibels (0.1 dB)
	 * @return {Number} the closest supported gain in centibels (cB), i.e. tenths of decibels (0.1 dB)
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `gain` is not a number
	 */
	nearestTunerGain(gain) {
		this.assertOpen();

		if (typeof gain !== 'number') {
			throw new TypeError('gain must be a number');
		}

		return this.tunerGains()
			.sort((a, b) => Math.abs(gain - a) - Math.abs(gain - b))
			.shift();
	}

	/**
	 * Tuner gain mode and value
	 * @typedef {Object} RTLSDR~TunerGain
	 * @property {String} mode - `'auto'` or `'manual'`
	 * @property {Number} value - gain in centibels (cB), i.e. tenths of decibels (0.1 dB)
	 */

	/**
	 * Get the device's tuner gain mode and value.
	 * @method RTLSDR#tunerGain(1)
	 * @return {RTLSDR~TunerGain} current tuner gain mode and value
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's tuner gain or gain mode. If `'auto'` or `'manual'`, set the appropriate gain mode, without altering
	 * the actual gain setting.
	 * @method RTLSDR#tunerGain(2)
	 * @param {(Number|String)} gain - the desired gain in centibels (cB), or `'auto'` or '`manual'`
	 * @param {Boolean} [exact=false] - iff `false` and `gain` is a number, set the nearest gain mode reported by {@link RTLSDR#nearestTunerGain}
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {Error} `gain` is not a number, `'auto'`, nor `'manual'`
	 */
	tunerGain(gain, exact) {
		this.assertOpen();
		let ex = exact;
		let ga = gain;

		if (typeof ex === 'undefined') {
			ex = false;
		}

		if (typeof ga !== 'undefined') {
			if (ga !== 'auto' && ga !== 'manual' && typeof ga !== 'number') {
				throw new Error("gain must be 'auto', 'manual', or a number");
			}

			if (ga === 'auto') {
				librtlsdr.set_tuner_gain_mode(this.device, 0);
				this.lastGainMode = 0;
			} else {
				if (typeof ga === 'number') {
					if (!ex) {
						ga = this.nearestTunerGain(ga);
					}

					librtlsdr.set_tuner_gain_mode(this.device, 1);
					librtlsdr.set_tuner_gain(this.device, ga);
				}

				this.lastGainMode = 1;
			}

			return this;
		}

		return {
			mode: this.lastGainMode === 1 ? 'manual' : 'auto',
			value: librtlsdr.get_tuner_gain(this.device),
		};
	}

	/**
	 * Get the device's bandwidth.
	 * @method RTLSDR#tunerBandwidth(1)
	 * @return {Number} current bandwidth in integer Hz
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's bandwidth.
	 * @method RTLSDR#tunerBandwidth(2)
	 * @param {Number} bandwidth - the desired bandwidth in integer Hz, or `0` or `'auto'` for automatic bandwidth
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {Error} `bandwidth` is not a number nor `'auto'`
	 */
	tunerBandwidth(bandwidth) {
		this.assertOpen();
		let bw = bandwidth;

		if (typeof bw !== 'undefined') {
			if (bw === 0) {
				bw = 'auto';
			}

			if (bw !== 'auto' && typeof bw !== 'number') {
				throw new Error("bw must be 'auto' or a number");
			}

			librtlsdr.set_tuner_bandwidth(this.device, bw === 'auto' ? 0 : bw);
			this.lastBandwidth = bw;
			return this;
		}

		return this.lastBandwidth;
	}

	/**
	 * Get all tuner IF gain(s).
	 * @method RTLSDR#tunerIFGain(1)
	 * @return {Object} an object (dictionary) of previously-set stages and gains
	 * @throws {Error} the device is closed
	 */

	/**
	 * Get tuner IF gain by stage
	 * @method RTLSDR#tunerIFGain(2)
	 * @param {Number} stage - the IF gain stage to get
	 * @return {?Number} the last `gain` set for that stage, if any
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set tuner IF gain by stage
	 * @method RTLSDR#tunerIFGain(3)
	 * @param {Number} stage - the IF gain stage set
	 * @param {Number} gain - the gain to set
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 */
	tunerIFGain(stage, gain) {
		this.assertOpen();

		if (typeof stage !== 'undefined' && typeof gain !== 'undefined') {
			librtlsdr.set_tuner_if_gain(this.device, stage, gain);
			this.latestIFGains[stage] = gain;
			return this;
		} else if (typeof stage !== 'undefined') {
			return this.latestIFGains[stage];
		} else if (typeof gain !== 'undefined') {
			throw new Error('cannot specify gain without specifying stage');
		} else {
			return simpleClone(this.latestIFGains);
		}
	}

	/**
	 * Get the device's sample rate.
	 * @method RTLSDR#sampleRate(1)
	 * @return {Number} current sample rate, in integer samples per second
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's sample rate. Per librtlsdr docs, valid values are 225001-300000 and 900001-3200000.
	 * @method RTLSDR#sampleRate(2)
	 * @param {Number} rate - the sample rate to tune on the RTL device, in integer samples per second
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `rate` is not a number
	 */
	sampleRate(rate) {
		this.assertOpen();

		if (typeof rate !== 'undefined') {
			librtlsdr.set_sample_rate(this.device, rate);
			return this;
		}

		return librtlsdr.get_sample_rate(this.device);
	}

	/**
	 * Get the device's testmode status.
	 * @method RTLSDR#testmode(1)
	 * @return {Boolean} current testmode status
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's testmode status. Testmode generates an 8-bit counter instead of RF samples.
	 * @method RTLSDR#testmode(2)
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L276 rtlsdr_set_testmode}
	 * @param {Boolean} on - true iff testmode should be enabled
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `on` is not a boolean
	 */
	testmode(on) {
		this.assertOpen();

		if (typeof on !== 'undefined') {
			librtlsdr.set_testmode(this.device, on);
			this.lastTestmode = on;
			return this;
		}

		return this.lastTestmode;
	}

	/**
	 * Get the device's automatic gain control (AGC) status.
	 * @method RTLSDR#agc(1)
	 * @return {Boolean} current automatic gain control (AGC) status
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's automatic gain control (AGC) status.
	 * @method RTLSDR#agc(2)
	 * @param {Boolean} on - true iff AGC should be enabled
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `on` is not a boolean
	 */
	agc(on) {
		this.assertOpen();

		if (typeof on !== 'undefined') {
			librtlsdr.set_agc_mode(this.device, on);
			this.lastAGC = on;
			return this;
		}

		return this.lastAGC;
	}

	/**
	 * Get the device's direct sampling mode.
	 * @method RTLSDR#directSampling(1)
	 * @return {Number} current direct sampling mode; `0` is off, `1` is I-ADC, `2` is Q-ADC
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's direct sampling mode. Used in conjunction with {@link RTLSDR#centerFreq} when active.
	 * @method RTLSDR#directSampling(2)
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L304 rtlsdr_set_direct_sampling}
	 * @param {Number} mode - `0` off, `1` activate I-ADC input, `2` activate Q-ADC input
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `mode` is not a number
	 * @throws {RangeError} `mode` is not `0`, `1`, nor `2`
	 */
	directSampling(mode) {
		this.assertOpen();

		if (typeof mode !== 'undefined') {
			librtlsdr.set_direct_sampling(this.device, mode);
			return this;
		}

		return librtlsdr.get_direct_sampling(this.device);
	}

	/**
	 * Get the device's offset tuning status.
	 * @method RTLSDR#offsetTuning(1)
	 * @return {Boolean} current offset tuning status
	 * @throws {Error} the device is closed
	 */

	/**
	 * Set the device's offset tuning status.
	 * @method RTLSDR#offsetTuning(2)
	 * @param {Boolean} on - true iff offset tuning should be enabled
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `on` is not a boolean
	 */
	offsetTuning(on) {
		this.assertOpen();

		if (typeof on !== 'undefined') {
			librtlsdr.set_offset_tuning(this.device, on);
			return this;
		}

		return librtlsdr.get_offset_tuning(this.device);
	}

	/**
	 * Try to synchronously read samples.
	 * @param {Number} length - how many bytes to try to read
	 * @return {Buffer} I/Q RF samples; may be fewer than requested
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `length` (len) is not a number
	 */
	readSync(length) {
		this.assertOpen();
		librtlsdr.reset_buffer(this.device);
		return librtlsdr.read_sync(length);
	}

	/**
	 * An asynchronous read has returned some samples.
	 * @event RTLSDR~data
	 * @param {Buffer} buffer - the RF sample bytes
	 */

	/**
	 * An error has occurred during an asynchronous read.
	 * @event RTLSDR~error
	 * @param {String} errorMsg - the error message that was raised
	 */

	/**
	 * Asynchronous reads have finished (after calling {@link RTLSDR#cancel})
	 * @event RTLSDR~done
	 */

	/**
	 * Deprecated; use {@link RTLSDR#read}. Asynchronously receive samples. This method calls the deprecated `rtlsdr_wait_async`
	 * function in librtlsdr, but _that_ function now simply calls `rtlsdr_read_async` with `0` for `buf_num` and
	 * `buf_len`. This method will cause {@link RTLSDR~event:data} to begin being emitted on `this`.
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L342 rtlsdr_wait_async}
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 */
	wait() {
		this.assertOpen();
		librtlsdr.reset_buffer(this.device);
		librtlsdr.wait_async(this.device, (ev, arg) => { this.emit(ev, arg); });
		return this;
	}

	/**
	 * Asynchronously receive samples. This method will cause {@link RTLSDR~event:data} to begin being emitted on `this`.
	 * Total buffer size per read will be `bufNum * bufLen`.
	 * @param {Number} [bufNum] - optional librtlsdr buffer count; default is 15 (librtlsdr behavior)
	 * @param {Number} [bufLen] - optional librtlsdr buffer length; default is `16 \* 32 \* 512` (librtlsdr behavior); must be a multiple of 512, and _should_ be a multiple of 16384
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 */
	read(bufNum, bufLen) {
		this.assertOpen();
		librtlsdr.reset_buffer(this.device);
		librtlsdr.read_async(this.device, (ev, arg) => { this.emit(ev, arg); }, bufNum, bufLen);
		return this;
	}

	/**
	 * Cancel asynchronous reads that were initiated with {@link RTLSDR#read} or {@link RTLSDR#wait}.
	 * @return {RTLSDR} `this`
	 * @throws {Error} the device is closed
	 */
	cancel() {
		this.assertOpen();
		librtlsdr.cancel_async(this.device);
		return this;
	}
}

/**
 * Get the number of RTLSDR devices present.
 * @return {Number} the number of RTLSDR devices present
 */
RTLSDR.deviceCount = () => librtlsdr.getdevice_count();

/**
 * Get the string name of the device at the given index.
 * @param {Number} index - the device index to get the name of
 * @return {String} the device name string, possibly empty or garbage data is no such device
 * @throws {TypeError} `index` is not a number
 */
RTLSDR.deviceName = index => librtlsdr.getdevice_name(index);

/**
 * Get the USB strings for the device at the given index.
 * @param {Number} index - the device index to get the USB strings for
 * @return {RTLSDR~USBStrings} possibly garbage data if no such device
 * @throws {TypeError} `index` is not a number
 */
RTLSDR.usbStrings = index => librtlsdr.getdevice_usb_strings(index);

/**
 * Get the device index of the (first) device with the given serial string.
 * @param {String} serial - the serial string to look for
 * @return {?Number} the device index requested, if any
 * @throws {TypeError} `serial` is not a string
 * @throws {Error} the `serial` string could not be read
 */
RTLSDR.indexBySerial = serial => librtlsdr.get_index_by_serial(serial);

/**
 * Static convenience function to create (and open) a new RTLSDR instance.
 * @param {Number} index - the index of the RTLSDR device to open
 * @return {RTLSDR} a new RTLSDR instance for the specified index
 * @throws {TypeError} `index` is not a number
 */
RTLSDR.open = index => new RTLSDR(index);

/**
 * Convenience method to list all available RTLSDR devices, their names, and their USB strings.
 * @return {Object[]} a list of objects (dictionaries) containing device indices, names, and USB strings
 */
RTLSDR.devices = () => {
	const count = RTLSDR.deviceCount();
	const result = [];
	for (let i = 0; i < count; i++) {
		result.push({
			name: RTLSDR.deviceName(i),
			deviceIndex: i,
			usbStrings: RTLSDR.usbStrings(i),
		});
	}
	return result;
};

module.exports = RTLSDR;
