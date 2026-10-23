import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  Flex,
  JUSTIFY_CENTER,
  Link,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'

import { getIsWellContentsEmpty } from '../../../components/organisms'
import { SlotDetailModal } from '../../../components/organisms/SlotDetailModal'
import { START_TERMINAL_ITEM_ID } from '../../../steplist'
import * as wellContentsSelectors from '../../../top-selectors/well-contents'
import { DECK_CONTROLS_STYLE } from '../DeckSetup/constants'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { DeckSlotId, Vector2D } from '@opentrons/shared-data'
import type { DeckSetupTerminalIdType } from '../types'

interface OffDeckControlsProps extends DeckSetupTerminalIdType {
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  slotBoundingBox: Vector2D
  labwareId: string
  slotPosition: Vector2D | null
  setShowMenuListForId: Dispatch<SetStateAction<string | null>>
  menuListId: DeckSlotId | null
  isSelected?: boolean
}

export function OffDeckControls(props: OffDeckControlsProps): ReactNode {
  const {
    hover,
    terminalItemId,
    setHover,
    slotBoundingBox,
    labwareId,
    setShowMenuListForId,
    menuListId,
    slotPosition,
    isSelected = false,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const [showSlotDetailModal, setShowSlotDetailModal] = useState<boolean>(false)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const hasNoContents = getIsWellContentsEmpty(
    allWellContentsForActiveItem,
    labwareId
  )

  if (
    slotPosition === null ||
    isSelected ||
    ((terminalItemId == null || terminalItemId !== START_TERMINAL_ITEM_ID) &&
      hasNoContents)
  ) {
    return null
  }
  const hoverOpacity =
    (hover != null && hover === labwareId) || menuListId === labwareId ? 1 : 0

  return (
    <>
      {showSlotDetailModal ? (
        <SlotDetailModal
          closeModal={() => {
            setShowSlotDetailModal(false)
          }}
          stackOfLabware={[labwareId]}
        />
      ) : null}
      <RobotCoordsForeignDiv
        x={slotPosition.x}
        y={slotPosition.y}
        width={slotBoundingBox.x}
        height={slotBoundingBox.y}
        innerDivProps={{
          opacity: hoverOpacity,
          ...DECK_CONTROLS_STYLE,
        }}
        innerDivEvents={{
          onMouseEnter: () => {
            setHover(labwareId)
          },
          onMouseLeave: () => {
            setHover(null)
          },
          onClick: () => {
            if (terminalItemId === START_TERMINAL_ITEM_ID) {
              setShowMenuListForId(labwareId)
            } else {
              setShowSlotDetailModal(true)
            }
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
          <Link role="button">
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {terminalItemId === START_TERMINAL_ITEM_ID
                ? t('edit_labware')
                : t('view_labware')}
            </StyledText>
          </Link>
        </Flex>
      </RobotCoordsForeignDiv>
    </>
  )
}
