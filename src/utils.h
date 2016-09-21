#ifndef JS_RTLSDR_UTILS_H
#define JS_RTLSDR_UTILS_H

#include <nan.h>
#include <rtl-sdr.h>

#include "sample_reader.h"

using v8::Local;
using v8::Value;
using v8::Object;

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

rtlsdr_dev_t * get_dev(Local<Value> dev_hnd_val) {
	if(!dev_hnd_val->IsObject()) return NULL;

	Local<Object> dev_hnd = Nan::To<Object>(dev_hnd_val).ToLocalChecked();
	if(dev_hnd->InternalFieldCount() != 1) return NULL;

	return (rtlsdr_dev_t *) Nan::GetInternalFieldPointer(dev_hnd, 0);
}

#endif
