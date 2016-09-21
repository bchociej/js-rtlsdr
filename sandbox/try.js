var rtlsdr = require('bindings')('rtlsdr.node');
var numDevs = rtlsdr.get_device_count();

if(numDevs === 0) {
	throw new Error('no devs!');
}

var dev = rtlsdr.open(0);

rtlsdr.set_center_freq(dev, 162400000);
rtlsdr.set_tuner_gain_mode(dev, 0);
rtlsdr.set_sample_rate(dev, 2048000);
rtlsdr.reset_buffer(dev);

var count = 0;

console.log('Will read 10 samples of default length, 2.048 Msamp/s @ 162.4 MHz, auto gain');

rtlsdr.read_async(dev, function(ev, arg) {
	switch(ev) {
		case 'data':
			console.log('#' + count++ + ': ' + arg.length + ' bytes');
			if(count == 10) rtlsdr.cancel_async(dev);
			break;

		case 'error':
			console.log('error: ' + arg);
			break;

		case 'done':
			console.log('done');
	}
});
