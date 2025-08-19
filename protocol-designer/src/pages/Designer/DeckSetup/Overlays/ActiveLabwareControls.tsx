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
import { getIsLid } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { LabwareButtonContainer } from '/protocol-designer/components/molecules/LabwareButtonContainer'
import { getIsWellContentsEmpty } from '/protocol-designer/components/organisms'
import { SlotDetailModal } from '/protocol-designer/components/organisms/SlotDetailModal'
import { END_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import * as wellContentsSelectors from '/protocol-designer/top-selectors/well-contents'
import { getIsAdapterFromDef } from '/protocol-designer/utils'

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
  const hasNoLiquidContents = getIsWellContentsEmpty(
    allWellContentsForActiveItem,
    fullStack[0]
  )
  const filteredStack = fullStack.filter(
    item =>
      activeDeckSetup.labware[item] != null &&
      !getIsAdapterFromDef(activeDeckSetup.labware[item].def)
  )
  const isLidOnTopOfSlot = Object.values(activeDeckSetup.labware).some(
    lw => lw.stack.includes(fullStack[0]) && getIsLid(lw.def)
  )
  if (
    (terminalItemId != null && terminalItemId !== END_TERMINAL_ITEM_ID) ||
    (hasNoLiquidContents && !isLidOnTopOfSlot) ||
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
          stackOfLabware={filteredStack}
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
        }}
        innerDivEvents={{
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
