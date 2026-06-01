// clang-format off
#include "FreeRTOS.h"
#include "task.h"
// clang-format on
#include "pipettes/firmware/eeprom_keys.hpp"

#include "motor-control/core/tasks/usage_storage_task.hpp"
#include "pipettes/core/pipette_type.h"

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev1_sing_mult{
    .data_rev = 1,
    .data_table = {std::make_pair(
        PLUNGER_MOTOR_STEP_KEY, usage_storage_task::distance_data_usage_len)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev2_sing_mult{
    .data_rev = 2,
    .data_table = {std::make_pair(P_SM_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev3_sing_mult{
    .data_rev = 3,
    .data_table = {std::make_pair(OVERPRESSURE_COUNT_KEY_SM,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev4_sing_mult{
    .data_rev = 4,
    .data_table = {std::make_pair(EVOTIP_DISPENSE_COUNT_KEY_SM,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev5_sing_mult{
    .data_rev = 5,
    .data_table = {std::make_pair(
        PLUNGER_MOTOR_STEP_KEY, usage_storage_task::distance_data_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev6_sing_mult{
    .data_rev = 6,
    .data_table = {std::make_pair(P_SM_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev7_sing_mult{
    .data_rev = 7,
    .data_table = {std::make_pair(OVERPRESSURE_COUNT_KEY_SM,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev8_sing_mult{
    .data_rev = 8,
    .data_table = {std::make_pair(EVOTIP_DISPENSE_COUNT_KEY_SM,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev_dud_sing_mult{
    .data_rev = 0, .data_table = {std::make_pair(0, 0)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev1_96ch{
    .data_rev = 1,
    .data_table = {
        std::make_pair(PLUNGER_MOTOR_STEP_KEY,
                       usage_storage_task::distance_data_usage_len),
        std::make_pair(GEAR_LEFT_MOTOR_KEY,
                       usage_storage_task::distance_data_usage_len),
        std::make_pair(GEAR_RIGHT_MOTOR_KEY,
                       usage_storage_task::distance_data_usage_len)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev2_96ch{
    .data_rev = 2,
    .data_table = {std::make_pair(P_96_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len),
                   std::make_pair(L_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len),
                   std::make_pair(R_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev3_96ch{
    .data_rev = 3,
    .data_table = {std::make_pair(OVERPRESSURE_COUNT_KEY_96,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::DataTableUpdateMessage data_table_rev4_96ch{
    .data_rev = 4,
    .data_table = {std::make_pair(EVOTIP_DISPENSE_COUNT_KEY_96,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev5_96ch{
    .data_rev = 5,
    .data_table = {std::make_pair(
        PLUNGER_MOTOR_STEP_KEY, usage_storage_task::distance_data_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev6_96ch{
    .data_rev = 6,
    .data_table = {std::make_pair(
        GEAR_LEFT_MOTOR_KEY, usage_storage_task::distance_data_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev7_96ch{
    .data_rev = 7,
    .data_table = {std::make_pair(
        GEAR_RIGHT_MOTOR_KEY, usage_storage_task::distance_data_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_rev_table_rev8_96ch{
    .data_rev = 8,
    .data_table = {std::make_pair(P_96_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_rev_table_rev9_96ch{
    .data_rev = 9,
    .data_table = {std::make_pair(L_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_rev_table_rev10_96ch{
    .data_rev = 10,
    .data_table = {std::make_pair(R_ERROR_COUNT_KEY,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev11_96ch{
    .data_rev = 11,
    .data_table = {std::make_pair(OVERPRESSURE_COUNT_KEY_96,
                                  usage_storage_task::error_count_usage_len)}};

const eeprom::data_rev_task::MigrateDataMessage data_table_rev12_96ch{
    .data_rev = 12,
    .data_table = {std::make_pair(EVOTIP_DISPENSE_COUNT_KEY_96,
                                  usage_storage_task::error_count_usage_len)}};

const std::vector<eeprom::data_rev_task::TaskMessage> table_updater = {
    // anytime there is an update to the data table add a message to this
    // vector with the new key/length pairs
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev1_96ch
                                             : data_table_rev1_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev2_96ch
                                             : data_table_rev2_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev3_96ch
                                             : data_table_rev3_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev4_96ch
                                             : data_table_rev4_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev5_96ch
                                             : data_table_rev5_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev6_96ch
                                             : data_table_rev6_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev7_96ch
                                             : data_table_rev7_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_rev_table_rev8_96ch
                                             : data_table_rev8_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_rev_table_rev9_96ch
                                             : data_table_rev_dud_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_rev_table_rev10_96ch
                                             : data_table_rev_dud_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev11_96ch
                                             : data_table_rev_dud_sing_mult,
    get_pipette_type() == NINETY_SIX_CHANNEL ? data_table_rev12_96ch
                                             : data_table_rev_dud_sing_mult};
