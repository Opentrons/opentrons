from typing import Dict, List


class UpdateTipTo:
  starting_nozzle: str
  number_of_tips: int

class NozzleConfigurationManager:
    def __init__(self, nozzle_map: Dict[str, List[float]], starting_nozzle: str) -> None:
        self._nozzle_map = nozzle_map
        self._current_nozzle = starting_nozzle

    def nozzle_offset(self) -> List[float]:
        return self._nozzle_map[self._current_nozzle]
    
    def update_nozzle(self, nozzle_config: UpdateTipTo) -> None:
        
        self._current_nozzle = nozzle_config.starting_nozzle

