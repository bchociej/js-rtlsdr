#include <cstdio>
#include <stdlib.h>
#include "rtl-sdr.h"

#define TEST_CHECK_DEV(dev) if(dev == NULL || !dev->open) return -1;
#define DEFAULT_BUFFER_SIZE (16 * 32 * 512)

static uint32_t device_count = 1;

void rtlsdr_mock_set_device_count(uint32_t count) {
	device_count = count;
}

uint32_t rtlsdr_get_device_count(void) {
	return device_count;
}

const char* rtlsdr_get_device_name(uint32_t index) {
	char * name = new char[100];

	if(index < device_count)
		sprintf(name, "Mock RTLSDR Device #%u", index);
	else
		name[0] = '\0';

	return name;
}

int rtlsdr_get_device_usb_strings(uint32_t index, char *manufact, char *product, char *serial) {
	if(index < device_count) {
		if(manufact != NULL) sprintf(manufact, "Mock");
		if(product  != NULL) sprintf(product,  "Mock RTLSDR Device");
		if(serial   != NULL) sprintf(serial,   "%08u", index + 1);
	}

	return 0;
}

int rtlsdr_get_index_by_serial(const char *serial) {
	if(serial == NULL) return -1;
	if(device_count == 0) return -2;

	int serial_num = (int) strtol(serial, NULL, 10);
	if(serial_num <= 0 || serial_num > (int) device_count) return -3;
	return serial_num;
}

int rtlsdr_open(rtlsdr_dev_t **dev, uint32_t index) {
	if(index >= device_count) return -1;
	if(dev == NULL) return -2;

	*dev = new rtlsdr_dev_t();
	(*dev)->open = true;
	(*dev)->index = index;
	return 0;
}

int rtlsdr_close(rtlsdr_dev_t *dev) {
	if(dev == NULL) return -1;
	dev->open = false;
	return 0;
}

int rtlsdr_set_xtal_freq(rtlsdr_dev_t *dev, uint32_t rtl_freq, uint32_t tuner_freq) {
	TEST_CHECK_DEV(dev);
	dev->rtl_freq = rtl_freq;
	dev->tuner_freq = tuner_freq;
	return 0;
}

int rtlsdr_get_xtal_freq(rtlsdr_dev_t *dev, uint32_t *rtl_freq, uint32_t *tuner_freq) {
	TEST_CHECK_DEV(dev);
	*rtl_freq = dev->rtl_freq;
	*tuner_freq = dev->tuner_freq;
	return 0;
}

int rtlsdr_get_usb_strings(rtlsdr_dev_t *dev, char *manufact, char *product, char *serial) {
	TEST_CHECK_DEV(dev);
	return rtlsdr_get_device_usb_strings(dev->index, manufact, product, serial);
}

int rtlsdr_write_eeprom(rtlsdr_dev_t *dev, uint8_t *data, uint8_t offset, uint16_t len) {
	TEST_CHECK_DEV(dev);
	if((len + offset) > 256) return -2;
	if(!dev->has_eeprom) return -3;
	return 0;
}

int rtlsdr_read_eeprom(rtlsdr_dev_t *dev, uint8_t *data, uint8_t offset, uint16_t len) {
	TEST_CHECK_DEV(dev);
	if((len + offset) > 256) return -2;
	if(!dev->has_eeprom) return -3;

	sprintf((char *) data, "Mock RTLSDR Dev EEPROM Contents");
	return 0;
}

int rtlsdr_set_center_freq(rtlsdr_dev_t *dev, uint32_t freq) {
	TEST_CHECK_DEV(dev);
	dev->center_freq = freq;
	return 0;
}

uint32_t rtlsdr_get_center_freq(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	return dev->center_freq;
}

int rtlsdr_set_freq_correction(rtlsdr_dev_t *dev, int ppm) {
	TEST_CHECK_DEV(dev);
	dev->freq_correction = ppm;
	return 0;
}

int rtlsdr_get_freq_correction(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	return dev->freq_correction;
}

enum rtlsdr_tuner rtlsdr_get_tuner_type(rtlsdr_dev_t *dev) {
	if(dev == NULL || !dev->open) return RTLSDR_TUNER_UNKNOWN;
	return RTLSDR_TUNER_R820T;
}

