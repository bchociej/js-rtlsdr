#ifndef JS_RTLSDR_GRAB_H
#define JS_RTLSDR_GRAB_H

#include <nan.h>

// https://github.com/steve-m/librtlsdr/blob/master/include/rtl-sdr.h

NAN_METHOD(get_device_count);
NAN_METHOD(get_device_name);
NAN_METHOD(get_device_usb_strings);
NAN_METHOD(get_index_by_serial);
NAN_METHOD(open);
NAN_METHOD(close);
NAN_METHOD(set_xtal_freq);
NAN_METHOD(get_xtal_freq);
NAN_METHOD(get_usb_strings);
NAN_METHOD(write_eeprom);
NAN_METHOD(read_eeprom);
NAN_METHOD(set_center_freq);
NAN_METHOD(get_center_freq);
NAN_METHOD(set_freq_correction);
NAN_METHOD(get_freq_correction);
NAN_METHOD(get_tuner_type);
NAN_METHOD(get_tuner_gains);
NAN_METHOD(set_tuner_gain);
NAN_METHOD(set_tuner_bandwidth);
NAN_METHOD(get_tuner_gain);
NAN_METHOD(set_tuner_if_gain);
NAN_METHOD(set_tuner_gain_mode);
NAN_METHOD(set_sample_rate);
NAN_METHOD(get_sample_rate);
NAN_METHOD(set_testmode);
NAN_METHOD(set_agc_mode);
NAN_METHOD(set_direct_sampling);
NAN_METHOD(get_direct_sampling);
NAN_METHOD(set_offset_tuning);
NAN_METHOD(get_offset_tuning);
NAN_METHOD(reset_buffer);
NAN_METHOD(read_sync);
NAN_METHOD(wait_async);
NAN_METHOD(read_async);
NAN_METHOD(cancel_async);

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
