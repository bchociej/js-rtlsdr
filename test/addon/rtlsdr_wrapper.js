const should = require('chai').should();
const rtlsdr = require('bindings')('rtlsdr_mocked.node');

describe('rtlsdr_wrapper addon', () => {
	beforeEach(() => rtlsdr.mock_set_device_count(1));

	describe('get_device_count()', () => {
		it('returns rtlsdr_get_device_count()', () => {
			rtlsdr.get_device_count().should.equal(1);

			rtlsdr.mock_set_device_count(0);
			rtlsdr.get_device_count().should.equal(0);

			rtlsdr.mock_set_device_count(10);
			rtlsdr.get_device_count().should.equal(10);
		});
	});

	describe('get_device_name(index)', () => {
		it('returns rtlsdr_get_device_name(index)', () => {
			rtlsdr.mock_set_device_count(2);
			rtlsdr.get_device_name(0).should.equal('Mock RTLSDR Device #0');
			rtlsdr.get_device_name(1).should.equal('Mock RTLSDR Device #1');
			rtlsdr.get_device_name(2).should.equal('');
		});

		it('throws if index is not a number', () => {
			(() => rtlsdr.get_device_name(true)).should.throw(TypeError);
			(() => rtlsdr.get_device_name('0')).should.throw(TypeError);
			(() => rtlsdr.get_device_name(null)).should.throw(TypeError);
		});
	});

	describe('get_device_usb_strings(index)', () => {
		it('returns rtlsdr_get_device_usb_strings(index)', () => {
			rtlsdr.mock_set_device_count(2);
			let usb;

			usb = rtlsdr.get_device_usb_strings(0);
			usb.vendor.should.equal('Mock');
			usb.product.should.equal('Mock RTLSDR Device');
			usb.serial.should.equal('00000001');

			usb = rtlsdr.get_device_usb_strings(1);
			usb.vendor.should.equal('Mock');
			usb.product.should.equal('Mock RTLSDR Device');
			usb.serial.should.equal('00000002');

			usb = rtlsdr.get_device_usb_strings(2);
			usb.vendor.should.not.equal('Mock');
			usb.product.should.not.equal('Mock RTLSDR Device');
			usb.serial.should.not.equal('00000003');
		});

		it('throws if index is not a number', () => {
			(() => rtlsdr.get_device_usb_strings(true)).should.throw(TypeError);
			(() => rtlsdr.get_device_usb_strings('0')).should.throw(TypeError);
			(() => rtlsdr.get_device_usb_strings(null)).should.throw(TypeError);
		});
	});

	describe('get_index_by_serial(serial)', () => {
		it('returns rtlsdr_get_index_by_serial(serial)', () => {
			rtlsdr.mock_set_device_count(2);
			rtlsdr.get_index_by_serial('00000001').should.equal(0);
			rtlsdr.get_index_by_serial('00000002').should.equal(1);
			should.not.exist(rtlsdr.get_index_by_serial('00000003'));
		});

		it('throws if serial is not a string', () => {
			(() => rtlsdr.get_index_by_serial(true)).should.throw(TypeError);
			(() => rtlsdr.get_index_by_serial(1)).should.throw(TypeError);
			(() => rtlsdr.get_index_by_serial(null)).should.throw(TypeError);
		});
	});

	describe('open(index)', () => {
		it('returns an open rtlsdr_dev_t handle via rtlsdr_open', () => {
			rtlsdr.mock_set_device_count(2);

			const dev0 = rtlsdr.open(0);
			rtlsdr.mock_is_device_handle(dev0).should.equal(true);
			rtlsdr.mock_get_rtlsdr_dev_contents(dev0).should.have.property('index', 0);
			rtlsdr.mock_get_rtlsdr_dev_contents(dev0).should.have.property('open', true);

			const dev1 = rtlsdr.open(1);
			rtlsdr.mock_is_device_handle(dev1).should.equal(true);
			rtlsdr.mock_get_rtlsdr_dev_contents(dev1).should.have.property('index', 1);
			rtlsdr.mock_get_rtlsdr_dev_contents(dev1).should.have.property('open', true);
		});

		it('throws if index does not exist', () => {
			(() => rtlsdr.open(2)).should.throw();
		});
	});

	describe('open-device functions', () => {
		let dev;
		beforeEach(() => {
			dev = rtlsdr.open(0);
		});

		describe('close(dev_hnd)', () => {
			it('closes the rtlsdr_dev_t via rtlsdr_close and invalidates the handle', () => {
				should.not.exist(rtlsdr.close(dev));
				rtlsdr.mock_is_device_handle(dev).should.equal(false);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.close({})).should.throw();
			});

			it('throws if rtlsdr_close errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.close(dev)).should.throw();
			});
		});

		describe('set_xtal_freq(dev_hnd, rtl_freq, tuner_freq)', () => {
			it('sets the device and tuner freqs via rtlsdr_set_xtal_freq', () => {
				let d;

				rtlsdr.set_xtal_freq(dev, 1234000, 3456000);
				d = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				d.rtl_freq.should.equal(1234000);
				d.tuner_freq.should.equal(3456000);

				rtlsdr.set_xtal_freq(dev, 2121000, 3434000);
				d = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				d.rtl_freq.should.equal(2121000);
				d.tuner_freq.should.equal(3434000);
			});

			it('throws if rtl_freq and/or tuner_freq are not numbers', () => {
				(() => rtlsdr.set_xtal_freq(dev, 'hi', 1234000)).should.throw(TypeError);
				(() => rtlsdr.set_xtal_freq(dev, 4321000)).should.throw(TypeError);
				(() => rtlsdr.set_xtal_freq(dev, undefined, true)).should.throw(TypeError);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_xtal_freq({}, 1234000, 4321000)).should.throw();
			});

			it('throws if rtlsdr_set_xtal_freq errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_xtal_freq(dev, 1234000, 4321000)).should.throw();
			});
		});

		describe('get_xtal_freq(dev_hnd)', () => {
			it('returns the device and tuner freqs as an object from rtlsdr_get_xtal_freq', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'rtl_freq', 1231000);
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'tuner_freq', 1232000);

				const x = rtlsdr.get_xtal_freq(dev);
				x.rtl_freq.should.equal(1231000);
				x.tuner_freq.should.equal(1232000);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_xtal_freq({})).should.throw();
			});

			it('throws if rtlsdr_get_xtal_freq errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.get_xtal_freq(dev)).should.throw();
			});
		});

		describe('get_usb_strings(dev_hnd)', () => {
			it('returns the USB strings as an object from rtlsdr_get_usb_strings', () => {
				const u = rtlsdr.get_usb_strings(dev);
				u.should.have.property('vendor', 'Mock');
				u.should.have.property('product', 'Mock RTLSDR Device');
				u.should.have.property('serial', '00000001');
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_usb_strings({})).should.throw();
			});

			it('throws if rtlsdr_get_usb_strings errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.get_usb_strings(dev)).should.throw();
			});
		});

		describe('write_eeprom(dev_hnd, data, offset, len)', () => {
			it('writes the EEPROM data via rtlsdr_write_eeprom', () => {
				const str = 'the quick brown fox jumps over the lazy dog';
				const data = new Buffer(str, 'ascii');

				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'has_eeprom', true);
				rtlsdr.write_eeprom(dev, data, 0, str.length);
				rtlsdr.mock_get_written_eeprom(dev)
					.slice(0, str.length)
					.toString('ascii')
					.should.equal(str);

				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'has_eeprom', true);
				rtlsdr.write_eeprom(dev, data, 20, str.length);
				rtlsdr.mock_get_written_eeprom(dev)
					.slice(20, 20 + str.length)
					.toString('ascii')
					.should.equal(str);

				rtlsdr.mock_get_written_eeprom(dev)
					.slice(0, 20 + str.length)
					.toString('ascii')
					.should.equal(str.substring(0, 20) + str);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.write_eeprom({}, new Buffer([0x1]), 0, 1)).should.throw();
			});

			it('throws if data is not a buffer', () => {
				(() => rtlsdr.write_eeprom(dev, [0x1], 0, 1)).should.throw(TypeError);
			});

			it('throws if offset is not a number', () => {
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), true, 1)).should.throw(TypeError);
			});

			it('throws if offset cannot fit in uint8_t', () => {
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), -1, 1)).should.throw(RangeError);
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), 256, 1)).should.throw(RangeError);
			});

			it('throws if len is not a number', () => {
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), 0, true)).should.throw(TypeError);
			});

			it('throws if len cannot fit in uint16_t', () => {
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), 0, -1)).should.throw(RangeError);
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), 0, 65536)).should.throw(RangeError);
			});

			it('throws if rtlsdr_write_eeprom errors -1', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), 0, 1)).should.throw();
			});

			it('throws if rtlsdr_write_eeprom errors -2', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -2);
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), 0, 1)).should.throw();
			});

			it('throws if rtlsdr_write_eeprom errors -3', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -3);
				(() => rtlsdr.write_eeprom(dev, new Buffer([0x1]), 0, 1)).should.throw();
			});
		});

		describe('read_eeprom(dev_hnd, offset, len)', () => {
			it('returns a buffer of EEPROM contents from rtlsdr_read_eeprom', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'has_eeprom', true);

				rtlsdr.read_eeprom(dev, 0, 37).toString('ascii').should.equal(
					'Mock RTLSDR read_eeprom Contents 0+37'
				);

				rtlsdr.read_eeprom(dev, 23, 38).toString('ascii').should.equal(
					'Mock RTLSDR read_eeprom Contents 23+38'
				);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.read_eeprom({}, 0, 37)).should.throw();
			});

			it('throws if offset is not a number', () => {
				(() => rtlsdr.read_eeprom(dev, true, 1)).should.throw(TypeError);
			});

			it('throws if offset cannot fit in uint8_t', () => {
				(() => rtlsdr.read_eeprom(dev, -1, 1)).should.throw(RangeError);
				(() => rtlsdr.read_eeprom(dev, 256, 1)).should.throw(RangeError);
			});

			it('throws if len is not a number', () => {
				(() => rtlsdr.read_eeprom(dev, 0, true)).should.throw(TypeError);
			});

			it('throws if len cannot fit in uint16_t', () => {
				(() => rtlsdr.read_eeprom(dev, 0, -1)).should.throw(RangeError);
				(() => rtlsdr.read_eeprom(dev, 0, 65536)).should.throw(RangeError);
			});

			it('throws if rtlsdr_read_eeprom errors -1', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.read_eeprom(dev, 0, 10)).should.throw();
			});

			it('throws if rtlsdr_read_eeprom errors -2', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -2);
				(() => rtlsdr.read_eeprom(dev, 0, 10)).should.throw();
			});

			it('throws if rtlsdr_read_eeprom errors -3', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -3);
				(() => rtlsdr.read_eeprom(dev, 0, 10)).should.throw();
			});
		});

		describe('set_center_freq(dev_hnd, center_freq)', () => {
			it('sets the center freq via rtlsdr_set_center_freq', () => {
				let c;

				rtlsdr.set_center_freq(dev, 162550000);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('center_freq', 162550000);

				rtlsdr.set_center_freq(dev, 162123321);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('center_freq', 162123321);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_center_freq({}, 162550000)).should.throw();
			});

			it('throws if rtlsdr_set_center_freq errors' /*
				librtlsdr doesn't specify what error codes mean for rtlsdr_set_center_freq
			*/);
		});

		describe('get_center_freq(dev_hnd)', () => {
			it('returns the center freq from rtlsdr_get_center_freq', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'center_freq', 123456000);
				rtlsdr.get_center_freq(dev).should.equal(123456000);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_center_freq({})).should.throw();
			});

			it('throws if rtlsdr_get_center_freq errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.get_center_freq(dev)).should.throw();
			});
		});

		describe('set_freq_correction(dev_hnd, ppm)', () => {
			it('sets freq correction ppm via rtlsdr_set_freq_correction', () => {
				let c;

				rtlsdr.set_freq_correction(dev, 56);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('freq_correction', 56);

				rtlsdr.set_freq_correction(dev, -2);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('freq_correction', -2);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_freq_correction({})).should.throw();
			});

			it('throws if ppm is not a number', () => {
				(() => rtlsdr.set_freq_correction(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_freq_correction errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_freq_correction(dev)).should.throw();
			});
		});

		describe('get_freq_correction(dev_hnd)', () => {
			it('gets freq correction ppm via rtlsdr_get_freq_correction', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'freq_correction', 20);
				rtlsdr.get_freq_correction(dev).should.equal(20);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_freq_correction({})).should.throw();
			});
		});

		describe('get_tuner_type(dev_hnd)', () => {
			it('returns the tuner enum type string from rtlsdr_get_tuner_type', () => {
				rtlsdr.get_tuner_type(dev).should.equal('RTLSDR_TUNER_R820T');
			});

			it('returns RTLSDR_TUNER_UNKNOWN if dev_hnd is not an open device handle', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'open', false);
				rtlsdr.get_tuner_type(dev).should.equal('RTLSDR_TUNER_UNKNOWN');
			});
		});

		describe('get_tuner_gains(dev_hnd)', () => {
			it('returns an array of tuner gains from rtlsdr_get_tuner_gains', () => {
				rtlsdr.get_tuner_gains(dev).should.eql([0, 10, 20, 30, 40]);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_tuner_gains({})).should.throw();
			});

			it('throws if rtlsdr_get_tuner_gains errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.get_tuner_gains(dev)).should.throw();
			});
		});

		describe('set_tuner_gain(dev_hnd, gain)', () => {
			it('sets the tuner gain via rtlsdr_set_tuner_gain', () => {
				let c;

				rtlsdr.set_tuner_gain(dev, 10);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('tuner_gain', 10);

				rtlsdr.set_tuner_gain(dev, -2);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('tuner_gain', -2);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_tuner_gain({})).should.throw();
			});

			it('throws if gain is not a number', () => {
				(() => rtlsdr.set_tuner_gain(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_tuner_gain errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_tuner_gain(dev)).should.throw();
			});
		});

		describe('set_tuner_bandwidth(dev_hnd, bw)', () => {
			it('sets the tuner bandwidth via rtlsdr_set_tuner_bandwidth', () => {
				let c;

				rtlsdr.set_tuner_bandwidth(dev, 10);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('tuner_bandwidth', 10);

				rtlsdr.set_tuner_bandwidth(dev, 12);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('tuner_bandwidth', 12);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_tuner_bandwidth({})).should.throw();
			});

			it('throws if bw is not a number', () => {
				(() => rtlsdr.set_tuner_bandwidth(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if bw is negative', () => {
				(() => rtlsdr.set_tuner_bandwidth(dev, -2)).should.throw(RangeError);
			});

			it('throws if rtlsdr_set_tuner_bandwidth errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_tuner_bandwidth(dev)).should.throw();
			});
		});

		describe('get_tuner_gain(dev_hnd)', () => {
			it('returns tuner gain from rtlsdr_get_tuner_gain', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'tuner_gain', 10);
				rtlsdr.get_tuner_gain(dev).should.equal(10);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_tuner_gain({})).should.throw();
			});

			it('returns 0 if rtlsdr_get_tuner_gain errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				rtlsdr.get_tuner_gain(dev).should.equal(0);
			});
		});

		describe('set_tuner_if_gain(dev_hnd, stage, gain)', () => {
			it('sets the tuner IF gain via rtlsdr_set_tuner_if_gain', () => {
				let c;

				rtlsdr.set_tuner_if_gain(dev, 0, 10);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('if_gains').that.deep.equals({ 0: 10 });

				rtlsdr.set_tuner_if_gain(dev, 2, 20);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('if_gains').that.deep.equals({ 0: 10, 2: 20 });
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_tuner_if_gain({})).should.throw();
			});

			it('throws if stage is not a number', () => {
				(() => rtlsdr.set_tuner_if_gain(dev, 'hi mom', 10)).should.throw(TypeError);
			});

			it('throws if gain is not a number', () => {
				(() => rtlsdr.set_tuner_if_gain(dev, 3, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_tuner_if_gain errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_tuner_if_gain(dev)).should.throw();
			});
		});

		describe('set_tuner_gain_mode(dev_hnd, manual)', () => {
			it('sets the gain mode via rtlsdr_set_tuner_gain_mode', () => {
				let c;

				rtlsdr.set_tuner_gain_mode(dev, 1);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('tuner_gain_mode', 1);

				rtlsdr.set_tuner_gain_mode(dev, 0);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('tuner_gain_mode', 0);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_tuner_gain_mode({})).should.throw();
			});

			it('throws if manual is not a number', () => {
				(() => rtlsdr.set_tuner_gain_mode(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_tuner_gain_mode errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_tuner_gain_mode(dev)).should.throw();
			});
		});

		describe('set_sample_rate(dev_hnd, rate)', () => {
			it('sets the sample rate via rtlsdr_set_sample_rate', () => {
				let c;

				rtlsdr.set_sample_rate(dev, 2048000);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('sample_rate', 2048000);

				rtlsdr.set_sample_rate(dev, 1960000);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('sample_rate', 1960000);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_sample_rate({})).should.throw();
			});

			it('throws if rate is not a number', () => {
				(() => rtlsdr.set_sample_rate(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_sample_rate errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_sample_rate(dev)).should.throw();
			});
		});

		describe('get_sample_rate(dev_hnd)', () => {
			it('returns the sample rate from rtlsdr_get_sample_rate', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'sample_rate', 2048000);
				rtlsdr.get_sample_rate(dev).should.equal(2048000);

				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'sample_rate', 1960000);
				rtlsdr.get_sample_rate(dev).should.equal(1960000);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_sample_rate({})).should.throw();
			});

			it('throws if rtlsdr_get_sample_rate errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.get_sample_rate(dev)).should.throw();
			});
		});

		describe('set_testmode(dev_hnd, on)', () => {
			it('sets testmode via rtlsdr_set_testmode', () => {
				let c;

				rtlsdr.set_testmode(dev, true);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('testmode', 1);

				rtlsdr.set_testmode(dev, false);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('testmode', 0);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_testmode({})).should.throw();
			});

			it('throws if on is not a boolean', () => {
				(() => rtlsdr.set_testmode(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_testmode errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_testmode(dev)).should.throw();
			});
		});

		describe('set_agc_mode(dev_hnd, on)', () => {
			it('sets the AGC mode via rtlsdr_set_agc_mode', () => {
				let c;

				rtlsdr.set_agc_mode(dev, true);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('agc_mode', 1);

				rtlsdr.set_agc_mode(dev, false);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('agc_mode', 0);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_agc_mode({})).should.throw();
			});

			it('throws if on is not a boolean', () => {
				(() => rtlsdr.set_agc_mode(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_agc_mode errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_agc_mode(dev)).should.throw();
			});
		});

		describe('set_direct_sampling(dev_hnd, mode)', () => {
			it('sets the direct sampling mode via rtlsdr_set_direct_sampling', () => {
				let c;

				rtlsdr.set_direct_sampling(dev, 1);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('direct_sampling', 1);

				rtlsdr.set_direct_sampling(dev, 0);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('direct_sampling', 0);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_direct_sampling({})).should.throw();
			});

			it('throws if mode is not a number', () => {
				(() => rtlsdr.set_direct_sampling(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_direct_sampling errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_direct_sampling(dev)).should.throw();
			});
		});

		describe('get_direct_sampling(dev_hnd)', () => {
			it('returns the direct sampling mode from rtlsdr_get_direct_sampling', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'direct_sampling', 1);
				rtlsdr.get_direct_sampling(dev).should.equal(1);

				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'direct_sampling', 0);
				rtlsdr.get_direct_sampling(dev).should.equal(0);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_direct_sampling({})).should.throw();
			});

			it('throws if rtlsdr_get_direct_sampling errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.get_direct_sampling(dev)).should.throw();
			});
		});

		describe('set_offset_tuning(dev_hnd, on)', () => {
			it('sets offset tuning via rtlsdr_set_offset_tuning', () => {
				let c;

				rtlsdr.set_offset_tuning(dev, true);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('offset_tuning', 1);

				rtlsdr.set_offset_tuning(dev, false);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('offset_tuning', 0);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.set_offset_tuning({})).should.throw();
			});

			it('throws if on is not a boolean', () => {
				(() => rtlsdr.set_offset_tuning(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_set_offset_tuning errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.set_offset_tuning(dev)).should.throw();
			});
		});

		describe('get_offset_tuning(dev_hnd)', () => {
			it('returns offset tuning from rtlsdr_get_offset_tuning', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'offset_tuning', 1);
				rtlsdr.get_offset_tuning(dev).should.equal(true);

				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'offset_tuning', 0);
				rtlsdr.get_offset_tuning(dev).should.equal(false);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.get_offset_tuning({})).should.throw();
			});

			it('throws if rtlsdr_get_offset_tuning errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.get_offset_tuning(dev)).should.throw();
			});
		});

		describe('reset_buffer(dev_hnd)', () => {
			it('resets the device buffer state via rtlsdr_reset_buffer', () => {
				let c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('buffer_ready', false);

				rtlsdr.reset_buffer(dev);
				c = rtlsdr.mock_get_rtlsdr_dev_contents(dev);
				c.should.have.property('buffer_ready', true);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.reset_buffer({})).should.throw();
			});

			it('throws if rtlsdr_reset_buffer errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.reset_buffer(dev)).should.throw();
			});
		});

		describe('read_sync(dev_hnd, len)', () => {
			it('reads data via rtlsdr_read_sync', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);

				let buf = rtlsdr.read_sync(dev, 20);
				buf.toString('ascii').should.equal('dddddddddddddddddddd');

				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_sync_read_discount', 5);
				buf = rtlsdr.read_sync(dev, 10);
				buf.toString('ascii').should.equal('ddddd');
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.read_sync({})).should.throw();
			});

			it('throws if len is not a number', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);
				(() => rtlsdr.read_sync(dev, 'hi mom')).should.throw(TypeError);
			});

			it('throws if rtlsdr_read_sync errors -1', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.read_sync(dev, 10)).should.throw();
			});

			it('throws if rtlsdr_read_sync errors -8', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -8);
				(() => rtlsdr.read_sync(dev, 10)).should.throw();
			});
		});

		describe('wait_async(dev_hnd, listener)', () => {
			it('emits reads via rtlsdr_wait_async', (done) => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);

				const bufs = [];
				let gotDoneEvent = false;

				rtlsdr.wait_async(dev, (ev, data) => {
					switch (ev) {
					case 'data':
						gotDoneEvent.should.equal(false);
						bufs.push(data);
						if (bufs.length === 2) rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', false);
						break;
					case 'done':
						gotDoneEvent = true;

						bufs.forEach((buf) => {
							buf.length.should.equal(15 * 512);
							buf.forEach(x => x.should.equal('d'.charCodeAt(0)));
						});

						done();
						break;
					default: done('should not have reached default case');
					}
				});
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.wait_async({}, (() => {}))).should.throw();
			});

			it('throws if listener is not a function', () => {
				(() => rtlsdr.wait_async({}, 'hi mom')).should.throw(TypeError);
			});

			it('emits an error if rtlsdr_wait_async errors right away', (done) => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				rtlsdr.wait_async(dev, (ev) => {
					ev.should.equal('error');
					done();
				});
			});

			it('emits an error if rtlsdr_wait_async errors after some reads', (done) => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);

				let bufCount = 0;
				rtlsdr.wait_async(dev, (ev) => {
					switch (ev) {
					case 'data':
						if (++bufCount === 5) rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
						break;
					case 'error':
						done();
						break;
					default: done('should not have reached default case');
					}
				});
			});
		});

		describe('read_async(dev_hnd, listener, buf_num, buf_len)', () => {
			it('emits reads via rtlsdr_read_async', (done) => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);

				const bufs = [];
				let gotDoneEvent = false;

				rtlsdr.read_async(dev, (ev, data) => {
					switch (ev) {
					case 'data':
						gotDoneEvent.should.equal(false);
						bufs.push(data);
						if (bufs.length === 2) rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', false);
						break;
					case 'done':
						gotDoneEvent = true;

						bufs.forEach((buf) => {
							buf.length.should.equal(5 * 1024);
							buf.forEach(x => x.should.equal('d'.charCodeAt(0)));
						});

						done();
						break;
					default: done('should not have reached default case');
					}
				}, 5, 1024);
			});

			it('defaults buf_num and buf_len to 0', (done) => {
				// buf_num of 0 --> 15 buffers
				// buf_len of 0 --> DEFAULT_BUFFER_SIZE = 512
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);

				let bufCount = 0;
				rtlsdr.read_async(dev, (ev, data) => {
					switch (ev) {
					case 'data':
						if (++bufCount === 2) rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', false);
						data.length.should.equal(15 * 512);
						break;
					case 'done':
						done();
						break;
					default: done('should not have reached default case');
					}
				});
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.read_async({}, (() => {}))).should.throw();
			});

			it('throws if listener is not a function', () => {
				(() => rtlsdr.read_async({}, 'hi mom')).should.throw(TypeError);
			});

			it('emits an error if rtlsdr_read_async errors right away', (done) => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				rtlsdr.read_async(dev, (ev) => {
					ev.should.equal('error');
					done();
				});
			});

			it('emits an error if rtlsdr_read_async errors after some reads', (done) => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);

				let bufCount = 0;
				rtlsdr.read_async(dev, (ev) => {
					switch (ev) {
					case 'data':
						if (++bufCount === 5) rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
						break;
					case 'error':
						done();
						break;
					default: done('should not have reached default case');
					}
				});
			});
		});

		describe('cancel_async(dev_hnd)', () => {
			it('cancels async reads via rtlsdr_cancel_async', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'buffer_ready', true);
				rtlsdr.cancel_async(dev);
				rtlsdr.mock_get_rtlsdr_dev_contents(dev).should.have.property('buffer_ready', false);
			});

			it('throws if dev_hnd is not an open device handle', () => {
				(() => rtlsdr.cancel_async({})).should.throw();
			});

			it('throws if rtlsdr_cancel_async errors', () => {
				rtlsdr.mock_set_rtlsdr_dev_contents(dev, 'mock_return_error', -1);
				(() => rtlsdr.cancel_async(dev)).should.throw();
			});
		});
	});
});
