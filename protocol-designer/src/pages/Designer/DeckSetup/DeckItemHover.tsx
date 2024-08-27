import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
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
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { SlotOverflowMenu } from './SlotOverflowMenu'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { TerminalItemId } from '../../../steplist'

interface DeckItemHoverProps {
  addEquipment: (slotId: string) => void
  hover: string | null
  setHover: React.Dispatch<React.SetStateAction<string | null>>
  slotBoundingBox: Dimensions
  //  can be slotId or labwareId (for off-deck labware)
  itemId: string
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
    itemId,
    slotPosition,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const [showMenuList, setShowMenuList] = React.useState<boolean>(false)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const offDeckLabware = Object.values(deckSetup.labware).find(
    lw => lw.id === itemId
  )
  if (
    selectedTerminalItemId !== START_TERMINAL_ITEM_ID ||
    slotPosition === null
  )
    return null

  const hoverOpacity =
    (hover != null && hover === itemId) || showMenuList ? '1' : '0'

  return (
    <>
      {showMenuList ? (
        <RobotCoordsForeignDiv
          x={slotPosition[0] + 50}
          y={slotPosition[1] - 160}
          width="172px"
          height="180px"
          innerDivProps={{
            style: {
              position: POSITION_ABSOLUTE,
              transform: 'rotate(180deg) scaleX(-1)',
              zIndex: 5,
            },
          }}
        >
          <SlotOverflowMenu
            slot={itemId}
            addEquipment={addEquipment}
            setShowMenuList={setShowMenuList}
          />
        </RobotCoordsForeignDiv>
      ) : null}

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
            setHover(itemId)
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
              {offDeckLabware?.slot === 'offDeck'
                ? t('edit_labware')
                : t('edit_slot')}
            </StyledText>
          </a>
        </Flex>
      </RobotCoordsForeignDiv>
    </>
  )
}
