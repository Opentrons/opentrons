import { useEffect, useMemo, useState } from 'react'

import {
  ALIGN_CENTER,
  BORDERS,
  CURSOR_GRABBING,
  CURSOR_POINTER,
  Flex,
  JUSTIFY_CENTER,
  RobotCoordsForeignObject,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getFlexHoverDimensions } from './utils'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  AddressableAreaName,
  CoordinateTuple,
  DeckSlotId,
  RobotType,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface SlotOverlayProps {
  slotId: DeckSlotId
  slotPosition: CoordinateTuple | null
  slotFillColor: string
  children: ReactNode
  robotType: RobotType
  invariantContext: InvariantContext
  robotState: RobotState
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
}

export function DeckViewOverlay(props: SlotOverlayProps): JSX.Element | null {
  const {
    slotId,
    slotPosition,
    slotFillColor,
    children,
    robotType,
    invariantContext,
    robotState,
    setSelectedSlot,
  } = props
  const { stagingAreaEntities, moduleEntities } = invariantContext
  const { modules } = robotState
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])

  const hasTCOnSlot = Object.entries(modules).find(
    ([id, module]) =>
      module.slot === slotId &&
      moduleEntities[id].type === THERMOCYCLER_MODULE_TYPE
  )
  const tcSlots = robotType === FLEX_ROBOT_TYPE ? ['A1'] : ['8', '10', '11']
  const stagingAreaLocations = Object.values(stagingAreaEntities)?.map(
    stagingArea => stagingArea.location as string
  )

  const cutoutId =
    getCutoutIdForAddressableArea(
      slotId as AddressableAreaName,
      deckDef.cutoutFixtures
    ) ?? 'cutoutD1'

  if (slotPosition === null || (hasTCOnSlot && tcSlots.includes(slotId))) {
    return null
  }

  //    TODO: extend for Ot-2
  const { width, height, x, y } = getFlexHoverDimensions(
    stagingAreaLocations,
    cutoutId,
    slotId,
    hasTCOnSlot != null,
    slotPosition
  )

  return (
    <RobotCoordsForeignObject
      key={`${robotType.toLowerCase()}_slotOverlay`}
      width={width}
      height={height}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{
        opacity: 1,
        flex: '1',
        cursor: CURSOR_POINTER,
        onClick: () => {
          setSelectedSlot(slotId)
        },
      }}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={slotFillColor}
        borderRadius={BORDERS.borderRadius4}
        gridGap={SPACING.spacing8}
        justifyContent={JUSTIFY_CENTER}
        width="100%"
      >
        {children}
      </Flex>
    </RobotCoordsForeignObject>
  )
}
