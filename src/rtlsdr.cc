#include <iostream>
#include <rtl-sdr.h>
#include <node_buffer.h>

#include "rtlsdr.h"
#include "js_rtlsdr.h"

using v8::Local;
using v8::Object;
using v8::Value;

// get_device_count() => int
NAN_METHOD(get_device_count) {
	JS_RTLSDR_RETURN(rtlsdr_get_device_count());
}

// get_device_name(index:int) => string
NAN_METHOD(get_device_name) {
	Local<Value> index = info[0];

	if(!index->IsNumber())
		return Nan::ThrowTypeError("index must be a numeric device index");

	const char * name = rtlsdr_get_device_name(Nan::To<uint32_t>(index).FromJust());
	JS_RTLSDR_RETURN(Nan::New(name).ToLocalChecked());
}

// get_device_usb_strings(index:int) => {vendor:string, product:string, serial:string}
NAN_METHOD(get_device_usb_strings) {
	Local<Value> index = info[0];

	if(!index->IsNumber())
		return Nan::ThrowTypeError("index must be a numeric device index");

	char manufact[256], product[256], serial[256];

	const int err = rtlsdr_get_device_usb_strings(
		Nan::To<uint32_t>(index).FromJust(),
		manufact,
		product,
		serial
	);

	JS_RTLSDR_CHECK_ERR("rtlsdr_get_device_usb_strings");

	Local<Object> usb_strs = Nan::New<Object>();
	Nan::Set(usb_strs, Nan::New("vendor").ToLocalChecked(),  Nan::New(manufact).ToLocalChecked());
	Nan::Set(usb_strs, Nan::New("product").ToLocalChecked(), Nan::New(product).ToLocalChecked());
	Nan::Set(usb_strs, Nan::New("serial").ToLocalChecked(),  Nan::New(serial).ToLocalChecked());

	JS_RTLSDR_RETURN(usb_strs);
}

// get_index_by_serial(serial:string) => (null|int)
NAN_METHOD(get_index_by_serial) {
	Local<Value> serial = info[0];

	if(!serial->IsString())
		return Nan::ThrowTypeError("serial must be a string");

	char * s_serial = *(Nan::Utf8String(serial));

	if(s_serial == NULL)
		return Nan::ThrowError("could not read the argument as a string");

	int result = rtlsdr_get_index_by_serial(s_serial);

	if(result < 0)
		JS_RTLSDR_RETURN(Nan::Null());
	else
		JS_RTLSDR_RETURN(Nan::New(result));
}

// open(index:int) => DeviceHandle
NAN_METHOD(open) {
	Local<Value> index = info[0];

	if(!index->IsNumber())
		return Nan::ThrowTypeError("index must be a numeric device index");

	rtlsdr_dev_t * rtl_dev;
	const int err = rtlsdr_open(&rtl_dev, Nan::To<uint32_t>(index).FromJust());
	JS_RTLSDR_CHECK_ERR("rtlsdr_open");

	// store the rtlsdr_dev_t pointer in a special "internal field" on the returned Object
	v8::Isolate * isolate = Nan::GetCurrentContext()->GetIsolate();
	Local<v8::ObjectTemplate> DeviceHandle = v8::ObjectTemplate::New(isolate);
	DeviceHandle->SetInternalFieldCount(1);
	Local<Object> dev_hnd = DeviceHandle->NewInstance();
	Nan::SetInternalFieldPointer(dev_hnd, /* internal field index = */ 0, rtl_dev);

	JS_RTLSDR_RETURN(dev_hnd);
}

// close(dev_hnd:DeviceHandle)
NAN_METHOD(close) {
	Local<Value> dev_hnd = info[0];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	const int err = rtlsdr_close(rtl_dev);
	JS_RTLSDR_CHECK_ERR("rtlsdr_close");

	// make the handle non-usable hereafter
	Nan::SetInternalFieldPointer(Nan::To<Object>(info[0]).ToLocalChecked(),
	                             /* internal field index = */ 0,
	                             (void *) NULL);

	//free(rtl_dev);
}

