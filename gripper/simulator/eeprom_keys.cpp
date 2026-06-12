// clang-format off
#include "FreeRTOS.h"
#include "task.h"
// clang-format on
#include "gripper/firmware/eeprom_keys.hpp"

#include "eeprom/simulation/eeprom.hpp"
#include "motor-control/core/tasks/usage_storage_task.hpp"

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev1{
    .data_rev = 1,
    .data_table = {
        std::make_pair(Z_MOTOR_DIST_KEY,
                       usage_storage_task::distance_data_usage_len),
        std::make_pair(G_MOTOR_DIST_KEY,
                       usage_storage_task::distance_data_usage_len)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev2{
    .data_rev = 2,
    .data_table = {
        std::make_pair(G_MOTOR_FORCE_TIME_KEY,
                       usage_storage_task::force_time_data_usage_len)}};

const std::vector<eeprom::data_rev_task::TaskMessage> table_updater = {
    // anytime there is an update to the data table add a message to this
    // vector with the new key/length pairs
    data_table_rev1, data_table_rev2};
