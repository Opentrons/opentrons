import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  RobotCoordsForeignObject,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getCutoutIdForAddressableArea,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getFlexHoverDimensions,
  getModuleType,
  getOT2HoverDimensions,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { getInitialDeckSetup } from '../../step-forms/selectors'

import type { Dispatch, SetStateAction } from 'react'
import type {
  AddressableAreaName,
  CoordinateTuple,
  DeckSlotId,
  RobotType,
} from '@opentrons/shared-data'

interface SlotHoverProps {
  hover: string | null
  setHover: Dispatch<SetStateAction<string | null>>
  slotId: DeckSlotId
  slotPosition: CoordinateTuple | null
  robotType: RobotType
}

export function SlotHover(props: SlotHoverProps): JSX.Element | null {
  const { hover, setHover, slotId, slotPosition, robotType } = props
  const deckSetup = useSelector(getInitialDeckSetup)
  const { additionalEquipmentOnDeck, modules } = deckSetup
  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [])
  const hasTCOnSlot = Object.values(modules).find(
    module => module.slot === slotId && module.type === THERMOCYCLER_MODULE_TYPE
  )
  const tcSlots = robotType === FLEX_ROBOT_TYPE ? ['A1'] : ['8', '10', '11']
  const columnFourLocations = Object.values(additionalEquipmentOnDeck)
    .filter(ae => ae.name === 'stagingArea')
    ?.map(ae => ae.location as string)

  Object.values(modules).reduce<string[]>((acc, module) => {
    if (getModuleType(module.model) === FLEX_STACKER_MODULE_TYPE) {
      const cutoutForStacker = getCutoutIdForSlotName(module.slot, deckDef)
      if (cutoutForStacker != null) {
        acc.push(cutoutForStacker)
      }
    }
    return acc
  }, columnFourLocations)

  const cutoutId =
    getCutoutIdForAddressableArea(
      slotId as AddressableAreaName,
      deckDef.cutoutFixtures
    ) ?? 'cutoutD1'

  //  return null for TC slots
  if (slotPosition === null || (hasTCOnSlot && tcSlots.includes(slotId))) {
    return null
  }

  const hoverOpacity = hover != null && hover === slotId ? 1 : 0
  const slotFill = (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={`${COLORS.black90}cc`}
      borderRadius={BORDERS.borderRadius4}
      color={COLORS.white}
      gridGap={SPACING.spacing8}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="100%"
    />
  )

  if (robotType === FLEX_ROBOT_TYPE) {
    const { width, height, x, y } = getFlexHoverDimensions(
      columnFourLocations,
      cutoutId,
      slotId,
      hasTCOnSlot != null,
      slotPosition
    )

    return (
      <RobotCoordsForeignObject
        key="flex_hover"
        width={width}
        height={height}
        x={x}
        y={y}
        flexProps={{ flex: '1' }}
        foreignObjectProps={{
          opacity: hoverOpacity,
          flex: '1',
        }}
        foreignObjectEvents={{
          onMouseEnter: () => {
            setHover(slotId)
          },
          onMouseLeave: () => {
            setHover(null)
          },
        }}
      >
        {slotFill}
      </RobotCoordsForeignObject>
    )
  } else {
    const { width, height, x, y } = getOT2HoverDimensions(
      hasTCOnSlot != null,
      slotPosition,
      false
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
        }}
        foreignObjectEvents={{
          onMouseEnter: () => {
            setHover(slotId)
          },
          onMouseLeave: () => {
            setHover(null)
          },
        }}
      >
        {slotFill}
      </RobotCoordsForeignObject>
    )
  }
}
