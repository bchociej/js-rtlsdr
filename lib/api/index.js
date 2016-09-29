const librtlsdr = require('../addon/');
const EventEmitter = require('events');

/**
 * Crystal frequency(ies) of underlying hardware.
 * @typedef {object} XtalFreqs
 * @property {number} rtl_freq - the frequency of the RTL device
 * @property {number} tuner_freq - the frequency of the tuner
 */

/**
 * Selected {@link http://www.beyondlogic.org/usbnutshell/usb5.shtml#StringDescriptors USB descriptor strings} as
 * defined in the {@link http://www.beyondlogic.org/usbnutshell/usb5.shtml#DeviceDescriptors USB device descriptor}
 * @typedef {object} USBStrings
 * @property {string} vendor - the Manufacturer string (`iManufacturer` USB descriptor string)
 * @property {string} product - the Product string (`iProduct` USB descriptor string)
 * @property {string} serial - the Serial Number string (`iSerialNumber` USB descriptor string)
 */

/**
 * Tuner gain mode and value
 * @typedef {object} TunerGain
 * @property {string} mode - 'auto' or 'manual'
 * @property {number} value - gain in centibels (cB), i.e. tenths of decibels (0.1 dB)
 */

/** @private */
function simpleClone(obj) {
	const result = {};
	Object.keys(obj).forEach((key) => {
		result[key] = obj[key];
	});
	return result;
}

/**
 * Class representing an RTLSDR device. Almost all methods can throw errors if I/O or low-level librtlsdr errors occur.
 * Other exception conditions will be called out explicitly. Methods which are guaranteed not to throw will be
 * documented as so.
 *
 * @param {number} deviceIndex - the zero-based index of the device to open
 * @throws {TypeError} `deviceIndex` is not a number
 * @see {@link https://nodejs.org/api/events.html EventEmitter API} for information on how to consume events
 * @extends EventEmitter
 * @emits data
 * @emits error
 * @emits done
 * @example
 * let device = new RTLSDR(0);
 */
