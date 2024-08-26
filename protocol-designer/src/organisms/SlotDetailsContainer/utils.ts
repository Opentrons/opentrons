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
export const getYPosition = (props: YPositionProps): string => {
  const { robotType, slot } = props

  let yPosition: string = ''
  if (robotType === FLEX_ROBOT_TYPE) {
    if (FLEX_TOP_ROW_SLOTS.includes(slot)) {
      yPosition = '-10'
    } else if (FLEX_TOP_MIDDLE_ROW_SLOTS.includes(slot)) {
      yPosition = '-110'
    } else if (FLEX_BOTTOM_MIDDLE_ROW_SLOTS.includes(slot)) {
      yPosition = '-230'
    } else {
      yPosition = '-330'
    }
  } else {
    if (OT2_TOP_ROW_SLOTS.includes(slot)) {
      yPosition = '-60'
    } else if (OT2_TOP_MIDDLE_ROW_SLOTS.includes(slot)) {
      yPosition = '-160'
    } else if (OT2_BOTTOM_MIDDLE_ROW_SLOTS.includes(slot)) {
      yPosition = '-250'
    } else {
      yPosition = '-340'
    }
  }

  return yPosition
}
