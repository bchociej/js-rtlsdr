// avoid changing this file, catch.hpp takes a little while to rebuild
#define CATCH_CONFIG_MAIN
#include "catch.hpp"

SCENARIO("test environment is sane") {
	GIVEN("the integer 1") {
		int the_int = 1;

		WHEN("the integer is tripled") {
			the_int *= 3;

			THEN("the result is 3") {
				REQUIRE(the_int == 3);
			}
		}
	}
}
