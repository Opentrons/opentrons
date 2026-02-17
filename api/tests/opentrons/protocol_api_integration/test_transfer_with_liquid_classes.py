"""Tests for the transfer APIs using liquid classes."""

import mock
import pytest

from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api.core.engine import InstrumentCore
from opentrons.protocol_api.core.engine.transfer_components_executor import (
    LiquidAndAirGapPair,
    TransferType,
)
from opentrons.protocols.advanced_control.transfers.common import (
    TransferTipPolicyV2Type,
)
from opentrons.types import Location, Point


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_water_transfer_with_volume_more_than_tip_max(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer steps without any errors.

    This test only checks that various supported configurations for a transfer
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with mock.patch.object(
        InstrumentCore,
        "pick_up_tip",
        side_effect=InstrumentCore.pick_up_tip,
        autospec=True,
    ) as patched_pick_up_tip:
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")

        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=60,
            source=nest_plate.rows()[0],
            dest=arma_plate.rows()[0],
            new_tip="always",
            trash_location=trash,
        )
        assert patched_pick_up_tip.call_count == 24
        patched_pick_up_tip.reset_mock()

        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=100,
            source=nest_plate.rows()[0],
            dest=arma_plate.rows()[0],
            new_tip="per source",
            trash_location=trash,
        )
        assert patched_pick_up_tip.call_count == 12
        patched_pick_up_tip.reset_mock()

        pipette_1k.pick_up_tip()
        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=50,
            source=nest_plate.rows()[0],
            dest=arma_plate.rows()[0],
            new_tip="never",
            trash_location=trash,
        )
        pipette_1k.drop_tip()
        assert patched_pick_up_tip.call_count == 1


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_transfer_steps(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer steps without any errors.

    This test only checks that various supported configurations for a transfer
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=40,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.rows()[0][:2],
            new_tip="always",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_transfer_steps_with_new_tip_per_destination(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer steps while picking up a new tip only for a new destination."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=60,
            source=nest_plate.rows()[0][:2],
            dest=nest_plate.rows()[1][:2],
            new_tip="per destination",
            trash_location=trash,
        )
        expected_calls_per_tip = [
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=30,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=30,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=30,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=30, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=30,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0.1)],
                volume_for_pipette_mode_configuration=30,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=30,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=30, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert (
            mock_manager.mock_calls == expected_calls_per_tip + expected_calls_per_tip
        )


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_transfer_steps_with_return_tip(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer steps without any errors and return tips.

    This test only checks that various supported configurations for a transfer
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip",
            side_effect=InstrumentCore.drop_tip,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip")
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=40,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.rows()[0][:2],
            new_tip="always",
            trash_location=trash,
            return_tip=True,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip(
                mock.ANY,
                location=None,
                well_core=mock.ANY,
                home_after=False,
                alternate_drop_location=False,
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip(
                mock.ANY,
                location=None,
                well_core=mock.ANY,
                home_after=False,
                alternate_drop_location=False,
            ),
        ]
        assert len(mock_manager.mock_calls) == 9
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_transfer_steps_with_no_new_tips(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer steps without any errors.

    This test only checks that various supported configurations for a transfer
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    pipette_50.pick_up_tip()
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=40,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.rows()[0][:2],
            new_tip="never",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0.1)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=False,
                trash_location=mock.ANY,
            ),
        ]
        assert len(mock_manager.mock_calls) == len(expected_calls)
        assert mock_manager.mock_calls[2] == expected_calls[2]


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
@pytest.mark.parametrize("new_tip", ["once", "always"])
def test_order_of_water_consolidate_steps(
    simulated_protocol_context: ProtocolContext,
    new_tip: TransferTipPolicyV2Type,
) -> None:
    """It should run the consolidate steps without any errors.

    This test only checks that various supported configurations for a consolidation
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.consolidate_with_liquid_class(
            liquid_class=water,
            volume=25,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.wells()[0],
            new_tip=new_tip,
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=25,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=50,
                current_volume=0.0,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=25,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=25, air_gap=0.1)],
                volume_for_pipette_mode_configuration=None,
                current_volume=25.0,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=50,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=50, air_gap=0)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert len(mock_manager.mock_calls) == 6
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_consolidate_steps_larger_volume_than_tip(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the consolidate steps without any errors.

    This test only checks that various supported configurations for a consolidation
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.consolidate_with_liquid_class(
            liquid_class=water,
            volume=30,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.wells()[0],
            new_tip="once",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=30,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=30,
                current_volume=0.0,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=30,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=30, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=30,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0.1)],
                volume_for_pipette_mode_configuration=30,
                current_volume=0.0,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=30,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=30, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_consolidate_steps_larger_volume_than_tip_with_new_tip_always(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should pick up new tips & probe liquid before every group of aspirates."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50",
        mount="left",
        tip_racks=[tiprack],
        liquid_presence_detection=True,
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.consolidate_with_liquid_class(
            liquid_class=water,
            volume=30,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.wells()[0],
            new_tip="always",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=30,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=30.0,
                current_volume=0.0,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=30,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=30, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=30,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=30.0,
                current_volume=0.0,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=30,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=30, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_consolidate_steps_with_no_new_tips(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the consolidate steps without any errors.

    This test only checks that various supported configurations for a consolidation
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    pipette_50.pick_up_tip()
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.consolidate_with_liquid_class(
            liquid_class=water,
            volume=25,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.wells()[0],
            new_tip="never",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=25,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=50,
                current_volume=0.0,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=25,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=25, air_gap=0.1)],
                volume_for_pipette_mode_configuration=None,
                current_volume=25.0,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=50,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=50, air_gap=0)],
                add_final_air_gap=False,
                trash_location=mock.ANY,
            ),
        ]
        assert len(mock_manager.mock_calls) == 4
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_consolidate_steps_with_return_tip(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the consolidate steps without any errors and return tips.

    This test only checks that various supported configurations for a consolidation
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip",
            side_effect=InstrumentCore.drop_tip,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip")
        pipette_50.consolidate_with_liquid_class(
            liquid_class=water,
            volume=25,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.wells()[0],
            new_tip="once",
            trash_location=trash,
            return_tip=True,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=25,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=50,
                current_volume=0.0,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=25,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=25, air_gap=0.1)],
                volume_for_pipette_mode_configuration=None,
                current_volume=25.0,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=50,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.MANY_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=50, air_gap=0)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip(
                mock.ANY,
                location=None,
                well_core=mock.ANY,
                home_after=False,
                alternate_drop_location=False,
            ),
        ]
        assert len(mock_manager.mock_calls) == 6
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_water_distribution_with_volume_more_than_tip_max(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should execute the distribute steps with the expected tip pick ups."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_200ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    water_props = water.get_for(pipette_1k, tiprack)
    water_props.multi_dispense.retract.blowout.location = "destination"  # type: ignore[union-attr]
    water_props.multi_dispense.retract.blowout.flow_rate = pipette_1k.flow_rate.blow_out  # type: ignore[union-attr]
    water_props.multi_dispense.retract.blowout.enabled = True  # type: ignore[union-attr]
    with mock.patch.object(
        InstrumentCore,
        "pick_up_tip",
        side_effect=InstrumentCore.pick_up_tip,
        autospec=True,
    ) as patched_pick_up_tip:
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")

        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=100,
            source=nest_plate.rows()[0][0],
            dest=arma_plate.rows()[0],
            new_tip="once",
            trash_location=trash,
        )
        assert patched_pick_up_tip.call_count == 1
        patched_pick_up_tip.reset_mock()

        pipette_1k.pick_up_tip()
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=50,
            source=nest_plate.rows()[0][0],
            dest=arma_plate.rows()[0],
            new_tip="never",
            trash_location=trash,
        )
        pipette_1k.drop_tip()
        assert patched_pick_up_tip.call_count == 1
        patched_pick_up_tip.reset_mock()

        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=50,
            source=nest_plate.rows()[0][0],
            dest=arma_plate.rows()[0],
            new_tip="always",
            trash_location=trash,
        )
        assert patched_pick_up_tip.call_count == 3


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_distribution_steps_using_multi_dispense(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should distribute the liquid using multi-dispense steps in the expected order."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    water_props = water.get_for(pipette_1k, tiprack)

    assert water_props.multi_dispense is not None
    water_props.multi_dispense.retract.blowout.location = "destination"
    water_props.multi_dispense.retract.blowout.flow_rate = pipette_1k.flow_rate.blow_out
    water_props.multi_dispense.retract.blowout.enabled = True

    expected_conditioning_volume = 4.5
    expected_disposal_volume = 5.5
    water_props.multi_dispense.conditioning_by_volume.set_for_all_volumes(
        expected_conditioning_volume
    )
    water_props.multi_dispense.disposal_by_volume.set_for_all_volumes(
        expected_disposal_volume
    )

    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class_during_multi_dispense",
            side_effect=InstrumentCore.dispense_liquid_class_during_multi_dispense,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(
            patched_dispense, "dispense_liquid_class_during_multi_dispense"
        )
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.rows()[0][1],
            dest=arma_plate.rows()[0][:4],
            new_tip="once",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_1000ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=800 + expected_conditioning_volume + expected_disposal_volume,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                conditioning_volume=expected_conditioning_volume,
                volume_for_pipette_mode_configuration=400,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][0]),
                    arma_plate.rows()[0][0]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=800 + expected_disposal_volume, air_gap=0
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=expected_conditioning_volume,
                disposal_volume=expected_disposal_volume,
                is_last_dispense_in_tip=False,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][1]),
                    arma_plate.rows()[0][1]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=400 + expected_disposal_volume, air_gap=0
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=expected_conditioning_volume,
                disposal_volume=expected_disposal_volume,
                is_last_dispense_in_tip=True,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=800 + expected_conditioning_volume + expected_disposal_volume,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=10)],
                conditioning_volume=expected_conditioning_volume,
                volume_for_pipette_mode_configuration=400,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][2]),
                    arma_plate.rows()[0][2]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=800 + expected_disposal_volume, air_gap=0
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=expected_conditioning_volume,
                disposal_volume=expected_disposal_volume,
                is_last_dispense_in_tip=False,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][3]),
                    arma_plate.rows()[0][3]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=400 + expected_disposal_volume, air_gap=0
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=expected_conditioning_volume,
                disposal_volume=expected_disposal_volume,
                is_last_dispense_in_tip=True,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_distribution_steps_using_multi_dispense_without_conditioning_volume(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should distribute the liquid using multi-dispense steps in the expected order.

    It should add air gaps between dispenses due to no conditioning volume.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    water_props = water.get_for(pipette_1k, tiprack)

    assert water_props.multi_dispense is not None
    water_props.multi_dispense.retract.blowout.location = "destination"
    water_props.multi_dispense.retract.blowout.flow_rate = pipette_1k.flow_rate.blow_out
    water_props.multi_dispense.retract.blowout.enabled = True
    disposal_volume = 5.5
    water_props.multi_dispense.conditioning_by_volume.set_for_all_volumes(0)
    water_props.multi_dispense.disposal_by_volume.set_for_all_volumes(disposal_volume)

    # Set distinct air gaps for different post-dispense volumes so that
    # we can verify that air gap volumes are calculated using the current tip volume
    post_aspirate_air_gap_vol = 1.5
    water_props.aspirate.retract.air_gap_by_volume.set_for_all_volumes(
        post_aspirate_air_gap_vol
    )
    water_props.multi_dispense.retract.air_gap_by_volume.set_for_volume(
        400 + disposal_volume, 2.5
    )
    water_props.multi_dispense.retract.air_gap_by_volume.set_for_volume(
        disposal_volume, 3.5
    )
    water_props.multi_dispense.retract.air_gap_by_volume.set_for_volume(0, 4.5)

    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class_during_multi_dispense",
            side_effect=InstrumentCore.dispense_liquid_class_during_multi_dispense,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(
            patched_dispense, "dispense_liquid_class_during_multi_dispense"
        )
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.rows()[0][1],
            dest=arma_plate.rows()[0][:4],
            new_tip="once",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_1000ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=800 + disposal_volume,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                conditioning_volume=0,
                volume_for_pipette_mode_configuration=400,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][0]),
                    arma_plate.rows()[0][0]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=800 + disposal_volume, air_gap=post_aspirate_air_gap_vol
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=0,
                disposal_volume=disposal_volume,
                is_last_dispense_in_tip=False,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][1]),
                    arma_plate.rows()[0][1]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(liquid=400 + disposal_volume, air_gap=2.5)
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=0,
                disposal_volume=disposal_volume,
                is_last_dispense_in_tip=True,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=800 + disposal_volume,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=4.5)],
                conditioning_volume=0,
                volume_for_pipette_mode_configuration=400,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][2]),
                    arma_plate.rows()[0][2]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=800 + disposal_volume, air_gap=post_aspirate_air_gap_vol
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=0,
                disposal_volume=disposal_volume,
                is_last_dispense_in_tip=False,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=(
                    Location(Point(), arma_plate.rows()[0][3]),
                    arma_plate.rows()[0][3]._core,
                ),
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(liquid=400 + disposal_volume, air_gap=2.5)
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=0,
                disposal_volume=disposal_volume,
                is_last_dispense_in_tip=True,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
@pytest.mark.parametrize(
    ["distribute_volume", "multi_dispense_props_present"],
    [
        (20, False),
        (26, True),
    ],  # Settings that should result in non-multi-dispense transfers
)
def test_order_of_water_distribute_steps_using_one_to_one_transfers(
    simulated_protocol_context: ProtocolContext,
    distribute_volume: float,
    multi_dispense_props_present: bool,
) -> None:
    """It should distribute liquid using the one-to-one transfer steps instead of doing multi-dispense."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")
    water_props = water.get_for(pipette_50, tiprack)
    if not multi_dispense_props_present:
        water_props._multi_dispense = None
    expected_post_aspirate_air_gap = (
        water_props.aspirate.retract.air_gap_by_volume.get_for_volume(distribute_volume)
    )
    expected_post_dispense_air_gap = (
        water_props.dispense.retract.air_gap_by_volume.get_for_volume(0)
    )
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.distribute_with_liquid_class(
            liquid_class=water,
            volume=distribute_volume,
            source=nest_plate.rows()[0][2],
            dest=arma_plate.wells()[:2],
            new_tip="once",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=distribute_volume,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=distribute_volume,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=distribute_volume,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=distribute_volume, air_gap=expected_post_aspirate_air_gap
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=distribute_volume,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=0, air_gap=expected_post_dispense_air_gap
                    )
                ],
                volume_for_pipette_mode_configuration=distribute_volume,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=distribute_volume,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=distribute_volume, air_gap=expected_post_aspirate_air_gap
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_distribution_steps_using_mixed_dispense(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should distribute the liquid using multi-dispense and single-dispense steps in the expected order."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    water_props = water.get_for(pipette_1k, tiprack)
    assert water_props.multi_dispense is not None
    water_props.multi_dispense.retract.blowout.location = "destination"
    water_props.multi_dispense.retract.blowout.flow_rate = pipette_1k.flow_rate.blow_out
    water_props.multi_dispense.retract.blowout.enabled = True
    expected_conditioning_volume = (
        water_props.multi_dispense.conditioning_by_volume.get_for_volume(800)
    )
    expected_disposal_volume = (
        water_props.multi_dispense.disposal_by_volume.get_for_volume(800)
    )
    expected_air_gap = water_props.aspirate.retract.air_gap_by_volume.get_for_volume(
        400
    )
    expected_post_dispense_air_gap = (
        water_props.multi_dispense.retract.air_gap_by_volume.get_for_volume(0)
    )
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_single_dispense,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class_during_multi_dispense",
            side_effect=InstrumentCore.dispense_liquid_class_during_multi_dispense,
            autospec=True,
        ) as patched_multi_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_single_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(
            patched_multi_dispense, "dispense_liquid_class_during_multi_dispense"
        )
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.rows()[0][1],
            dest=arma_plate.rows()[0][:3],
            new_tip="once",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_1000ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=800 + expected_conditioning_volume + expected_disposal_volume,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                conditioning_volume=expected_conditioning_volume,
                volume_for_pipette_mode_configuration=400,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=800 + expected_disposal_volume, air_gap=0
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=expected_conditioning_volume,
                disposal_volume=expected_disposal_volume,
                is_last_dispense_in_tip=False,
            ),
            mock.call.dispense_liquid_class_during_multi_dispense(
                mock.ANY,
                volume=400,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=400 + expected_disposal_volume, air_gap=0
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
                conditioning_volume=expected_conditioning_volume,
                disposal_volume=expected_disposal_volume,
                is_last_dispense_in_tip=True,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=400,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=0, air_gap=expected_post_dispense_air_gap
                    )
                ],
                conditioning_volume=0,
                volume_for_pipette_mode_configuration=400,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=400,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_MANY,
                tip_contents=[
                    LiquidAndAirGapPair(
                        liquid=400,
                        air_gap=expected_air_gap,
                    )
                ],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls[1] == expected_calls[1]
        assert mock_manager.mock_calls[2] == expected_calls[2]
        assert mock_manager.mock_calls[3] == expected_calls[3]
        assert mock_manager.mock_calls[4] == expected_calls[4]
        assert mock_manager.mock_calls[5] == expected_calls[5]
        assert mock_manager.mock_calls[6] == expected_calls[6]
        assert mock_manager.mock_calls[7] == expected_calls[7]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_water_distribute_steps_with_return_tip(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should return tips during the distribution.

    This test uses the same liquid class and transfer parameters as
    `test_order_of_water_distribution_steps_using_mixed_dispense`, except that it sets
    `return_tip` arg to True. So we expect the execution to call `drop_tip()` with
    the well_core pointing to last tip's well and a `location` of None.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    with (
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "drop_tip",
            side_effect=InstrumentCore.drop_tip,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip")
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.rows()[0][1],
            dest=arma_plate.rows()[0][:3],
            new_tip="once",
            trash_location=trash,
            return_tip=True,
        )
        expected_calls = [
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.drop_tip(
                mock.ANY,
                location=None,
                well_core=mock.ANY,
                home_after=False,
                alternate_drop_location=False,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_water_distribution_raises_error_for_disposal_vol_without_blowout(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should execute the distribute steps with the expected tip pick ups."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    water = simulated_protocol_context.get_liquid_class("water")
    water_props = water.get_for(pipette_1k, tiprack)
    water_props.multi_dispense.retract.blowout.enabled = False  # type: ignore[union-attr]
    with pytest.raises(
        RuntimeError,
        match="Specify a blowout location and enable blowout when using a disposal volume",
    ):
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=140,
            source=nest_plate.rows()[0][0],
            dest=nest_plate.rows()[1],
            new_tip="once",
            trash_location=trash,
        )


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_transfers_do_not_perform_lpd(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should not do any liquid probing for LC-based transfer/ consolidate/ distribute."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000",
        mount="left",
        tip_racks=[tiprack],
        liquid_presence_detection=True,
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    with mock.patch.object(
        InstrumentCore,
        "liquid_probe_with_recovery",
        autospec=True,
    ) as patched_liquid_probe:
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_liquid_probe, "liquid_probe_with_recovery")
        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=1100,
            source=nest_plate.rows()[0],
            dest=arma_plate.rows()[0],
            new_tip="always",
            trash_location=trash,
        )
        pipette_1k.consolidate_with_liquid_class(
            liquid_class=water,
            volume=100,
            source=nest_plate.rows()[0],
            dest=arma_plate.rows()[0][0],
            new_tip="always",
            trash_location=trash,
        )
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=100,
            source=nest_plate.rows()[0][0],
            dest=arma_plate.rows()[0],
            new_tip="always",
            trash_location=trash,
        )
        assert patched_liquid_probe.call_count == 0


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_water_transfer_with_multi_channel_pipette(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer steps for a multi-channel pipette and well grouping without any errors.

    This test only checks that various supported configurations for a transfer
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_8channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=40,
            source=nest_plate.columns()[:2],
            dest=arma_plate.columns()[:2],
            new_tip="always",
            trash_location=trash,
        )
        assert patched_aspirate.call_count == 2
        assert patched_dispense.call_count == 2


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_raises_no_tips_available_error(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should raise an error explaining that there aren't any tips available."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack1 = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    tiprack2 = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D2"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack1, tiprack2]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")
    expected_error_msg = (
        "No tip available among the tipracks assigned for flex_1channel_50:"
        " \\['Opentrons Flex 96 Tip Rack 50 µL in D1', 'Opentrons Flex 96 Tip Rack 50 µL in D2'\\]"
    )
    with pytest.raises(RuntimeError, match=expected_error_msg):
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=160,
            source=nest_plate.columns(),
            dest=arma_plate.columns(),
            new_tip="always",
            trash_location=trash,
        )
    with pytest.raises(RuntimeError, match=f"{expected_error_msg}"):
        pipette_50.distribute_with_liquid_class(
            liquid_class=water,
            volume=160,
            source=nest_plate.wells()[-1],
            dest=arma_plate.columns(),
            new_tip="once",
            trash_location=trash,
        )
    with pytest.raises(RuntimeError, match=f"{expected_error_msg}"):
        pipette_50.consolidate_with_liquid_class(
            liquid_class=water,
            volume=50,
            source=nest_plate.columns(),
            dest=arma_plate.wells()[0],
            new_tip="once",
            trash_location=trash,
        )


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_transfer_with_keep_last_tip(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should keep the last tip instead of dropping the last one."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    with (
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.wells()[:2],
            dest=arma_plate.wells()[:2],
            new_tip="always",
            trash_location=trash,
            keep_last_tip=True,
        )
        expected_calls = [
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
        ]
        assert pipette_1k.has_tip
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_transfer_with_keep_last_tip_false(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should not keep the last tip for a tip policy of never."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    with (
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        pipette_1k.pick_up_tip()
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.wells()[:2],
            dest=arma_plate.wells()[:2],
            new_tip="never",
            trash_location=trash,
            keep_last_tip=False,
        )
        expected_calls = [
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            )
        ]
        assert not pipette_1k.has_tip
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_transfer_with_keep_last_tip_chained(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should be able to use the last kept tip when calling with never after another transfer."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    with (
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.wells()[0],
            dest=arma_plate.wells()[:2],
            new_tip="always",
            trash_location=trash,
            keep_last_tip=True,
        )
        assert pipette_1k.has_tip
        pipette_1k.consolidate_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.wells()[:2],
            dest=arma_plate.wells()[0],
            new_tip="never",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            )
        ]
        assert pipette_1k.has_tip
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_return_tip_after_transfer_with_never(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should be able to return the current tip when calling a transfer with return tip."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    with (
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "drop_tip",
            side_effect=InstrumentCore.drop_tip,
            autospec=True,
        ) as patched_drop_tip,
    ):
        pipette_1k.pick_up_tip()
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip")
        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.wells()[:2],
            dest=arma_plate.wells()[:2],
            new_tip="never",
            trash_location=trash,
            keep_last_tip=False,
            return_tip=True,
        )
        expected_calls = [
            mock.call.drop_tip(
                mock.ANY,
                location=None,
                well_core=mock.ANY,
                home_after=False,
                alternate_drop_location=False,
            ),
        ]
        assert not pipette_1k.has_tip
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_return_tip_after_chained_transfers(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should be able to return the current tip when calling a transfer with return tip."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    with (
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "drop_tip",
            side_effect=InstrumentCore.drop_tip,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip")
        pipette_1k.transfer_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.wells()[:2],
            dest=arma_plate.wells()[:2],
            new_tip="once",
            trash_location=trash,
            keep_last_tip=True,
        )
        assert pipette_1k.has_tip
        pipette_1k.distribute_with_liquid_class(
            liquid_class=water,
            volume=400,
            source=nest_plate.wells()[0],
            dest=arma_plate.wells()[:2],
            new_tip="never",
            trash_location=trash,
            keep_last_tip=False,
            return_tip=True,
        )
        expected_calls = [
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.drop_tip(
                mock.ANY,
                location=None,
                well_core=mock.ANY,
                home_after=False,
                alternate_drop_location=False,
            ),
        ]
        assert not pipette_1k.has_tip
        assert mock_manager.mock_calls == expected_calls


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_return_tip_fails_after_new_tip_never_keep_last_tip_false(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should fail in returning a tip with new tip of never and keep last tip False."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "D1"
    )
    pipette_1k = simulated_protocol_context.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )
    water = simulated_protocol_context.get_liquid_class("water")

    pipette_1k.pick_up_tip()
    pipette_1k.transfer_with_liquid_class(
        liquid_class=water,
        volume=400,
        source=nest_plate.wells()[0],
        dest=arma_plate.wells()[0],
        new_tip="never",
        trash_location=trash,
        keep_last_tip=False,
    )

    with pytest.raises(TypeError, match="Last tip location"):
        pipette_1k.return_tip()


