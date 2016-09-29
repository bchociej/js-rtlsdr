#ifndef JS_RTLSDR_SAMPLE_READER_GRAB_H
#define JS_RTLSDR_SAMPLE_READER_GRAB_H

#include <rtl-sdr.h>
#include <node.h>
#include <nan.h>

typedef struct sample_reader_work {
	rtlsdr_dev_t *  rtl_dev;
	uint32_t        buf_num; // for read_async only (i.e. wait = false)
	uint32_t        buf_len; // for read_async only (i.e. wait = false)
	bool            wait = false;
} sample_reader_work_t;

typedef struct sample_buffer {
	uint8_t * buf;
	uint32_t  len;
} sample_buffer_t;

class SampleReader : public Nan::AsyncProgressWorkerBase<uint8_t> {
public:
	static void RTLSDRAsyncCallback(uint8_t * buf, uint32_t len, void * ctx);

	SampleReader(Nan::Callback * listener, sample_reader_work_t * work)
		: Nan::AsyncProgressWorkerBase<uint8_t>(listener), work(work) {}
	~SampleReader() {}

	void Execute(const ExecutionProgress & progress);
	void HandleProgressCallback(const uint8_t * buf, size_t len);
	void HandleOKCallback(void);
	void HandleErrorCallback(void);

private:
	sample_reader_work_t * work;
};

#endif
