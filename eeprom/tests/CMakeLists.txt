# this CMakeLists.txt file is only used when host-compiling to build tests
find_package(Catch2 REQUIRED)
include(CTest)
include(Catch)
include(AddBuildAndTestTarget)

add_executable(
        eeprom
        test_main.cpp
        test_message_handler.cpp
        test_eeprom_task.cpp
        test_hardware_iface.cpp
        test_serial_number.cpp
        test_data_rev.cpp
        test_revision.cpp
        test_dev_data.cpp
        test_book_accessor.cpp
)

target_include_directories(eeprom PUBLIC ${CMAKE_SOURCE_DIR}/include)
set_target_properties(eeprom
        PROPERTIES
        CXX_STANDARD 20
        CXX_STANDARD_REQUIRED TRUE)

target_compile_options(eeprom
        PUBLIC
        -Wall
        -Werror
        -Wextra
        -Wno-missing-field-initializers
        $<$<COMPILE_LANGUAGE:CXX>:-Weffc++>
        $<$<COMPILE_LANGUAGE:CXX>:-Wreorder>
        $<$<COMPILE_LANGUAGE:CXX>:-Wsign-promo>
        $<$<COMPILE_LANGUAGE:CXX>:-Wextra-semi>
        $<$<COMPILE_LANGUAGE:CXX>:-Wctor-dtor-privacy>
        $<$<COMPILE_LANGUAGE:CXX>:-fno-rtti>
)

add_revision(TARGET eeprom REVISION a1)

target_link_libraries(eeprom PUBLIC Catch2::Catch2 common-core)
target_i2c_simlib(eeprom)

catch_discover_tests(eeprom)
add_build_and_test_target(eeprom)

add_coverage(eeprom)
