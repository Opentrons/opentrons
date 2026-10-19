"""Tests for the pipette function downloader."""

import json
from typing import Dict, List, Tuple

import pytest
from mock import AsyncMock
from opentrons_shared_data import load_shared_data
from opentrons_shared_data.pipette.pipette_definition import SupportedTipsDefinition
from opentrons_shared_data.pipette.types import PipetteTipType

from opentrons_hardware.firmware_bindings import (
    NodeId,
)
from opentrons_hardware.firmware_update.pipette_function_download import (
    PipetteFunctionDownloader,
)


def get_supported_tips_model_from_json(
    path: str,
) -> Dict[PipetteTipType, SupportedTipsDefinition]:
    """Grab a supported tip definition from shared-data for testing."""
    supported_tips_json = json.loads(load_shared_data(path))["supportedTips"]
    return {
        PipetteTipType(int(tip_type[1:])): SupportedTipsDefinition.model_validate(
            supported_tip_def
        )
        for tip_type, supported_tip_def in supported_tips_json.items()
    }


@pytest.mark.parametrize(
    "pip_liquid_def_path",
    [
        "pipette/definitions/2/liquid/eight_channel/p1000/default/3_6.json",
        "pipette/definitions/2/liquid/eight_channel/p50/default/3_5.json",
    ],
)
def test_pipette_function_formatting(
    mock_messenger: AsyncMock, pip_liquid_def_path: str
) -> None:
    """Pipetting functions should be reformatted from the pipette config so they're all in the same dictionary, with tip size as int as the keys."""
    supported_tips_def = get_supported_tips_model_from_json(pip_liquid_def_path)
    subject = PipetteFunctionDownloader(
        node_id=NodeId.pipette_left,
        can_messenger=mock_messenger,
        supported_tips_def=supported_tips_def,
    )

    formatted_dict = subject.formatted_pipetting_function
    for tip_size, tip_size_data in subject._supported_tips_def.items():
        # this is the actual pipetting function
        func_for_tip_size = tip_size_data.aspirate.default
        # it's keyed by an int literal, we just want the values
        float_tuples = list(func_for_tip_size.values())[0]
        assert formatted_dict[int(tip_size.value)] == float_tuples


@pytest.mark.parametrize(
    "pip_liquid_def_path",
    [
        "pipette/definitions/2/liquid/eight_channel/p1000/default/3_6.json",
    ],
)
async def test_function_bytes_generator(
    mock_messenger: AsyncMock, pip_liquid_def_path: str
) -> None:
    """Test the generated pipette func bytestream by converting it back to floats and comparing to the object's formatted dict before conversion to bytes."""
    supported_tips_def = get_supported_tips_model_from_json(pip_liquid_def_path)
    subject = PipetteFunctionDownloader(
        node_id=NodeId.pipette_left,
        can_messenger=mock_messenger,
        supported_tips_def=supported_tips_def,
    )
    formatted_dict = subject.formatted_pipetting_function
    unpacked_dict = convert_chunks_back_to_floats(subject)
    for before_processing, unpacked in zip(
        formatted_dict.items(), unpacked_dict.items()
    ):
        test_tip_size, before_vals = before_processing
        unpacked_tip_size, unpacked_vals = unpacked
        decimal_places = 3

        rounded_vals = []
        for tup in before_vals:
            rounded_tup = tuple(
                [int(val * 10**decimal_places) / 10**decimal_places for val in tup]
            )
            rounded_vals.append(rounded_tup)

        assert test_tip_size == unpacked_tip_size
        assert rounded_vals == unpacked_vals


def convert_chunks_back_to_floats(
    subject: PipetteFunctionDownloader,
) -> Dict[int, List[Tuple[float, float, float]]]:
    """Convert byte streams back to floats and reformat for comparing to supported tips definitions."""
    expected_chunk_len = 15
    entry_size_bytes = 3
    tip_size = 0
    unpacked_dict = {}
    current_function_list = []
    for chunk in subject.pipetting_function_chunks():
        data_list = [
            int.from_bytes(chunk[i : i + entry_size_bytes], "big")
            for i in range(0, len(chunk), entry_size_bytes)
        ]

        # if the first entry is anything besides 0, that should be a tip size
        if data_list[0] != 0:
            tip_size = data_list[0]

        # data should be 1 tip size entry, then 15 entries of 3 byte numbers
        data_list.pop(0)
        assert (len(data_list)) == expected_chunk_len

        while data_list[-1] == 0:
            data_list.pop()

        # reformat floats- handle negative numbers and shift decimal place back
        formatted_data_list = []
        for i in range(len(data_list)):
            # before = data_list[i]
            pip_val_bytes = bytearray(data_list[i].to_bytes(3))
            is_negative = bool(pip_val_bytes[0] & 128)
            if is_negative:
                pip_val_bytes[0] &= 127
                data_list[i] = int.from_bytes(pip_val_bytes, "big") * -1
            # shift decimal point back 3 places
            new_data_val = data_list[i] / (10**3)
            formatted_data_list.append(new_data_val)

        # make sure a multiple of 3 got taken off
        numbers_removed = expected_chunk_len - len(data_list)
        assert numbers_removed % entry_size_bytes == 0

        # pack them into tuples of 3
        for i in range(0, len(data_list) - 2, 3):
            current_function_list.append(
                (
                    formatted_data_list[i],
                    formatted_data_list[i + 1],
                    formatted_data_list[i + 2],
                )
            )

        # end of a function for the given tip size
        if numbers_removed > 0:
            # damage is already done atp
            unpacked_dict[tip_size] = current_function_list.copy()
            current_function_list.clear()
            tip_size = 0

    return unpacked_dict
