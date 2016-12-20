import copy
from opentrons.util.vector import Vector

from opentrons.containers.placeable import unpack_location


def apply_calibration(calibration_data,
                      placeable,
                      coordinates=(0, 0, 0)):
    calibrator = Calibrator()
    return calibrator.convert(calibration_data, placeable, coordinates)


class Calibrator(object):
    def __init__(self, placeable, calibration_data):
        self.calibrated_coordinates = {}
        self.calibration_data = calibration_data
        self.root_placeable = placeable
        self._apply_calibration(calibration_data, placeable)

    # Returns calibrated coordinates relative to deck
    def convert(self,
                placeable,
                coordinates=Vector(0, 0, 0)):
        coordinates = Vector(coordinates)
        path = placeable.get_trace()

        adjusted_coordinates = Vector(0, 0, 0)
        for item in path:
            c = self.calibrated_coordinates.get(item, item._coordinates)
            adjusted_coordinates += c

        return coordinates + adjusted_coordinates

    def _apply_calibration(self, calibration_data, placeable):
        for name, data in calibration_data.items():
            child = placeable.get_child_by_name(name)
            if child:
                if 'delta' in data:
                    c = child._coordinates + data['delta']
                    self.calibrated_coordinates[child] = c
                if 'children' in data:
                    self._apply_calibration(
                        data['children'], child)

    def calibrate(self,
                  calibration_data,
                  location,
                  actual):
        actual = Vector(actual)
        placeable, expected = unpack_location(location)
        coordinates_to_deck = placeable.coordinates(placeable.get_deck())
        expected_to_deck = expected + coordinates_to_deck

        delta = actual - expected_to_deck
        path = placeable.get_path()
        calibration_data = copy.deepcopy(calibration_data)

        current = {'children': calibration_data}
        for i, name in enumerate(path):
            children = current['children']
            if name not in children:
                if i == len(path) - 1:
                    children[name] = {}
                else:
                    children[name] = {'children': {}}
            current = children[name]

        current['delta'] = delta
        current['type'] = placeable.get_type()
        self.calibration_data = calibration_data

        self._apply_calibration(calibration_data, self.root_placeable)

        return calibration_data
