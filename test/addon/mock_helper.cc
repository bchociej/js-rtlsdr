#include <nan.h>
#include <rtl-sdr.h>

using v8::Array;
using v8::Local;
using v8::Object;
using v8::Value;

#define SET_DEV_FIELD(obj, dev, field) Nan::Set(obj, Nan::New(#field).ToLocalChecked(), Nan::New(dev->field))

void mock_get_rtlsdr_dev_contents(const Nan::FunctionCallbackInfo<Value> & info) {
	Local<Value> dev_hnd_val = info[0];
	rtlsdr_dev_t * rtl_dev = NULL;

	if(dev_hnd_val->IsObject()) {
		Local<Object> dev_hnd = Nan::To<Object>(dev_hnd_val).ToLocalChecked();

		if(dev_hnd->InternalFieldCount() == 1) {
			rtl_dev = (rtlsdr_dev_t *) Nan::GetInternalFieldPointer(dev_hnd, 0);
		}
	}

	if(rtl_dev == NULL) return Nan::ThrowTypeError("the device handle must be a currently-open handle (from .open())");

	Local<Object> mockContent = Nan::New<Object>();

	SET_DEV_FIELD(mockContent, rtl_dev, index);
	SET_DEV_FIELD(mockContent, rtl_dev, freq_correction);
	SET_DEV_FIELD(mockContent, rtl_dev, tuner_gain);
	SET_DEV_FIELD(mockContent, rtl_dev, tuner_gain_mode);
	SET_DEV_FIELD(mockContent, rtl_dev, testmode);
	SET_DEV_FIELD(mockContent, rtl_dev, agc_mode);
	SET_DEV_FIELD(mockContent, rtl_dev, direct_sampling);
	SET_DEV_FIELD(mockContent, rtl_dev, offset_tuning);
	SET_DEV_FIELD(mockContent, rtl_dev, mock_sync_read_discount);
	SET_DEV_FIELD(mockContent, rtl_dev, mock_return_error);
	SET_DEV_FIELD(mockContent, rtl_dev, tuner_freq);
	SET_DEV_FIELD(mockContent, rtl_dev, rtl_freq);
	SET_DEV_FIELD(mockContent, rtl_dev, center_freq);
	SET_DEV_FIELD(mockContent, rtl_dev, tuner_bandwidth);
	SET_DEV_FIELD(mockContent, rtl_dev, sample_rate);

	Local<Object> if_gains_arr = Nan::New<Object>();
	for(std::map<int, int>::iterator it = rtl_dev->if_gains.begin(); it != rtl_dev->if_gains.end(); ++it)
		if_gains_arr->Set(it->first, Nan::New(it->second));
	Nan::Set(mockContent, Nan::New("if_gains").ToLocalChecked(), if_gains_arr);

	SET_DEV_FIELD(mockContent, rtl_dev, buffer_ready);
	SET_DEV_FIELD(mockContent, rtl_dev, open);
	SET_DEV_FIELD(mockContent, rtl_dev, has_eeprom);

	info.GetReturnValue().Set(mockContent);
}

