import typing
from dataclasses import dataclass
from opentrons import protocol_api
from opentrons.protocol_api import OFF_DECK, SINGLE, ROW, COLUMN, PARTIAL_COLUMN
from opentrons.types import Location

# Need to add transfer, consolidate, and distribute
# Tip pickup around thermocycler

PipetteNames = typing.Literal["flex_8channel_50", "flex_8channel_1000", "flex_96channel_1000"]
TipRackNames = typing.Literal["opentrons_flex_96_tiprack_1000ul", "opentrons_flex_96_tiprack_200ul", "opentrons_flex_96_tiprack_50ul"]

NUM_ROWS_IN_TIPRACK = 8
NUM_COLUMNS_IN_TIPRACK = 12
NUM_TIPS_PER_TIPRACK = NUM_ROWS_IN_TIPRACK * NUM_COLUMNS_IN_TIPRACK
HACKY_FLEX_1000_UL_TIPRACK_LOAD_NAME = "hacky_1000ul_flex_tiprack"
LIQUID_TRANSFER_AMOUNT = 1


@dataclass
class LiquidTransferSettings:
    source_labware_deck_slot: str
    destination_labware_deck_slot: str
    transfer_volume: int = LIQUID_TRANSFER_AMOUNT


@dataclass
class PipetteConfiguration:
    num_to_row_lookup: typing.ClassVar[typing.Dict[int, str]] = {
        1: "A",
        2: "B",
        3: "C",
        4: "D",
        5: "E",
        6: "F",
        7: "G",
        8: "H",
    }
    number_per_pickup_to_slot_lookup: typing.ClassVar[typing.Dict[int, str]] = {
        2: "G1",
        3: "F1",
        4: "E1",
        5: "D1",
        6: "C1",
        7: "B1",
    }

    pickup_mode: typing.Literal[SINGLE, ROW, COLUMN, PARTIAL_COLUMN]
    starting_pipette_nozzle: str
    ending_pipette_nozzle: typing.Optional[str]  # for PARTIAL_COLUMN only

    def _calculate_number_per_pickup_for_partial_column(self) -> int:
        assert self.pickup_mode == PARTIAL_COLUMN
        for num_pickups_key, self.ending_pipette_nozzle in self.number_per_pickup_to_slot_lookup.items():
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

    def _calculate_drop_location_list_for_partial_column(self) -> typing.List[str]:
        assert self.pickup_mode == PARTIAL_COLUMN
        # we should have the same number of drops as number of pickups
        num_drops = self._calculate_number_pickups_per_column_for_partial_column()
        num_per_pickup = self._calculate_number_per_pickup_for_partial_column()

        drop_location_list = []

        for col_number in range(1, NUM_COLUMNS_IN_TIPRACK + 1):
            for drop_number in range(1, num_drops + 1):

                drop_row = PipetteConfiguration.num_to_row_lookup[(NUM_ROWS_IN_TIPRACK + 1) - (drop_number * num_per_pickup)]
                drop_location_list.append(f"{drop_row}{col_number}")

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
            starting_pipette_nozzle="A1",
            ending_pipette_nozzle=PipetteConfiguration.number_per_pickup_to_slot_lookup[num_per_pickup],
        )


@dataclass
class PartialTipPickupTestCase:
    summary: str
    pickup_deck_slot: str
    drop_deck_slot: str
    pipette_configuration: PipetteConfiguration
    liquid_transfer_settings: LiquidTransferSettings


