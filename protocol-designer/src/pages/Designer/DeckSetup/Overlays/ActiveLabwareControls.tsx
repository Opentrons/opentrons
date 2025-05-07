import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  Link,
  StyledText,
} from '@opentrons/components'

import { SlotOverlay } from './SlotOverlay'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { DeckSetupTerminalIdType } from '../../types'

interface ActiveLabwareControlsProps extends DeckSetupTerminalIdType {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  //  this is the slotId (i.e. D1, A1, 1, 2, 3)
  itemId: string
}

export function ActiveLabwareControls(
  props: ActiveLabwareControlsProps
): JSX.Element | null {
  const { slotPosition, slotBoundingBox, itemId, terminalItemId } = props

  if (terminalItemId != null) {
    return null
  }
  return (
    <SlotOverlay
      slotPosition={slotPosition}
      slotId={itemId}
      slotFillColor={`${COLORS.black90}cc`}
      slotFillOpacity="1"
    >
      <Flex
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        color={COLORS.white}
        onClick={() => {
          console.log('wire up')
        }}
      >
        <StyledText desktopStyle="bodyLargeSemiBold">
          {'Labware details'}
        </StyledText>
      </Flex>
    </SlotOverlay>
  )
}
