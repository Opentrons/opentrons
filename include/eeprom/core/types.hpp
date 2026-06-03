#pragma once

#include <array>
#include <cstdint>
namespace eeprom {
namespace types {

// 0-65535
using address = uint16_t;

// 0-8
using data_length = uint16_t;

constexpr data_length max_data_length = 8;

// OT-LIBRARY

// in the OT-LIBRARY data_length can be up to 56
constexpr data_length page_data = 56;
constexpr data_length book_header_length = 8;

constexpr data_length page_length = 64;

// NOTE: Changed during testing to be 64 instead of 8 to try and write more in
// one go
using EepromData = std::array<uint8_t, page_length>;

constexpr uint8_t pages_per_book = 4;

}  // namespace types
}  // namespace eeprom