void mock_set_rtlsdr_dev_contents(const Nan::FunctionCallbackInfo<Value> & info) {
	Local<Value> dev_hnd_val = info[0],
	             field       = info[1],
	             val         = info[2];

	rtlsdr_dev_t * rtl_dev = NULL;

	if(dev_hnd_val->IsObject()) {
		Local<Object> dev_hnd = Nan::To<Object>(dev_hnd_val).ToLocalChecked();

		if(dev_hnd->InternalFieldCount() == 1) {
			rtl_dev = (rtlsdr_dev_t *) Nan::GetInternalFieldPointer(dev_hnd, 0);
		}
	}

	if(rtl_dev == NULL)
		return Nan::ThrowTypeError("the device handle must be a currently-open handle (from .open())");

	if(!field->IsString())
		return Nan::ThrowTypeError("field must be a string");

	Local<v8::String>     field_v8str = Nan::To<v8::String>(field).ToLocalChecked();
	v8::String::Utf8Value field_utf8val(field_v8str);
	std::string           field_str(*field_utf8val);

	if(0 == field_str.compare("index")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->index = Nan::To<uint32_t>(val).FromJust();
	} else if(0 == field_str.compare("freq_correction")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->freq_correction = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("tuner_gain")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->tuner_gain = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("tuner_gain_mode")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->tuner_gain_mode = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("testmode")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->testmode = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("agc_mode")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->agc_mode = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("direct_sampling")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->direct_sampling = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("offset_tuning")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->offset_tuning = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("mock_sync_read_discount")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->mock_sync_read_discount = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("mock_return_error")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->mock_return_error = Nan::To<int>(val).FromJust();
	} else if(0 == field_str.compare("tuner_freq")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->tuner_freq = Nan::To<uint32_t>(val).FromJust();
	} else if(0 == field_str.compare("rtl_freq")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->rtl_freq = Nan::To<uint32_t>(val).FromJust();
	} else if(0 == field_str.compare("center_freq")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->center_freq = Nan::To<uint32_t>(val).FromJust();
	} else if(0 == field_str.compare("tuner_bandwidth")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->tuner_bandwidth = Nan::To<uint32_t>(val).FromJust();
	} else if(0 == field_str.compare("sample_rate")) {
		if(!val->IsNumber()) return Nan::ThrowTypeError("val must be a number for that field");
		rtl_dev->sample_rate = Nan::To<uint32_t>(val).FromJust();
	} else if(0 == field_str.compare("buffer_ready")) {
		if(!val->IsBoolean()) return Nan::ThrowTypeError("val must be a boolean for that field");
		rtl_dev->buffer_ready = Nan::To<bool>(val).FromJust();
	} else if(0 == field_str.compare("open")) {
		if(!val->IsBoolean()) return Nan::ThrowTypeError("val must be a boolean for that field");
		rtl_dev->open = Nan::To<bool>(val).FromJust();
	} else if(0 == field_str.compare("has_eeprom")) {
		if(!val->IsBoolean()) return Nan::ThrowTypeError("val must be a boolean for that field");
		rtl_dev->has_eeprom = Nan::To<bool>(val).FromJust();
	} else {
		return Nan::ThrowError("don't know how to set that field");
	}
}

void mock_set_device_count(const Nan::FunctionCallbackInfo<v8::Value> & info) {
	Local<Value> count = info[0];

	if(!count->IsNumber())
		return Nan::ThrowTypeError("count must be a number");

	uint32_t u_count = Nan::To<uint32_t>(count).FromJust();
	rtlsdr_mock_set_device_count(u_count);
}

void mock_is_device_handle(const Nan::FunctionCallbackInfo<v8::Value> & info) {
	Local<Value> dev_hnd_val = info[0];
	rtlsdr_dev_t * rtl_dev = NULL;

	if(dev_hnd_val->IsObject()) {
		Local<Object> dev_hnd = Nan::To<Object>(dev_hnd_val).ToLocalChecked();

		if(dev_hnd->InternalFieldCount() == 1) {
			rtl_dev = (rtlsdr_dev_t *) Nan::GetInternalFieldPointer(dev_hnd, 0);
		}
	}

	info.GetReturnValue().Set((rtl_dev != NULL && rtl_dev->validity_magic == 0x123) ? Nan::True() : Nan::False());
}

void mock_get_written_eeprom(const Nan::FunctionCallbackInfo<v8::Value> & info) {
	Local<Value> dev_hnd_val = info[0];
	rtlsdr_dev_t * rtl_dev = NULL;

	if(dev_hnd_val->IsObject()) {
		Local<Object> dev_hnd = Nan::To<Object>(dev_hnd_val).ToLocalChecked();

		if(dev_hnd->InternalFieldCount() == 1) {
			rtl_dev = (rtlsdr_dev_t *) Nan::GetInternalFieldPointer(dev_hnd, 0);
		}
	}

	if(rtl_dev == NULL)
		return Nan::ThrowTypeError("the device handle must be a currently-open handle (from .open())");

	if(rtl_dev->mock_eeprom == NULL)
		info.GetReturnValue().Set(Nan::Null());
	else
		info.GetReturnValue().Set(
			Nan::CopyBuffer((char *) rtl_dev->mock_eeprom, 256).ToLocalChecked()
		);
}
