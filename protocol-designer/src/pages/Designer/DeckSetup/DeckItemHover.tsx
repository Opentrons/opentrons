import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  PRODUCT,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { SlotOverflowMenu } from './SlotOverflowMenu'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { TerminalItemId } from '../../../steplist'

interface DeckItemHoverProps {
  addEquipment: (slotId: string) => void
  hover: string | null
  setHover: React.Dispatch<React.SetStateAction<string | null>>
  slotBoundingBox: Dimensions
  slotId: string
  slotPosition: CoordinateTuple | null
  selectedTerminalItemId?: TerminalItemId | null
}

export function DeckItemHover(props: DeckItemHoverProps): JSX.Element | null {
  const {
    addEquipment,
    hover,
    selectedTerminalItemId,
    setHover,
    slotBoundingBox,
    slotId,
    slotPosition,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const [showMenuList, setShowMenuList] = React.useState<boolean>(false)

  if (
    selectedTerminalItemId !== START_TERMINAL_ITEM_ID ||
    slotPosition === null
  )
    return null

  const hoverOpacity = hover != null && hover === slotId ? '1' : '0'

  return (
    <RobotCoordsForeignDiv
      x={slotPosition[0]}
      y={slotPosition[1]}
      width={slotBoundingBox.xDimension}
      height={slotBoundingBox.yDimension}
      innerDivProps={{
        style: {
          opacity: hoverOpacity,
          position: POSITION_ABSOLUTE,
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          transform: 'rotate(180deg) scaleX(-1)',
          zIndex: 1,
          backgroundColor: `${COLORS.black90}cc`,
          display: DISPLAY_FLEX,
          alignItems: ALIGN_CENTER,
          color: COLORS.white,
          fontSize: PRODUCT.TYPOGRAPHY.fontSizeBodyDefaultSemiBold,
          borderRadius: BORDERS.borderRadius8,
        },
        onMouseEnter: () => {
          setHover(slotId)
        },
        onMouseLeave: () => {
          setHover(null)
        },
        onClick: () => {
          setShowMenuList(true)
        },
      }}
    >
      <Flex
        css={css`
          justify-content: ${JUSTIFY_CENTER};
          width: 100%;
          opacity: ${hoverOpacity};
        `}
      >
        <a
          onClick={() => {
            setShowMenuList(true)
          }}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {slotId === 'offDeck' ? t('edit_labware') : t('edit_slot')}
          </StyledText>
        </a>
      </Flex>
      {showMenuList ? (
        <SlotOverflowMenu
          slot={slotId}
          addEquipment={addEquipment}
          setShowMenuList={setShowMenuList}
          xSlotPosition={slotPosition[0]}
          ySlotPosition={slotPosition[1]}
        />
      ) : null}
    </RobotCoordsForeignDiv>
  )
}
