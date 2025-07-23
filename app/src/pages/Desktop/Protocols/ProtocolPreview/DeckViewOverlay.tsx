import { useMemo } from 'react'

import { CURSOR_POINTER, RobotCoordsForeignObject } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import styles from './preview.module.css'
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
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  opacity?: number
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
    setHoveredSlot,
    opacity = 1,
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

  // TODO: extend for Ot-2
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
        opacity: opacity,
        flex: '1',
        cursor: CURSOR_POINTER,
      }}
      foreignObjectEvents={{
        onClick: () => {
          setSelectedSlot(slotId)
        },
        onMouseEnter: () => {
          setHoveredSlot(slotId)
        },
        onMouseLeave: () => {
          setHoveredSlot(null)
        },
      }}
    >
      <div
        className={styles.deck_overlay}
        style={{ backgroundColor: slotFillColor }}
      >
        {children}
      </div>
    </RobotCoordsForeignObject>
  )
}
