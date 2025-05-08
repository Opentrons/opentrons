import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  Link,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'

import { DECK_CONTROLS_STYLE } from '../constants'
import { SlotOverlay } from './SlotOverlay'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { DeckSetupTerminalIdType } from '../../types'

interface ActiveLabwareControlsProps extends DeckSetupTerminalIdType {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  itemId: string
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
}

export function ActiveLabwareControls(
  props: ActiveLabwareControlsProps
): JSX.Element | null {
  const {
    slotPosition,
    slotBoundingBox,
    itemId,
    terminalItemId,
    hover,
    setHover,
  } = props
  const { t } = useTranslation('starting_deck_state')
  if (terminalItemId != null || slotPosition == null) {
    return null
  }
  const hoverOpacity = hover != null && hover === itemId ? 1 : 0

  return (
    <RobotCoordsForeignDiv
      dataTestId={itemId}
      x={slotPosition[0]}
      y={slotPosition[1]}
      width={slotBoundingBox.xDimension}
      height={slotBoundingBox.yDimension}
      innerDivProps={{
        style: {
          opacity: hoverOpacity,
          ...DECK_CONTROLS_STYLE,
        },
        onMouseEnter: () => {
          setHover(itemId)
        },
        onMouseLeave: () => {
          setHover(null)
        },
        onClick: () => {
          console.log('hello')
        },
      }}
    >
      <Flex
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
      >
        <Link role="button">
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('view_labware')}
          </StyledText>
        </Link>
      </Flex>
    </RobotCoordsForeignDiv>
  )
}
