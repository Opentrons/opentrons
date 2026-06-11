#pragma once
#include <sys/types.h>

#include <algorithm>
#include <bitset>
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <unordered_map>

#include "accessor.hpp"
#include "addresses.hpp"
#include "common/core/bit_utils.hpp"
#include "dev_data.hpp"
#include "messages.hpp"
#include "task.hpp"
#include "types.hpp"

extern "C" {
#include "eeprom/firmware/crc16.h"
}

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
    DataBufferType<static_cast<size_t>(types::page_length)>
        intermediate_buffer{};
};

/*Accessor for OT Library. Takes byte arrays as data. Ensure they are in
 * Little Endian (in accordance with STM32 Architecture)
 *
 * SIZE is the size of the buffer*/

template <task::TaskClient EEpromTaskClient, size_t BUFFER_SIZE>
class BookAccessor
    : BookAccessorIntermediate,
      public eeprom::accessor::EEPromAccessor<EEpromTaskClient,
                                              addresses::ot_library_begin>,
      eeprom::accessor::ReadListener {
  public:
    explicit BookAccessor(
        EEpromTaskClient& eeprom_client, accessor::ReadListener& read_listener,
        DataBufferType<BUFFER_SIZE>& buffer,
        dev_data::DevDataTailAccessor<EEpromTaskClient>& tail_accessor,
        std::array<std::array<uint8_t, types::page_length>, 4>& all_reads)
        : BookAccessorIntermediate(),
          accessor::EEPromAccessor<EEpromTaskClient,
                                   addresses::ot_library_begin>(
              eeprom_client, *this,
              accessor::AccessorBuffer(intermediate_buffer.begin(),
                                       intermediate_buffer.end())),
          tail_accessor(tail_accessor),
          read_listener(read_listener),
          buffer(buffer),
          all_reads(all_reads) {
        for (auto& read : all_reads) {
            read.fill(0x00);
        }
        eeprom_client.send_eeprom_queue(
            message::ConfigRequestMessage{config_req_callback, this});

        write_buffer_internal.fill(0x00);
    }

    template <size_t NUM_BYTES>
    void create_data_part(uint16_t key, uint16_t len,
                          std::array<uint8_t, NUM_BYTES>& data,
                          bool migrating) {
        action_cmd_m.action = TableAction::CREATE;

        if (migrating) {
            action_cmd_m.action = TableAction::MIGRATE;
        }
        // "page_data" is what will be written to the EEPROM. Just data
        // with the header and some extra bytes afterwards to fill the
        // page.
        std::array<uint8_t, types::page_length> page_data{};
        page_data.fill(0x00);
        // set the length immediately. This is important for CRC calculations,
        // as the length of the data is not necessarily the same as the size of
        // the array passed in
        action_cmd_m.len = len;

        if (!data.empty()) {
            if (data.size() > types::page_data) {
                LOG("Warning, sent too much data to initalize, "
                    "truncating to %d",
                    types::page_data);
            }
            uint16_t counter = 1;
            uint16_t crc = calc_crc(data);

            // copy CRC, counter, and data to page_data
            std::memcpy(page_data.data(), &crc, 2);
            std::memcpy(page_data.data() + 2, &counter, sizeof(counter));

            // copy len into page_data
            std::memcpy(page_data.data() + 4, &len, sizeof(len));

            std::copy(data.begin(), data.begin() + len,
                      page_data.begin() + types::book_header_length);
        }
        if (table_ready()) {
            //  if the key is zero we don't need to read the former address
            if (key == 0) {
                // double check if this is writig to the data_table
                message::WriteEepromMessage write;
                write.memory_address = addresses::ot_library_table;
                write.length = 2 * conf.addr_bytes;
                // data pointers are offsets from the start of the data
                // section of the eeprom, so we subtract ot_library_begin
                // here to store the right value

                // new in OT library, subtract from ot_library_end to cut
                // off stale addresses
                types::address new_ptr =
                    addresses::ot_library_end -
                    (types::page_length * types::pages_per_book) -
                    addresses::ot_library_begin;

                // drop second byte (see confluence page for details)
                new_ptr &= 0xFF00;

                auto* data_iter = write.data.begin();
                data_iter = bit_utils::int_to_bytes(
                    // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                    new_ptr, data_iter, data_iter + conf.addr_bytes);
                data_iter = bit_utils::int_to_bytes(
                    // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                    len, data_iter, data_iter + conf.addr_bytes);
                this->eeprom_client.send_eeprom_queue(write);

                if (!migrating) {
                    tail_accessor.increase_data_tail(2 * conf.addr_bytes);
                }

                // create empty page for use in initilazation

                if (!data.empty()) {
                    this->write_at_offset(
                        accessor::AccessorBuffer(page_data.begin(),
                                                 page_data.end()),
                        new_ptr, new_ptr + types::page_length, 0);
                }
            } else {
                action_cmd_m.offset = 0;
                action_cmd_m.len = len;
                if (!data.empty()) {
                    std::copy_n(page_data.begin(), page_data.size(),
                                write_buffer.begin());
                    if (!migrating) {
                        action_cmd_m.action = TableAction::INITALIZE;
                        // call a read to the previous table entry so we know
                        // where to put the data
                        tail_accessor.start_update();
                    }
                }

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

    template <size_t NUM_BYTES>
    void create_data_part(uint16_t key, uint16_t len,
                          std::array<uint8_t, NUM_BYTES>& data) {
        create_data_part(key, len, data, false);
    }

    void create_data_part(uint16_t key, uint16_t len) {
        auto dummy = std::array<uint8_t, 0>{};
        create_data_part(key, len, dummy);
    }

    template <std::size_t NUM_BYTES>
    void write_data(uint16_t key, uint16_t len, uint16_t offset,
                    std::array<uint8_t, NUM_BYTES>& data) {
        if (read_write_ready()) {
            if (len > types::page_data) {
                LOG("ERROR, trying to write %d bytes from a %lu byte "
                    "buffer",
                    len, types::page_data);
                len = types::page_data;
            }

            this->action_cmd_m =
                table_entry_action{.key = key,
                                   .offset = offset,
                                   .len = len,
                                   .action = TableAction::READ_BEFORE_WRITE};

            LOG("Writing %d bytes to data partition", types::page_length);

            // format data to page
            std::array<uint8_t, types::page_length> page_data{};
            page_data.fill(0x00);

            // counter will be updated in table_action_callback
            uint16_t counter = 0;
            uint16_t crc = calc_crc(data);

            // make CRC the first two bytes of the page
            std::memcpy(page_data.data(), &crc, 2);
            // make Counter the next two bytes of the page
            std::memcpy(page_data.data() + 2, &counter, sizeof(counter));
            // make the length the next two bytes of the page
            std::memcpy(page_data.data() + 4, &len, sizeof(len));

            // make the data the rest of the page
            std::copy_n(data.begin(), len,
                        page_data.begin() + types::book_header_length);

            // copy the data to our internal buffer (write_buffer is used as
            // an internal buffer so it isn't overwritten by the read that
            // we have to do to write)
            std::copy_n(page_data.begin(), page_data.size(),
                        write_buffer.begin());

            // if we're writing to the same key as the cached key, we can skip
            // the read and use the data that was already in all_reads
            if (key == cached_key) {
                read_final(0);
            } else {
                // otherwise, call get_data and launch read flow
                get_data(key, len, offset, 0);
            }
        }
    }

    template <std::size_t NUM_BYTES>
    void write_data(uint16_t key, uint16_t len,
                    std::array<uint8_t, NUM_BYTES>& data) {
        write_data(key, len, 0, data);
    }

    template <std::size_t NUM_BYTES>
    void write_data(uint16_t key, std::array<uint8_t, NUM_BYTES>& data) {
        write_data(key, data.size(), 0, data);
    }

    void get_data(uint16_t key, uint16_t len, uint16_t offset,
                  uint32_t message_index) {
        if (read_write_ready()) {
            // reset all_reads
            for (auto& read : all_reads) {
                read.fill(0x00);
            }

            auto table_location = calculate_table_entry_start(key);
            // if (table_location > tail_accessor.get_data_tail()) {
            //     LOG("Error, attemping to read uninitalized value");
            //     return;
            // }

            if (!(action_cmd_m.action == TableAction::READ_BEFORE_WRITE)) {
                action_cmd_m = table_entry_action{.key = key,
                                                  .offset = offset,
                                                  .len = len,
                                                  .action = TableAction::READ};
            }

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

    auto data_part_exists(uint16_t key) -> bool {
        if (table_ready()) {
            return calculate_table_entry_start(key) <
                   tail_accessor.get_data_tail();
        }
        return false;
    }

    auto read_write_ready() -> bool {
        return table_ready() && tail_accessor.data_rev_complete();
    }

    auto table_ready() -> bool {
        return config_updated && tail_accessor.get_tail_updated();
        // return true;
    }

    void read_complete(uint32_t message_index) override {
        // receives read data 4 times, once for each page. After the 4th time,
        // the data from all 4 pages is processed together and the final
        // callback is called with the processed data. This is because the book
        // is split into 4 pages and we need to read all 4 pages to get the full
        // data

        // save what's in buffer to all_reads
        std::copy_n(intermediate_buffer.begin(), types::page_length,
                    all_reads[read_count].begin());

        // increment read_count
        read_count++;

        if (read_count < 4) {
            // kick off another read of the next page
            this->start_read_at_offset(
                current_book_address + (types::page_length * read_count),
                current_book_address + (types::page_length * (read_count + 1)),
                message_index);

        } else {
            read_count = 0;
            read_final(message_index);
        }
    }

  private:
    // fields, decide what they are
    // Add a tail accessor?
    dev_data::DevDataTailAccessor<EEpromTaskClient>& tail_accessor;
    message::ConfigResponseMessage conf = message::ConfigResponseMessage{};
    bool config_updated{false};
    table_entry_action action_cmd_m = dev_data::table_entry_action{};
    ReadListener& read_listener;
    uint8_t read_count = 0;
    DataBufferType<BUFFER_SIZE>& buffer;
    types::address current_book_address = addresses::ot_library_begin;
    std::array<uint8_t, types::page_length> write_buffer_internal{};
    accessor::AccessorBuffer write_buffer{write_buffer_internal.begin(),
                                          write_buffer_internal.end()};
    std::array<std::array<uint8_t, types::page_length>, 4>& all_reads;
    // cache the most recent key read to bypass reads wherever necesasry
    int16_t cached_key = -1;

    template <size_t num_bytes>
    auto calc_crc(std::array<uint8_t, num_bytes> data) -> uint16_t {
        crc16_init();

        // pass the length of the data from action_cmd_m, not the size of the
        // array, since the array may be larger than the actual data being
        // written
        uint16_t crc =
            crc16_compute(data.begin(), static_cast<uint8_t>(action_cmd_m.len));

        return crc;
    }

    auto check_crc(std::array<uint8_t, types::page_length>& bytes) -> bool {
        // Grab CRC from byte array
        uint16_t given_crc{};
        std::memcpy(&given_crc, bytes.data(), sizeof(given_crc));

        // calculate the CRC from the given data
        // Note: only the used bytes will be used in CRC caluclations
        std::array<uint8_t, types::page_data> given_data{0};
        std::copy_n(bytes.begin() + types::book_header_length, types::page_data,
                    given_data.begin());

        uint16_t calculated_crc = calc_crc<types::page_data>(given_data);

        return (calculated_crc == given_crc);
    }

    void read_final(uint16_t message_index) {
        // create variables representing read page addresses
        uint16_t read0 = 0;
        uint16_t read1 = 0;
        uint16_t read2 = 0;
        uint16_t read3 = 0;
        // convert counter from bytes to longs

        std::memcpy(&read0, &all_reads[0][2], sizeof(read0));
        std::memcpy(&read1, &all_reads[1][2], sizeof(read1));
        std::memcpy(&read2, &all_reads[2][2], sizeof(read2));
        std::memcpy(&read3, &all_reads[3][2], sizeof(read3));

        // quickly zero out all reads that are xFFFF
        if (read0 == 0xFFFF) {
            read0 = 0x0000;
        }
        if (read1 == 0xFFFF) {
            read1 = 0x0000;
        }
        if (read2 == 0xFFFF) {
            read2 = 0x0000;
        }
        if (read3 == 0xFFFF) {
            read3 = 0x0000;
        }

        // find maximum value
        std::array<uint16_t, 4> reads = {read0, read1, read2, read3};

        // sort reads from largest to smallest
        std::sort(reads.begin(), reads.end(), std::greater<>());

        // handle counter wraparound
        if (reads[0] >= 65000) {
            // keep track of previous value to compute difference
            uint16_t prev = reads[0];

            for (auto& read : reads) {
                // check if previous read is close enough to current read to
                // be a non-wraparound value
                if (prev - read <= 1) {
                    prev = read;
                }
                // if not, then we have found the most recent value
                else {
                    uint16_t index = &read - &reads[0];
                    // re-arrange reads so most recent value is first
                    std::rotate(reads.begin(), reads.begin() + index,
                                reads.end());
                    break;
                }
            }
        }
        if (action_cmd_m.action == TableAction::READ) {
            find_most_recent(message_index, reads, read0, read1, read2, read3);
        }

        else if (action_cmd_m.action == TableAction::READ_BEFORE_WRITE) {
            find_next_write(reads, read0, read1, read2, read3);
        }
    }

    void find_most_recent(uint16_t message_index,
                          std::array<uint16_t, 4>& reads, uint16_t read0,
                          uint16_t read1, uint16_t read2, uint16_t read3) {
        // change action_cmd_m.len to the length of the
        // data stored in the
        // page. This information is in bytes 4 and 5 of the header
        uint16_t data_len = 0;
        std::memcpy(&data_len, &all_reads[0][4], sizeof(data_len));
        action_cmd_m.len = data_len;

        // set most recent index and most recent valid again
        uint16_t most_recent_index = 0;
        size_t all_reads_index = 0;
        uint16_t most_recent_valid = reads.at(most_recent_index);

        bool crc_valid = false;

        while (!crc_valid) {
            // This while loop will keep looping through pages read
            // until it finds one whose written CRC matches the one
            // calcluated breaks if it has tried more than 4 times (the
            // number of pages in a book)
            if (most_recent_index >= 4) {
                std::array<uint8_t, BUFFER_SIZE> error{};
                error.fill(0xAA);
                // writes an error to the buffer
                // TODO: ? maybe come up with a way to recover the data
                // when this happens?

                std::copy_n(error.begin(), error.size(), this->buffer.begin());

                // tell object that called that the read is abailable, even
                // though it's just an error message, to avoid leaving it
                // hanging indefinitely or passing the wrong data
                read_listener.read_complete(message_index);
                return;
            }

            most_recent_valid = reads[most_recent_index];

            if (most_recent_valid == read0) {
                crc_valid = check_crc(all_reads[0]);
                all_reads_index = 0;

            } else if (most_recent_valid == read1) {
                crc_valid = check_crc(all_reads[1]);
                all_reads_index = 1;

            } else if (most_recent_valid == read2) {
                crc_valid = check_crc(all_reads[2]);
                all_reads_index = 2;

            } else if (most_recent_valid == read3) {
                crc_valid = check_crc(all_reads[3]);
                all_reads_index = 3;
            }

            most_recent_index++;
        }

        std::array<uint8_t, types::page_length>& relevant_page =
            all_reads.at(all_reads_index);

        std::copy_n(relevant_page.begin() + types::book_header_length,
                    BUFFER_SIZE, this->buffer.begin());
        // cache the key that was just read so that if we need to do a write
        // right after we can bypass the read and just write to the same
        // place
        cached_key = action_cmd_m.key;

        // tell object that called the read that the read is avaiable
        read_listener.read_complete(message_index);
    }

    void find_next_write(std::array<uint16_t, 4>& reads, uint16_t read0,
                         uint16_t read1, uint16_t read2, uint16_t read3) {
        // create a new eeprom message to send to table_action_callback

        message::EepromMessage write_msg{};

        types::address read0_offset = 0;
        types::address read1_offset = types::page_length;
        types::address read2_offset = types::page_length * 2;
        types::address read3_offset = types::page_length * 3;

        // because of the wraparound counter logic, we can be assured
        // that the last page is the least recently written page, so we
        // can use that to determine where to write the new data
        uint16_t least_recent = reads.at(reads.size() - 1);

        types::address page_address = current_book_address;

        // NOTE: this logic will break once a location eventually wears
        // out. It does not prevent writes to that location.

        if (least_recent == read0) {
            page_address += read0_offset;
        } else if (least_recent == read1) {
            page_address += read1_offset;
        } else if (least_recent == read2) {
            page_address += read2_offset;
        } else if (least_recent == read3) {
            page_address += read3_offset;
        }

        // clear write_msg.data just in case
        write_msg.data.fill(0x00);
        // storing this in data instead of memory address because table
        // action callback cheks data to determine write location
        uint8_t* write_iter = write_msg.data.begin();
        // copy page address into first 2 bytes of data
        write_iter = bit_utils::int_to_bytes(
            page_address, write_iter,
            // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
            write_iter + conf.addr_bytes);
        // copy new counter value into next 2 bytes of data
        uint16_t new_counter = reads[0] + 1;
        if (new_counter > 65000) {
            // reset counter to avoid overflow, this will cause some
            // confusion in determining the most recent page, but it is
            // necessary to avoid counter overflow
            new_counter = 0;
        }
        write_iter = bit_utils::int_to_bytes(
            new_counter, write_iter,
            // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
            write_iter + conf.addr_bytes);
        write_msg.length = conf.addr_bytes;
        // just fill memory address with beginning of lookup table tail
        write_msg.memory_address = addresses::lookup_table_tail_begin;

        // set table action to write
        action_cmd_m.action = TableAction::WRITE;

        table_action_callback(write_msg);
    }

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
                book_accessor::BookAccessor<EEpromTaskClient, BUFFER_SIZE>*>(
                param);
        self->config_req_callback(m);
    }
    // Calculates data's location on the lookup table
    auto calculate_table_entry_start(uint16_t key) -> types::address {
        types::address addr = 0;
        if (config_updated) {
            addr = addresses::ot_library_table + (key * 2 * conf.addr_bytes);
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
        bool migrating = false;
        switch (action_cmd_m.action) {
            case TableAction::MIGRATE:
                migrating = true;
                [[fallthrough]];
            case TableAction::INITALIZE:
                do_initalize = true;
                // don't break this is just an extension of create
                [[fallthrough]];
            case TableAction::CREATE:
                if (tail_accessor.get_data_tail() + types::page_length +
                        (2 * conf.addr_bytes) >
                    data_addr) {
                    LOG("Error attempted to initialize value too large for "
                        "memory");
                } else {
                    // First write the new table entry
                    message::WriteEepromMessage write;

                    // if we're migrating we want to write the new table
                    // entry to the same place as the old one, if we're not
                    // we want to write it to the tail
                    write.memory_address =
                        m.memory_address + (2 * conf.addr_bytes);

                    write.length = 2 * conf.addr_bytes;
                    auto* write_iter = write.data.begin();
                    uint16_t new_addr = data_addr - (types::page_length * 3);
                    // subtract a page to account for the fact that the
                    // final page of the EEPROM is off-limits
                    new_addr -= types::page_length;
                    write_iter = bit_utils::int_to_bytes(
                        new_addr, write_iter,
                        // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                        write_iter + conf.addr_bytes);
                    write_iter = bit_utils::int_to_bytes(
                        action_cmd_m.len, write_iter,
                        // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
                        write_iter + conf.addr_bytes);
                    this->eeprom_client.send_eeprom_queue(write);

                    // After writing the table entry use the tail accessor
                    // to update the tail
                    if (!migrating) {
                        tail_accessor.increase_data_tail(2 * conf.addr_bytes);
                    }

                    // If we passed data into the create write that data
                    // into the memory
                    if (do_initalize) {
                        // initialize the first page
                        this->write_at_offset(write_buffer, new_addr,
                                              new_addr + types::page_length,
                                              m.message_index);
                    }
                }
                break;
            case TableAction::WRITE:
                data_addr += action_cmd_m.offset;
                // NOTE: To avoid writing to much extra code, when
                // writing, the "data_len" gets received here (send from
                // read_final) actually contains the new counter value
                // to be written.

                // copy directly into internal buffer
                std::memcpy(write_buffer_internal.data() + 2, &data_len, 2);

                this->write_at_offset(write_buffer, data_addr,
                                      data_addr + types::page_length,
                                      m.message_index);
                break;
            case TableAction::READ_BEFORE_WRITE:
                [[fallthrough]];
            case TableAction::READ:
                data_addr += action_cmd_m.offset;
                current_book_address = data_addr;
                this->start_read_at_offset(
                    data_addr, data_addr + types::page_length, m.message_index);
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
