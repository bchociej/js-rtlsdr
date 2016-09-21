{
	"targets": [
		{
			"target_name":  "rtlsdr",
			"sources":      ["src/rtlsdr.cc", "src/sample_reader.cc"],
			"include_dirs": ["<!(node -e \"require('nan')\")"],
			"libraries":    ["-lrtlsdr"]
		}
	],
}