// set_xtal_freq(dev_hnd:DeviceHandle, rtl_freq:int, tuner_freq:int)
NAN_METHOD(set_xtal_freq) {
	Local<Value> dev_hnd    = info[0],
	             rtl_freq   = info[1],
	             tuner_freq = info[2];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!rtl_freq->IsNumber())
		return Nan::ThrowTypeError("rtl_freq must be a number");

	if(!tuner_freq->IsNumber())
		return Nan::ThrowTypeError("tuner_freq must be a number");

	const int err = rtlsdr_set_xtal_freq(rtl_dev,
	                                     Nan::To<uint32_t>(rtl_freq).FromJust(),
	                                     Nan::To<uint32_t>(tuner_freq).FromJust());

	JS_RTLSDR_CHECK_ERR("rtlsdr_set_xtal_freq");
}

// get_xtal_freq(dev_hnd:DeviceHandle) => {rtl_freq:int, tuner_freq:int}
NAN_METHOD(get_xtal_freq) {
	Local<Value> dev_hnd = info[0];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	uint32_t rtl_freq, tuner_freq;

	const int err = rtlsdr_get_xtal_freq(rtl_dev, &rtl_freq, &tuner_freq);
	JS_RTLSDR_CHECK_ERR("rtlsdr_get_xtal_freq");

	Local<Object> xtalFreqs = Nan::New<Object>();
	Nan::Set(xtalFreqs, Nan::New("rtl_freq").ToLocalChecked(),   Nan::New(rtl_freq));
	Nan::Set(xtalFreqs, Nan::New("tuner_freq").ToLocalChecked(), Nan::New(tuner_freq));

	JS_RTLSDR_RETURN(xtalFreqs);
}

// get_usb_strings(dev_hnd:DeviceHandle) => {vendor:string, product:string, serial:string}
NAN_METHOD(get_usb_strings) {
	Local<Value> dev_hnd = info[0];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	char manufact[256], product[256], serial[256];

	const int err = rtlsdr_get_usb_strings(rtl_dev, manufact, product, serial);
	JS_RTLSDR_CHECK_ERR("rtlsdr_get_usb_strings");

	Local<Object> usb_strs = Nan::New<Object>();
	Nan::Set(usb_strs, Nan::New("vendor").ToLocalChecked(),  Nan::New(manufact).ToLocalChecked());
	Nan::Set(usb_strs, Nan::New("product").ToLocalChecked(), Nan::New(product).ToLocalChecked());
	Nan::Set(usb_strs, Nan::New("serial").ToLocalChecked(),  Nan::New(serial).ToLocalChecked());

	JS_RTLSDR_RETURN(usb_strs);
}

// write_eeprom(dev_hnd:DeviceHandle, data:Buffer, offset:int, len:int)
NAN_METHOD(write_eeprom) {
	Local<Value> dev_hnd = info[0],
	             data    = info[1],
	             offset  = info[2],
	             len     = info[3];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!node::Buffer::HasInstance(data))
		return Nan::ThrowTypeError("data must be a Buffer");

	if(!offset->IsNumber())
		return Nan::ThrowTypeError("offset must be a number");

	int64_t i_offset = Nan::To<int64_t>(offset).FromJust();
	if(i_offset < 0 || i_offset >= 1<<8)
		return Nan::ThrowRangeError("offset should be an integer value from 0-255");

	if(!len->IsNumber())
		return Nan::ThrowTypeError("len must be a number");

	int64_t i_len = Nan::To<int64_t>(len).FromJust();
	if(i_len < 0 || i_len > 1<<16)
	return Nan::ThrowRangeError("len should be an integer value from 0-65535");

	uint8_t * ua_data = (uint8_t *) node::Buffer::Data(data);
	const int err = rtlsdr_write_eeprom(rtl_dev,
	                                    ua_data,
	                                    (uint8_t) i_offset,
	                                    (uint16_t) i_len);
	switch(err) {
		case -1:
			return Nan::ThrowError("rtlsdr_write_eeprom: the device handle is invalid (error -1)");
		case -2:
			return Nan::ThrowError("rtlsdr_write_eeprom: the EEPROM size is exceeded (error -2)");
		case -3:
			return Nan::ThrowError("rtlsdr_write_eeprom: no EEPROM was found (error -3)");
		default:
			JS_RTLSDR_CHECK_ERR("rtlsdr_write_eeprom");
	}
}