class RTLSDR extends EventEmitter {
	constructor(deviceIndex) {
		super();

		/**
		 * The index of the device for this instance.
		 * @private
		 * @const
		 * @name _deviceIndex
		 * @memberof RTLSDR
		 * @instance
		 * @type {number}
		 */
		Object.defineProperty(this, '_deviceIndex', { value: deviceIndex });

		/**
		 * The special handle object for the currently-open device.
		 * @private
		 * @name _device
		 * @memberof RTLSDR
		 * @instance
		 * @type {?Object}
		 */
		Object.defineProperty(this, '_device', { writable: true });

		/**
		 * The last tuner gain mode setting
		 * @private
		 * @name _gainMode
		 * @memberof RTLSDR
		 * @instance
		 * @type {number}
		 */
		Object.defineProperty(this, '_gainMode', { writable: true });

		/**
		 * The last bandwidth setting
		 * @private
		 * @name _bw
		 * @memberof RTLSDR
		 * @instance
		 * @type {boolean}
		 */
		Object.defineProperty(this, '_bw', { writable: true });

		/**
		 * The latest IF gain settings
		 * @private
		 * @name _gains
		 * @memberof RTLSDR
		 * @instance
		 * @type {Object}
		 */
		Object.defineProperty(this, '_ifGains', { value: {} });

		/**
		 * The last testmode setting
		 * @private
		 * @name _testmode
		 * @memberof RTLSDR
		 * @instance
		 * @type {boolean}
		 */
		Object.defineProperty(this, '_testmode', { writable: true });

		/**
		 * The last AGC mode setting
		 * @private
		 * @name _agc
		 * @memberof RTLSDR
		 * @instance
		 * @type {boolean}
		 */
		Object.defineProperty(this, '_agc', { writable: true });

		this._device = librtlsdr.open(this._deviceIndex);
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
	 * Get the zero-based index of the device. Does not throw.
	 * @return {number} the zero-based index of the device
	 */
	deviceIndex() {
		return this._deviceIndex;
	}

	/**
	 * Determines if the device is open. Does not throw.
	 * @return {boolean} whether the device is open
	 */
	isOpen() {
		return (this._device !== null && typeof this._device !== 'undefined');
	}

	/**
	 * Close the device (if it is open). Most other methods should not be called after calling this. Idempotent.
	 */
	destroy() {
		if (this.isOpen()) {
			librtlsdr.close(this._device);
			this._device = undefined;
		}
	}

	/**
	 * Get the device's crystal frequencies. (NO ARGUMENTS - if arguments are shown, it is a bug in the doc generator
	 * library.)
	 * @example
	 * dev.xtalFreq() // => { rtl_freq: 28800000, tuner_freq: 28800000 }
	 * @return {XtalFreqs} current crystal frequencies
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's crystal frequency(ies).
	 * @param {number} rtlFreq - the crystal frequency to set on the RTL device
	 * @param {number} [tunerFreq=rtlFreq] - the crystal frequency to set on the tuner, if different
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} rtlFreq is not a number
	 * @throws {TypeError} tunerFreq is not a number
	 */
	xtalFreq(rtlFreq, tunerFreq) {
		this.assertOpen();

		if (rtlFreq) {
			librtlsdr.set_xtal_freq(this._device, rtlFreq, tunerFreq || rtlFreq);
			return this;
		}

		return librtlsdr.get_xtal_freq(this._device);
	}

	/**
	 * Get the device's USB strings.
	 * @return {USBStrings}
	 * @throws {Error} the device is closed
	 */
	usbStrings() {
		this.assertOpen();
		return librtlsdr.get_usb_strings(this._device);
	}

	/**
	 * Synchronously read the device's EEPROM
	 * @param {number} offset - the offset to start reading from
	 * @param {number} length - how many bytes to read
	 * @return {Buffer} the requested EEPROM bytes
	 * @throws {Error} the device is closed
	 * @throws {TypeError} offset is not a number
	 * @throws {RangeError} offset is not 0-255
	 * @throws {TypeError} length (len) is not a number
	 * @throws {RangeError} length (len) is not 0-255
	 */
	readEEPROMSync(offset, length) {
		this.assertOpen();
		librtlsdr.read_eeprom(this._device, offset, length)
	}

	/**
	 * @callback RTLSDR~readEEPROMCallback
	 * @param {?Error} error - the error that occurred, if any
	 * @param {?Buffer} buffer - the requested EEPROM bytes
	 */
	
	/**
	 * Asynchronously read the device's EEPROM. Convenience wrapper via `setTimeout`.
	 * @param {number} offset - as in `readEEPROMSync`
	 * @param {number} length - as in `readEEPROMSync`
	 * @param {RTLSDR~readEEPROMCallback} callback - node-style callback to handle the result
	 * @throws {Error} the device is closed
	 * @throws {TypeError} offset is not a number
	 * @throws {RangeError} offset is not 0-255
	 * @throws {TypeError} length (len) is not a number
	 * @throws {RangeError} length (len) is not 0-255
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
	 * @param {number} offset - the offset to start writing at
	 * @param {number} length - how many bytes to write
	 * @throws {Error} the device is closed
	 * @throws {TypeError} buf (data) is not a buffer
	 * @throws {TypeError} offset is not a number
	 * @throws {RangeError} offset is not 0-255
	 * @throws {TypeError} length (len) is not a number
	 * @throws {RangeError} length (len) is not 0-255
	 */
	writeEEPROMSync(buf, offset, length) {
		this.assertOpen();
		librtlsdr.write_eeprom(this._device, buf, offset, length);
	}

	/**
	 * @callback RTLSDR~writeEEPROMCallback
	 * @param {?Error} error - the error that occurred, if any
	 */
	
	/**
	 * Asynchronously write the device's EEPROM. Convenience wrapper via `setTimeout`.
	 * @param {Buffer} buf - the bytes to write
	 * @param {number} offset - as in `writeEEPROMSync`
	 * @param {number} length - as in `writeEEPROMSync`
	 * @param {RTLSDR~writeEEPROMCallback} callback - node-style callback to handle the result
	 * @throws {Error} the device is closed
	 * @throws {TypeError} buf (data) is not a buffer
	 * @throws {TypeError} offset is not a number
	 * @throws {RangeError} offset is not 0-255
	 * @throws {TypeError} length (len) is not a number
	 * @throws {RangeError} length (len) is not 0-255
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
	 * Get the device's center frequency. (NO ARGUMENTS - if arguments are shown, it is a bug in the doc generator
	 * library.)
	 * @return {number} current center frequency, in integer Hz
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's center frequency.
	 * @param {number} freq - the center frequency to tune on the RTL device, in integer Hz
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} freq is not a number
	 */
	centerFreq(freq) {
		this.assertOpen();

		if (freq) {
			librtlsdr.set_center_freq(this._device, freq);
			return this;
		}

		return librtlsdr.get_center_freq(this._device);
	}

	/**
	 * Get the device's frequency correction. (NO ARGUMENTS - if arguments are shown, it is a bug in the doc generator
	 * library.)
	 * @return {number} current frequency correction, in integer parts per million (ppm)
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's frequency correction.
	 * @param {number} ppm - the frequency correction to tune on the RTL device, in integer parts per million (ppm)
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} ppm is not a number
	 */
	freqCorrection(ppm) {
		this.assertOpen();

		if (ppm) {
			librtlsdr.set_freq_correction(this._device, ppm);
			return this;
		}

		return librtlsdr.get_freq_correction(this._device);
	}

	/**
	 * Get a string representing the type of tuner onboard the device.
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L172 tuner types enum in librtlsdr}
	 * @return {?string} the tuner type string, or "RTLSDR_TUNER_UNKNOWN" if not known, or null if unreadable
	 * @throws {Error} the device is closed
	 */
	tunerType() {
		this.assertOpen();
		return librtlsdr.get_tuner_type();
	}

	/**
	 * Get the list of gains supported by the tuner.
	 * @return {number[]} list of gains in centibels (cB), i.e. tenths of decibels (0.1 dB)
	 * @throws {Error} the device is closed
	 */
	tunerGains() {
		this.assertOpen();
		return librtlsdr.get_tuner_gains(this._device);
	}

	/**
	 * Convenience method to get the supported tuner gain closest to the input number.
	 * @param {number} gain - the desired gain in centibels (cB), i.e. tenths of decibels (0.1 dB)
	 * @return {number} the closest supported gain in centibels (cB), i.e. tenths of decibels (0.1 dB)
	 * @throws {Error} the device is closed
	 * @throws {TypeError} gain is not a number
	 */
	nearestTunerGain(gain) {
		this.assertOpen();

		if (typeof gain !== 'number') {
			throw new TypeError('gain must be a number');
		}

		return this.tunerGains()
			.sort((a, b) => Math.abs(x - a) - Math.abs(x - b))
			.shift();
	}

	/**
	 * Get the device's tuner gain mode and value. (NO ARGUMENTS - if arguments are shown, it is a bug in the doc
	 * generator library.)
	 * @return {TunerGain} current tuner gain mode and value
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's tuner gain or gain mode. If `'auto'` or `'manual'`, set the appropriate gain mode, without altering
	 * the actual gain setting.
	 * @param {(number|string)} gain - the desired gain in centibels (cB), or `'auto'` or '`manual'`
	 * @param {boolean} [exact=false] - iff false and `gain` is a number, set the nearest gain mode reported by `this.nearestTunerGain(gain)`
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {Error} gain is not a number, `'auto'`, nor `'manual'`
	 */
	tunerGain(gain, exact) {
		this.assertOpen();

		if (typeof exact === 'undefined') {
			exact = false;
		}

		if (typeof gain !== 'undefined') {
			if (gain !== 'auto' && gain !== 'manual' && typeof gain !== 'number') {
				throw new Error("gain must be 'auto', 'manual', or a number");
			}

			if (gain === 'auto') {
				librtlsdr.set_tuner_gain_mode(this._device, 0);
				this._gainMode = 0;
			} else {
				if (typeof gain === 'number') {
					if (!exact) {
						gain = this.nearestTunerGain(gain);
					}

					librtlsdr.set_tuner_gain_mode(this._device, 1);
					librtlsdr.set_tuner_gain(this._device, gain);
				}

				this._gainMode = 1;
			}

			return this;
		}

		return {
			mode: this._gainMode === 1 ? 'manual' : 'auto',
			value: librtlsdr.get_tuner_gain(this._device)
		};
	}

	/**
	 * Get the device's bandwidth. (NO ARGUMENTS - if arguments are shown, it is a bug in the doc generator
	 * library.)
	 * @return {number} current bandwidth in integer Hz
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's bandwidth.
	 * @param {number} bw - the desired bandwidth in integer Hz, or `0` or `'auto'` for automatic bandwidth
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {Error} bw is not a number nor `'auto'`
	 */
	tunerBandwidth(bw) {
		this.assertOpen();

		if (typeof bw !== 'undefined') {
			if (bw === 0) {
				bw = 'auto';
			}

			if (bw !== 'auto' && typeof bw !== 'number') {
				throw new Error("bw must be 'auto' or a number");
			}

			librtlsdr.set_tuner_bandwidth(this._device, bw === 'auto' ? 0 : bw);
			this._bw = bw;
			return this;
		}

		return this._bw;
	}

	/**
	 * Get or set tuner IF gain(s).
	 * @param {number} [stage] - the IF gain stage to get or set, if any
	 * @param {number} [gain] - the gain to set, if any
	 * @return {(object|number|RTLSDR)} with `stage` and `gain`, returns `this`; with `stage`, the last `gain` set for that stage; else, an object (dictionary) of stages and gains
	 * @throws {Error} the device is closed
	 * @throws {Error} a nonsensical combination of parameters is present
	 */
	tunerIFGain(stage, gain) {
		this.assertOpen();

		if (typeof stage !== 'undefined' && typeof gain !== 'undefined') {
			librtlsdr.set_tuner_if_gain(this._device, stage, gain);
			this._ifGains[stage] = gain;
			return this;
		} else if (typeof stage !== 'undefined') {
			return this._ifGains[stage];
		} else if (typeof gain !== 'undefined') {
			throw new Error('cannot specify gain without specifying stage');
		} else {
			return simpleClone(this._ifGains);
		}
	}

	/**
	 * Get the device's sample rate. (NO ARGUMENTS - if arguments are shown, it is a bug in the doc generator
	 * library.)
	 * @return {number} current sample rate, in integer samples per second
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's sample rate. Per librtlsdr docs, valid values are 225001-300000 and 900001-3200000.
	 * @param {number} rate - the sample rate to tune on the RTL device, in integer samples per second
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} rate is not a number
	 */
	sampleRate(rate) {
		this.assertOpen();

		if (typeof rate !== 'undefined') {
			librtlsdr.set_sample_rate(this._device, rate);
			return this;
		}

		return libstlsdr.get_sample_rate(this._device);
	}

	/**
	 * Get the device's testmode status. (NO ARGUMENTS - if arguments are shown, it is a bug in the doc generator
	 * library.)
	 * @return {boolean} current testmode status
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's testmode status. Testmode generates an 8-bit counter instead of RF samples.
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L276 rtlsdr_set_testmode}
	 * @param {boolean} on - true iff testmode should be enabled
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `on` is not a boolean
	 */
	testmode(on) {
		this.assertOpen();

		if (typeof on !== 'undefined') {
			librtlsdr.set_testmode(this._device, on);
			this._testmode = on;
			return this;
		}

		return this._testmode;
	}

	/**
	 * Get the device's automatic gain control (AGC) status. (NO ARGUMENTS - if arguments are shown, it is a bug in the
	 * doc generator library.)
	 * @return {boolean} current automatic gain control (AGC) status
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's automatic gain control (AGC) status.
	 * @param {boolean} on - true iff AGC should be enabled
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `on` is not a boolean
	 */
	agc(on) {
		this.assertOpen();

		if (typeof on !== 'undefined') {
			librtlsdr.set_agc_mode(this._device, on);
			this._agc = on;
			return this;
		}

		return this._agc;
	}

	/**
	 * Get the device's direct sampling mode. (NO ARGUMENTS - if arguments are shown, it is a bug in the
	 * doc generator library.) Used in conjunction with `centerFreq` when active.
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L304 rtlsdr_set_agc_mode}
	 * @return {number} current direct sampling mode; `0` is off, `1` is I-ADC, `2` is Q-ADC
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's direct sampling mode. Used in conjunction with `centerFreq` when active.
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L304 rtlsdr_set_agc_mode}
	 * @param {number} mode - `0` off, `1` activate I-ADC input, `2` activate Q-ADC input
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} mode is not a number
	 * @throws {RangeError} mode is not `0`, `1`, nor `2`
	 */
	directSampling(mode) {
		this.assertOpen();

		if (typeof mode !== 'undefined') {
			librtlsdr.set_direct_sampling(this._device, mode);
			return this;
		}

		return librtlsdr.get_direct_sampling(this._device);
	}

	/**
	 * Get the device's offset tuning status. (NO ARGUMENTS - if arguments are shown, it is a bug in the
	 * doc generator library.)
	 * @return {boolean} current offset tuning status
	 * @throws {Error} the device is closed
	 */
	
	/**
	 * Set the device's offset tuning status.
	 * @param {boolean} on - true iff offset tuning should be enabled
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 * @throws {TypeError} `on` is not a boolean
	 */
	offsetTuning(on) {
		this.assertOpen();

		if (typeof on !== 'undefined') {
			librtlsdr.set_offset_tuning(this._device, on);
			return this;
		}

		return librtlsdr.get_offset_tuning(this._device);
	}

	/**
	 * Try to synchronously read samples.
	 * @param {number} length - how many bytes to try to read
	 * @return {Buffer} I/Q RF samples; may be fewer than requested
	 * @throws {Error} the device is closed
	 * @throws {TypeError} length (len) is not a number
	 */
	readSync(length) {
		this.assertOpen();
		librtlsdr.reset_buffer(this._device);
		return librtlsdr.read_sync(length);
	}

	/**
	 * Data event, fired every time an asynchronous read returns some samples. Argument is the data buffer.
	 * @event data
	 * @type {Buffer}
	 */

	/**
	 * Error event, fired when asynchronous reading raises an error. Argument is an error message.
	 * @event error
	 * @type {string}
	 */

	/**
	 * Done event, fired when asynchronous reads have finished. No argument.
	 * @event done
	 */

	/**
	 * Deprecated; use `read`. Asynchronously receive samples. This method calls the deprecated `rtlsdr_wait_async`
	 * function in librtlsdr, but _that_ function now simply calls `rtlsdr_read_async` with `0` for `buf_num` and
	 * `buf_len`. Causes this RTLSDR instance to emit `data`, `error`, and/or `done` events.
	 * @see {@link https://github.com/steve-m/librtlsdr/blob/8b4d755ba1b889510fba30f627ee08736203070d/include/rtl-sdr.h#L342 rtlsdr_wait_async}
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 */
	wait() {
		this.assertOpen();
		librtlsdr.reset_buffer(this._device);
		librtlsdr.wait_async(this._device, (ev, arg) => { this.emit(ev, arg); }, bufNum, bufLen);
		return this;
	}

	/**
	 * Asynchronously receive samples. Causes this RTLSDR instance to emit `data`, `error`, and/or `done` events. Total
	 * buffer size per read will be `bufNum * bufLen`. Causes this RTLSDR instance to emit `data`, `error`, and/or
	 * `done` events.
	 * @param {number} [bufNum] - optional librtlsdr buffer count; default is 15 per librtlsdr behavior
	 * @param {number} [bufLen] - optional librtlsdr buffer length; default is (16*32*512) per librtlsdr behavior; must be a multiple of 512, and _should_ be a multiple of 16384
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 */
	read(bufNum, bufLen) {
		this.assertOpen();
		librtlsdr.reset_buffer(this._device);
		librtlsdr.read_async(this._device, (ev, arg) => { this.emit(ev, arg); }, bufNum, bufLen);
		return this;
	}

	/**
	 * Cancel asynchronous reads that were initiated with `read` or `wait`.
	 * @return {RTLSDR} this
	 * @throws {Error} the device is closed
	 */
	cancel() {
		this.assertOpen();
		librtlsdr.cancel_async(this._device);
		return this;
	}
}

/**
 * Get the number of RTLSDR devices present. Does not throw.
 * @return {number} the number of RTLSDR devices present
 */
RTLSDR.deviceCount = () => librtlsdr.get_device_count();

/**
 * Get the string name of the device at the given index.
 * @param {number} index - the device index to get the name of
 * @return {string} the device name string, possibly empty or garbage data is no such device
 * @throws {TypeError} index is not a number
 */
RTLSDR.deviceName = index => librtlsdr.get_device_name(index);

/**
 * Get the USB strings for the device at the given index.
 * @param {number} index - the device index to get the USB strings for
 * @return {USBStrings} possibly garbage data if no such device
 * @throws {TypeError} index is not a number
 */
RTLSDR.usbStrings = index => librtlsdr.get_device_usb_strings(index);

/**
 * Get the device index of the (first) device with the given serial string.
 * @param {string} serial - the serial string to look for
 * @return {?number} the device index requested, if any
 * @throws {TypeError} serial is not a string
 * @throws {Error} the serial string could not be read
 */
RTLSDR.indexBySerial = serial => librtlsdr.get_index_by_serial(serial);

/**
 * Static convenience function to create (and open) a new RTLSDR instance.
 * @param {number} index - the index of the RTLSDR device to open
 * @return {RTLSDR} a new RTLSDR instance for the specified index
 * @throws {TypeError} index is not a number
 */
RTLSDR.open = index => new RTLSDR(index);

/**
 * Convenience method to list all available RTLSDR devices, their names, and their USB strings.
 * @return {object[]} a list of objects (dictionaries) containing device indices, names, and USB strings
 */
RTLSDR.devices = () => {
	const count = RTLSDR.deviceCount();
	const result = [];
	for(let i = 0; i < count; i++) {
		result.push({
			name: RTLSDR.deviceName(i),
			deviceIndex: i,
			usbStrings: RTLSDR.usbStrings(i)
		});
	}
	return result;
}

module.exports = RTLSDR;