NINETY_SIX_CH_TEST_CASES = [
    PartialTipPickupTestCase(
        summary=(
            "single tip pickup"
            "using top-left nozzle of pipette"
            "pickup bottom-right tip of tiprack"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached: "
            "pickup each tip in column, from bottom to top -> shift to column left"
        ),
        pickup_deck_slot="A1",
        drop_deck_slot="C1",
        pipette_configuration=PipetteConfiguration.single_top_left(),
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="B2",
            destination_labware_deck_slot="D2",
        ),
    ),
    PartialTipPickupTestCase(
        summary=(
            "single tip pickup"
            "using top-right nozzle of pipette"
            "pickup bottom-left tip of tiprack"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached: "
            "pickup each tip in column, from bottom to top -> shift to column right"
        ),
        pipette_configuration=PipetteConfiguration.single_top_right(),
        pickup_deck_slot="A3",
        drop_deck_slot="C3",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="B2",
            destination_labware_deck_slot="C2",
        ),
    ),
    PartialTipPickupTestCase(
        summary=(
            "single tip pickup"
            "using bottom-left nozzle of pipette"
            "pickup top-right tip of tiprack"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached: "
            "pickup each tip in column, from top to bottom -> shift to column left"
        ),
        pipette_configuration=PipetteConfiguration.single_bottom_left(),
        pickup_deck_slot="D1",
        drop_deck_slot="B1",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="D2",
            destination_labware_deck_slot="C2",
        ),
    ),
    PartialTipPickupTestCase(
        summary=(
            "single tip pickup"
            "using bottom-right nozzle of pipette"
            "pickup top-left tip of tiprack"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached: "
            "pickup each tip in column, from top to bottom -> shift to column right"
        ),
        pipette_configuration=PipetteConfiguration.single_bottom_right(),
        pickup_deck_slot="D3",
        drop_deck_slot="B3",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="D2",
            destination_labware_deck_slot="B2",
        ),
    ),
    PartialTipPickupTestCase(
        summary=(
            "row tip pickup"
            "using top row of nozzles"
            "pickup bottom row of tips"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached:"
            "shift to row above -> pickup row of tips"
        ),
        pipette_configuration=PipetteConfiguration.row_top(),
        pickup_deck_slot="A1",
        drop_deck_slot="A2",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="B1",
            destination_labware_deck_slot="B2",
        ),
    ),
    PartialTipPickupTestCase(
        summary=(
            "row tip pickup"
            "using bottom row of nozzles" 
            "pickup top row of tips"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached:"
            "shift to row below -> pickup row of tips"
            ),
        pipette_configuration=PipetteConfiguration.row_bottom(),
        pickup_deck_slot="D1",
        drop_deck_slot="D2",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="C1",
            destination_labware_deck_slot="C2",
        ),
    ),
    PartialTipPickupTestCase(
        summary=(
            "column tip pickup"
            "using left column of nozzles"
            "pickup right column of tips"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached:"
            "pickup a column of tips -> shift to column right"),
        pipette_configuration=PipetteConfiguration.column_left(),
        pickup_deck_slot="A1",
        drop_deck_slot="B1",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="A2",
            destination_labware_deck_slot="B2",
        ),
    ),
    PartialTipPickupTestCase(
        summary=(
            "column tip pickup"
            "using right column of nozzles"
            "pickup left column of tips"
            "repeat the following steps until tips are exhausted or rtp specified number of pickups is reached:"
            "pickup a column of tips -> shift to column left"),
        pipette_configuration=PipetteConfiguration.column_right(),
        pickup_deck_slot="A3",
        drop_deck_slot="B3",
        liquid_transfer_settings=LiquidTransferSettings(
            source_labware_deck_slot="A2",
            destination_labware_deck_slot="B2",
        ),
    ),
]

# EIGHT_CH_TEST_CASES = [

#     PartialTipPickupTestCase(
#         summary=(
#             "single tip pickup"
#             "starting with top left tip"
#             "pickup each tip in column from top to bottom -> shift to column right -> repeat"
#         ),
#         pipette_configuration=PipetteConfiguration.single_top_left(),
#         pickup_deck_slot="D1",
#         drop_deck_slot="D2",
#     ),


#     PartialTipPickupTestCase(
#         summary=(
#             "single tip pickup"
#             "starting with bottom left tip"
#             "pickup each tip in column from bottom to top -> shift to column right -> repeat"
#         ),
#         pipette_configuration=PipetteConfiguration.single_bottom_left(),
#         pickup_deck_slot="A1",
#         drop_deck_slot="A2",
#     ),


#     PartialTipPickupTestCase(
#         summary=(
#             "partial column tip pickup"
#             "starting with bottom left tip"
#             "pickup bottom 4 tips in column -> pickup top 4 tips in column -> shift to column right -> repeat"
#         ),
#         pipette_configuration=PipetteConfiguration.partial_column(4),
#         pickup_deck_slot="A1",
#         drop_deck_slot="A2",
#     ),

#     PartialTipPickupTestCase(
#         summary=(
#             "partial column tip pickup"
#             "starting with bottom left tip"
#             "pickup bottom 5 tips in column -> shift to column right -> repeat"
#         ),
#         pipette_configuration=PipetteConfiguration.partial_column(5),
#         pickup_deck_slot="A1",
#         drop_deck_slot="A2",
#     ),
# ]


