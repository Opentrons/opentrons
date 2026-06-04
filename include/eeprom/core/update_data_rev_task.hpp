#pragma once

#include <cstdint>

#include "book_accessor.hpp"
#include "common/core/bit_utils.hpp"
#include "eeprom/core/book_accessor.hpp"
#include "eeprom/core/data_rev.hpp"
#include "eeprom/core/dev_data.hpp"
#include "eeprom/core/task.hpp"
#include "eeprom/core/types.hpp"
#include "eeprom/firmware/crc16.h"
#include "types.hpp"

// to be passed to EEPROM. breaks unless it's statically allocated at the file
// level for some reason. Likely a quirk of this god forsaken language
static std::array<std::array<uint8_t, eeprom::types::page_length>, 4> all_reads;

namespace eeprom {
namespace data_rev_task {

struct DataTableUpdateMessage {
    uint16_t data_rev;
    // list of new data table key/length pairs to add to the table
    std::vector<std::pair<types::address, types::data_length>> data_table;
};

// Message to migrate data from old to new
struct MigrateDataMessage {
    uint16_t data_rev;
    // previous data table
    std::vector<std::pair<types::address, types::data_length>> data_table;
};

struct OTLibraryUpdateMessage {
    uint16_t data_rev;
    std::vector<std::pair<types::address, types::data_length>> data_table;
};

using TaskMessage = std::variant<std::monostate, DataTableUpdateMessage,
                                 MigrateDataMessage, OTLibraryUpdateMessage>;

template <task::TaskClient EEPromClient>
class UpdateDataRevHandler : accessor::ReadListener {
  public:
    UpdateDataRevHandler(const UpdateDataRevHandler&) = delete;
    auto operator=(const UpdateDataRevHandler&)
        -> UpdateDataRevHandler& = delete;

    UpdateDataRevHandler(
        EEPromClient& eeprom_client,
        dev_data::DevDataTailAccessor<EEPromClient>& tail_accessor)
        : table_creator{eeprom_client, *this, accessor_backing, tail_accessor},
          book_table_creator{eeprom_client, *this, accessor_backing,
                             tail_accessor, all_reads},
          data_rev_accessor{eeprom_client, *this, data_rev_backing},
          eeprom_client(eeprom_client),
          tail_accessor(tail_accessor) {
        data_rev_accessor.start_read(0);
    }

    void handle_message(const TaskMessage& message) {
        std::visit([this](auto m) { this->visit(m); }, message);
    }

    auto ready() -> bool {
        return ready_for_new_message && table_creator.table_ready();
    }

    auto busy_migrating() -> bool { return migrating; }

  private:
    void visit(std::monostate&) {}

    void visit(const DataTableUpdateMessage& m) {
        // we really want to do this sequentially or the table can be malformed
        if (m.data_rev == current_data_rev + 1) {
            for (const auto& i : m.data_table) {
                // add the new data table entry
                table_creator.create_data_part(i.first, i.second);
                // wait for the table update to finish
                while (!table_creator.table_ready()) {
                    vTaskDelay(10);
                }
            }
            std::ignore = bit_utils::int_to_bytes(
                m.data_rev, data_rev_backing.begin(), data_rev_backing.end());
            data_rev_accessor.write(data_rev_backing, 0);
            current_data_rev = m.data_rev;
        }
    }

    void visit(const MigrateDataMessage& m) {
        // "finish data rev" before data rev is finished for migration to ensure
        // that reads can properly occur
        tail_accessor.finish_data_rev();

        if (m.data_rev == current_data_rev + 1) {
            migrating = true;
            key = m.data_table[0].first;
            length = m.data_table[0].second;
            intermediate_data_rev = m.data_rev;

            // reset the accessor backing to make sure it's empty for the next
            // read
            accessor_backing.fill(0);

            // get data that was previously at key
            table_creator.get_data(key, length, 0);
        }
    }

    void migrate_message_helper() {
        // create a new table entry at the same key
        book_table_creator.create_data_part(key, length, accessor_backing,
                                            true);

        // while (!table_creator.table_ready()) {
        //     vTaskDelay(10);
        // }

        current_data_rev = intermediate_data_rev;

        // reassign item to the next item in data table
        std::ignore = bit_utils::int_to_bytes(
            current_data_rev, data_rev_backing.begin(), data_rev_backing.end());
        data_rev_accessor.write(data_rev_backing, 0);

        migrating = false;
    }

