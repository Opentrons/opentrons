import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  CURSOR_POINTER,
  DeckLabelSet,
  DISPLAY_FLEX,
  POSITION_ABSOLUTE,
  PRODUCT,
  RobotCoordsForeignDiv,
  useCommandTypeSummaries,
} from '@opentrons/components'
import {
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotType,
  getPositionFromSlotId,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import type { CutoutId, RunTimeCommand } from '@opentrons/shared-data'

const Y_OFFSET = 28 // allow for the deck label set to be even with the slot
const X_OFFSET = 30 // center the fixedTrash overlay
interface Ot2TrashCommandSummaryProps {
  commandType: RunTimeCommand['commandType']
  cutoutId: CutoutId
}

export function Ot2FixedTrashCommandSummary(
  props: Ot2TrashCommandSummaryProps
): JSX.Element | null {
  const { commandType, cutoutId } = props
  const deckDef = getDeckDefFromRobotType(OT2_ROBOT_TYPE)
  const addressableArea = getAddressableAreaFromSlotId(
    cutoutId.split('cutout')[1],
    deckDef
  )
  const commandSummary = useCommandTypeSummaries(commandType)
  const slotPosition = getPositionFromSlotId('fixedTrash', deckDef)
  const slotBoundingBox = addressableArea?.boundingBox

  if (slotPosition == null || slotBoundingBox == null) {
    return null
  }
  return (
    <>
      <RobotCoordsForeignDiv
        x={slotPosition[0] - X_OFFSET}
        y={slotPosition[1]}
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
        innerDivProps={{
          position: POSITION_ABSOLUTE,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          transform: 'rotate(180deg) scaleX(-1)',
          zIndex: 1,
          border: `3px solid ${COLORS.blue50}`,
          display: DISPLAY_FLEX,
          alignItems: ALIGN_CENTER,
          color: COLORS.white,
          fontSize: PRODUCT.TYPOGRAPHY.fontSizeBodyDefaultSemiBold,
          borderRadius: BORDERS.borderRadius8,
          cursor: CURSOR_POINTER,
        }}
      />
      <DeckLabelSet
        deckLabels={[
          {
            text: commandSummary,
            isLast: true,
            isSelected: true,
            isZoomed: false,
          },
        ]}
        x={slotPosition[0] - X_OFFSET}
        y={slotPosition[1] - Y_OFFSET}
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
      />
    </>
  )
}
