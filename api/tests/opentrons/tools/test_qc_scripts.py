import pytest
from unittest import mock

from opentrons.tools import args_handler

pipette_barcode_to_model = {
    'P10S20180101A01': 'p10_single_v1',
    'P10M20180101A01': 'p10_multi_v1',
    'P50S180101A01': 'p50_single_v1',
    'P50M20180101B01': 'p50_multi_v1',
    'P300S20180101A01': 'p300_single_v1',
    'P300M20180101A01': 'p300_multi_v1',
    'P1000S20180101A01': 'p1000_single_v1',
    'P10SV1318010101': 'p10_single_v1.3',
    'P10MV1318010102': 'p10_multi_v1.3',
    'P50SV1318010103': 'p50_single_v1.3',
    'P50MV1318010104': 'p50_multi_v1.3',
    'P3HSV1318010105': 'p300_single_v1.3',
    'P3HMV1318010106': 'p300_multi_v1.3',
    'P1KSV1318010107': 'p1000_single_v1.3',
    'P10SV1418010101': 'p10_single_v1.4',
    'P10MV1418010102': 'p10_multi_v1.4',
    'P50SV1418010103': 'p50_single_v1.4',
    'P50MV1418010104': 'p50_multi_v1.4',
    'P3HSV1418010105': 'p300_single_v1.4',
    'P3HMV1418010106': 'p300_multi_v1.4',
    'P1KSV1418010107': 'p1000_single_v1.4'
}


@pytest.fixture
def driver_import(monkeypatch):
    builder = mock.Mock()
    hw_mock = mock.Mock()
    driver_mock = mock.Mock()
    builder.return_value = (hw_mock, driver_mock)
    monkeypatch.setattr(args_handler, 'build_driver', builder)
    yield hw_mock, driver_mock


def test_parse_model_from_barcode(driver_import):
    from opentrons.tools import write_pipette_memory as wpm
    for barcode, model in pipette_barcode_to_model.items():
        assert wpm._parse_model_from_barcode(barcode) == model

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('P1HSV1318010101')

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('P1KSV1218010101')

    with pytest.raises(Exception):
        wpm._parse_model_from_barcode('aP300S20180101A01')