    // method to set boundary of ot_library... not currently necessary, but may
    // be useful in the future
    //
    // void set_ot_library_boundary(MigrateDataMessage&
    // m) {
    //     // sort the data table to make sure keys are properly ordered
    //     auto data_table_length = m.data_table.size();
    //     std::sort(m.data_table.begin(), m.data_table.end());
    //
    //     // access final pair of data table and extract contents
    //     std::pair<types::address, types::data_length> data_end =
    //         m.data_table[data_table_length - 1];
    //     types::address key = data_end.first;
    //     types::data_length length = data_end.second;
    //
    //     // update the "tail" of ot_library (through ot_library_end address)
    //     // to end of previous data
    //     addresses::DataAddressWrapper::set_data_boundary(
    //         table_creator.find_data_end(key, length), eeprom_client);
    // }

    void visit(const OTLibraryUpdateMessage& m) {
        if (m.data_rev == current_data_rev + 1) {
            // set_ot_library_boundary(m);

            for (const auto& i : m.data_table) {
                // add the new data table entry
                book_table_creator.create_data_part(i.first, i.second);
                // wait for the table update to finish
                while (!table_creator.table_ready()) {
                    vTaskDelay(10);
                }
            }

            std::ignore = bit_utils::int_to_bytes(
                m.data_rev, data_rev_backing.begin(), data_rev_backing.end());
            data_rev_accessor.write(data_rev_backing, 0);
            current_data_rev = m.data_rev;
        }
    }

    void read_complete(uint32_t) final {
        // test if data is set to 0xFFFF, some chips default to 0x0000 but this
        // is fine since if it's set to that then it's already where we want it
        // to be as a default
        auto delivery_state =
            std::vector<uint8_t>(addresses::data_revision_length, 0xFF);
        // read_complete gets called twice:
        // 1. at the beginning to read the current data revision
        // 2. during a migration read to read the data table for a key
        if (migrating) {
            migrate_message_helper();
        } else {
            if (std::equal(delivery_state.begin(), delivery_state.end(),
                           data_rev_backing.begin())) {
                data_rev_backing.fill(0x00);
                data_rev_accessor.write(data_rev_backing, 0);
            }
            std::ignore = bit_utils::bytes_to_int(data_rev_backing.begin(),
                                                  data_rev_backing.end(),
                                                  current_data_rev);
        }
        ready_for_new_message = true;
    }
    uint16_t current_data_rev = 0;
    uint16_t intermediate_data_rev = 0;
    bool ready_for_new_message = false;
    bool migrating = false;
    uint16_t key = 0;
    uint16_t length = 0;
    dev_data::DataBufferType<8> accessor_backing =
        dev_data::DataBufferType<8>{};
    dev_data::DevDataAccessor<EEPromClient> table_creator;
    book_accessor::BookAccessor<EEPromClient, 8> book_table_creator;
    data_revision::DataRevisionType data_rev_backing =
        data_revision::DataRevisionType{};
    data_revision::DataRevAccessor<EEPromClient> data_rev_accessor;
    EEPromClient& eeprom_client;
    dev_data::DevDataTailAccessor<EEPromClient>& tail_accessor;
};

/**
 * The task type.
 */
template <template <class> class QueueImpl>
    requires MessageQueue<QueueImpl<TaskMessage>, TaskMessage>
class UpdateDataRevTask {
  public:
    using Messages = TaskMessage;
    using QueueType = QueueImpl<TaskMessage>;
    UpdateDataRevTask(QueueType& queue) : queue{queue} {}
    UpdateDataRevTask(const UpdateDataRevTask& c) = delete;
    UpdateDataRevTask(const UpdateDataRevTask&& c) = delete;
    auto operator=(const UpdateDataRevTask& c) = delete;
    auto operator=(const UpdateDataRevTask&& c) = delete;
    ~UpdateDataRevTask() = default;

    /**
     * Task entry point.
     */
    template <task::TaskClient EEPromClient>
    void operator()(
        EEPromClient* eeprom_client,
        dev_data::DevDataTailAccessor<EEPromClient>* tail_accessor,
        const std::vector<eeprom::data_rev_task::TaskMessage>* table_updater) {
        auto handler = UpdateDataRevHandler(*eeprom_client, *tail_accessor);
        for (const auto& i : *table_updater) {
            while (!handler.ready()) {
                vTaskDelay(10);
            }

            handler.handle_message(i);

            while (handler.busy_migrating()) {
                vTaskDelay(10);
            }
        }

        tail_accessor->finish_data_rev();
        vTaskDelete(nullptr);
    }

    [[nodiscard]] auto get_queue() const -> QueueType& { return queue; }

  private:
    QueueType& queue;
};

}  // namespace data_rev_task
}  // namespace eeprom
