#include "js_rtlsdr.h"

using v8::Local;
using v8::Value;
using v8::Object;

rtlsdr_dev_t * get_dev(Local<Value> dev_hnd_val) {
	if(!dev_hnd_val->IsObject()) return NULL;

	Local<Object> dev_hnd = Nan::To<Object>(dev_hnd_val).ToLocalChecked();
	if(dev_hnd->InternalFieldCount() != 1) return NULL;

	return (rtlsdr_dev_t *) Nan::GetInternalFieldPointer(dev_hnd, 0);
}
