{
	"variables": {
		"js_rtlsdr_sources": [
			"src/rtlsdr.cc",
			"src/sample_reader.cc"
		],
		"js_rtlsdr_cpp_test_sources": [
			"test/main.cc"
		]
	},
	"targets": [
		{
			"target_name":       "rtlsdr",
			"product_extension": "node",
			"type":              "shared_library",
			"libraries":         ["-lrtlsdr"],
			"sources":           ["<@(js_rtlsdr_sources)"],
			"include_dirs":      ["<!(node -e \"require('nan')\")"]
		},
		{
			"target_name":       "rtlsdr_mocked",
			"product_extension": "node",
			"type":              "shared_library",
			"sources":           ["<@(js_rtlsdr_sources)"],
			"include_dirs": [
				"test/include",
				"<!(node -e \"require('nan')\")"
			]
		},

	],
	"conditions": [
		['"<!(echo $JS_RTLSDR_BUILD_CPP_TESTS)"=="yes"', {
			"targets": [{
				"target_name": "rtlsdr_cpp_tests",
				"type":        "executable",
				"cflags!":     ["-fno-exceptions"],
				"cflags_cc!":  ["-fno-exceptions"],
				"sources": [
					"<@(js_rtlsdr_cpp_test_sources)",
				],
				"include_dirs": [
					"test/include",
					"<!(node -e \"require('@bchociej/catch')\")",
				]
			}]
		}]
	]
}
