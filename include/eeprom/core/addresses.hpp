#pragma once

#include "common/core/bit_utils.hpp"
#include "messages.hpp"
#include "types.hpp"

namespace eeprom {
namespace addresses {

/*
 * **** header format for the eeprom chip ****
 * [serial number] [revison]  [reserved]  [data_revison] [lookup_table_tail]
 *
 * [20 bytes]    [4 bytes] [4 bytes]    [2 bytes]      [2 bytes]
 *
 * [                         32 bytes                          ]
 *
 * overall eeprom organization
 * [header] [lookup table] [unallocated] [data]
 *
 *  ****    Description ****
 * Systems using the eeprom storage should use one of several of the
 * provided accessors
 * there are 3 default accessors for every chip/board
 *
 * serial number
 * data_revision
 * revision

 * each of these has 2 main functions, write and start read. Write populates
 * that type of value into the eeprom, while start_read queries the chip for
 * data and then calls a provided listener.
 *
 * ------------General purpose filesystem-----------
 * The eeprom driver provides a way to add/remove key-values to the lookup
 * table. the lookup table grows from lower address to greater, while the data
 * gets allocated from the back forward. This allows future revisions to simply
 * add new data allocations without having to reformat the chip every time. this
 * also allows us to generalize around different eeprom chips with different
 * memory sizes in regards to data allocation.
 *
 * The lookup table will be hardware dependent, with each element of the table
 * being a pair of numbers equal to the data address size (i.e. two 8-bit values
 * for an 8-bit address chip and two 16-bit values on 16-bit address chips). The
 * first stores the memory address of the beginning of that value (as an offset
 * from the data section i.e address - 32) and the second stores the length in
 * bytes.
 *
 * The implementing client will need to define a list of key-values they want to
 *  read/write from starting at 0 in some sort of configuration file to
 * initialize a key-value table on the eeprom.
 *
 * An initialize request will be sent with [key, value_length] or optionally
 * [key, value_length, initial value]. When attemping to
 *
 * When clients send a ‘write_data’ request they will need to provide at a
 * minimum [key, buffer] to completely overwrite a particular key-value. This is
 * also overloaded to [key, length, buffer] to only write to the first ‘length’
 * bytes of the value.  The final overload is [key, length, offset, buffer] this
 * function writes ‘length’ bytes offset by ‘offset’ bytes from the beginning of
 * the value
 *
 * When a client sends a get_data request it will provide [key]. As with the
 * write it should also overload with [key, length] to read the first ‘length’
 * bytes and [key, length, offset] to read ‘length’ bytes offset by ‘offset’
 * bytes from the beginning of the value
 *
 * When a read or write operation is performed, first the driver will read the
 * value memory address at  lookup_table[2*sizeof(address)*key] and the data
 * length from lookup_table[(2*sizeof(address)*key) + sizeof(address)]. If the
 * operation attempts to read a uninitialized key ie when
 * ((2*sizeof(address)*key) > data_table_tail) it will call the callback with an
 * UNINITIALIZED error.
 *
*/

constexpr types::data_length serial_number_length = 20;
constexpr types::address serial_number_address_begin = 0;
constexpr types::address serial_number_address_end =
    serial_number_address_begin + serial_number_length;

constexpr types::data_length revision_length = 4;
constexpr types::address revision_address_begin = serial_number_address_end;
constexpr types::address revision_address_end =
    revision_address_begin + revision_length;

constexpr types::data_length boundary_address_length = 2;
constexpr types::address boundary_address_begin = revision_address_end;
constexpr types::address boundary_address_end =
    boundary_address_begin + boundary_address_length;

constexpr types::data_length reserved_length = 2;
constexpr types::address reserved_address_begin = boundary_address_end;
constexpr types::address reserved_address_end =
    reserved_address_begin + reserved_length;

constexpr types::data_length data_revision_length = 2;
constexpr types::address data_revision_address_begin = reserved_address_end;
constexpr types::address data_revision_address_end =
    data_revision_address_begin + data_revision_length;

constexpr types::data_length lookup_table_tail_length = 2;
constexpr types::address lookup_table_tail_begin = data_revision_address_end;
constexpr types::address lookup_table_tail_end =
    lookup_table_tail_begin + lookup_table_tail_length;

constexpr types::address data_address_begin = lookup_table_tail_end;

// create ot_library variables
// First 3 pages of the eeprom are reserved for the lookup table
constexpr types::address ot_library_begin = types::page_length * 3;
constexpr types::address ot_library_end =
    static_cast<types::address>(hardware_iface::EEpromMemorySize::ST_16_KBYTE) -
    types::page_length;

/*
 *Wrapper class for ot_library_end and ot_library_begin
 *included here because there we need a way to enforce
 *that ot_library addresses can only be written to once
 *
 *NOTE This is no longer necessary for the ot_library implementation
 See confluence "Ot-Library Migration" docs for more information
 *NOTE: ot_library_begin and ot_library_end WILL BE NULL VALUES until
 *set_data_boundary is called.
 */
// template <task::TaskClient EEpromClient>
class DataAddressWrapper {
  public:
    static auto get_ot_library_begin() -> types::address {
        return _ot_library_begin.value();
    }
    static auto get_ot_library_end() -> types::address {
        return _ot_library_end.value();
    }

    // sets the ot_library boundary with old data
    //  FYI: this _boundary_address is the actual address that will be stored at
    //  the location of the above boundary_address Basicalsy _boundary_address =
    //  value
    //             boundary_address = header location that contains
    //             _boundary_address
    static void set_data_boundary(types::address _boundary_address,
                                  auto& eeprom_client) {
        // if either these have been written to, don't do anything
        if (_ot_library_end || _ot_library_begin) {
            return;
        }

        uint8_t byte_size = 64;

        if (_boundary_address % byte_size != 0) {
            uint16_t divided = _boundary_address / 64;
            uint16_t page_aligned = divided * 64;

            _boundary_address -= _boundary_address - page_aligned;
        }

        // reassign everything
        // _ot_library_begin is set to 192 to give the lookup table enough room
        // to grow It amounts to 3 pages at the beginning of the eeprom
        _ot_library_begin = 192;
        _ot_library_end = _boundary_address;

        message::WriteEepromMessage write;
        write.memory_address = boundary_address_begin;
        write.length = boundary_address_length;

        auto* write_iter = write.data.begin();
        write_iter = bit_utils::int_to_bytes(
            _boundary_address, write_iter,
            // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
            write_iter + write.length);

        eeprom_client.send_eeprom_queue(write);
    }

  private:
    static inline std::optional<types::address> _ot_library_begin;
    static inline std::optional<types::address> _ot_library_end;
};

}  // namespace addresses
}  // namespace eeprom
