def get_instrument_max_height(
	self,
	mount: Union[top_types.Mount, OT3Mount],
	critical_point: Optional[CriticalPoint] = None,
) -> float:
	carriage_pos = self._deck_from_machine(self._backend.home_position())
	pos_at_home = self._effector_pos_from_carriage_pos(
		OT3Mount.from_mount(mount), carriage_pos, critical_point
	)

	return pos_at_home[Axis.by_mount(mount)] - self._config.z_retract_distance


def get_instrument_bounds() -> None:
	return None

def get_robot_bounds() -> None:
	return None
