#############
# CHANGELOG #
#############

# ----
# 2.19
# ----

# NOTHING NEW
# This protocol is exactly the same as 2.16 Smoke Test V3
# The only difference is the API version in the metadata
# The only change was changing pipette overlap values, which is not anything that can be validated by the smoke test
# Just make sure the protocol runs normally

# ----
# 2.18
# ----

# - labware.set_offset
# - Runtime Parameters added
# - TrashContainer.top() and Well.top() now return objects of the same type
# - pipette.drop_tip() if location argument not specified the tips will be dropped at different locations in the bin
# - pipette.drop_tip() if location is specified, the tips will be dropped in the same place every time

# ----
# 2.17
# ----

# NOTHING NEW
# This protocol is exactly the same as 2.16 Smoke Test V3
# The only difference is the API version in the metadata
# There were no new positive test cases for 2.17
# The negative test cases are captured in the 2.17 dispense changes protocol

# ----
# 2.16
# ----

# - prepare_to_aspirate added
# - fixed_trash property changed
# - instrument_context.trash_container property changed

# ----
# 2.15
# ----

# - move_labware added - Manual Deck State Modification
# - ProtocolContext.load_adapter added
# - OFF_DECK location added

from opentrons import protocol_api, types
import dataclasses
import typing

metadata = {
    "protocolName": "Flex Smoke Test - v2.19",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.19",
}

DeckSlots = typing.Literal[
    "A1",
    "A2",
    "A3",
    "A4",
    "B1",
    "B2",
    "B3",
    "B4",
    "C1",
    "C2",
    "C3",
    "C4",
    "D1",
    "D2",
    "D3",
    "D4",
]
ValidModuleLocations = typing.List[
    typing.Union[
        protocol_api.ThermocyclerContext,
        protocol_api.MagneticBlockContext,
        protocol_api.Labware,  # H/S Adapter or Temp Module Adapter
    ]
]

TestConfigurationChoices = typing.Literal["qa", "dev"]


@dataclasses.dataclass
class MoveSequence:
    """A sequence of moves for a given labware."""

    move_tos: typing.List[DeckSlots | ValidModuleLocations]
    starting_location: DeckSlots | ValidModuleLocations
    reset_to_start_after_each_move: bool

    def do_moves(self, ctx: protocol_api.ProtocolContext, labware: protocol_api.Labware):

        if labware.parent is not self.starting_location:
            ctx.move_labware(labware, self.starting_location, use_gripper=True)

        for location in self.move_tos:
            ctx.move_labware(labware, location, use_gripper=True)

            if self.reset_to_start_after_each_move:
                ctx.move_labware(labware, self.starting_location, use_gripper=True)


@dataclasses.dataclass
class AllMoveSequences:
    """All move sequences for the gripper."""

    moves: typing.List[MoveSequence]

    @classmethod
    def abbreviated_moves(cls, all_modules: typing.List[ValidModuleLocations]) -> "AllMoveSequences":
        module_to_move_to = all_modules[0]
        return cls(
            [MoveSequence(move_tos=["B2", module_to_move_to, "D4", "C3"], starting_location="C2", reset_to_start_after_each_move=False)],
        )

    @classmethod
    def all_moves(cls, all_modules: typing.List[ValidModuleLocations]) -> "AllMoveSequences":
        return cls(
            [
                # Covers
                # Deck -> Deck
                # Deck -> Staging Area Slot 3
                # Deck -> Staging Area Slot 4
                # Deck -> All modules
                # Staging Area Slot 3 -> Deck
                # Staging Area Slot 4 -> Deck
                # All modules -> Deck
                MoveSequence(move_tos=["B2", "C3", "D4"] + all_modules, starting_location="C2", reset_to_start_after_each_move=True),
                # Covers
                # Staging Area Slot 3 -> Staging Area Slot 4
                # Staging Area Slot 3 -> All modules
                # Staging Area Slot 4 -> Staging Area Slot 3
                # All modules -> Staging Area Slot 3
                # Note: cannot cover staging area slot 3 -> staging area slot 3. Not enough room on deck
                MoveSequence(move_tos=["D4"] + all_modules, starting_location="C3", reset_to_start_after_each_move=True),
                # Covers
                # Staging Area Slot 4 -> Staging Area Slot 4
                # Staging Area Slot 4 -> All modules
                # All modules -> Staging Area Slot 4
                MoveSequence(move_tos=["C4"] + all_modules, starting_location="D4", reset_to_start_after_each_move=True),
            ]
            +
            # Covers
            # module -> module
            [
                MoveSequence(
                    move_tos=[module_location for module_location in all_modules if module_location != starting_location],
                    starting_location=starting_location,
                    reset_to_start_after_each_move=True,
                )
                for starting_location in all_modules
            ],
        )

    def do_moves(
        self, ctx: protocol_api.ProtocolContext, labware: protocol_api.Labware, original_labware_location: DeckSlots | ValidModuleLocations
    ):
        for move_sequence in self.moves:
            move_sequence.do_moves(ctx, labware)

        if labware.parent is not original_labware_location:
            ctx.move_labware(labware, original_labware_location, use_gripper=True)


