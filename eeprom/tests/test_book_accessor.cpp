#include <cstdint>
#include <variant>

#include "catch2/catch.hpp"
#include "common/tests/mock_message_queue.hpp"
#include "eeprom/core/book_accessor.hpp"
#include "eeprom/core/messages.hpp"
#include "eeprom/core/task.hpp"
#include "eeprom/core/types.hpp"
#include "eeprom/firmware/crc16.h"
#include "eeprom/tests/mock_crc.hpp"
#include "eeprom/tests/mock_eeprom_listener.hpp"
#include "i2c/core/writer.hpp"
#include "i2c/tests/mock_response_queue.hpp"
using namespace eeprom;

class MockHardwareIface : public hardware_iface::EEPromHardwareIface {
    using hardware_iface::EEPromHardwareIface::EEPromHardwareIface;

  public:
    void set_write_protect(bool enabled) { set_calls.push_back(enabled); }
    std::vector<bool> set_calls{};
};

enum ReadOption {
    VALID,
    ONE_INVALID,
    ALL_INVALID,
};

template <class I2CQueueWriter, class OwnQueue>
struct BMockEEpromTaskClient {
    ReadOption read_option = VALID;
    int read_counter = 0;

    BMockEEpromTaskClient() {
        writer.set_queue(&i2c_queue);
        backing.fill(0xFF);
    }

    task::EEPromMessageHandler<I2CQueueWriter, OwnQueue> true_eeprom_handler =
        task::EEPromMessageHandler{writer, response_queue, hardware_iface};

    void send_eeprom_queue(const task::TaskMessage& message) {
        std::visit(
            [this](auto o) -> auto { this->visit(o); }, message);
    }

    std::vector<task::TaskMessage> messages_received{};

    std::array<uint8_t, 16384> backing{};

  private:
    test_mocks::MockMessageQueue<i2c::writer::TaskMessage> i2c_queue{};
    test_mocks::MockI2CResponseQueue response_queue{};
    i2c::writer::Writer<test_mocks::MockMessageQueue> writer =
        i2c::writer::Writer<test_mocks::MockMessageQueue>{};
    MockHardwareIface hardware_iface =
        MockHardwareIface{hardware_iface::EEPromChipType::ST_M24128_BF};
    void visit(const message::OTLibraryReadMessage& message) {
        // structure return message
        message::OTLibraryPageMessage to_be_sent =
            eeprom::message::OTLibraryPageMessage{};
        to_be_sent.memory_address = message.memory_address;
        to_be_sent.length = message.length;
        to_be_sent.message_index = 0;

        auto data_to_be_sent =
            std::array<uint8_t, static_cast<size_t>(types::DataSize::PAGE)>{};

        // TODO Make Data that will be sent back from "EEPROM"
        // generate arrays that aren't the valid one

        if (read_option == VALID) {
            switch (read_counter) {
                    // first in page, counter value 2
                case 0:
                    data_to_be_sent[2] = 0b00000010;  // counter
                    data_to_be_sent[9] = 0b00000010;  // value
                    break;
                    // second page in book, counter value 3
                case 1:
                    data_to_be_sent[2] = 0b00000011;
                    data_to_be_sent[9] = 0b00000011;
                    break;
                    // third (current) page in book, counter value 4
                case 2:
                    data_to_be_sent[2] = 0b00000100;
                    data_to_be_sent[0] = 0b10000100;  // CRC
                    data_to_be_sent[1] = 0b01000000;  // still CRC
                    data_to_be_sent[9] = 0b00000100;
                    break;
                    // fourth page in book, counter value 1
                case 3:
                    data_to_be_sent[2] = 0b00000001;
                    data_to_be_sent[9] = 0b00000001;
                    read_counter =
                        -1;  // reset counter so that if the object tries to
                             // read again it will get the same values and
                             // not an out of bounds value
                             // negative one because the counter is
                             // incremented at the end of this block
                    break;
            }
        } else if (read_option == ONE_INVALID) {
            switch (read_counter) {
                    // first in page, counter value 1
                case 0:
                    data_to_be_sent[2] = 0b00000001;  // counter
                    data_to_be_sent[9] = 0b00000001;  // value
                    break;
                    // second page in book, counter value 2
                case 1:
                    data_to_be_sent[2] = 0b00000010;
                    data_to_be_sent[9] = 0b00000010;
                    break;
                    // third (current) page in book, counter value 3 valid
                    // CRC; data value 4
                case 2:
                    data_to_be_sent[2] = 0b00000011;
                    data_to_be_sent[0] = 0b10000100;  // CRC
                    data_to_be_sent[1] = 0b01000000;  // still CRC
                    data_to_be_sent[9] = 0b00000100;
                    break;
                    // fourth page in book, counter value 3 invalid (no)
                    // CRC; data value 7
                case 3:
                    data_to_be_sent[2] = 0b00000100;
                    data_to_be_sent[9] = 0b00001001;
                    read_counter =
                        -1;  // reset counter so that if the object tries to
                             // read again it will get the same values and
                             // not an out of bounds value
                             // negative one because the counter is
                             // incremented at the end of this block
                    break;
            }
        } else if (read_option == ALL_INVALID) {
            // NO CRC sent at all
            data_to_be_sent[2] = 0b00000001;  // counter
            data_to_be_sent[9] = 0b00000001;  // value
            read_counter = 0;
        }

        read_counter++;

        to_be_sent.data = data_to_be_sent;

        const message::OTReadResponseCallback callback = message.callback;

        callback(to_be_sent, message.callback_param);
        messages_received.push_back(message);
    }

