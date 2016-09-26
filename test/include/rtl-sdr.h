// rtl-sdr mocks

#ifndef JS_RTLSDR_TEST_INCLUDE_RTL_SDR_GRAB_H
#define JS_RTLSDR_TEST_INCLUDE_RTL_SDR_GRAB_H

#define JS_RTLSDR_MODULE_IS_UNDER_TEST

#include <map>

typedef void(*rtlsdr_read_async_cb_t)(unsigned char *buf, uint32_t len, void *ctx);

typedef struct rtlsdr_dev {
	int freq_correction = 0;
	int tuner_gain = 0;
	int tuner_gain_mode = 0;
	int testmode = 0;
	int agc_mode = 0;
	int direct_sampling = 0;
	int offset_tuning = 0;
	int mock_sync_read_discount = 0;
	int mock_return_error = 0;
	uint8_t mock_eeprom[256];
	uint32_t index;
	uint32_t tuner_freq = 0;
	uint32_t rtl_freq = 0;
	uint32_t center_freq = 0;
	uint32_t tuner_bandwidth = 0;
	uint32_t sample_rate = 0;
	std::map<int, int> if_gains;
	const uint16_t validity_magic = 0x123;
	bool buffer_ready = false;
	bool open = false;
	bool has_eeprom = false;
} rtlsdr_dev_t;

enum rtlsdr_tuner {
	RTLSDR_TUNER_UNKNOWN = 0,
	RTLSDR_TUNER_E4000,
	RTLSDR_TUNER_FC0012,
	RTLSDR_TUNER_FC0013,
	RTLSDR_TUNER_FC2580,
	RTLSDR_TUNER_R820T,
	RTLSDR_TUNER_R828D
};

void rtlsdr_mock_set_device_count(uint32_t count);

uint32_t rtlsdr_get_device_count(void);
const char* rtlsdr_get_device_name(uint32_t index);
int rtlsdr_get_device_usb_strings(uint32_t index, char *manufact, char *product, char *serial);
int rtlsdr_get_index_by_serial(const char *serial);
int rtlsdr_open(rtlsdr_dev_t **dev, uint32_t index);
int rtlsdr_close(rtlsdr_dev_t *dev);
int rtlsdr_set_xtal_freq(rtlsdr_dev_t *dev, uint32_t rtl_freq, uint32_t tuner_freq);
int rtlsdr_get_xtal_freq(rtlsdr_dev_t *dev, uint32_t *rtl_freq, uint32_t *tuner_freq);
int rtlsdr_get_usb_strings(rtlsdr_dev_t *dev, char *manufact, char *product, char *serial);
int rtlsdr_write_eeprom(rtlsdr_dev_t *dev, uint8_t *data, uint8_t offset, uint16_t len);
int rtlsdr_read_eeprom(rtlsdr_dev_t *dev, uint8_t *data, uint8_t offset, uint16_t len);
int rtlsdr_set_center_freq(rtlsdr_dev_t *dev, uint32_t freq);
uint32_t rtlsdr_get_center_freq(rtlsdr_dev_t *dev);
int rtlsdr_set_freq_correction(rtlsdr_dev_t *dev, int ppm);
int rtlsdr_get_freq_correction(rtlsdr_dev_t *dev);
enum rtlsdr_tuner rtlsdr_get_tuner_type(rtlsdr_dev_t *dev);
int rtlsdr_get_tuner_gains(rtlsdr_dev_t *dev, int *gains);
int rtlsdr_set_tuner_gain(rtlsdr_dev_t *dev, int gain);
int rtlsdr_set_tuner_bandwidth(rtlsdr_dev_t *dev, uint32_t bw);
int rtlsdr_get_tuner_gain(rtlsdr_dev_t *dev);
int rtlsdr_set_tuner_if_gain(rtlsdr_dev_t *dev, int stage, int gain);
int rtlsdr_set_tuner_gain_mode(rtlsdr_dev_t *dev, int manual);
int rtlsdr_set_sample_rate(rtlsdr_dev_t *dev, uint32_t rate);
uint32_t rtlsdr_get_sample_rate(rtlsdr_dev_t *dev);
int rtlsdr_set_testmode(rtlsdr_dev_t *dev, int on);
int rtlsdr_set_agc_mode(rtlsdr_dev_t *dev, int on);
int rtlsdr_set_direct_sampling(rtlsdr_dev_t *dev, int on);
int rtlsdr_get_direct_sampling(rtlsdr_dev_t *dev);
int rtlsdr_set_offset_tuning(rtlsdr_dev_t *dev, int on);
int rtlsdr_get_offset_tuning(rtlsdr_dev_t *dev);
int rtlsdr_reset_buffer(rtlsdr_dev_t *dev);
int rtlsdr_read_sync(rtlsdr_dev_t *dev, void *buf, int len, int *n_read);
int rtlsdr_wait_async(rtlsdr_dev_t *dev, rtlsdr_read_async_cb_t cb, void *ctx);
int rtlsdr_read_async(rtlsdr_dev_t *dev, rtlsdr_read_async_cb_t cb, void *ctx, uint32_t buf_num, uint32_t buf_len);
int rtlsdr_cancel_async(rtlsdr_dev_t *dev);

#endif
