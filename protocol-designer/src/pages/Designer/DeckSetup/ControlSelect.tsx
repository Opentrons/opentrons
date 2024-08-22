import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { css } from 'styled-components'
import {
  Flex,
  JUSTIFY_CENTER,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import { SlotOverflowMenu } from './SlotOverflowMenu'

import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { TerminalItemId } from '../../../steplist'

import styles from './DeckSetup.module.css'

interface ControlSelectProps {
  slotPosition: CoordinateTuple | null
  slotBoundingBox: Dimensions
  slotId: string
  addEquipment: (slotId: string) => void
  hover: string | null
  setHover: React.Dispatch<React.SetStateAction<string | null>>
  selectedTerminalItemId?: TerminalItemId | null
}

export const ControlSelect = (
  props: ControlSelectProps
): JSX.Element | null => {
  const {
    slotBoundingBox,
    slotPosition,
    slotId,
    selectedTerminalItemId,
    addEquipment,
    hover,
    setHover,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const [showMenuList, setShowMenuList] = React.useState<boolean>(false)

  if (selectedTerminalItemId !== START_TERMINAL_ITEM_ID || slotPosition == null)
    return null

  return (
    <>
      <RobotCoordsForeignDiv
        x={slotPosition[0]}
        y={slotPosition[1]}
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
        innerDivProps={{
          className: cx(styles.slot_overlay, styles.appear_on_mouseover),
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
            opacity: ${hover != null && hover === slotId ? `1` : `0`};
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
        {showMenuList && (
          <SlotOverflowMenu
            slot={slotId}
            addEquipment={addEquipment}
            setShowMenuList={setShowMenuList}
            xSlotPosition={slotPosition[0]}
            ySlotPosition={slotPosition[1]}
          />
        )}
      </RobotCoordsForeignDiv>
    </>
  )
}
