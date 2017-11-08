from ..trackers.pose_tracker import Point, transform, update, ROOT


class Mover:
    def __init__(self, driver, axis_mapping, dst, src=ROOT):
        self._driver = driver
        self._axis_mapping = axis_mapping
        self._dst = dst
        self._src = src

    def jog(self, pose, axis, distance):
        assert axis in 'xyz', "axis value should be x, y or z"
        assert axis in self._axis_mapping, "mapping is not set for " + axis

        x, y, z = transform(pose, src=self)

        target = {
            'x': x if 'x' in self._axis_mapping else None,
            'y': y if 'y' in self._axis_mapping else None,
            'z': z if 'z' in self._axis_mapping else None,
        }

        target[axis] += distance

        return self.move(pose, **target)

    def move(self, pose, x=None, y=None, z=None):
        """
        Dispatch move command to the driver transforming
        x, y and z from source coordinate system to destination.

        Value must be set for each axis that is mapped.
        """
        def defaults(_x, _y, _z):
            _x = _x if x is not None else 0
            _y = _y if y is not None else 0
            _z = _z if z is not None else 0
            return _x, _y, _z

        dst_x, dst_y, dst_z = transform(
            pose,
            src=self._src,
            dst=self._dst,
            point=Point(*defaults(x, y, z)))

        driver_target = {}

        if 'x' in self._axis_mapping:
            assert x is not None, "Value must be set for each axis mapped"
            driver_target[self._axis_mapping['x']] = dst_x

        if 'y' in self._axis_mapping:
            assert y is not None, "Value must be set for each axis mapped"
            driver_target[self._axis_mapping['y']] = dst_y

        if 'z' in self._axis_mapping:
            assert z is not None, "Value must be set for each axis mapped"
            driver_target[self._axis_mapping['z']] = dst_z

        self._driver.move(target=driver_target)

        # Update pose with the new value. Since stepper motors are open loop
        # there is no need to to query diver for position
        return update(pose, self, Point(*defaults(dst_x, dst_y, dst_z)))

    def home(self, pose):
        position = self._driver.home(axis=''.join(self._axis_mapping.values()))
        # map from driver axis names to xyz and expand position
        # into point object
        point = Point(
            x=position.get(self._axis_mapping.get('x', 'X'), 0.0),
            y=position.get(self._axis_mapping.get('y', 'Y'), 0.0),
            z=position.get(self._axis_mapping.get('z', 'Z'), 0.0)
        )

        return update(pose, self, point)

    def set_speed(self, value):
        pass
        # TODO (artyom 20171105): uncomment once proper plunger speeds are
        # defined
        # self._driver.set_speed({
        #     axis: value
        #     for axis in self._axis_mapping.values()
        # })

    def probe(self, axis, movement):
        assert axis in self._axis_mapping, "mapping is not set for " + axis

        if axis in self._axis_mapping:
            return self._driver.probe_axis(
                        self._axis_mapping[axis],
                        movement)

    def delay(self, seconds):
        self._driver.delay(seconds)