def add_parameters(parameters: protocol_api.Parameters):
    parameters.add_str(
        variable_name="pipette_name",
        display_name="Pipette Name",
        choices=[
            {"display_name": "8-Channel 50μL", "value": "flex_8channel_50"},
            {"display_name": "8-Channel 1000μL", "value": "flex_8channel_1000"},
            {"display_name": "96-Channel 1000μL", "value": "flex_96channel_1000"},
        ],
        default="flex_96channel_1000",
    ),
    parameters.add_str(
        variable_name="tip_rack_name",
        display_name="Tip Rack Name",
        choices=[
            {"display_name": "50μL", "value": "opentrons_96_tiprack_50ul"},
            {"display_name": "200μL", "value": "opentrons_96_tiprack_200ul"},
            {"display_name": "1000μL", "value": "opentrons_96_tiprack_1000ul"},
        ],
        default="opentrons_96_tiprack_1000ul",
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
        variable_name="actual_num_of_single_pickups",
        display_name="Number of Single Mode Pickups",
        description="How many pickups should be done in single mode.",
        default=4,
        minimum=2,
        maximum=96,
    )


requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

metadata = {
    "protocolName": "Partial Tip Pickup Smoke Test",
    "author": "Opentrons QA",
}


def run(protocol_context: protocol_api.ProtocolContext):

    PIPETTE_NAME = protocol_context.params.pipette_name
    TIP_RACK_NAME = protocol_context.params.tip_rack_name
    TRANSFER_LABWARE_NAME = protocol_context.params.liquid_transfer_labware_name
    ACTUAL_NUM_OF_SINGLE_PICKUPS = protocol_context.params.actual_num_of_single_pickups

    if "50" in PIPETTE_NAME and "50" not in TIP_RACK_NAME:
        raise ValueError("50μL pipette requires 50μL tip rack")

    if "8_channel" in PIPETTE_NAME:
        PICKUP_CASES = EIGHT_CH_TEST_CASES
    else:
        PICKUP_CASES = NINETY_SIX_CH_TEST_CASES

    pipette = protocol_context.load_instrument(PIPETTE_NAME, mount="left")

    for test_case in PICKUP_CASES:
        pickup_tip_rack = protocol_context.load_labware(load_name="opentrons_96_tiprack_1000ul", location=protocol_api.OFF_DECK)

        drop_tip_rack = protocol_context.load_labware(load_name=HACKY_FLEX_1000_UL_TIPRACK_LOAD_NAME, location=protocol_api.OFF_DECK)

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

        protocol_context.move_labware(labware=pickup_tip_rack, new_location=test_case.pickup_deck_slot)

        protocol_context.pause("Make sure to load an empty tip rack for the next step")

        protocol_context.move_labware(labware=drop_tip_rack, new_location=test_case.drop_deck_slot)

        pipette.configure_nozzle_layout(
            style=test_case.pipette_configuration.pickup_mode,
            start=test_case.pipette_configuration.starting_pipette_nozzle,
            tip_racks=[pickup_tip_rack],
        )

        # Trying not to murder a pipette
        pipette.default_speed = 50

        if test_case.pipette_configuration.pickup_mode == SINGLE:
            num_pickups = ACTUAL_NUM_OF_SINGLE_PICKUPS
        else:
            num_pickups = test_case.pipette_configuration.max_number_of_pickups

        for i in range(num_pickups):
            pipette.pick_up_tip(location=pickup_tip_rack)

            drop_location = test_case.pipette_configuration.get_drop_location(drop_tip_rack, i)

            if test_case.pipette_configuration.pickup_mode == SINGLE and i == 0:

                src_well_list = [src_labware.wells_by_name()["A1"], src_labware.wells_by_name()["C1"]]
                dest_well_list = [dest_labware.wells_by_name()["A1"], dest_labware.wells_by_name()["C1"]]

                pipette.transfer(
                    test_case.liquid_transfer_settings.transfer_volume,
                    src_well_list,
                    dest_well_list,
                    new_tip="never",
                )

                # Currently getting error because something is looking for a trash bin and I
                # don't have one defined.
                # https://opentrons.atlassian.net/browse/RQA-2888
                # pipette.distribute(
                #     test_case.liquid_transfer_settings.transfer_volume,
                #     src_labware.wells_by_name()["A1"],
                #     dest_well_list,
                #     new_tip="never",
                # )

                pipette.consolidate(
                    test_case.liquid_transfer_settings.transfer_volume,
                    src_well_list,
                    dest_labware.wells_by_name()["A1"],
                    new_tip="never",
                )

            pipette.drop_tip(drop_location)

        # You don't actually need to move these off deck.
        # Want to trick the backend into thinking that we have though
        protocol_context.move_labware(labware=pickup_tip_rack, new_location=OFF_DECK)

        protocol_context.move_labware(labware=drop_tip_rack, new_location=OFF_DECK)

        protocol_context.move_labware(labware=src_labware, new_location=OFF_DECK)

        protocol_context.move_labware(labware=dest_labware, new_location=OFF_DECK)
