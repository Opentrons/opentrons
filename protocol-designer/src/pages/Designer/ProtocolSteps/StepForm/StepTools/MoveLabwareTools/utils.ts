import {
  ALL_FLEX_ADDRESSABLE_AREAS_SORTED,
  FLEX_ROBOT_TYPE,
  OT2_SINGLE_SLOT_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  VACUUM_DOCK_ADDRESSABLE_AREA,
} from '@opentrons/step-generation'

import { VACUUM_DOCK_DISPLAY_LOCATION } from '/protocol-designer/constants'

import type { DropdownOption } from '@opentrons/components'
import type { AddressableAreaName, RobotType } from '@opentrons/shared-data'
import type { TimelineFrame } from '@opentrons/step-generation'
import type { Option } from '/protocol-designer/top-selectors/labware-locations'

export const getSortedAddressableArea = (
  options: Option[] | DropdownOption[],
  robotState: TimelineFrame,
  robotType: RobotType
): Option[] | DropdownOption[] => {
  const sortedAddressableAreasReference =
    robotType === FLEX_ROBOT_TYPE
      ? ALL_FLEX_ADDRESSABLE_AREAS_SORTED
      : OT2_SINGLE_SLOT_ADDRESSABLE_AREAS
  const { modules: modulesState, labware: labwareState } = robotState
  return options.sort((a, b) => {
    const getSlot = (value: string): string => {
      if (modulesState?.[value]?.slot != null) {
        return modulesState[value].slot
      }
      if (labwareState?.[value]?.stack != null) {
        const slotInLocationStack = getSlotInLocationStack(
          labwareState[value]?.stack
        )
        // explicit check for vacuum dock
        return slotInLocationStack === VACUUM_DOCK_ADDRESSABLE_AREA
          ? VACUUM_DOCK_DISPLAY_LOCATION
          : slotInLocationStack
      }
      // value is a slot or OFFDECK
      return value
    }
    const slotA = getSlot(a.value) as AddressableAreaName
    const slotB = getSlot(b.value) as AddressableAreaName
    const indexA = sortedAddressableAreasReference.indexOf(slotA)
    const indexB = sortedAddressableAreasReference.indexOf(slotB)

    if (indexA === -1 && indexB === -1) {
      return 0
    }
    if (indexA === -1) {
      return 1
    }
    if (indexB === -1) {
      return -1
    }

    return indexA - indexB
  })
}