    void visit(const message::ReadEepromMessage& message) {
        auto resp = message::EepromMessage{};

        resp.memory_address = message.memory_address;
        resp.length = message.length;
        resp.message_index = message.message_index;
        std::copy_n(&backing[message.memory_address], message.length,
                    resp.data.begin());
        message.callback(resp, message.callback_param);
        messages_received.push_back(message);
    }

    void visit(const message::WriteEepromMessage& message) {
        // for testing purposes we don't need to do anything when we get
        // a write message, but we could add some functionality here if
        // we wanted
        std::copy_n(message.data.begin(), message.length,
                    &backing[message.memory_address]);
        messages_received.push_back(message);
    }

    void visit(const std::monostate& message) {
        std::ignore = message;
        // for testing purposes we don't need to do anything when we get a
        // monostate message, but we could add some functionality here if we
        // wanted
        messages_received.push_back(message);
    }

    void visit(const message::ConfigRequestMessage& message) {
        messages_received.push_back(message);

        auto m = task::TaskMessage{message};

        true_eeprom_handler.handle_message(m);
    }

    void visit(const i2c::messages::TransactionResponse& message) {
        std::ignore = message;
        messages_received.push_back(message);
    }
};

SCENARIO("Creating a data partition") { /* NOTE: This feature is very similar to
    what we have in dev data, so we
     * are not testing it as extensively here, just making sure that the
     * book accessor can call create data without error and that it sends
     * the correct message to the EEPROM client. We will rely on the more
     * extensive testing of create data in dev data to make sure that
     create
     * data is working properly. */

    auto mock_listener = MockListener{};
    auto buffer = eeprom::book_accessor::DataBufferType<1>();
    auto mock_crc = MockCRC{};

    auto mock_client =
        BMockEEpromTaskClient<i2c::writer::Writer<test_mocks::MockMessageQueue>,
                              test_mocks::MockI2CResponseQueue>{};
    auto tail_accessor = eeprom::dev_data::DevDataTailAccessor<
        BMockEEpromTaskClient<i2c::writer::Writer<test_mocks::MockMessageQueue>,
                              test_mocks::MockI2CResponseQueue>>{mock_client};
    auto test_book_accessor = book_accessor::BookAccessor<
        BMockEEpromTaskClient<i2c::writer::Writer<test_mocks::MockMessageQueue>,
                              test_mocks::MockI2CResponseQueue>,
        1>{mock_client, mock_listener, buffer, tail_accessor, mock_crc};

    tail_accessor.finish_data_rev();

    GIVEN("Book Accessor initializes properly") {
        THEN("Create data part no data") {
            uint16_t key = 0;
            uint16_t len = 1;
            // std::array<uint8_t, 1> data{0b00000100};
            std::array<uint8_t, 0> empty_data{};

            mock_client.messages_received.clear();
            test_book_accessor.create_data_part<0>(key, len, empty_data);

            // 3 messages (config, read, write) sent to eeprom client (by
            // tail_accessor flow) before the write that we care about
            auto message = mock_client.messages_received[0];
            REQUIRE(std::holds_alternative<eeprom::message::WriteEepromMessage>(
                message));
            auto write_message =
                std::get<eeprom::message::WriteEepromMessage>(message);
            REQUIRE(write_message.memory_address ==
                    eeprom::addresses::data_address_begin);

            // check that address to be written is correct

            uint16_t data_address_written = 0;

            std::ignore = bit_utils::bytes_to_int(
                write_message.data.cbegin(),
                write_message.data.cbegin() + sizeof(data_address_written),
                data_address_written);
            // hide first byte of address, we only care that the second
            // byte is 0
            data_address_written &= 0x00FF;

            REQUIRE(data_address_written == 0);
        }
        // THEN("create data part with existing data") {
        uint16_t key = 1;
        uint16_t len = 1;
        // std::array<uint8_t, 1> data{0b00000100};
        std::array<uint8_t, 0> empty_data{};

        mock_client.messages_received.clear();
        test_book_accessor.create_data_part<0>(key, len, empty_data);

        // 3 messages (config, read, write) sent to eeprom client (by
        // tail_accessor flow) before the write that we care about
        auto message = mock_client.messages_received[0];
        REQUIRE(std::holds_alternative<eeprom::message::WriteEepromMessage>(
            message));
        auto write_message =
            std::get<eeprom::message::WriteEepromMessage>(message);
        REQUIRE(write_message.memory_address ==
                eeprom::addresses::data_address_begin + 4);

        // check that address to be written is correct

        uint16_t data_address_written = 0;

        std::ignore = bit_utils::bytes_to_int(
            write_message.data.cbegin(),
            write_message.data.cbegin() + sizeof(data_address_written),
            data_address_written);

        // hide first byte of address, we only care that the second
        // byte is 0
        data_address_written &= 0x00FF;

        REQUIRE(data_address_written == 0);
        // }
    }
}

