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
  getAddressableAreaFromSlotId,
  getCutoutIdForAddressableArea,
  getDeckDefFromRobotType,
  getFlexHoverDimensions,
  getOT2HoverDimensions,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  FAKE_HOPPER_LOCATION_MAP,
  HOPPER_FAKE_LOCATIONS,
} from '@opentrons/step-generation'

import styles from './deckviewoverlay.module.css'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type {
  AddressableAreaName,
  CoordinateTuple,
  DeckSlotId,
  RobotType,
} from '@opentrons/shared-data'
import type {
  HopperLocationMapKey,
  InvariantContext,
  RobotState,
} from '@opentrons/step-generation'

interface DeckViewOverlayProps {
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
  selectedSlot: string | null
}

const X_OFFSET = 30 // center the fixedTrash overlay

export function DeckViewOverlay(
  props: DeckViewOverlayProps
): JSX.Element | null {
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
    selectedSlot,
  } = props
  const { stagingAreaEntities, moduleEntities, wasteChuteEntities } =
    invariantContext
  const { modules } = robotState
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])
  const slotMapped = HOPPER_FAKE_LOCATIONS.includes(slotId)
    ? FAKE_HOPPER_LOCATION_MAP[slotId as HopperLocationMapKey]
    : slotId
  const hasTCOnSlot = Object.entries(modules).some(([id, module]) => {
    const entity = moduleEntities[id]
    return (
      module.slot === slotMapped && entity?.type === THERMOCYCLER_MODULE_TYPE
    )
  })
  const tcSlots = robotType === FLEX_ROBOT_TYPE ? ['A1'] : ['8', '10', '11']
  const stagingAreaLocations = Object.values(stagingAreaEntities)?.map(
    stagingArea => stagingArea.location as string
  )
  const isWasteChuteOnSlot =
    Object.values(wasteChuteEntities).length > 0 && slotMapped === 'D3'

  const cutoutId =
    getCutoutIdForAddressableArea(
      slotMapped as AddressableAreaName,
      deckDef.cutoutFixtures
    ) ?? 'cutoutD1'

  if (slotPosition === null || (hasTCOnSlot && tcSlots.includes(slotMapped))) {
    return null
  }

  // Note the outline is kept when a user opens the spotlight window
  const hoverOpacity =
    (hover != null && hover === slotId) ||
    (selectedSlot != null && selectedSlot === slotId)
      ? 0.9
      : 0

  if (robotType === FLEX_ROBOT_TYPE) {
    const thermocyclerModuleEntry = Object.entries(modules).find(
      ([id, module]) =>
        module.slot === slotMapped &&
        moduleEntities[id]?.type === THERMOCYCLER_MODULE_TYPE
    )
    const thermocyclerModuleModel =
      thermocyclerModuleEntry != null
        ? moduleEntities[thermocyclerModuleEntry[0]]?.model
        : null
    const slotOffsetFromCutout = getAddressableAreaFromSlotId(
      slotMapped,
      deckDef
    )?.offsetFromCutoutFixture ?? [0, 0, 0]
    const moduleOffsetFromCutout = deckDef.locations.addressableAreas.find(
      area => area.id === thermocyclerModuleModel
    )?.offsetFromCutoutFixture ?? [0, 0, 0]
    const thermocyclerOffsetFromSlot = [
      moduleOffsetFromCutout[0] - slotOffsetFromCutout[0],
      moduleOffsetFromCutout[1] - slotOffsetFromCutout[1],
      moduleOffsetFromCutout[2] - slotOffsetFromCutout[2],
    ]
    const { width, x, y, height } = getFlexHoverDimensions(
      stagingAreaLocations,
      cutoutId,
      slotMapped,
      hasTCOnSlot,
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
          x={hasTCOnSlot === true ? x + thermocyclerOffsetFromSlot[0] : x}
          y={hasTCOnSlot === true ? y + thermocyclerOffsetFromSlot[1] : y}
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
        {isWasteChuteOnSlot ? (
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
      hasTCOnSlot,
      slotPosition,
      true
    )

    return (
      <RobotCoordsForeignObject
        key="ot2_hover"
        width={width}
        height={height}
        x={slotId === 'fixedTrash' ? x - X_OFFSET : x}
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