// read_eeprom(dev_hnd:DeviceHandle, offset:int, len:int) => Buffer
NAN_METHOD(read_eeprom) {
	Local<Value> dev_hnd = info[0],
	             offset  = info[1],
	             len     = info[2];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!offset->IsNumber())
		return Nan::ThrowTypeError("offset must be a number");

	int64_t i_offset = Nan::To<int64_t>(offset).FromJust();
	if(i_offset < 0 || i_offset >= 1<<8)
		return Nan::ThrowRangeError("offset should be an integer value from 0-255");

	if(!len->IsNumber())
		return Nan::ThrowTypeError("len must be a number");

	int64_t i_len = Nan::To<int64_t>(len).FromJust();
	if(i_len < 0 || i_len >= 1<<16)
		return Nan::ThrowRangeError("len should be an integer value from 0-65535");

	uint8_t * data = new uint8_t[i_len];

	const int err = rtlsdr_read_eeprom(rtl_dev, data, (uint8_t) i_offset, (uint16_t) i_len);
	switch(err) {
		case -1:
			return Nan::ThrowError("rtlsdr_read_eeprom: the device handle is invalid (error -1)");
		case -2:
			return Nan::ThrowError("rtlsdr_read_eeprom: the EEPROM size is exceeded (error -2)");
		case -3:
			return Nan::ThrowError("rtlsdr_read_eeprom: no EEPROM was found (error -3)");
		default:
			JS_RTLSDR_CHECK_ERR("rtlsdr_read_eeprom");
	}

	JS_RTLSDR_RETURN(Nan::NewBuffer((char *) data, (uint32_t) i_len).ToLocalChecked());
}

// set_center_freq(dev_hnd:DeviceHandle, center_freq:int)
NAN_METHOD(set_center_freq) {
	Local<Value> dev_hnd     = info[0],
	             center_freq = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!center_freq->IsNumber())
		return Nan::ThrowTypeError("center_freq must be a number");

	uint32_t u_center_freq = Nan::To<uint32_t>(center_freq).FromJust();
	rtlsdr_set_center_freq(rtl_dev, u_center_freq);
}

// get_center_freq(dev_hnd:DeviceHandle) => int
NAN_METHOD(get_center_freq) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	uint32_t result = rtlsdr_get_center_freq(rtl_dev);

	if(result == 0)
		return Nan::ThrowError("an error occurred in rtlsdr_get_center_freq - maybe no center_freq set yet");
	else
		JS_RTLSDR_RETURN(Nan::New(result));
}

// set_freq_correction(dev_hnd:DeviceHandle, ppm:int)
NAN_METHOD(set_freq_correction) {
	Local<Value> dev_hnd = info[0],
				 ppm     = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!ppm->IsNumber())
		return Nan::ThrowTypeError("ppm must be a number");

	int i_ppm = Nan::To<int>(ppm).FromJust();
	rtlsdr_set_freq_correction(rtl_dev, i_ppm);
}

// get_freq_correction(dev_hnd:DeviceHandle) => ppm:int
NAN_METHOD(get_freq_correction) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	uint32_t result = rtlsdr_get_freq_correction(rtl_dev);
	JS_RTLSDR_RETURN(Nan::New(result));
}

