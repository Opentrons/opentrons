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

import type {
  CoordinateTuple,
  Dimensions,
  RunTimeCommand,
} from '@opentrons/shared-data'

interface FixtureCommandSummaryProps {
  commandType: RunTimeCommand['commandType']
  slotBoundingBox: Dimensions
  slotPosition: CoordinateTuple | null
}

const Y_OFFSET = 28 // allow for the deck label set to be even with the slot

export function FixtureCommandSummary(
  props: FixtureCommandSummaryProps
): JSX.Element | null {
  const { slotBoundingBox, slotPosition, commandType } = props
  const commandSummary = useCommandTypeSummaries(commandType)
  if (slotPosition === null) {
    return null
  }

  return (
    <>
      <RobotCoordsForeignDiv
        x={slotPosition[0]}
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
        x={slotPosition[0]}
        y={slotPosition[1] - Y_OFFSET}
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
      />
    </>
  )
}
