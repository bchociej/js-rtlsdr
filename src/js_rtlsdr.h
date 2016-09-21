#ifndef JS_RTLSDR_GRAB_H
#define JS_RTLSDR_GRAB_H

#include <nan.h>
#include <rtl-sdr.h>

#include "sample_reader.h"

#define JS_RTLSDR_CHECK_DEV(hnd) if(hnd == NULL) \
	return Nan::ThrowTypeError("the device handle must be a currently-open handle (from .open())");

#define JS_RTLSDR_CHECK_ERR(fn_name) if(err < 0) { \
	std::string errmsg = ""; \
	errmsg += fn_name; \
	errmsg += " failed with code "; \
	errmsg += std::to_string(err); \
	return Nan::ThrowError(errmsg.c_str()); }

#define JS_RTLSDR_CHECK_ERR_NONZERO(fn_name) if(err != 0) { \
	std::string errmsg = ""; \
	errmsg += fn_name; \
	errmsg += " failed with code "; \
	errmsg += std::to_string(err); \
	return Nan::ThrowError(errmsg.c_str()); }

#define JS_RTLSDR_RETURN(thing) info.GetReturnValue().Set(thing)

rtlsdr_dev_t * get_dev(v8::Local<v8::Value> dev_hnd_val);
void read_async_cb(uint8_t * buf, uint32_t len, void * ctx);
void wait_async_worker(uv_work_t * req);
void read_async_worker(uv_work_t * req);
void async_cleanup(uv_work_t * req, int status);

#endif
