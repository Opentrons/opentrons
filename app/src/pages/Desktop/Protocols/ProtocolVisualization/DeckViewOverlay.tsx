import { useMemo } from 'react'

import {
  ALIGN_CENTER,
  COLORS,
  CURSOR_POINTER,
  RobotCoordsForeignObject,
  WASTE_CHUTE_HEIGHT,
  WASTE_CHUTE_WIDTH,
  WASTE_CHUTE_X,
  WASTE_CHUTE_Y,
  WasteChute,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  getFlexHoverDimensions,
  getOT2HoverDimensions,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import styles from './visualization.module.css'

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
  invariantContext: InvariantContext
  robotState: RobotState
  setSelectedSlot: Dispatch<SetStateAction<string | null>>
  setHoveredSlot: Dispatch<SetStateAction<string | null>>
  robotType: RobotType
  hover: string | null
  children?: ReactNode
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
    hover,
  } = props
  const { stagingAreaEntities, moduleEntities, wasteChuteEntities } =
    invariantContext
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
  const wasteChuteOnSlot =
    Object.values(wasteChuteEntities).length > 0 && slotId === 'D3'

  const cutoutId =
    getCutoutIdForAddressableArea(
      slotId as AddressableAreaName,
      deckDef.cutoutFixtures
    ) ?? 'cutoutD1'

  if (slotPosition === null || (hasTCOnSlot && tcSlots.includes(slotId))) {
    return null
  }
  const hoverOpacity = hover != null && hover === slotId ? 0.9 : 0

  if (robotType === FLEX_ROBOT_TYPE) {
    const { width, x, y, height } = getFlexHoverDimensions(
      stagingAreaLocations,
      cutoutId,
      slotId,
      hasTCOnSlot != null,
      slotPosition
    )

    const callToActions = {
      onClick: () => {
        setSelectedSlot(slotId)
      },
      onMouseEnter: () => {
        setHoveredSlot(slotId)
      },
      onMouseLeave: () => {
        setHoveredSlot(null)
      },
    }

    return (
      <>
        <RobotCoordsForeignObject
          key={`${robotType.toLowerCase()}_slotOverlay`}
          width={width}
          height={height}
          x={x}
          y={y}
          flexProps={{ flex: '1' }}
          foreignObjectProps={{
            opacity: hoverOpacity,
            flex: '1',
            cursor: CURSOR_POINTER,
            textAlign: ALIGN_CENTER,
            border: `3px solid ${COLORS.purple50}`,
            borderRadius: '6px', // no const but matches the labware svg radius
          }}
          foreignObjectEvents={callToActions}
        >
          {children != null ? (
            <div className={styles.deck_overlay}>
              <div
                className={styles.text_background}
                style={{ backgroundColor: slotFillColor }}
              >
                {children}
              </div>
            </div>
          ) : null}
        </RobotCoordsForeignObject>
        {/* This is to render the waste chute above the hover border - very gnarly but this
            is what design wanted */}
        {wasteChuteOnSlot != null ? (
          <RobotCoordsForeignObject
            width={WASTE_CHUTE_WIDTH}
            height={WASTE_CHUTE_HEIGHT}
            x={WASTE_CHUTE_X}
            y={WASTE_CHUTE_Y}
            flexProps={{
              transform: 'rotate(180deg) scaleX(-1)',
              width: '100%',
            }}
            foreignObjectProps={{
              opacity: hoverOpacity,
              cursor: CURSOR_POINTER,
            }}
            foreignObjectEvents={callToActions}
          >
            <WasteChute
              key="wasteChute_hovered"
              wasteIconColor={COLORS.grey35}
              backgroundColor={COLORS.grey50}
            />
          </RobotCoordsForeignObject>
        ) : null}
      </>
    )
  } else {
    const { width, x, y, height } = getOT2HoverDimensions(
      hasTCOnSlot != null,
      slotPosition
    )

    return (
      <RobotCoordsForeignObject
        key="ot2_hover"
        width={width}
        height={height}
        x={x}
        y={y}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{
          opacity: hoverOpacity,
          flex: '1',
          cursor: CURSOR_POINTER,
          border: `3px solid ${COLORS.purple50}`,
          borderRadius: '6px',
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
        {children != null ? (
          <div className={styles.deck_overlay}>
            <div
              className={styles.text_background}
              style={{ backgroundColor: slotFillColor }}
            >
              {children}
            </div>
          </div>
        ) : null}
      </RobotCoordsForeignObject>
    )
  }
}
