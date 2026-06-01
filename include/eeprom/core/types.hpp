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

using EepromData = std::array<uint8_t, max_data_length>;

// OT-LIBRARY

// in the OT-LIBRARY data_length can be up to 56
// TODO update hard coded values in book_accessor
constexpr data_length book_data_length = 56;
constexpr data_length book_header_length = 8;

constexpr data_length page_length = 64;

constexpr uint8_t pages_per_book = 4;

enum class DataSize : uint16_t {
    PAGE = 64,
    BOOK = 256,
};

template <DataSize SIZE>
using OTLibraryData = std::array<uint8_t, static_cast<size_t>(SIZE)>;

}  // namespace types
}  // namespace eeprom
