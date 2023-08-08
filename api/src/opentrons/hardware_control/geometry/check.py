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

def generate_bounding_box(bottom_left_corner, top_right_corner, offset) -> None:
	return None

def check_against_robot_bounds() -> bool:
	return False

def check_for_bounding_box_collision(bounding_box_1, bounding_box_2) -> bool:
	check_slot_origin = bound
	check_slot_end = None
	return True


def check_for_point_collision() -> bool:
	return True