@dataclasses.dataclass
class ModuleTemperatureConfiguration:
    thermocycler_block: float
    thermocycler_lid: float
    heater_shaker: float
    temperature_module: float

    @classmethod
    def qa_configuration(cls) -> "ModuleTemperatureConfiguration":
        return cls(
            thermocycler_block=60.0,
            thermocycler_lid=80.0,
            heater_shaker=50.0,
            temperature_module=50.0,
        )

    @classmethod
    def dev_configuration(cls) -> "ModuleTemperatureConfiguration":
        return cls(
            thermocycler_block=50.0,
            thermocycler_lid=50.0,
            heater_shaker=45.0,
            temperature_module=40.0,
        )


@dataclasses.dataclass
class TestConfiguration:
    # Don't default these, they are set by runtime parameters
    configuration_name: TestConfigurationChoices
    reservoir_name: str
    well_plate_name: str
    prefer_gripper_disposal: bool

    test_set_offset: bool
    run_abbreviated_pipetting_test: bool

    # Make this greater than or equal to 2, and less than or equal to 12
    partial_tip_pickup_column_count: int

    module_temps: ModuleTemperatureConfiguration
    gripper_moves: AllMoveSequences

    @property
    def is_qa(self) -> bool:
        return self.configuration_name == "qa"

    @property
    def is_dev(self) -> bool:
        return self.configuration_name == "dev"

    @classmethod
    def _get_qa_config(
        cls, prefer_gripper_disposal: bool, reservoir_name: str, well_plate_name: str, all_modules: typing.List[ValidModuleLocations]
    ) -> "TestConfiguration":
        return cls(
            configuration_name="qa",
            reservoir_name=reservoir_name,
            well_plate_name=well_plate_name,
            test_set_offset=True,
            run_abbreviated_pipetting_test=False,
            partial_tip_pickup_column_count=12,
            prefer_gripper_disposal=prefer_gripper_disposal,
            module_temps=ModuleTemperatureConfiguration.qa_configuration(),
            gripper_moves=AllMoveSequences.all_moves(all_modules),
        )

    @classmethod
    def _get_dev_config(
        cls, prefer_gripper_disposal: bool, reservoir_name: str, well_plate_name: str, all_modules: typing.List[ValidModuleLocations]
    ) -> "TestConfiguration":
        return cls(
            configuration_name="dev",
            reservoir_name=reservoir_name,
            well_plate_name=well_plate_name,
            test_set_offset=False,
            run_abbreviated_pipetting_test=True,
            partial_tip_pickup_column_count=2,
            prefer_gripper_disposal=prefer_gripper_disposal,
            module_temps=ModuleTemperatureConfiguration.dev_configuration(),
            gripper_moves=AllMoveSequences.abbreviated_moves(all_modules),
        )

    @classmethod
    def get_configuration(
        cls,
        parameters: protocol_api.Parameters,
        where_to_put_labware_on_modules: typing.List[
            protocol_api.ThermocyclerContext | protocol_api.MagneticBlockContext | protocol_api.Labware
        ],
    ) -> "TestConfiguration":
        test_configuration = parameters.test_configuration
        prefer_gripper_disposal = parameters.prefer_gripper_disposal
        reservoir_name = parameters.reservoir_name
        well_plate_name = parameters.well_plate_name

        if test_configuration == "qa":
            return cls._get_qa_config(
                prefer_gripper_disposal=prefer_gripper_disposal,
                reservoir_name=reservoir_name,
                well_plate_name=well_plate_name,
                all_modules=where_to_put_labware_on_modules,
            )
        elif test_configuration == "dev":
            return cls._get_dev_config(
                prefer_gripper_disposal=prefer_gripper_disposal,
                reservoir_name=reservoir_name,
                well_plate_name=well_plate_name,
                all_modules=where_to_put_labware_on_modules,
            )
        else:
            raise ValueError(f"Invalid test configuration: {test_configuration}")


#################
### CONSTANTS ###
#################

