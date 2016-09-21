#include <cstdio>
#include <iostream>

#include "sample_reader.h"

using v8::Local;
using v8::Object;
using v8::Value;

/* static */ void SampleReader::RTLSDRAsyncCallback(uint8_t * buf, uint32_t len, void * ctx) {
	const ExecutionProgress * progress = (const ExecutionProgress *) ctx;
	progress->Send(buf, len);
}

void SampleReader::Execute(const SampleReader::ExecutionProgress & progress) {
	int err;
	void * ctx = (void *) &progress;

	if(this->work->wait)
		err = rtlsdr_wait_async(this->work->rtl_dev, &SampleReader::RTLSDRAsyncCallback, ctx);
	else
		err = rtlsdr_read_async(this->work->rtl_dev, &SampleReader::RTLSDRAsyncCallback, ctx,
		                        this->work->buf_num, this->work->buf_len);

	if(err != 0) {
		char msg[60];
		sprintf(msg, "%s returned error code %i on exit",
			this->work->wait ? "rtlsdr_wait_async" : "rtlsdr_read_async",
			err
		);

		this->SetErrorMessage(msg);
	}
}

void SampleReader::HandleProgressCallback(const uint8_t * buf, size_t len) {
	Nan::HandleScope scope;

	Local<Value> argv[] = {
		Nan::New("data").ToLocalChecked(),
		Nan::CopyBuffer((char *) buf, len).ToLocalChecked()
	};

	this->callback->Call(2, argv);
}

void SampleReader::HandleOKCallback() {
	Nan::HandleScope scope;
	Local<Value> argv[] = {Nan::New("done").ToLocalChecked()};
	this->callback->Call(1, argv);

	delete this->work;
	this->work = NULL;
}

void SampleReader::HandleErrorCallback() {
	Nan::HandleScope scope;

	Local<Value> argv[] = {
		Nan::New("error").ToLocalChecked(),
		Nan::New<v8::String>(this->ErrorMessage()).ToLocalChecked()
	};

	this->callback->Call(2, argv);

	delete this->work;
	this->work = NULL;
}
