## The variable test_case_key will be pre-pended to the file name and the override value will be used to replace the value of the variable in the protocol file.
from typing import Literal, Union, ClassVar, Dict, List, Optional
from dataclasses import dataclass
from opentrons import protocol_api
from opentrons.protocol_api import OFF_DECK, SINGLE, ROW, COLUMN, PARTIAL_COLUMN
from opentrons.types import Location

# Need to add transfer, consolidate, and distribute
# Tip pickup around thermocycler

PipetteNames = Literal["flex_8channel_50", "flex_8channel_1000", "flex_96channel_1000"]
TipRackNames = Literal["opentrons_flex_96_tiprack_1000ul", "opentrons_flex_96_tiprack_200ul", "opentrons_flex_96_tiprack_50ul"]

NUM_ROWS_IN_TIPRACK = 8
NUM_COLUMNS_IN_TIPRACK = 12
NUM_TIPS_PER_TIPRACK = NUM_ROWS_IN_TIPRACK * NUM_COLUMNS_IN_TIPRACK
HACKY_FLEX_1000_UL_TIPRACK_LOAD_NAME = "hacky_1000ul_flex_tiprack"
LIQUID_TRANSFER_AMOUNT = 5.0


@dataclass
class LiquidTransferSettings:
    source_labware_deck_slot: str
    destination_labware_deck_slot: str
    transfer_volume: float = LIQUID_TRANSFER_AMOUNT


