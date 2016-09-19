{
	"targets": [
		{
			"target_name":  "rtlsdr",
			"sources":      ["src/rtlsdr.cpp"],
			"include_dirs": ["<!(node -e \"require('nan')\")"],
			"libraries":    ["-lrtlsdr"]
		}
	],
}