HEATER_SHAKER_ADAPTER_NAME = "opentrons_96_pcr_adapter"
HEATER_SHAKER_NAME = "heaterShakerModuleV1"
MAGNETIC_BLOCK_NAME = "magneticBlockV1"
TEMPERATURE_MODULE_ADAPTER_NAME = "opentrons_96_well_aluminum_block"
TEMPERATURE_MODULE_NAME = "temperature module gen2"
THERMOCYCLER_NAME = "thermocycler module gen2"

TIPRACK_96_ADAPTER_NAME = "opentrons_flex_96_tiprack_adapter"
TIPRACK_96_NAME = "opentrons_flex_96_tiprack_1000ul"

PIPETTE_96_CHANNEL_NAME = "flex_96channel_1000"

##############################
# Runtime Parameters Support #
##############################

# -------------------------- #
# Added in API version: 2.18 #
# -------------------------- #


def add_parameters(parameters: protocol_api.Parameters):

    test_configuration_choices = [
        {"display_name": "QA Smoke Test", "value": "qa"},
        {"display_name": "Developer Validation", "value": "dev"},
    ]

    reservoir_choices = [
        {"display_name": "Agilent 1 Well 290 mL", "value": "agilent_1_reservoir_290ml"},
        {"display_name": "Nest 1 Well 290 mL", "value": "nest_1_reservoir_290ml"},
    ]

    well_plate_choices = [
        {"display_name": "Nest 96 Well 100 µL", "value": "nest_96_wellplate_100ul_pcr_full_skirt"},
        {"display_name": "Corning 96 Well 360 µL", "value": "corning_96_wellplate_360ul_flat"},
        {"display_name": "Opentrons Tough 96 Well 200 µL", "value": "opentrons_96_wellplate_200ul_pcr_full_skirt"},
    ]

    parameters.add_str(
        variable_name="test_configuration",
        display_name="Test Configuration",
        description="Configuration of QA test to perform",
        default="qa",
        choices=test_configuration_choices,
    )

    parameters.add_str(
        variable_name="reservoir_name",
        display_name="Reservoir Name",
        description="Name of the reservoir",
        default="nest_1_reservoir_290ml",
        choices=reservoir_choices,
    )

    parameters.add_str(
        variable_name="well_plate_name",
        display_name="Well Plate Name",
        description="Name of the well plate",
        default="nest_96_wellplate_100ul_pcr_full_skirt",
        choices=well_plate_choices,
    )

    parameters.add_bool(
        variable_name="prefer_gripper_disposal",
        display_name="I LOVE TO REFILL TIP RACKS",
        description="Prefer to use the gripper to dispose of labware, instead of manual moves off deck",
        default=False,
    )


