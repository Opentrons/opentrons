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
import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'
import {
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
} from '@opentrons/step-generation'

import { SlotDetailModal } from '/protocol-designer/components/organisms/SlotDetailModal'
import { getTimelineIsBeingComputed } from '/protocol-designer/file-data/selectors'
import { getPendingCreationState } from '/protocol-designer/step-forms/selectors'
import { END_TERMINAL_ITEM_ID } from '/protocol-designer/steplist'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getFullStackFromLabwaresOnDeck } from '/protocol-designer/utils'

import { DECK_CONTROLS_STYLE } from '../constants'

import type { Dispatch, SetStateAction } from 'react'
import type { CoordinateTuple, Dimensions } from '@opentrons/shared-data'
import type { FlexStackerModuleState } from '@opentrons/step-generation'
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
  const pendingCreationStateForHopper = useSelector(getPendingCreationState)
  const timelineIsBeingComputed = useSelector(getTimelineIsBeingComputed)
  const isSlotAHopper = getIsSlotAHopper(itemId)
  const isSlotAVacuumDock = getIsSlotAVacuumDock(itemId)
  const [showSlotDetailModal, setShowSlotDetailModal] = useState<boolean>(false)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)

  // TODO (ND:2026-01-21): Remove this once we have a way to ensure the stack properties are populated asynchronously.
  // This check should be superfluous, since any LabwareOnDeck should have a stack
  // However, there is a timing issue where the labware entities exist but the stack
  // properties are not populated.
  const allLabwareHaveStack = Object.values(activeDeckSetup.labware).every(
    labware => 'stack' in labware
  )
  const fullStack =
    pendingCreationStateForHopper ||
    timelineIsBeingComputed ||
    !allLabwareHaveStack
      ? []
      : getFullStackFromLabwaresOnDeck(
          Object.values(activeDeckSetup.labware),
          itemId,
          isSlotAHopper,
          isSlotAVacuumDock
        )

  const stackerModuleId = fullStack.find(
    id =>
      activeDeckSetup.modules[id] != null &&
      activeDeckSetup.modules[id].type === FLEX_STACKER_MODULE_TYPE
  )
  const stackerModuleState: FlexStackerModuleState | null =
    stackerModuleId != null
      ? (activeDeckSetup.modules[stackerModuleId]
          .moduleState as FlexStackerModuleState)
      : null
  const stackerHopperLabware: string[] =
    stackerModuleState?.labwareInHopper?.reduceRight<string[]>(
      (acc, { lidLabwareId, primaryLabwareId, adapterLabwareId }) => {
        if (lidLabwareId) {
          acc.push(lidLabwareId)
        }
        acc.push(primaryLabwareId)
        if (adapterLabwareId) {
          acc.push(adapterLabwareId)
        }
        return acc
      },
      []
    ) ?? []

  const filteredStack = fullStack.filter(
    item => activeDeckSetup.labware[item] != null
  )

  if (
    (terminalItemId != null && terminalItemId !== END_TERMINAL_ITEM_ID) ||
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
          stackOfLabware={
            stackerHopperLabware.length > 0
              ? stackerHopperLabware
              : filteredStack
          }
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
