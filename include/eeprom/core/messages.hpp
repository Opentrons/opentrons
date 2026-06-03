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

// EEpromMessage to OT Library
// Write messages
struct OTLibraryBookMessage {
    uint32_t message_index;
    eeprom::types::address memory_address;
    eeprom::types::data_length length;
    eeprom::types::OTLibraryData<types::DataSize::BOOK> data;

    auto operator==(const OTLibraryBookMessage&) const -> bool = default;
};

// TODO: Looks like we won't be using this, so get rid of it
struct OTLibraryPageMessage {
    uint32_t message_index;
    eeprom::types::address memory_address;
    eeprom::types::data_length length;
    eeprom::types::OTLibraryData<types::DataSize::PAGE> data;

    auto operator==(const OTLibraryPageMessage&) const -> bool = default;
};

using EepromDataMessage =
    std::variant<OTLibraryBookMessage, OTLibraryPageMessage>;

// Read Messages
using OTReadResponseCallback = void (*)(const EepromDataMessage&, void*);

struct OTLibraryReadMessage {
    uint32_t message_index;
    eeprom::types::address memory_address;
    eeprom::types::data_length length;
    OTReadResponseCallback callback;
    void* callback_param;
};

}  // namespace message
}  // namespace eeprom