// get_tuner_type(dev_hnd:DeviceHandle) => string
NAN_METHOD(get_tuner_type) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	enum rtlsdr_tuner tuner_type = rtlsdr_get_tuner_type(rtl_dev);

	std::string s_tuner_type = "";
	switch(tuner_type) {
		case RTLSDR_TUNER_UNKNOWN: s_tuner_type = "RTLSDR_TUNER_UNKNOWN"; break;
		case RTLSDR_TUNER_E4000:   s_tuner_type = "RTLSDR_TUNER_E4000"; break;
		case RTLSDR_TUNER_FC0012:  s_tuner_type = "RTLSDR_TUNER_FC0012"; break;
		case RTLSDR_TUNER_FC0013:  s_tuner_type = "RTLSDR_TUNER_FC0013"; break;
		case RTLSDR_TUNER_FC2580:  s_tuner_type = "RTLSDR_TUNER_FC2580"; break;
		case RTLSDR_TUNER_R820T:   s_tuner_type = "RTLSDR_TUNER_R820T"; break;
		case RTLSDR_TUNER_R828D:   s_tuner_type = "RTLSDR_TUNER_R828D"; break;
	}

	if(s_tuner_type.length() != 0)
		JS_RTLSDR_RETURN(Nan::New(s_tuner_type).ToLocalChecked());
	else
		JS_RTLSDR_RETURN(Nan::Undefined());
}

// get_tuner_gains(dev_hnd:DeviceHandle) => [int] (array of integer gains expressed in cB)
NAN_METHOD(get_tuner_gains) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);
	int err;

	err = rtlsdr_get_tuner_gains(rtl_dev, NULL);
	JS_RTLSDR_CHECK_ERR("rtlsdr_get_tuner_gains");

	const size_t num_gains = (size_t) err;
	Local<v8::Array> gains = Nan::New<v8::Array>(num_gains);

	if(num_gains > 0) {
		int i_gains[num_gains];
		err = rtlsdr_get_tuner_gains(rtl_dev, i_gains);
		JS_RTLSDR_CHECK_ERR("rtlsdr_get_tuner_gains");

		for(size_t i = 0; i < num_gains; i++)
			gains->Set(i, Nan::New(i_gains[i]));
	}

	JS_RTLSDR_RETURN(gains);
}

// set_tuner_gain(dev_hnd:DeviceHandle, gain:int)
NAN_METHOD(set_tuner_gain) {
	Local<Value> dev_hnd = info[0],
	             gain    = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!gain->IsNumber())
		return Nan::ThrowTypeError("gain must be a number");

	int i_gain = Nan::To<int>(gain).FromJust();
	const int err = rtlsdr_set_tuner_gain(rtl_dev, i_gain);
	JS_RTLSDR_CHECK_ERR("rtlsdr_set_tuner_gain");
}

// set_tuner_bandwidth(dev_hnd:DeviceHandle, bw:int)
// 0 bw means automatic gain
NAN_METHOD(set_tuner_bandwidth) {
	Local<Value> dev_hnd = info[0],
	             bw      = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!bw->IsNumber())
		return Nan::ThrowTypeError("bw must be a number");

	int i_bw = Nan::To<int>(bw).FromJust();
	const int err = rtlsdr_set_tuner_gain(rtl_dev, i_bw);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_tuner_gain");
}

// get_tuner_gain(dev_hnd:DeviceHandle) => int (expressed in cB)
NAN_METHOD(get_tuner_gain) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	int gain = rtlsdr_get_tuner_gain(rtl_dev);
	JS_RTLSDR_RETURN(Nan::New(gain));
}

// set_tuner_if_gain(dev_hnd:DeviceHandle, stage:int, gain:int)
NAN_METHOD(set_tuner_if_gain) {
	Local<Value> dev_hnd = info[0],
	             stage   = info[1],
	             gain    = info[2];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!stage->IsNumber())
		return Nan::ThrowTypeError("stage must be a number");

	if(!gain->IsNumber())
		return Nan::ThrowTypeError("gain must be a number");

	int i_stage = Nan::To<int>(stage).FromJust();
	int i_gain = Nan::To<int>(gain).FromJust();

	const int err = rtlsdr_set_tuner_if_gain(rtl_dev, i_stage, i_gain);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_tuner_if_gain");
}

