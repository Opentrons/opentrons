import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import type { DeckSlotId, RobotType } from '@opentrons/shared-data'

const FLEX_TOP_ROW_SLOTS = ['A1', 'A2', 'A3', 'A4']
const FLEX_TOP_MIDDLE_ROW_SLOTS = ['B1', 'B2', 'B3', 'B4']
const FLEX_BOTTOM_MIDDLE_ROW_SLOTS = ['C1', 'C2', 'C3', 'C4']

const OT2_TOP_ROW_SLOTS = ['10', '11']
const OT2_TOP_MIDDLE_ROW_SLOTS = ['7', '8', '9']
const OT2_BOTTOM_MIDDLE_ROW_SLOTS = ['4', '5', '6']

interface YPositionProps {
  robotType: RobotType
  slot: DeckSlotId
}

const Y_POSITIONS = {
  FLEX: {
    TOP: '-10',
    TOP_MIDDLE: '-110',
    BOTTOM_MIDDLE: '-230',
    BOTTOM: '-330',
  },
  OT2: {
    TOP: '-60',
    TOP_MIDDLE: '-160',
    BOTTOM_MIDDLE: '-250',
    BOTTOM: '-340',
  },
}

export const getYPosition = ({ robotType, slot }: YPositionProps): string => {
  if (robotType === FLEX_ROBOT_TYPE) {
    if (FLEX_TOP_ROW_SLOTS.includes(slot)) {
      return Y_POSITIONS.FLEX.TOP
    } else if (FLEX_TOP_MIDDLE_ROW_SLOTS.includes(slot)) {
      return Y_POSITIONS.FLEX.TOP_MIDDLE
    } else if (FLEX_BOTTOM_MIDDLE_ROW_SLOTS.includes(slot)) {
      return Y_POSITIONS.FLEX.BOTTOM_MIDDLE
    } else {
      return Y_POSITIONS.FLEX.BOTTOM
    }
  } else {
    if (OT2_TOP_ROW_SLOTS.includes(slot)) {
      return Y_POSITIONS.OT2.TOP
    } else if (OT2_TOP_MIDDLE_ROW_SLOTS.includes(slot)) {
      return Y_POSITIONS.OT2.TOP_MIDDLE
    } else if (OT2_BOTTOM_MIDDLE_ROW_SLOTS.includes(slot)) {
      return Y_POSITIONS.OT2.BOTTOM_MIDDLE
    } else {
      return Y_POSITIONS.OT2.BOTTOM
    }
  }
}
