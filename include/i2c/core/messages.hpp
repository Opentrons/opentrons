#pragma once

#include <array>
#include <cstdint>

#include "common/core/message_queue.hpp"

namespace i2c {
namespace messages {

using std::size_t;
static constexpr std::size_t MAX_BUFFER_SIZE = 10;
using MaxMessageBuffer = std::array<uint8_t, MAX_BUFFER_SIZE>;

/*
** Component struct for identifying a transaction. The primary identifier
** is an arbitrary uint32_t - this should be set by the caller, and is
** available for setting in i2c::writer::Writer - and an add on bool used
** for chaining response messages through the poller.
** The transaction index is used for multi-register reads; for these, the
** index is which transaction just completed.
*/
struct TransactionIdentifier {
    uint32_t token;
    bool is_completed_poll;
    uint8_t transaction_index;
    auto operator==(const TransactionIdentifier& other) const -> bool = default;
};

/*
** Core data structure describing a single i2c transaction. The address should
** be the i2c address of the device; the write_buffer holds data to write and
** the size elements are the amounts to read or write.
*/
struct Transaction {
    uint32_t message_index;
    uint16_t address;
    size_t bytes_to_read;
    size_t bytes_to_write;
    MaxMessageBuffer write_buffer;

    auto operator==(const Transaction&) const -> bool = default;
};

/*
** Response message that will be sent after a transaction completes, mirroring
** the transaction identifier that was associated with the transaction that just
** ended, and contains the data read out of the bus (if any).
*/
struct TransactionResponse {
    auto operator==(const TransactionResponse&) const -> bool = default;
    uint32_t message_index;
    TransactionIdentifier id;
    size_t bytes_read;
    MaxMessageBuffer read_buffer;
};

/*
** A concept that can be used to identify a queue capable of receiving a
** Transaction Response.
*/
template <typename MessageQueue>
concept I2CResponseQueue =
    RespondableMessageQueue<MessageQueue, TransactionResponse>;

/*
** Holds a special tiny little closure for writing response values
** that can be passed something with static lifetime - a normal
** function pointer. We need this because it will be memcpy'd, and
** so we can't use an actual safe closure like a std::function because
** it will get destroyed.
*/
struct ResponseWriter {
    template <I2CResponseQueue OriginatingQueue>
    explicit ResponseWriter(OriginatingQueue& rq)
        // NOLINTNEXTLINE(cppcoreguidelines-pro-type-reinterpret-cast)
        : queue_ref(reinterpret_cast<void*>(&rq)),
          writer(&OriginatingQueue::try_write_static) {}
    ResponseWriter() = default;
    ResponseWriter(const ResponseWriter& other) = default;
    auto operator=(const ResponseWriter& other) -> ResponseWriter& = default;
    ResponseWriter(ResponseWriter&& other) = default;
    auto operator=(ResponseWriter&& other) -> ResponseWriter& = default;
    ~ResponseWriter() = default;
    void* queue_ref{nullptr};
    bool (*writer)(void*, const TransactionResponse&){nullptr};

    [[nodiscard]] auto write(const TransactionResponse& response) const
        -> bool {
        if ((writer != nullptr) && (queue_ref != nullptr)) {
            return writer(queue_ref, response);
        }
        return false;
    }
};

/*
** Command an immediate I2C read-write transaction with an address.
** handle_buffer will be called on the response.
*/

struct Transact {
    Transaction transaction;
    TransactionIdentifier id;
    ResponseWriter response_writer;
};
/*
** Command a count-limited number of I2C reads from an single register
** of a single address at a specific poll timing. The poll timing may
** end up slightly off because other polls may be in progress for this
** device.
**
** After each read is complete, a TransactionResponse will be set upstream;
** after the poll is complete, the last response will have its
** is_completed_poll flag set.
*/
struct SingleRegisterPollRead {
    int polling;
    int delay_ms;
    Transaction first;
    TransactionIdentifier id;
    ResponseWriter response_writer;
};

/**
** Command a count-limited number of I2C reads from a pair of registers
** of a single address at a specific poll timing. The poll timing may
** end up slightly off because other polls may be in progress for this
** device.
**
** After each read is complete, a TransactionResponse will be sent upstream;
** after the poll is complete, the last response will have its
** is_completed_poll flag set. Since a response is sent for each transaction,
** each poll will have two responses sent upstream.
* */
struct MultiRegisterPollRead {
    int polling;
    int delay_ms;
    TransactionIdentifier id;
    Transaction first;
    Transaction second;
    ResponseWriter response_writer;
};

/**
** Start, update, or stop continuous polling of a single register
** of an I2C address at a specific timing.
**
** If the poll_id has already been configured, receipt of this message
** will reconfigure that ongoing poll. If it has not, a new poll will
** be started.
**
** If the delay_ms is 0, the poll will not happen. Otherwise, it will
** reoccur at the commanded period.
**
** To stop an ongoing poll, send this message with the same poll_id and
** a delay_ms of 0.
**
** After each read completes, a TransactionResponse will be sent upstream.
*/
struct ConfigureSingleRegisterContinuousPolling {
    int delay_ms;
    Transaction first;
    TransactionIdentifier id;
    ResponseWriter response_writer;
};

/**
** Start, update, or stop continuous polling of multiple registers
** of an I2C address at a specific timing.
**
** If the poll_id has already been configured, receipt of this message
** will reconfigure that ongoing poll. If it has not, a new poll will
** be started.
**
** If the delay_ms is 0, the poll will not happen. Otherwise, it will
** reoccur at the commanded period.
**
** To stop an ongoing poll, send this message with the same poll_id and
** a delay_ms of 0.
**
** After each read completes, a TransactionResponse will be sent upstream.
*/
struct ConfigureMultiRegisterContinuousPolling {
    int delay_ms;
    Transaction first;
    Transaction second;
    TransactionIdentifier id;
    ResponseWriter response_writer;
};

}  // namespace messages
}  // namespace i2c
