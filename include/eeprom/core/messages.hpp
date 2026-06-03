#pragma once

#include <variant>

#include "eeprom/core/hardware_iface.hpp"
#include "eeprom/core/types.hpp"
#include "hardware_iface.hpp"
#include "types.hpp"
namespace eeprom {
namespace message {

/** Eeprom message */
struct EepromMessage {
    uint32_t message_index;
    eeprom::types::address memory_address;
    eeprom::types::data_length length;
    eeprom::types::EepromData data;

    auto operator==(const EepromMessage&) const -> bool = default;
};

using ReadResponseCallback = void (*)(const EepromMessage&, void*);
// would love to use this instead if gcc wasn't broken on my system. revist when
// gcc > 12.1.1 https://github.com/catchorg/Catch2/issues/2423

// using ReadResponseCallback = std::function<void(const
// EepromMessage&, void*)>;

/**
 * The read from eeprom message.
 */
struct ReadEepromMessage {
    uint32_t message_index;
    eeprom::types::address memory_address;
    eeprom::types::data_length length;
    ReadResponseCallback callback;
    void* callback_param;
};

/** The write to eeprom message */
using WriteEepromMessage = EepromMessage;

struct ConfigResponseMessage {
    eeprom::hardware_iface::EEPromChipType chip;
    types::address addr_bytes;
    types::data_length mem_size;
    uint8_t default_byte_value;
};

using ConfigRequestCallback = void (*)(const ConfigResponseMessage&, void*);
// would love to use this instead if gcc wasn't broken on my system. revist when
// gcc > 12.1.1 https://github.com/catchorg/Catch2/issues/2423

// using ConfigRequestCallback = std::function<void(const
// ConfigResponseMessage&, void*)>;

struct ConfigRequestMessage {
    ConfigRequestCallback callback;
    void* callback_param;
};

}  // namespace message
}  // namespace eeprom
