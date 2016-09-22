var rtlsdr = require('bindings')('rtlsdr_mocked.node');
rtlsdr.mock_set_device_count(10);
console.log(rtlsdr.get_device_count());
