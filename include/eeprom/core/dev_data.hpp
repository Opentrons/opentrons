#pragma once
#include <array>

#include "accessor.hpp"
#include "addresses.hpp"
#include "can/core/message_core.hpp"
#include "common/core/bit_utils.hpp"
#include "task.hpp"

namespace eeprom {
namespace dev_data {

template <std::size_t SIZE>
using DataBufferType = std::array<uint8_t, SIZE>;
using DataTailType = std::array<uint8_t, addresses::lookup_table_tail_length>;

enum TableAction { READ, WRITE, CREATE, INITALIZE, READ_BEFORE_WRITE };

struct table_entry_action {
    uint16_t key;
    types::address offset;
    types::data_length len;
    TableAction action;
};
/** Implementation Note: This Accessor needs to be a singleton per device.
 *  A pointer to this instance can be passed to any number of DevDataAccessor
 *instances
 *
 * @tparam EEPromTaskClient client of eeprom task
 **/
// intermediate base class for DevDataTailAccessor
struct DevDataTailIntermediate {
  protected:
    DataTailType data_tail_buff = DataTailType{};
};

// helper class to handle reading writing the data_tail value
template <task::TaskClient EEPromTaskClient>
class DevDataTailAccessor
    : DevDataTailIntermediate,
      public accessor::EEPromAccessor<EEPromTaskClient,
                                      addresses::lookup_table_tail_begin>,
      accessor::ReadListener {
    using accessor::EEPromAccessor<
        EEPromTaskClient, addresses::lookup_table_tail_begin>::EEPromAccessor;

  public:
    explicit DevDataTailAccessor(EEPromTaskClient& eeprom_client)
        : accessor::EEPromAccessor<EEPromTaskClient,
                                   addresses::lookup_table_tail_begin>::
              EEPromAccessor(eeprom_client, *this,
                             accessor::AccessorBuffer(data_tail_buff.begin(),
                                                      data_tail_buff.end())) {}

    auto start_update() -> void { tail_updated = false; }

    auto get_tail_updated() -> bool { return config_updated && tail_updated; }

    auto get_data_tail() -> types::address { return data_tail; }

    void set_config(const message::ConfigResponseMessage& m) {
        conf = m;
        config_updated = true;
    }

    auto data_rev_complete() -> bool { return data_rev_finished; }

    auto finish_data_rev() -> void { data_rev_finished = true; }

    void read_complete(uint32_t) final {
        // test if data is set to default values at delivery
        auto delivery_state =
            std::array<uint8_t, addresses::lookup_table_tail_length>{};
        delivery_state.fill(conf.default_byte_value);
        if (std::equal(delivery_state.begin(), delivery_state.end(),
                       data_tail_buff.begin())) {
            // Value is set to default so update it to data section start
            auto init_tail = DataTailType{};
            data_tail = addresses::data_address_begin;
            std::ignore = bit_utils::int_to_bytes(
                data_tail, init_tail.begin(),
                init_tail.begin() + addresses::lookup_table_tail_length);
            this->write(init_tail, 0);
        } else {
            // load current data tail to memory
            std::ignore = bit_utils::bytes_to_int(
                data_tail_buff.begin(),
                data_tail_buff.begin() + addresses::lookup_table_tail_length,
                data_tail);
        }
        tail_updated = true;
    }

    auto increase_data_tail(const DataTailType& data_added) -> void {
        tail_updated = false;
        auto read_addr = addresses::lookup_table_tail_begin;
        auto bytes_remain = addresses::lookup_table_tail_length;
        types::data_length amount_to_read =
            std::min(bytes_remain, types::max_data_length);
        std::copy_n(data_added.begin(), addresses::lookup_table_tail_length,
                    data_to_add.begin());
        this->eeprom_client.send_eeprom_queue(
            eeprom::message::ReadEepromMessage{
                .message_index = 0,
                .memory_address = read_addr,
                .length = amount_to_read,
                .callback = increase_tail_callback,
                .callback_param = this});
    }

    auto increase_data_tail(const types::data_length data_added) -> void {
        auto typed_length = DataTailType{};
        std::ignore = bit_utils::int_to_bytes(
            data_added, typed_length.begin(),
            typed_length.begin() + addresses::lookup_table_tail_length);
        increase_data_tail(typed_length);
    }

  private:
    /**
     * Handle a completed read that was triggered by a increase_usage_call.
     * @param msg The message
     */
    void increase_tail_callback(const eeprom::message::EepromMessage& msg) {
        uint16_t data_to_add_int = 0;
        uint16_t current_data_length = 0;
        auto new_data_length = DataTailType{};
        std::ignore = bit_utils::bytes_to_int(data_to_add, data_to_add_int);
        std::ignore = bit_utils::bytes_to_int(msg.data, current_data_length);
        current_data_length += data_to_add_int;
        std::ignore = bit_utils::int_to_bytes(
            current_data_length, new_data_length.begin(),
            new_data_length.begin() + addresses::lookup_table_tail_length);
        this->write(new_data_length, 0);
        data_tail = current_data_length;
        tail_updated = true;
    }

    /**
     * Handle a completed read.
     * @param msg The message
     * @param param This pointer.
     */
    static void increase_tail_callback(
        const eeprom::message::EepromMessage& msg, void* param) {
        // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
        auto* self = reinterpret_cast<DevDataTailAccessor*>(param);
        self->increase_tail_callback(msg);
    }

    types::address data_tail = 0;
    bool tail_updated{false};
    bool config_updated{false};
    bool data_rev_finished{false};
    message::ConfigResponseMessage conf = message::ConfigResponseMessage{};
    DataTailType data_to_add = DataTailType{};
};

/**
 * Class that reads and writes generalized data using a lookup table stored on
 * the eeprom
 *
 * Implementation Note: When creating an instance of this class, take care
 * to make the instance not outlive the backing buffer as this will cause a
 * SYSSEGV
 * The best way to implement this is to create an instance of both the accessor
 * and the backing buffer as members of a class so that they share scope
 *
 * @tparam EEPromTaskClient client of eeprom task
 **/
template <task::TaskClient EEPromTaskClient>
class DevDataAccessor
    : public accessor::EEPromAccessor<EEPromTaskClient,
                                      addresses::data_address_begin> {
    using accessor::EEPromAccessor<
        EEPromTaskClient, addresses::data_address_begin>::EEPromAccessor;

  public:
    template <std::size_t SIZE>
    explicit DevDataAccessor(
        EEPromTaskClient& eeprom_client, accessor::ReadListener& listener,
        DataBufferType<SIZE>& buffer,
        DevDataTailAccessor<EEPromTaskClient>& tail_accessor)
        : accessor::EEPromAccessor<EEPromTaskClient,
                                   addresses::data_address_begin>::
              EEPromAccessor(
                  eeprom_client, listener,
                  accessor::AccessorBuffer(buffer.begin(), buffer.end())),
          tail_accessor{tail_accessor} {
        eeprom_client.send_eeprom_queue(
            message::ConfigRequestMessage{config_req_callback, this});
    }

    template <std::size_t SIZE>
    void write_data(uint16_t key, uint16_t len, uint16_t offset,
                    std::array<uint8_t, SIZE>& data) {
        if (read_write_ready()) {
            auto table_location = calculate_table_entry_start(key);
            if (table_location > tail_accessor.get_data_tail()) {
                LOG("Error, attemping to read uninitalized value");
                return;
            }
            if (len > data.size()) {
                LOG("ERROR, trying to write %d bytes from a %lu byte buffer",
                    len, data.size());
                len = data.size();
            }
            LOG("Writing %d bytes to data partition", len);
            // copy the data to our internal buffer
            std::copy_n(data.begin(), len, this->type_data.begin());
            this->action_cmd_m =
                table_entry_action{.key = key,
                                   .offset = offset,
                                   .len = len,
                                   .action = TableAction::WRITE};
            // call a read to the table entry so we know where
            // to put the data
            this->eeprom_client.send_eeprom_queue(message::ReadEepromMessage{
                .memory_address = table_location,
                .length = static_cast<types::data_length>(2 * conf.addr_bytes),
                .callback = table_action_callback,
                .callback_param = this});
        }
    }
    template <std::size_t SIZE>
    void write_data(uint16_t key, uint16_t len,
                    std::array<uint8_t, SIZE>& data) {
        write_data(key, len, 0, data);
    }
    template <std::size_t SIZE>
    void write_data(uint16_t key, std::array<uint8_t, SIZE>& data) {
        write_data(key, data.size(), 0, data);
    }

    void get_data(uint16_t key, uint16_t len, uint16_t offset,
                  uint32_t message_index) {
        if (read_write_ready()) {
            auto table_location = calculate_table_entry_start(key);
            if (table_location > tail_accessor.get_data_tail()) {
                LOG("Error, attemping to read uninitalized value");
                return;
            }
            action_cmd_m = table_entry_action{.key = key,
                                              .offset = offset,
                                              .len = len,
                                              .action = TableAction::READ};

            // call a read to the table entry so we know where
            // to read the data
            this->eeprom_client.send_eeprom_queue(message::ReadEepromMessage{
                .message_index = message_index,
                .memory_address = table_location,
                .length = static_cast<types::data_length>(2 * conf.addr_bytes),
                .callback = table_action_callback,
                .callback_param = this});
        }
    }
    void get_data(uint16_t key, uint16_t len, uint32_t message_index) {
        get_data(key, len, 0, message_index);
    }
    void get_data(uint16_t key, uint32_t message_index) {
        get_data(key, 0, 0, message_index);
    }

    template <std::size_t SIZE>
    void create_data_part(uint16_t key, uint16_t len,
                          std::array<uint8_t, SIZE>& data) {
        if (table_ready()) {
            //  if the key is zero we don't need to read the former address
            if (key == 0) {
                message::WriteEepromMessage write;
                write.memory_address = addresses::data_address_begin;
                write.length = 2 * conf.addr_bytes;
                // data pointers are offsets from the start of the data section
                // of the eeprom, so we subtract data_address_begin here to
                // store the right value
                types::address new_ptr =
                    conf.mem_size - len - addresses::data_address_begin;
                if (conf.chip ==
                    hardware_iface::EEPromChipType::MICROCHIP_24AA02T) {
                    new_ptr = new_ptr << 8;
                    len = len << 8;
                }
                auto* data_iter = write.data.begin();
                data_iter = bit_utils::int_to_bytes(
                    // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                    new_ptr, data_iter, data_iter + conf.addr_bytes);
                data_iter = bit_utils::int_to_bytes(
                    // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                    len, data_iter, data_iter + conf.addr_bytes);
                this->eeprom_client.send_eeprom_queue(write);
                tail_accessor.increase_data_tail(2 * conf.addr_bytes);
                if (!data.empty()) {
                    if (data.size() > len) {
                        LOG("Warning, sent too much data to initalize, "
                            "truncating to %d",
                            len);
                    }
                    this->write_at_offset(
                        accessor::AccessorBuffer(data.begin(), data.end()),
                        new_ptr, len, 0);
                }
            } else {
                action_cmd_m.key = key;
                action_cmd_m.offset = 0;
                action_cmd_m.len = len;
                action_cmd_m.action = TableAction::CREATE;
                if (!data.empty()) {
                    if (data.size() > len) {
                        LOG("Warning, sent too much data to initalize, "
                            "truncating to %d",
                            len);
                    }
                    std::copy_n(data.begin(), len, this->type_data.begin());
                    action_cmd_m.action = TableAction::INITALIZE;
                }
                // call a read to the previous table entry so we know where
                // to put the data
                tail_accessor.start_update();
                this->eeprom_client.send_eeprom_queue(
                    message::ReadEepromMessage{
                        .memory_address = calculate_table_entry_start(key - 1),
                        .length = static_cast<types::data_length>(
                            2 * conf.addr_bytes),
                        .callback = table_action_callback,
                        .callback_param = this});
            }
        } else {
            LOG("ERROR, attempting to create data part before driver "
                "initalized");
        }
    }

    void create_data_part(uint16_t key, uint16_t len) {
        auto dummy = std::array<uint8_t, 0>{};
        create_data_part(key, len, dummy);
    }

    auto data_part_exists(uint16_t key) -> bool {
        if (table_ready()) {
            return calculate_table_entry_start(key) <
                   tail_accessor.get_data_tail();
        }
        return false;
    }

    auto table_ready() -> bool {
        return config_updated && tail_accessor.get_tail_updated();
    }

    auto read_write_ready() -> bool {
        return table_ready() && tail_accessor.data_rev_complete();
    }

    /*
    OT-Library Methods
    */

    // Migration
    auto find_data_end(uint16_t key, uint16_t len) -> types::address {
        // find address of current key
        types::address current_key_start_address =
            calculate_table_entry_start(key);

        types::address key_end_address = current_key_start_address + len;

        types::address true_key_end_address =
            static_cast<types::address>(
                hardware_iface::EEpromMemorySize::ST_16_KBYTE) -
            key_end_address;

        return true_key_end_address;
    }

  private:
    DevDataTailAccessor<EEPromTaskClient>& tail_accessor;
    message::ConfigResponseMessage conf = message::ConfigResponseMessage{};
    bool config_updated{false};
    table_entry_action action_cmd_m = table_entry_action{};

    // callbacks
    void config_req_callback(const message::ConfigResponseMessage& m) {
        conf = m;
        config_updated = true;
        tail_accessor.set_config(conf);
        tail_accessor.start_read(0);
    }

    static void config_req_callback(const message::ConfigResponseMessage& m,
                                    void* param) {
        auto* self =
            // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
            reinterpret_cast<DevDataAccessor<EEPromTaskClient>*>(param);
        self->config_req_callback(m);
    }

    // this method gets called when the dev_data accessor reads the lookup table
    void table_action_callback(const message::EepromMessage& m) {
        const auto* data_iter = m.data.begin();
        types::address data_addr = 0;
        types::data_length data_len = 0;
        data_iter = bit_utils::bytes_to_int(
            // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
            data_iter, data_iter + conf.addr_bytes, data_addr);
        data_iter = bit_utils::bytes_to_int(
            // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
            data_iter, data_iter + conf.addr_bytes, data_len);
        if (conf.chip == hardware_iface::EEPromChipType::MICROCHIP_24AA02T) {
            data_addr = data_addr >> hardware_iface::ADDR_BITS_DIFFERENCE;
            data_len = data_len >> hardware_iface::ADDR_BITS_DIFFERENCE;
        }
        bool do_initalize = false;
        switch (action_cmd_m.action) {
            // When we recive a message started from a create, the message will
            // contain the table entry for the previous key, we need this data
            // to assign the new key a storage location
            case TableAction::INITALIZE:
                do_initalize = true;
                // don't break this is just an extension of create
                [[fallthrough]];
            case TableAction::CREATE:
                if (tail_accessor.get_data_tail() + action_cmd_m.len +
                        (2 * conf.addr_bytes) >
                    data_addr) {
                    LOG("Error attempted to iniztialze value too large for "
                        "memory");
                } else {
                    // First write the new table entry
                    message::WriteEepromMessage write;
                    write.memory_address = tail_accessor.get_data_tail();
                    write.length = 2 * conf.addr_bytes;
                    auto* write_iter = write.data.begin();
                    write_iter = bit_utils::int_to_bytes(
                        uint16_t(data_addr - action_cmd_m.len), write_iter,
                        // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                        (write_iter + conf.addr_bytes));
                    write_iter = bit_utils::int_to_bytes(
                        action_cmd_m.len, write_iter,
                        // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                        write_iter + conf.addr_bytes);
                    this->eeprom_client.send_eeprom_queue(write);

                    // After writing the table entry use the tail accessor to
                    // update the tail
                    tail_accessor.increase_data_tail(2 * conf.addr_bytes);

                    // If we passed data into the create write that data into
                    // the memory
                    if (do_initalize) {
                        this->write_at_offset(this->type_data,
                                              data_addr - action_cmd_m.len,
                                              data_addr, m.message_index);
                    }
                }
                break;
            case TableAction::READ_BEFORE_WRITE:
                // introduced for BookAccessor
                [[fallthrough]];
            case TableAction::READ:
                data_addr += action_cmd_m.offset;
                // if the read action has length 0, read the whole value else
                // only read as much as requested
                if (action_cmd_m.len != 0) {
                    data_len = action_cmd_m.len;
                }
                this->start_read_at_offset(data_addr, data_addr + data_len,
                                           m.message_index);
                break;
            case TableAction::WRITE:
                data_addr += action_cmd_m.offset;
                this->write_at_offset(this->type_data, data_addr,
                                      data_addr + action_cmd_m.len,
                                      m.message_index);
                break;
        }
    }

    static auto table_action_callback(const message::EepromMessage& m,
                                      void* param) -> void {
        // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
        auto* self = reinterpret_cast<DevDataAccessor*>(param);
        self->table_action_callback(m);
    }

    // helper function
    auto calculate_table_entry_start(uint16_t key) -> types::address {
        types::address addr = 0;
        if (config_updated) {
            addr = addresses::data_address_begin + (key * 2 * conf.addr_bytes);
        }  // todo else
        return addr;
    }
};

}  // namespace dev_data
}  // namespace eeprom
