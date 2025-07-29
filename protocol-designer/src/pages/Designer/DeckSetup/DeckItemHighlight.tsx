import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

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
} from '@opentrons/components'

import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import {
  getHoveredDropdownItem,
  getSelectedDropdownItem,
  getSelectedTerminalItemId,
} from '../../../ui/steps/selectors'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'

interface DeckItemHighlightProps {
  slotBoundingBox: Dimensions
  //  can be slotId or labwareId (for off-deck labware)
  itemId: string
  slotPosition: CoordinateTuple | null
}

export function DeckItemHighlight(
  props: DeckItemHighlightProps
): JSX.Element | null {
  const { slotBoundingBox, itemId, slotPosition } = props
  const { t } = useTranslation('application')
  const hoveredDropdownSelection = useSelector(getHoveredDropdownItem)
  const selectedDropdownLocation = useSelector(getSelectedDropdownItem)
  const terminalItemId = useSelector(getSelectedTerminalItemId)

  const isHovered =
    hoveredDropdownSelection?.id != null
      ? hoveredDropdownSelection.id === itemId
      : false
  const isSelected = selectedDropdownLocation.some(
    selected => selected.id === itemId && selected.field === '2'
  )

  if (
    terminalItemId === START_TERMINAL_ITEM_ID ||
    slotPosition === null ||
    (!isHovered && !isSelected)
  ) {
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
            text: t('new_location'),
            isLast: true,
            isSelected: isSelected,
            isZoomed: false,
          },
        ]}
        x={slotPosition[0]}
        y={slotPosition[1] - 28}
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
      />
    </>
  )
}
