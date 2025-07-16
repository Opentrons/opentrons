import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Flex,
  JUSTIFY_CENTER,
  Link,
  RobotCoordsForeignDiv,
  StyledText,
} from '@opentrons/components'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { getIsWellContentsEmpty } from '../../../../components/organisms'
import { SlotDetailModal } from '../../../../components/organisms/SlotDetailModal'
import { END_TERMINAL_ITEM_ID } from '../../../../steplist'
import { getDeckSetupForActiveItem } from '../../../../top-selectors/labware-locations'
import * as wellContentsSelectors from '../../../../top-selectors/well-contents'
import { DECK_CONTROLS_STYLE } from '../constants'

import type { Dispatch, SetStateAction } from 'react'
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
  const [showSlotDetailModal, setShowSlotDetailModal] = useState<boolean>(false)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const fullStack = getFullStackFromLabwares(activeDeckSetup.labware, itemId)
  const hasNoContents = getIsWellContentsEmpty(
    allWellContentsForActiveItem,
    fullStack[0]
  )

  if (
    (terminalItemId != null && terminalItemId !== END_TERMINAL_ITEM_ID) ||
    hasNoContents ||
    slotPosition == null
  ) {
    return null
  }
  const hoverOpacity = hover != null && hover === itemId ? 1 : 0

  return (
    <>
      {showSlotDetailModal ? (
        <SlotDetailModal
          closeModal={() => {
            setShowSlotDetailModal(false)
          }}
          itemId={itemId}
        />
      ) : null}
      <RobotCoordsForeignDiv
        dataTestId={itemId}
        x={slotPosition[0]}
        y={slotPosition[1]}
        width={slotBoundingBox.xDimension}
        height={slotBoundingBox.yDimension}
        innerDivProps={{
          opacity: hoverOpacity,
          ...DECK_CONTROLS_STYLE,

          onMouseEnter: () => {
            setHover(itemId)
          },
          onMouseLeave: () => {
            setHover(null)
          },
          onClick: () => {
            setShowSlotDetailModal(true)
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
    </>
  )
}
