import copy
from collections import OrderedDict


class Calibrator(object):
    def apply_calibration(self, calibration_data, placeable):
        placeable = copy.deepcopy(placeable)
        self.apply_calibration_recursive(calibration_data, placeable)
        return placeable

    def apply_calibration_recursive(self, calibration_data, placeable):
        for name, data in calibration_data.items():
            child = placeable.children[name]

            if 'delta' in data:
                child['coordinates'] = tuple(
                    a + b for a, b in zip(child['coordinates'],
                                          data['delta'])
                )
            if 'children' in data:
                self.apply_calibration_recursive(
                    data['children'], child['instance'])

    def calibrate(self, calibration_data, placeable, expected, actual):
        delta = tuple(a - b for a, b in zip(actual, expected))
        path = list(reversed([item.get_name()
                             for item in placeable.get_trace()
                             if item.get_name() is not None]))

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
        return calibration_data