SCENARIO("Book Accessor can read data from EEPROM") {
    auto mock_listener = MockListener{};
    auto buffer = eeprom::book_accessor::DataBufferType<1>();
    auto mock_crc = MockCRC{};

    auto mock_client =
        BMockEEpromTaskClient<i2c::writer::Writer<test_mocks::MockMessageQueue>,
                              test_mocks::MockI2CResponseQueue>{};
    auto tail_accessor = eeprom::dev_data::DevDataTailAccessor<
        BMockEEpromTaskClient<i2c::writer::Writer<test_mocks::MockMessageQueue>,
                              test_mocks::MockI2CResponseQueue>>{mock_client};
    auto test_book_accessor = book_accessor::BookAccessor<
        BMockEEpromTaskClient<i2c::writer::Writer<test_mocks::MockMessageQueue>,
                              test_mocks::MockI2CResponseQueue>,
        1>{mock_client, mock_listener, buffer, tail_accessor, mock_crc};

    tail_accessor.finish_data_rev();
    uint16_t key = 0;
    uint16_t len = 1;
    uint16_t offset = 0;
    uint32_t message_index = 0;

    std::array<uint8_t, 0> empty_data{};
    GIVEN("Book Accessor initializes properly") {
        test_book_accessor.create_data_part<0>(key, len, empty_data);
        THEN("Read valid data properly") {
            mock_client.read_option = ReadOption::VALID;
            test_book_accessor.get_data(key, len, offset, message_index);
            // check that the value read is correct
            REQUIRE(buffer[0] == 0b00000100);
        }

        THEN("Cascade read when one page of data is invalid") {
            mock_client.read_option = ReadOption::ONE_INVALID;
            test_book_accessor.get_data(key, len, offset, message_index);
            // check that the value read is correct
            REQUIRE(buffer[0] == 0b00000100);
        }

        THEN("Return invalid data when all pages are invalid") {
            mock_client.read_option = ReadOption::ALL_INVALID;
            test_book_accessor.get_data(key, len, offset, message_index);
            // check that the value read is correct
            REQUIRE(buffer[0] == 0b00000000);
        }
    }
}