// set_tuner_gain_mode(dev_hnd:DeviceHandle, mode:int)
NAN_METHOD(set_tuner_gain_mode) {
	Local<Value> dev_hnd = info[0],
	             manual  = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!manual->IsNumber())
		return Nan::ThrowTypeError("mode must be a number");

	int i_mode = Nan::To<int>(manual).FromJust();
	const int err = rtlsdr_set_tuner_gain_mode(rtl_dev, i_mode);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_tuner_gain_mode");
}

// set_sample_rate(dev_hnd:DeviceHandle, rate:int)
// per librtlsdr docs, valid values are 225001-300000, 900001-3200000
// and sample loss is to be expected > 2400000
NAN_METHOD(set_sample_rate) {
	Local<Value> dev_hnd   = info[0],
	             samp_rate = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!samp_rate->IsNumber())
		return Nan::ThrowTypeError("samp_rate must be a number");

	uint32_t u_samp_rate = Nan::To<uint32_t>(samp_rate).FromJust();
	const int err = rtlsdr_set_sample_rate(rtl_dev, u_samp_rate);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_sample_rate");
}

// get_sample_rate(dev_hnd:DeviceHandle) => int
NAN_METHOD(get_sample_rate) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	const uint32_t samp_rate = rtlsdr_get_sample_rate(rtl_dev);

	if(samp_rate == 0)
		return Nan::ThrowError("an error occurred in rtlsdr_get_sample_rate");
	else
		JS_RTLSDR_RETURN(Nan::New(samp_rate));
}

// set_testmode(dev_hnd:DeviceHandle, on:bool)
NAN_METHOD(set_testmode) {
	Local<Value> dev_hnd = info[0],
	             on      = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!on->IsBoolean())
		return Nan::ThrowTypeError("on must be a boolean");

	bool b_on = Nan::To<bool>(on).FromJust();
	const int err = rtlsdr_set_testmode(rtl_dev, b_on ? 1 : 0);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_testmode");
}

// set_agc_mode(dev_hnd:DeviceHandle, on:bool)
NAN_METHOD(set_agc_mode) {
	Local<Value> dev_hnd = info[0],
	             on      = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!on->IsBoolean())
		return Nan::ThrowTypeError("on must be a boolean");

	bool b_on = Nan::To<bool>(on).FromJust();
	const int err = rtlsdr_set_agc_mode(rtl_dev, b_on ? 1 : 0);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_agc_mode");
}

// set_direct_sampling(dev_hnd:DeviceHandle, mode:int)
NAN_METHOD(set_direct_sampling) {
	Local<Value> dev_hnd = info[0],
	             mode    = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!mode->IsNumber())
		return Nan::ThrowTypeError("mode must be a number");

	int i_mode = Nan::To<int>(mode).FromJust();
	if(i_mode < 0 || i_mode > 2)
		return Nan::ThrowRangeError("mode must be 0 (off), 1 (I-ADC input), or 2 (Q-ADC input)");

	const int err = rtlsdr_set_direct_sampling(rtl_dev, i_mode);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_direct_sampling");
}

// get_direct_sampling(dev_hnd:DeviceHandle) => int
NAN_METHOD(get_direct_sampling) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	const int mode = rtlsdr_get_direct_sampling(rtl_dev), err = mode;
	JS_RTLSDR_CHECK_ERR("rtlsdr_get_direct_sampling");
	JS_RTLSDR_RETURN(Nan::New(mode));
}