def run(ctx: protocol_api.ProtocolContext) -> None:
    ################
    ### FIXTURES ###
    ################

    trash_bin = ctx.load_trash_bin("B3")
    waste_chute = ctx.load_waste_chute()

    ###############
    ### MODULES ###
    ###############
    thermocycler = ctx.load_module(THERMOCYCLER_NAME)  # A1 & B1
    magnetic_block = ctx.load_module(MAGNETIC_BLOCK_NAME, "C1")
    heater_shaker = ctx.load_module(HEATER_SHAKER_NAME, "A3")
    temperature_module = ctx.load_module(TEMPERATURE_MODULE_NAME, "D1")

    thermocycler.open_lid()
    heater_shaker.open_labware_latch()

    #######################
    ### MODULE ADAPTERS ###
    #######################

    temperature_module_adapter = temperature_module.load_adapter(TEMPERATURE_MODULE_ADAPTER_NAME)
    heater_shaker_adapter = heater_shaker.load_adapter(HEATER_SHAKER_ADAPTER_NAME)
    adapters = [temperature_module_adapter, heater_shaker_adapter]

    ##########################
    ### TEST CONFIGURATION ###
    ##########################

    test_config: TestConfiguration = TestConfiguration.get_configuration(
        ctx.params, [thermocycler, magnetic_block, temperature_module_adapter, heater_shaker_adapter]
    )

    ###############
    ### LABWARE ###
    ###############

    source_reservoir = ctx.load_labware(test_config.reservoir_name, "D2")
    dest_pcr_plate = ctx.load_labware(test_config.well_plate_name, "C2")

    tip_rack_1 = ctx.load_labware(TIPRACK_96_NAME, "A2", adapter=TIPRACK_96_ADAPTER_NAME)
    tip_rack_adapter = tip_rack_1.parent

    tip_rack_2 = ctx.load_labware(TIPRACK_96_NAME, "C3")
    tip_rack_3 = ctx.load_labware(TIPRACK_96_NAME, "C4")

    tip_racks = [tip_rack_1, tip_rack_2, tip_rack_3]

    ##########################
    ### PIPETTE DEFINITION ###
    ##########################

    pipette_96_channel = ctx.load_instrument(PIPETTE_96_CHANNEL_NAME, mount="left", tip_racks=tip_racks)
    pipette_96_channel.trash_container = trash_bin

    assert isinstance(pipette_96_channel.trash_container, protocol_api.TrashBin)

    ########################
    ### LOAD SOME LIQUID ###
    ########################

    water = ctx.define_liquid(name="water", description="High Quality H₂O", display_color="#42AB2D")
    source_reservoir.wells_by_name()["A1"].load_liquid(liquid=water, volume=29000)

    ################################
    ### GRIPPER LABWARE MOVEMENT ###
    ################################

    def dispose_with_preferred_method(labware: protocol_api.Labware):
        """
        Get the disposal preference based on the PREFER_MOVE_OFF_DECK flag.

        Returns:
            tuple: A tuple containing the disposal preference. The first element is the location preference,
                   either `protocol_api.OFF_DECK` or `waste_chute`. The second element is a boolean indicating
                   whether the gripper is being used or not.
        """
        if test_config.prefer_gripper_disposal:
            ctx.move_labware(labware, waste_chute, use_gripper=True)
        else:
            ctx.move_labware(labware, protocol_api.OFF_DECK, use_gripper=False)

    def test_manual_moves():
        # In C4 currently
        ctx.move_labware(source_reservoir, "D4", use_gripper=False)

    def test_pipetting():
        def test_partial_tip_pickup_usage():
            pipette_96_channel.configure_nozzle_layout(style=protocol_api.COLUMN, start="A12")

            for i in range(1, test_config.partial_tip_pickup_column_count + 1):

                pipette_96_channel.pick_up_tip(tip_rack_2[f"A{i}"])

                pipette_96_channel.aspirate(5, source_reservoir["A1"])
                pipette_96_channel.touch_tip()

                pipette_96_channel.dispense(5, dest_pcr_plate[f"A{i}"])

                if test_config.is_qa:
                    if i == 1:
                        ctx.pause(
                            "Watch this next tip drop in the waste chute. We are going to compare it against the next drop in the waste chute."
                        )

                    if i == 2:
                        ctx.pause(
                            "Watch this next tip drop in the waste chute. It should drop in a different location than the previous drop."
                        )

                if i == 1:
                    pipette_96_channel.drop_tip(waste_chute)
                elif i == 2:
                    pipette_96_channel.drop_tip()
                else:
                    pipette_96_channel.drop_tip(trash_bin)

            dispose_with_preferred_method(tip_rack_2)

        def test_full_tip_rack_usage():
            pipette_96_channel.configure_nozzle_layout(style=protocol_api.ALL, start="A1")
            pipette_96_channel.pick_up_tip(tip_rack_1["A1"])

            pipette_96_channel.aspirate(10, source_reservoir["A1"])
            pipette_96_channel.touch_tip()

            pipette_96_channel.air_gap(height=30)

            pipette_96_channel.dispense(10, dest_pcr_plate["A1"])

            pipette_96_channel.blow_out(waste_chute)

            pipette_96_channel.return_tip()
            dispose_with_preferred_method(tip_rack_1)
            ctx.move_labware(tip_rack_3, tip_rack_adapter, use_gripper=True)

            if not test_config.run_abbreviated_pipetting_test:
                pipette_96_channel.pick_up_tip(tip_rack_3["A1"])

                pipette_96_channel.transfer(
                    volume=10,
                    source=source_reservoir["A1"],
                    dest=dest_pcr_plate["A1"],
                    new_tip="never",
                    touch_tip=True,
                    blow_out=True,
                    blowout_location="trash",
                    mix_before=(3, 5),
                    mix_after=(5, 15),
                )
                pipette_96_channel.return_tip()

        test_partial_tip_pickup_usage()
        test_full_tip_rack_usage()

    def test_module_usage():

        def test_thermocycler():
            thermocycler.close_lid()

            thermocycler.set_block_temperature(test_config.module_temps.thermocycler_block, hold_time_seconds=5.0)
            thermocycler.set_lid_temperature(test_config.module_temps.thermocycler_lid)
            thermocycler.deactivate()

        def test_heater_shaker():
            heater_shaker.open_labware_latch()
            heater_shaker.close_labware_latch()

            heater_shaker.set_target_temperature(test_config.module_temps.heater_shaker)
            heater_shaker.set_and_wait_for_shake_speed(1000)
            heater_shaker.wait_for_temperature()

            heater_shaker.deactivate_heater()
            heater_shaker.deactivate_shaker()

        def test_temperature_module():
            temperature_module.set_temperature(test_config.module_temps.temperature_module)
            temperature_module.deactivate()

        def test_magnetic_block():
            pass

        test_thermocycler()
        test_heater_shaker()
        test_temperature_module()
        test_magnetic_block()

    def test_labware_waste_chute_disposal_with_gripper():
        ctx.move_labware(source_reservoir, waste_chute, use_gripper=True)
        ctx.move_labware(dest_pcr_plate, waste_chute, use_gripper=True)

    def test_labware_set_offset():
        """Test the labware.set_offset method."""
        ######################
        # labware.set_offset #
        ######################

        # -------------------------- #
        # Added in API version: 2.18 #
        # -------------------------- #

        SET_OFFSET_AMOUNT = 10.0
        ctx.move_labware(labware=source_reservoir, new_location=protocol_api.OFF_DECK, use_gripper=False)
        pipette_96_channel.pick_up_tip(tip_rack_3["A1"])
        pipette_96_channel.move_to(dest_pcr_plate.wells_by_name()["A1"].top())

        ctx.pause("Is the pipette tip in the middle of the PCR Plate, well A1, in slot C2? It should be at the LPC calibrated height.")

        dest_pcr_plate.set_offset(
            x=0.0,
            y=0.0,
            z=SET_OFFSET_AMOUNT,
        )

        pipette_96_channel.move_to(dest_pcr_plate.wells_by_name()["A1"].top())
        ctx.pause(
            "Is the pipette tip in the middle of the PCR Plate, well A1, in slot C2? It should be 10mm higher than the LPC calibrated height."
        )

        ctx.move_labware(labware=dest_pcr_plate, new_location="D2", use_gripper=False)
        pipette_96_channel.move_to(dest_pcr_plate.wells_by_name()["A1"].top())

        ctx.pause("Is the pipette tip in the middle of the PCR Plate, well A1, in slot D2? It should be at the LPC calibrated height.")

        dest_pcr_plate.set_offset(
            x=0.0,
            y=0.0,
            z=SET_OFFSET_AMOUNT,
        )

        pipette_96_channel.move_to(dest_pcr_plate.wells_by_name()["A1"].top())
        ctx.pause(
            "Is the pipette tip in the middle of the PCR Plate, well A1, in slot D2? It should be 10mm higher than the LPC calibrated height."
        )

        ctx.move_labware(labware=dest_pcr_plate, new_location="C2", use_gripper=False)
        pipette_96_channel.move_to(dest_pcr_plate.wells_by_name()["A1"].top())

        ctx.pause(
            "Is the pipette tip in the middle of the PCR Plate, well A1, in slot C2? It should be 10mm higher than the LPC calibrated height."
        )

        ctx.move_labware(labware=source_reservoir, new_location="D2", use_gripper=False)
        pipette_96_channel.move_to(source_reservoir.wells_by_name()["A1"].top())

        ctx.pause("Is the pipette tip in the middle of the reservoir , well A1, in slot D2? It should be at the LPC calibrated height.")

        pipette_96_channel.return_tip()

        ctx.pause("!!!!!!!!!!YOU NEED TO REDO LPC!!!!!!!!!!")

    def test_unique_top_methods():
        """
        Test the unique top() methods for TrashBin and WasteChute.

        Well objects should remain the same
        """
        ########################
        # unique top() methods #
        ########################

        # ---------------------------- #
        # Changed in API version: 2.18 #
        # ---------------------------- #

        assert isinstance(trash_bin.top(), protocol_api.TrashBin)
        assert isinstance(waste_chute.top(), protocol_api.WasteChute)
        assert isinstance(source_reservoir.wells_by_name()["A1"].top(), types.Location)

    ###################################################################################################
    ### THE ORDER OF THESE FUNCTION CALLS MATTER. CHANGING THEM WILL CAUSE THE PROTOCOL NOT TO WORK ###
    ###################################################################################################
    test_pipetting()
    test_config.gripper_moves.do_moves(ctx=ctx, labware=dest_pcr_plate, original_labware_location="C2")
    test_module_usage()
    test_manual_moves()
    if test_config.test_set_offset:
        test_labware_set_offset()
    test_unique_top_methods()
    test_labware_waste_chute_disposal_with_gripper()

    ###################################################################################################
    ### THE ORDER OF THESE FUNCTION CALLS MATTER. CHANGING THEM WILL CAUSE THE PROTOCOL NOT TO WORK ###
    ###################################################################################################


# Cannot test in this protocol
#           - Waste Chute w/ Lid