@dataclass
class PipetteConfiguration:
    num_to_row_lookup: ClassVar[Dict[int, str]] = {
        1: "A",
        2: "B",
        3: "C",
        4: "D",
        5: "E",
        6: "F",
        7: "G",
        8: "H",
    }
    number_per_pickup_to_slot_lookup: ClassVar[Dict[int, str]] = {
        2: "G1",
        3: "F1",
        4: "E1",
        5: "D1",
        6: "C1",
        7: "B1",
    }

    pickup_mode: Union[Literal["SINGLE"], Literal["ROW"], Literal["COLUMN"], Literal["PARTIAL_COLUMN"]]
    starting_pipette_nozzle: str
    ending_pipette_nozzle: Optional[str]  # for PARTIAL_COLUMN only

    def __str__(self) -> str:
        return (
            f"PipetteConfiguration(pickup_mode={self.pickup_mode}, "
            f"starting_pipette_nozzle={self.starting_pipette_nozzle}, "
            f"ending_pipette_nozzle={self.ending_pipette_nozzle}, "
            f"max_number_of_pickups={self.max_number_of_pickups})"
        )

    def _calculate_number_per_pickup_for_partial_column(self) -> int:
        assert self.pickup_mode == PARTIAL_COLUMN
        well_name = self.ending_pipette_nozzle
        for num_pickups_key, well_name_key in self.number_per_pickup_to_slot_lookup.items():
            if well_name == well_name_key:
                return num_pickups_key
        else:
            raise ValueError(f"Could not find number of pickups for well {well_name}")

    def _calculate_number_pickups_per_column_for_partial_column(self) -> int:
        assert self.pickup_mode == PARTIAL_COLUMN
        num_per_pickup = self._calculate_number_per_pickup_for_partial_column()
        return NUM_COLUMNS_IN_TIPRACK // num_per_pickup

    def _calculate_max_pickups_for_partial_column(self) -> int:
        assert self.pickup_mode == PARTIAL_COLUMN

        return NUM_COLUMNS_IN_TIPRACK * self._calculate_number_pickups_per_column_for_partial_column()

    def _calculate_drop_location_list_for_partial_column(self) -> List[str]:
        assert self.pickup_mode == PARTIAL_COLUMN
        # we should have the same number of drops as number of pickups
        num_drops = self._calculate_number_pickups_per_column_for_partial_column()
        num_per_pickup = self._calculate_number_per_pickup_for_partial_column()

        drop_location_list = []

        for col_number in range(1, NUM_COLUMNS_IN_TIPRACK + 1):
            for drop_number in range(1, num_drops + 1):

                drop_row = PipetteConfiguration.num_to_row_lookup[(NUM_ROWS_IN_TIPRACK + 1) - (drop_number * num_per_pickup)]
                drop_location_list.append(f"{drop_row}{col_number}")

        return drop_location_list

    @property
    def max_number_of_pickups(self) -> int:
        match self.pickup_mode.value:
            case SINGLE.value:
                return NUM_TIPS_PER_TIPRACK
            case ROW.value:
                return NUM_ROWS_IN_TIPRACK
            case COLUMN.value:
                return NUM_COLUMNS_IN_TIPRACK
            case PARTIAL_COLUMN.value:
                return self._calculate_max_pickups_for_partial_column()
            case _:
                raise ValueError(f"Unknown pickup mode {self.pickup_mode} for configuration")

    def get_drop_location(self, labware: protocol_api.labware.Labware, pickup_number: int) -> Location:
        well_name: str
        match self.pickup_mode.value:
            case SINGLE.value:
                well_name = labware.wells()[pickup_number].well_name
            case ROW.value:
                well_name = labware.rows()[pickup_number][0].well_name
            case COLUMN.value:
                well_name = labware.columns()[pickup_number][0].well_name
            case PARTIAL_COLUMN.value:
                well_name = self._calculate_drop_location_list_for_partial_column()[pickup_number]
            case _:
                raise ValueError(f"Unknown pickup mode {self.pickup_mode} for configuration")
        return labware.wells_by_name()[well_name]

    @classmethod
    def single_top_left(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=SINGLE,
            starting_pipette_nozzle="A1",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def single_top_right(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=SINGLE,
            starting_pipette_nozzle="A12",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def single_bottom_right(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=SINGLE,
            starting_pipette_nozzle="H12",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def single_bottom_left(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=SINGLE,
            starting_pipette_nozzle="H1",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def row_top(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=ROW,
            starting_pipette_nozzle="A1",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def row_bottom(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=ROW,
            starting_pipette_nozzle="H1",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def column_left(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=COLUMN,
            starting_pipette_nozzle="A1",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def column_right(cls) -> "PipetteConfiguration":
        return cls(
            pickup_mode=COLUMN,
            starting_pipette_nozzle="A12",
            ending_pipette_nozzle=None,
        )

    @classmethod
    def partial_column(cls, num_per_pickup: int) -> "PipetteConfiguration":
        assert 2 <= num_per_pickup <= 7

        return cls(
            pickup_mode=PARTIAL_COLUMN,
            starting_pipette_nozzle="H1",
            ending_pipette_nozzle=PipetteConfiguration.number_per_pickup_to_slot_lookup[num_per_pickup],
        )


@dataclass
class PartialTipPickupTestCase:
    key: str
    summary: str
    pickup_deck_slot: str
    drop_deck_slot: str
    pipette_configuration: PipetteConfiguration
    liquid_transfer_settings: LiquidTransferSettings

    def __str__(self) -> str:
        return (
            f"Test Case Key: {self.key}\n"
            f"Summary: {self.summary}\n"
            f"Pickup Deck Slot: {self.pickup_deck_slot}\n"
            f"Drop Deck Slot: {self.drop_deck_slot}\n"
            f"Pipette Configuration:\n"
            f"  Pickup Mode: {self.pipette_configuration.pickup_mode}\n"
            f"  Starting Pipette Nozzle: {self.pipette_configuration.starting_pipette_nozzle}\n"
            f"  Ending Pipette Nozzle: {self.pipette_configuration.ending_pipette_nozzle}\n"
            f"  Max Number of Pickups: {self.pipette_configuration.max_number_of_pickups}\n"
            f"Liquid Transfer Settings:\n"
            f"  Source Labware Deck Slot: {self.liquid_transfer_settings.source_labware_deck_slot}\n"
            f"  Destination Labware Deck Slot: {self.liquid_transfer_settings.destination_labware_deck_slot}\n"
            f"  Transfer Volume: {self.liquid_transfer_settings.transfer_volume}\n"
        )


def get_test_case_by_key(test_cases: List[PartialTipPickupTestCase], key: str) -> PartialTipPickupTestCase:
    for test_case in test_cases:
        if test_case.key == key:
            return test_case
    raise ValueError(f"Could not find test case with key {key}")


EIGHT_CH_TEST_CASES = [
    PartialTipPickupTestCase(
        key="0",
        summary=(
            "single tip pickup"
            "starting with top left tip"
            "pickup each tip in column from top to bottom -> shift to column right -> repeat"
        ),
        pipette_configuration=PipetteConfiguration.single_top_left(),
        pickup_deck_slot="B1",
        drop_deck_slot="B2",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="D1",
            destination_labware_deck_slot="D2",
        ),
    ),
    PartialTipPickupTestCase(
        key="1",
        summary=(
            "single tip pickup"
            "starting with bottom left tip"
            "pickup each tip in column from bottom to top -> shift to column right -> repeat"
        ),
        pipette_configuration=PipetteConfiguration.single_bottom_left(),
        pickup_deck_slot="B1",
        drop_deck_slot="B2",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="D1",
            destination_labware_deck_slot="D2",
        ),
    ),
    PartialTipPickupTestCase(
        key="2",
        summary=(
            "partial column tip pickup"
            "starting with bottom left tip"
            "pickup bottom 4 tips in column -> pickup top 4 tips in column -> shift to column right -> repeat"
        ),
        pipette_configuration=PipetteConfiguration.partial_column(4),
        pickup_deck_slot="B1",
        drop_deck_slot="B2",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="D1",
            destination_labware_deck_slot="D2",
        ),
    ),
    PartialTipPickupTestCase(
        key="3",
        summary=(
            "partial column tip pickup" "starting with bottom left tip" "pickup bottom 5 tips in column -> shift to column right -> repeat"
        ),
        pipette_configuration=PipetteConfiguration.partial_column(5),
        pickup_deck_slot="B1",
        drop_deck_slot="B2",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="D1",
            destination_labware_deck_slot="D2",
        ),
    ),
]


def add_parameters(parameters: protocol_api.Parameters):
    parameters.add_str(
        variable_name="pipette_name",
        display_name="Pipette Name",
        choices=[
            {"display_name": "8-Channel 50μL", "value": "flex_8channel_50"},
            {"display_name": "8-Channel 1000μL", "value": "flex_8channel_1000"},
        ],
        default="flex_8channel_1000",
    ),
    parameters.add_str(
        variable_name="tip_rack_name",
        display_name="Tip Rack Name",
        choices=[
            {"display_name": "50μL", "value": "opentrons_flex_96_tiprack_50ul"},
            {"display_name": "200μL", "value": "opentrons_flex_96_tiprack_200ul"},
            {"display_name": "1000μL", "value": "opentrons_flex_96_tiprack_1000ul"},
        ],
        default="opentrons_flex_96_tiprack_1000ul",
    )
    parameters.add_str(
        variable_name="liquid_transfer_labware_name",
        display_name="Liquid Transfer Labware Name",
        choices=[
            {"display_name": "Nest 96 Well 100μL", "value": "nest_96_wellplate_100ul_pcr_full_skirt"},
            {"display_name": "Bio-Rad 96 Well 200μL", "value": "biorad_96_wellplate_200ul_pcr"},
            {"display_name": "Corning 96 Well 360μL", "value": "corning_96_wellplate_360ul_flat"},
        ],
        default="nest_96_wellplate_100ul_pcr_full_skirt",
    )
    parameters.add_int(
        variable_name="pipetting_speed",
        display_name="Pipetting Speed",
        description="How fast should the pipette move around the deck.",
        default=300,
        minimum=50,
        maximum=350,
    )


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

metadata = {
    "protocolName": "Partial Tip Pickup Smoke Test 8 channel",
    "author": "Opentrons QA",
}


def run(protocol_context: protocol_api.ProtocolContext):

    PIPETTE_NAME = protocol_context.params.pipette_name
    TIP_RACK_NAME = protocol_context.params.tip_rack_name
    TRANSFER_LABWARE_NAME = protocol_context.params.liquid_transfer_labware_name
    PIPETTING_SPEED = protocol_context.params.pipetting_speed

    if "50" in PIPETTE_NAME and "50" not in TIP_RACK_NAME:
        raise ValueError("50μL pipette requires 50μL tip rack")

    PICKUP_CASES = EIGHT_CH_TEST_CASES

    pipette = protocol_context.load_instrument(PIPETTE_NAME, mount="left")
    pipette.default_speed = PIPETTING_SPEED

    test_case = get_test_case_by_key(PICKUP_CASES, test_case_key)

    protocol_context.comment(str(test_case))

    pickup_tip_rack = protocol_context.load_labware(load_name=TIP_RACK_NAME, label="Tip Rack - Full", location=test_case.pickup_deck_slot)

    drop_tip_rack = protocol_context.load_labware(
        load_name=HACKY_FLEX_1000_UL_TIPRACK_LOAD_NAME,
        label="Tip Rack - Empty",
        location=test_case.drop_deck_slot,
    )

    src_labware = protocol_context.load_labware(
        load_name=TRANSFER_LABWARE_NAME,
        label="Liquid Transfer - Source Labware",
        location=test_case.liquid_transfer_settings.source_labware_deck_slot,
    )

    dest_labware = protocol_context.load_labware(
        load_name=TRANSFER_LABWARE_NAME,
        label="Liquid Transfer - Destination Labware",
        location=test_case.liquid_transfer_settings.destination_labware_deck_slot,
    )

    pipette.configure_nozzle_layout(
        style=test_case.pipette_configuration.pickup_mode,
        start=test_case.pipette_configuration.starting_pipette_nozzle,
        end=test_case.pipette_configuration.ending_pipette_nozzle,
        tip_racks=[pickup_tip_rack],
    )

    NUMBER_OF_PICKUPS = 1
    for i in range(NUMBER_OF_PICKUPS):
        src_well_list = [src_labware.wells_by_name()[well_name] for well_name in ["A1", "C1"]]
        dest_well_list = [dest_labware.wells_by_name()[well_name] for well_name in ["A1", "C1"]]

        if test_case.pipette_configuration.pickup_mode == SINGLE:
            single_src_well = src_labware.wells_by_name()["A1"]
            single_dest_well = dest_labware.wells_by_name()["A1"]

            pipette.transfer(
                test_case.liquid_transfer_settings.transfer_volume,
                src_well_list,
                dest_well_list,
                new_tip="never",
            )

            pipette.distribute(
                test_case.liquid_transfer_settings.transfer_volume,
                single_src_well,
                dest_well_list,
                new_tip="never",
                disposal_volume=0,
            )

            pipette.consolidate(
                test_case.liquid_transfer_settings.transfer_volume,
                src_well_list,
                single_dest_well,
                new_tip="never",
            )

        elif test_case.pipette_configuration.pickup_mode == ROW:
            raise NotImplementedError("Row pickup not implemented")
        elif test_case.pipette_configuration.pickup_mode == COLUMN:
            raise NotImplementedError("Column pickup not implemented")
        elif test_case.pipette_configuration.pickup_mode == PARTIAL_COLUMN:

            pipette.transfer(
                volume=test_case.liquid_transfer_settings.transfer_volume,
                src_wells=src_well_list,
                dest_wells=dest_well_list,
                new_tip="never",
            )

            pipette.distribute(
                volume=test_case.liquid_transfer_settings.transfer_volume,
                src_wells=src_well_list,
                dest_wells=dest_well_list,
                new_tip="never",
                disposal_volume=0,
            )

            pipette.consolidate(
                test_case.liquid_transfer_settings.transfer_volume,
                src_wells=src_well_list,
                dest_wells=dest_well_list,
                new_tip="never",
            )