// set_offset_tuning(dev_hnd:DeviceHandle, on:bool)
NAN_METHOD(set_offset_tuning) {
	Local<Value> dev_hnd = info[0],
	             on      = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!on->IsBoolean())
		return Nan::ThrowTypeError("on must be a boolean");

	bool b_on = Nan::To<bool>(on).FromJust();
	const int err = rtlsdr_set_offset_tuning(rtl_dev, b_on ? 1 : 0);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_set_offset_tuning");
}

// get_offset_tuning(dev_hnd:DeviceHandle) => bool
NAN_METHOD(get_offset_tuning) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	const int mode = rtlsdr_get_direct_sampling(rtl_dev), err = mode;
	JS_RTLSDR_CHECK_ERR("rtlsdr_get_direct_sampling");
	JS_RTLSDR_RETURN(mode == 1 ? Nan::True() : Nan::False());
}

// reset_buffer(dev_hnd:DeviceHandle)
NAN_METHOD(reset_buffer) {
	Local<Value> dev_hnd = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	const int err = rtlsdr_reset_buffer(rtl_dev);
	JS_RTLSDR_CHECK_ERR("rtlsdr_reset_buffer");
}

// read_sync(dev_hnd:DeviceHandle, len:int) => Buffer
NAN_METHOD(read_sync) {
	Local<Value> dev_hnd = info[0],
	             len     = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!len->IsNumber())
		return Nan::ThrowTypeError("len must be a number");

	int i_len = Nan::To<int>(len).FromJust();
	unsigned char * data = new unsigned char[i_len];
	int num_read = -1;

	const int err = rtlsdr_read_sync(rtl_dev, (void *) data, i_len, &num_read);
	if(err < 0) delete [] data;
	JS_RTLSDR_CHECK_ERR("rtlsdr_read_sync");

	JS_RTLSDR_RETURN(Nan::NewBuffer((char *) data, (uint32_t) num_read).ToLocalChecked());
}

// DEPRECATED IN LIBRTLSDR
// wait_async(dev_hnd:DeviceHandle, listener:function(event, args...))
// listener events: 'data' -> Buffer, 'error', -> msg:string, 'done'
NAN_METHOD(wait_async) {
	Local<Value> dev_hnd  = info[0],
	             listener = info[1];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!listener->IsFunction())
		return Nan::ThrowTypeError("listener must be a function");

	sample_reader_work_t * work = new sample_reader_work_t();
	work->rtl_dev = rtl_dev;
	work->wait    = true;

	Nan::Callback * cb_listener = new Nan::Callback(listener.As<v8::Function>());
	Nan::AsyncQueueWorker(new SampleReader(cb_listener, work));
}

// read_async(dev_hnd:DeviceHandle, listener:function(event, args...), buf_num:int = 0, buf_len:int = 0)
// listener events: 'data' -> Buffer, 'error', -> msg:string, 'done'
NAN_METHOD(read_async) {
	Local<Value> dev_hnd  = info[0],
	             listener = info[1],
	             buf_num  = info[2],
	             buf_len  = info[3];

	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	if(!listener->IsFunction())
		return Nan::ThrowTypeError("listener must be a function");

	sample_reader_work_t * work = new sample_reader_work_t();
	work->rtl_dev = rtl_dev;
	work->buf_num = Nan::To<uint32_t>(buf_num).FromMaybe(0);
	work->buf_len = Nan::To<uint32_t>(buf_len).FromMaybe(0);
	work->wait    = true;

	Nan::Callback * cb_listener = new Nan::Callback(listener.As<v8::Function>());
	Nan::AsyncQueueWorker(new SampleReader(cb_listener, work));
}

// cancel_async(dev_hnd:DeviceHandle)
NAN_METHOD(cancel_async) {
	Local<Value> dev_hnd  = info[0];
	rtlsdr_dev_t * rtl_dev = get_dev(dev_hnd);
	JS_RTLSDR_CHECK_DEV(rtl_dev);

	const int err = rtlsdr_cancel_async(rtl_dev);
	JS_RTLSDR_CHECK_ERR_NONZERO("rtlsdr_cancel_async");
}
