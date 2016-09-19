#include "rtlsdr.h"
#include <rtl-sdr.h>

/* TODO: move non-API stuff into a utility file */

rtlsdr_dev_t * getDeviceStruct(v8::Local<v8::Value> deviceHandleArg) {
	if(!deviceHandleArg->IsObject()) return NULL;

	v8::Local<v8::Object> deviceHandle = deviceHandleArg->ToObject();
	if(deviceHandle->InternalFieldCount() != 1) return NULL;

	return (rtlsdr_dev_t *) Nan::GetInternalFieldPointer(deviceHandle, 0);
}

#define JS_RTLSDR_CHECK_DEV(hnd) if(hnd == NULL) \
	return Nan::ThrowTypeError("the argument must be a currently-open handle (from .open())");

#define JS_RTLSDR_RETURN(thing) info.GetReturnValue().Set(thing)

/* /non-API bits */



NAN_METHOD(get_device_count) {
	JS_RTLSDR_RETURN(rtlsdr_get_device_count());
}

NAN_METHOD(get_device_name) {
	if(!info[0]->IsNumber())
		return Nan::ThrowTypeError("the argument must be a numeric device index");

	const char * name = rtlsdr_get_device_name(info[0]->Uint32Value());

	JS_RTLSDR_RETURN(Nan::New(name).ToLocalChecked());
}

NAN_METHOD(get_device_usb_strings) {
	if(!info[0]->IsNumber())
		return Nan::ThrowTypeError("the argument must be a numeric device index");

	char manufact[256], product[256], serial[256];

	const int err = rtlsdr_get_device_usb_strings(
		info[0]->Uint32Value(),
		manufact,
		product,
		serial
	);

	if(err != 0) {
		std::string errmsg = "rtlsdr_get_device_usb_strings failed with code " + std::to_string(err);
		return Nan::ThrowError(errmsg.c_str());
	}

	v8::Local<v8::Object> usbStrings = Nan::New<v8::Object>();
	Nan::Set(usbStrings, Nan::New("vendor").ToLocalChecked(),  Nan::New(manufact).ToLocalChecked());
	Nan::Set(usbStrings, Nan::New("product").ToLocalChecked(), Nan::New(product).ToLocalChecked());
	Nan::Set(usbStrings, Nan::New("serial").ToLocalChecked(),  Nan::New(serial).ToLocalChecked());

	JS_RTLSDR_RETURN(usbStrings);
}

NAN_METHOD(get_index_by_serial) {
	if(!info[0]->IsString())
		return Nan::ThrowTypeError("the argument must be a string");

	Nan::Utf8String serialStr(info[0]->ToString());
	int result = rtlsdr_get_index_by_serial(*serialStr);

	if(result < 0)
		JS_RTLSDR_RETURN(Nan::Null());
	else
		JS_RTLSDR_RETURN(Nan::New(result));
}

NAN_METHOD(open) {
	if(!info[0]->IsNumber())
		return Nan::ThrowTypeError("the argument must be a numeric device index");

	rtlsdr_dev_t * rtlsdrDev;

	int err = rtlsdr_open(&rtlsdrDev, info[0]->Uint32Value());
	if(err < 0) {
		std::string errmsg = "rtlsdr_open failed with code " + std::to_string(err);
		return Nan::ThrowError(errmsg.c_str());
	}

	v8::Local<v8::ObjectTemplate> DeviceHandle = v8::ObjectTemplate::New();
	DeviceHandle->SetInternalFieldCount(1);

	v8::Local<v8::Object> deviceHandle = DeviceHandle->NewInstance();
	Nan::SetInternalFieldPointer(deviceHandle, 0, rtlsdrDev);

	JS_RTLSDR_RETURN(deviceHandle);
}

NAN_METHOD(close) {
	rtlsdr_dev_t * rtlsdrDev = getDeviceStruct(info[0]);
	JS_RTLSDR_CHECK_DEV(rtlsdrDev);

	int err = rtlsdr_close(rtlsdrDev);
	Nan::SetInternalFieldPointer(info[0]->ToObject(), 0, (void *) 0);

	if(err != 0) {
		std::string errmsg = "rtlsdr_close failed with code " + std::to_string(err);
		return Nan::ThrowError(errmsg.c_str());
	}
}

NAN_METHOD(set_xtal_freq) {
	rtlsdr_dev_t * rtlsdrDev = getDeviceStruct(info[0]);
	JS_RTLSDR_CHECK_DEV(rtlsdrDev);

	if(!info[1]->IsNumber())
		return Nan::ThrowTypeError("the second argument must be a number");

	if(!info[2]->IsNumber())
		return Nan::ThrowTypeError("the second argument must be a number");

	int err = rtlsdr_set_xtal_freq(rtlsdrDev, info[1]->Uint32Value(), info[2]->Uint32Value());

	if(err != 0) {
		std::string errmsg = "rtlsdr_set_xtal_freq failed with code " + std::to_string(err);
		return Nan::ThrowError(errmsg.c_str());
	}
}

NAN_METHOD(get_xtal_freq) {
	rtlsdr_dev_t * rtlsdrDev = getDeviceStruct(info[0]);
	JS_RTLSDR_CHECK_DEV(rtlsdrDev);

	uint32_t rtl_freq, tuner_freq;
	int err = rtlsdr_get_xtal_freq(rtlsdrDev, &rtl_freq, &tuner_freq);

	if(err != 0) {
		std::string errmsg = "rtlsdr_get_xtal_freq failed with code " + std::to_string(err);
		return Nan::ThrowError(errmsg.c_str());
	}

	v8::Local<v8::Object> xtalFreqs = Nan::New<v8::Object>();
	Nan::Set(xtalFreqs, Nan::New("rtl_freq").ToLocalChecked(),   Nan::New(rtl_freq));
	Nan::Set(xtalFreqs, Nan::New("tuner_freq").ToLocalChecked(), Nan::New(tuner_freq));

	JS_RTLSDR_RETURN(xtalFreqs);
}

NAN_METHOD(get_usb_strings) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(write_eeprom) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(read_eeprom) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_center_freq) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_center_freq) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_freq_correction) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_freq_correction) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_tuner_type) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_tuner_gains) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_tuner_gain) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_tuner_bandwidth) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_tuner_gain) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_tuner_if_gain) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_tuner_gain_mode) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_sample_rate) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_sample_rate) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_testmode) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_agc_mode) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_direct_sampling) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_direct_sampling) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(set_offset_tuning) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(get_offset_tuning) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(reset_buffer) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(read_sync) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(wait_async) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(read_async) {
	/* TODO */ return Nan::ThrowError("not implemented");
}

NAN_METHOD(cancel_async) {
	/* TODO */ return Nan::ThrowError("not implemented");
}
