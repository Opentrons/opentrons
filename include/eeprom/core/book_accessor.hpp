#pragma once
#include <bitset>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <span>
#include <vector>

#include "accessor.hpp"
#include "addresses.hpp"
#include "common/core/bit_utils.hpp"
#include "dev_data.hpp"
#include "eeprom/firmware/crc16.h"
#include "messages.hpp"
#include "task.hpp"
#include "types.hpp"

namespace eeprom {
namespace book_accessor {

template <size_t SIZE>
using DataBufferType = std::array<uint8_t, SIZE>;
using DataTailType =
    std::array<uint8_t, eeprom::addresses::lookup_table_tail_length>;
using TableAction = dev_data::TableAction;
using table_entry_action = dev_data::table_entry_action;

struct BookAccessorIntermediate {
  protected:
    DataBufferType<static_cast<size_t>(types::page_length * 4)>
        intermediate_buffer;
};

/*Accessor for OT Library. Takes byte arrays as data. Ensure they are in
 * Little Endian (in accordance with STM32 Architecture)
 *
 * SIZE is the size of the buffer*/

template <task::TaskClient EEpromTaskClient, size_t SIZE>
class BookAccessor
    : BookAccessorIntermediate,
      public eeprom::accessor::EEPromAccessor<EEpromTaskClient,
                                              addresses::ot_library_begin>,
      eeprom::accessor::ReadListener {
  public:
    explicit BookAccessor(
        EEpromTaskClient& eeprom_client, accessor::ReadListener& read_listener,
        DataBufferType<SIZE>& buffer,
        dev_data::DevDataTailAccessor<EEpromTaskClient>& tail_accessor,
        eeprom::CRC16Base& crc16)
        : BookAccessorIntermediate{},
          accessor::EEPromAccessor<EEpromTaskClient,
                                   addresses::ot_library_begin>(
              eeprom_client, *this,
              accessor::AccessorBuffer(intermediate_buffer.begin(),
                                       intermediate_buffer.end())),
          tail_accessor(tail_accessor),
          crc16(crc16),
          read_listener(read_listener),
          buffer(buffer) {
        eeprom_client.send_eeprom_queue(
            message::ConfigRequestMessage{config_req_callback, this});
    }

    template <size_t NUM_BYTES>
    void create_data_part(uint16_t key, uint16_t len,
                          std::array<uint8_t, NUM_BYTES>& data) {
        // "page_data" is what will be written to the EEPROM. Just data with the
        // header and some extra bytes afterwards to fill the page.
        std::array<uint8_t, types::page_length> page_data{0};

        if (!data.empty()) {
            if (data.size() > types::book_data_length) {
                LOG("Warning, sent too much data to initalize, "
                    "truncating to %d",
                    types::book_data_length);
            }
            uint16_t counter = 1;
            // move data to larger container
            std::array<uint8_t, types::book_data_length> data_container{};
            std::copy_n(data.begin(), data.size(), data_container.begin());
            std::array<uint8_t, 2> crc = calc_crc(data_container);

            // make CRC the first two bytes of the page
            std::copy_n(crc.begin(), 2, page_data.begin());
            // make Counter the next two bytes of the page
            std::memcpy(page_data.data() + 2, &counter, sizeof(counter));
            // make the data the rest of the page
            std::copy_n(data_container.begin(), data_container.size(),
                        page_data.begin() + types::book_header_length + 1);
        }
        if (table_ready()) {
            //  if the key is zero we don't need to read the former address
            if (key == 0) {
                // double check if this is writig to the data_table
                message::WriteEepromMessage write;
                write.memory_address = addresses::data_address_begin;
                write.length = 2 * conf.addr_bytes;
                // data pointers are offsets from the start of the data section
                // of the eeprom, so we subtract ot_library_begin here to
                // store the right value

                // new in OT library, subtract from ot_library_end to cut off
                // stale addresses
                types::address new_ptr = addresses::ot_library_end -
                                         types::page_length -
                                         addresses::ot_library_begin;

                // drop second byte (first byte is pre-aligned to 4 pages);
                new_ptr &= 0xFF00;

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
                    this->write_at_offset(
                        accessor::AccessorBuffer(page_data.begin(),
                                                 page_data.end()),
                        new_ptr, types::page_length, 0);
                }
            } else {
                action_cmd_m.offset = 0;
                action_cmd_m.len = len;
                action_cmd_m.action = TableAction::CREATE;
                if (!data.empty()) {
                    std::copy_n(page_data.begin(), page_data.size(),
                                this->type_data.begin());
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
    //
    // void write_data(uint8_t key, uint16_t len,
    //                 std::array<uint8_t, SIZE> data) {
    //     std::ignore = key, len, data;
    // }
    //
    // write WRITE_DATA CONVENIENCE METHODS

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

    auto read_write_ready() -> bool {
        return table_ready() && tail_accessor.data_rev_complete();
    }

    auto table_ready() -> bool {
        return config_updated && tail_accessor.get_tail_updated();
        // return true;
    }

    void read_complete(uint32_t message_index) override {
        // split big read into 4 pages
        for (uint8_t i = 0; i < 4; i++) {
            // 1. save what's in buffer to all_reads
            std::copy_n((intermediate_buffer.begin() +
                         (static_cast<ptrdiff_t>(types::page_length * i))),
                        types::page_length, all_reads.at(i).begin());
        }
        read_final(message_index);
    }

    // GET_DATA CONVENIENCE METHODS
  private:
    // fields, decide what they are
    // Add a tail accessor?
    dev_data::DevDataTailAccessor<EEpromTaskClient>& tail_accessor;
    eeprom::CRC16Base& crc16;
    message::ConfigResponseMessage conf = message::ConfigResponseMessage{};
    bool config_updated{false};
    table_entry_action action_cmd_m = dev_data::table_entry_action{};
    ReadListener& read_listener;
    std::array<std::array<uint8_t, types::page_length>, 4> all_reads{};
    DataBufferType<SIZE>& buffer;

    template <size_t num_bytes>
    auto calc_crc(std::array<uint8_t, num_bytes> data)
        -> std::array<uint8_t, 2> {
        uint16_t crc =
            crc16.crc16_compute(data.cbegin(), static_cast<uint8_t>(num_bytes));
        std::array<uint8_t, 2> crc_byte{};
        std::memcpy(crc_byte.data(), &crc, sizeof(crc));

        return crc_byte;
    }

    auto check_crc(std::array<uint8_t, types::page_length> bytes) -> bool {
        // Grab CRC from byte array
        std::array<uint8_t, 2> given_CRC{};
        std::copy_n(bytes.begin(), 2, given_CRC.begin());

        // calculate the CRC from the given data
        // Note: only the used bytes will be used in CRC caluclations
        std::array<uint8_t, types::book_data_length> given_data{};
        std::copy_n(bytes.begin() + types::book_header_length + 1,
                    action_cmd_m.len, given_data.begin());

        std::array<uint8_t, 2> calculated_crc = calc_crc(given_data);

        return (calculated_crc == given_CRC);
    }

    void read_final(uint16_t message_index) {
        // create variables representing read page addresses
        // TODO: Change names to reflect the fact that we are not doing one
        // large read instead of 4 small ones
        uint16_t read_00 = 0;
        uint16_t read_01 = 0;
        uint16_t read_11 = 0;
        uint16_t read_10 = 0;
        // convert counter from bytes to longs

        std::memcpy(&read_00, &all_reads[0][2], sizeof(read_00));
        std::memcpy(&read_01, &all_reads[1][2], sizeof(read_01));
        std::memcpy(&read_11, &all_reads[2][2], sizeof(read_11));
        std::memcpy(&read_10, &all_reads[3][2], sizeof(read_10));

        // find maximum value
        // TODO implement counter wraparound
        std::array<uint16_t, 4> reads = {read_00, read_01, read_11, read_10};
        std::sort(reads.begin(), reads.end(), std::greater<>());
        uint16_t most_recent_index = 0;
        uint16_t most_recent_valid = reads.at(most_recent_index);

        if (action_cmd_m.action == TableAction::READ) {
            // std::array<uint8_t, 56> data_for_return{};
            types::data_length returned_data_len = action_cmd_m.len;
            auto returned_data =
                std::span(all_reads[0])
                    .subspan(types::book_header_length + 1, returned_data_len);
            bool crc_valid = false;

            while (!crc_valid) {
                // This while loop will keep looping through pages read
                // until it finds one whose written CRC matches the one
                // calcluated breaks if it has tried more than 4 times (the
                // number of pages in a book)
                if (most_recent_index >= 4) {
                    std::array<uint8_t, SIZE> error{0};
                    // writes an error to the buffer
                    // TODO ? maybe come up with a way to recover the data
                    // when this happens?

                    std::copy_n(error.begin(), error.size(),
                                this->buffer.begin());

                    break;
                }

                most_recent_valid = reads.at(most_recent_index);

                if (most_recent_valid == read_00) {
                    returned_data = std::span(all_reads[0])
                                        .subspan(types::book_header_length + 1,
                                                 returned_data_len);
                    crc_valid = check_crc(all_reads[0]);

                } else if (most_recent_valid == read_01) {
                    returned_data = std::span(all_reads[1])
                                        .subspan(types::book_header_length + 1,
                                                 returned_data_len);
                    crc_valid = check_crc(all_reads[1]);

                } else if (most_recent_valid == read_11) {
                    returned_data = std::span(all_reads[2])
                                        .subspan(types::book_header_length + 1,
                                                 returned_data_len);
                    crc_valid = check_crc(all_reads[2]);

                } else if (most_recent_valid == read_10) {
                    returned_data = std::span(all_reads[3])
                                        .subspan(types::book_header_length + 1,
                                                 returned_data_len);
                    crc_valid = check_crc(all_reads[3]);
                }

                most_recent_index++;
            }

            if (crc_valid) {
                std::copy_n(returned_data.begin(), returned_data.size(),
                            this->buffer.begin());
            }

            // tell object that called the read that the read is avaiable
            read_listener.read_complete(message_index);

        } else if (action_cmd_m.action == TableAction::WRITE) {
            // TODO: finish this when writing
            return;
        }
    }

    // void write_callback(uint8_t key, uint16_t len,
    //                     std::array<uint8_t, SIZE> data) {
    //     std::ignore = data;
    // }
    //
    // Methods from DevDataAccessor

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
            reinterpret_cast<
                book_accessor::BookAccessor<EEpromTaskClient, SIZE>*>(param);
        self->config_req_callback(m);
    }
    // Calculates data's location on the lookup table
    auto calculate_table_entry_start(uint16_t key) -> types::address {
        types::address addr = 0;
        if (config_updated) {
            addr = addresses::data_address_begin + (key * 2 * conf.addr_bytes);
        }
        return addr;
    }

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
            case TableAction::INITALIZE:
                do_initalize = true;
                // don't break this is just an extension of create
                [[fallthrough]];
            case TableAction::CREATE:
                // TODO: calculate new start address
                if (tail_accessor.get_data_tail() + types::page_length +
                        (2 * conf.addr_bytes) >
                    data_addr) {
                    LOG("Error attempted to initialize value too large for "
                        "memory");
                } else {
                    // First write the new table entry
                    message::WriteEepromMessage write;
                    write.memory_address = tail_accessor.get_data_tail();
                    write.length = 2 * conf.addr_bytes;
                    auto* write_iter = write.data.begin();
                    write_iter = bit_utils::int_to_bytes(
                        uint16_t(data_addr - (types::page_length * 4)) & 0xFF00,
                        write_iter,
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
                        this->write_at_offset(
                            this->type_data,
                            (data_addr - (types::page_length * 4)) & 0xFF00,
                            types::page_length, m.message_index);
                    }
                }
                break;
            case TableAction::WRITE:
                [[fallthrough]];
            case TableAction::READ:
                // TODO: ask Ryan if this is unnecessary
                // action_cmd_m.len = data_len;
                data_addr += action_cmd_m.offset;
                // read all 4 whole pages at the same time
                this->OT_start_read_at_offset(
                    data_addr, data_addr + (types::page_length * 4),
                    m.message_index);
                break;
        }
    }

    static auto table_action_callback(const message::EepromMessage& m,
                                      void* param) -> void {
        // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
        auto* self = reinterpret_cast<BookAccessor*>(param);
        self->table_action_callback(m);
    }
};

}  // namespace book_accessor
}  // namespace eeprom
