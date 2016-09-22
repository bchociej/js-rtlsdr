#ifndef JS_RTLSDR_MAIN_API_GRAB_H
#define JS_RTLSDR_MAIN_API_GRAB_H

#include <nan.h>
#include <rtl-sdr.h>

#ifdef JS_RTLSDR_TEST_INCLUDE_RTL_SDR_GRAB_H

#endif

// https://github.com/steve-m/librtlsdr/blob/master/include/rtl-sdr.h

void get_device_count(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_device_name(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_device_usb_strings(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_index_by_serial(const Nan::FunctionCallbackInfo<v8::Value> & info);
void open(const Nan::FunctionCallbackInfo<v8::Value> & info);
void close(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_xtal_freq(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_xtal_freq(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_usb_strings(const Nan::FunctionCallbackInfo<v8::Value> & info);
void write_eeprom(const Nan::FunctionCallbackInfo<v8::Value> & info);
void read_eeprom(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_center_freq(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_center_freq(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_freq_correction(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_freq_correction(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_tuner_type(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_tuner_gains(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_tuner_gain(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_tuner_bandwidth(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_tuner_gain(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_tuner_if_gain(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_tuner_gain_mode(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_sample_rate(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_sample_rate(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_testmode(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_agc_mode(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_direct_sampling(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_direct_sampling(const Nan::FunctionCallbackInfo<v8::Value> & info);
void set_offset_tuning(const Nan::FunctionCallbackInfo<v8::Value> & info);
void get_offset_tuning(const Nan::FunctionCallbackInfo<v8::Value> & info);
void reset_buffer(const Nan::FunctionCallbackInfo<v8::Value> & info);
void read_sync(const Nan::FunctionCallbackInfo<v8::Value> & info);
void wait_async(const Nan::FunctionCallbackInfo<v8::Value> & info);
void read_async(const Nan::FunctionCallbackInfo<v8::Value> & info);
void cancel_async(const Nan::FunctionCallbackInfo<v8::Value> & info);

NAN_MODULE_INIT(InitAll) {
	NAN_EXPORT(target, get_device_count);
	NAN_EXPORT(target, get_device_name);
	NAN_EXPORT(target, get_device_usb_strings);
	NAN_EXPORT(target, get_index_by_serial);
	NAN_EXPORT(target, open);
	NAN_EXPORT(target, close);
	NAN_EXPORT(target, set_xtal_freq);
	NAN_EXPORT(target, get_xtal_freq);
	NAN_EXPORT(target, get_usb_strings);
	NAN_EXPORT(target, write_eeprom);
	NAN_EXPORT(target, read_eeprom);
	NAN_EXPORT(target, set_center_freq);
	NAN_EXPORT(target, get_center_freq);
	NAN_EXPORT(target, set_freq_correction);
	NAN_EXPORT(target, get_freq_correction);
	NAN_EXPORT(target, get_tuner_type);
	NAN_EXPORT(target, get_tuner_gains);
	NAN_EXPORT(target, set_tuner_gain);
	NAN_EXPORT(target, set_tuner_bandwidth);
	NAN_EXPORT(target, get_tuner_gain);
	NAN_EXPORT(target, set_tuner_if_gain);
	NAN_EXPORT(target, set_tuner_gain_mode);
	NAN_EXPORT(target, set_sample_rate);
	NAN_EXPORT(target, get_sample_rate);
	NAN_EXPORT(target, set_testmode);
	NAN_EXPORT(target, set_agc_mode);
	NAN_EXPORT(target, set_direct_sampling);
	NAN_EXPORT(target, get_direct_sampling);
	NAN_EXPORT(target, set_offset_tuning);
	NAN_EXPORT(target, get_offset_tuning);
	NAN_EXPORT(target, reset_buffer);
	NAN_EXPORT(target, read_sync);
	NAN_EXPORT(target, wait_async);
	NAN_EXPORT(target, read_async);
	NAN_EXPORT(target, cancel_async);
}

NODE_MODULE(rtlsdr, InitAll)

#endif