@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.27", "Flex")], indirect=True
)
def test_water_transfer_with_selected_tips(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer using the tips provided."""
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50",
        mount="left",
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=40,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.rows()[0][:2],
            new_tip="always",
            trash_location=trash,
            tips=[tiprack["D10"], tiprack["B3"]],
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=Location(tiprack["D10"]._core.get_top(0), tiprack),
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=Location(tiprack["B3"]._core.get_top(0), tiprack),
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls


# Fix this test
@pytest.mark.ot3_only
@pytest.mark.parametrize(
    "simulated_protocol_context", [("2.24", "Flex")], indirect=True
)
def test_order_of_water_transfer_steps_with_blowout_in_source_custom_position(
    simulated_protocol_context: ProtocolContext,
) -> None:
    """It should run the transfer steps with blowout at specified position in source labware.

    This test only checks that various supported configurations for a transfer
    analyze successfully. It doesn't check whether the steps are as expected.
    That will be covered in analysis snapshot tests.
    """
    trash = simulated_protocol_context.load_trash_bin("A3")
    tiprack = simulated_protocol_context.load_labware(
        "opentrons_flex_96_tiprack_50ul", "D1"
    )
    pipette_50 = simulated_protocol_context.load_instrument(
        "flex_1channel_50", mount="left", tip_racks=[tiprack]
    )
    nest_plate = simulated_protocol_context.load_labware(
        "nest_96_wellplate_200ul_flat", "C3"
    )
    arma_plate = simulated_protocol_context.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "C2"
    )

    water = simulated_protocol_context.get_liquid_class("water")
    water_blowout_props = water.get_for(pipette_50, tiprack).dispense.retract.blowout
    water_blowout_props.enabled = True
    water_blowout_props.location = "source"
    water_blowout_props.blowout_position = {
        "position_reference": "well-top",
        "offset": {"x": 1, "y": 2, "z": 3},
    }

    with (
        mock.patch.object(
            InstrumentCore,
            "load_liquid_class",
            side_effect=InstrumentCore.load_liquid_class,
            autospec=True,
        ) as patched_load_liquid_class,
        mock.patch.object(
            InstrumentCore,
            "pick_up_tip",
            side_effect=InstrumentCore.pick_up_tip,
            autospec=True,
        ) as patched_pick_up_tip,
        mock.patch.object(
            InstrumentCore,
            "aspirate_liquid_class",
            side_effect=InstrumentCore.aspirate_liquid_class,
            autospec=True,
        ) as patched_aspirate,
        mock.patch.object(
            InstrumentCore,
            "dispense_liquid_class",
            side_effect=InstrumentCore.dispense_liquid_class,
            autospec=True,
        ) as patched_dispense,
        mock.patch.object(
            InstrumentCore,
            "blow_out",
            side_effect=InstrumentCore.blow_out,
            autospec=True,
        ) as patched_blowout,
        mock.patch.object(
            InstrumentCore,
            "drop_tip_in_disposal_location",
            side_effect=InstrumentCore.drop_tip_in_disposal_location,
            autospec=True,
        ) as patched_drop_tip,
    ):
        mock_manager = mock.Mock()
        mock_manager.attach_mock(patched_pick_up_tip, "pick_up_tip")
        mock_manager.attach_mock(patched_load_liquid_class, "load_liquid_class")
        mock_manager.attach_mock(patched_aspirate, "aspirate_liquid_class")
        mock_manager.attach_mock(patched_dispense, "dispense_liquid_class")
        mock_manager.attach_mock(patched_blowout, "blow_out")
        mock_manager.attach_mock(patched_drop_tip, "drop_tip_in_disposal_location")
        pipette_50.transfer_with_liquid_class(
            liquid_class=water,
            volume=40,
            source=nest_plate.rows()[0][:2],
            dest=arma_plate.rows()[0][:2],
            new_tip="always",
            trash_location=trash,
        )
        expected_calls = [
            mock.call.load_liquid_class(
                mock.ANY,
                name="water",
                transfer_properties=mock.ANY,
                tiprack_uri="opentrons/opentrons_flex_96_tiprack_50ul/1",
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.blow_out(
                mock.ANY,
                location=Location(
                    nest_plate.rows()[0][0].top(0).point + Point(1, 2, 3),
                    labware=nest_plate.rows()[0][0],
                ),
                well_core=mock.ANY,
                in_place=False,
                flow_rate=50,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
            mock.call.pick_up_tip(
                mock.ANY,
                location=mock.ANY,
                well_core=mock.ANY,
                presses=mock.ANY,
                increment=mock.ANY,
            ),
            mock.call.aspirate_liquid_class(
                mock.ANY,
                volume=40,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=0, air_gap=0)],
                volume_for_pipette_mode_configuration=40,
            ),
            mock.call.dispense_liquid_class(
                mock.ANY,
                volume=40,
                dest=mock.ANY,
                source=mock.ANY,
                transfer_properties=mock.ANY,
                transfer_type=TransferType.ONE_TO_ONE,
                tip_contents=[LiquidAndAirGapPair(liquid=40, air_gap=0.1)],
                add_final_air_gap=True,
                trash_location=mock.ANY,
            ),
            mock.call.blow_out(
                mock.ANY,
                location=Location(
                    nest_plate.rows()[0][1].top(0).point + Point(1, 2, 3),
                    labware=nest_plate.rows()[0][1],
                ),
                well_core=mock.ANY,
                in_place=False,
                flow_rate=50,
            ),
            mock.call.drop_tip_in_disposal_location(
                mock.ANY,
                disposal_location=trash,
                home_after=False,
                alternate_tip_drop=True,
            ),
        ]
        assert mock_manager.mock_calls == expected_calls