int rtlsdr_get_tuner_gains(rtlsdr_dev_t *dev, int *gains) {
	TEST_CHECK_DEV(dev);
	gains[0] = 0;
	gains[1] = 10;
	gains[2] = 20;
	gains[3] = 30;
	gains[4] = 40;
	return 5;
}

int rtlsdr_set_tuner_gain(rtlsdr_dev_t *dev, int gain) {
	TEST_CHECK_DEV(dev);
	dev->tuner_gain = gain;
	return 0;
}

int rtlsdr_set_tuner_bandwidth(rtlsdr_dev_t *dev, uint32_t bw) {
	TEST_CHECK_DEV(dev);
	dev->tuner_bandwidth = bw;
	return 0;
}

int rtlsdr_get_tuner_gain(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	return dev->tuner_gain;
}

int rtlsdr_set_tuner_if_gain(rtlsdr_dev_t *dev, int stage, int gain) {
	TEST_CHECK_DEV(dev);
	dev->if_gains[stage] = gain;
	return 0;
}

int rtlsdr_set_tuner_gain_mode(rtlsdr_dev_t *dev, int manual) {
	TEST_CHECK_DEV(dev);
	dev->tuner_gain_mode = manual;
	return 0;
}

int rtlsdr_set_sample_rate(rtlsdr_dev_t *dev, uint32_t rate) {
	TEST_CHECK_DEV(dev);
	dev->sample_rate = rate;
	return 0;
}

uint32_t rtlsdr_get_sample_rate(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	return dev->sample_rate;
}

int rtlsdr_set_testmode(rtlsdr_dev_t *dev, int on) {
	TEST_CHECK_DEV(dev);
	dev->testmode = on;
	return 0;
}

int rtlsdr_set_agc_mode(rtlsdr_dev_t *dev, int on) {
	TEST_CHECK_DEV(dev);
	dev->agc_mode = on;
	return 0;
}

int rtlsdr_set_direct_sampling(rtlsdr_dev_t *dev, int on) {
	TEST_CHECK_DEV(dev);
	dev->direct_sampling = on;
	return 0;
}

int rtlsdr_get_direct_sampling(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	return dev->direct_sampling;
}

int rtlsdr_set_offset_tuning(rtlsdr_dev_t *dev, int on) {
	TEST_CHECK_DEV(dev);
	dev->offset_tuning = on;
	return 0;
}

int rtlsdr_get_offset_tuning(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	return dev->offset_tuning;
}

int rtlsdr_reset_buffer(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	dev->buffer_ready = true;
	return 0;
}

int rtlsdr_read_sync(rtlsdr_dev_t *dev, void *buf, int len, int *n_read) {
	TEST_CHECK_DEV(dev);
	if(!dev->buffer_ready) return -8;

	int to_read = len - dev->mock_sync_read_discount;
	for(int i = 0; i < to_read; i++)
		((uint8_t *) buf)[i] = (uint8_t) 'd'; // d for data, yuk yuk

	return 0;
}

int rtlsdr_wait_async(rtlsdr_dev_t *dev, rtlsdr_read_async_cb_t cb, void *ctx) {
	return rtlsdr_read_async(dev, cb, ctx, 0, 0);
}

int rtlsdr_read_async(rtlsdr_dev_t *dev, rtlsdr_read_async_cb_t cb, void *ctx, uint32_t buf_num, uint32_t buf_len) {
	TEST_CHECK_DEV(dev);
	if(!dev->buffer_ready) return -8;
	if(buf_num == 0) buf_num = 15;
	if(buf_len == 0) buf_len = DEFAULT_BUFFER_SIZE;
	if(buf_len % 512 != 0) return -1;
	const int max_reads = dev->mock_async_num_reads;

	for(int i = 0; (max_reads < 0 || i < max_reads) && dev->buffer_ready; i++) {
		char * buf = new char[buf_num * buf_len];
		for(size_t j = 0; j < buf_num * buf_len; j++) buf[j] = 'd';

		(*cb)((uint8_t *) buf, 7, ctx);
	}

	dev->buffer_ready = false; // self-cancel, for when mock_async_num_reads is used

	return 0;
}

int rtlsdr_cancel_async(rtlsdr_dev_t *dev) {
	TEST_CHECK_DEV(dev);
	dev->buffer_ready = false;
	return 0;
}
