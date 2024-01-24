import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'
import {
  CutoutConfig,
  CutoutFixtureId,
  FLEX_CUTOUT_BY_SLOT_ID,
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getPositionFromSlotId,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { Tooltip, useHoverTooltip } from '../../tooltips'
import {
  DeckFromLayers,
  LegacyDeckSlotLocation,
  OT2_FIXED_TRASH_X_DIMENSION,
  OT2_FIXED_TRASH_Y_DIMENSION,
  RobotCoordinateSpace,
  RobotCoordsForeignDiv,
  SingleSlotFixture,
  SlotLabels,
} from '../../hardware-sim'
import { Icon } from '../../icons'
import { Flex, Text } from '../../primitives'
import { ALIGN_CENTER, JUSTIFY_CENTER } from '../../styles'
import { COLORS, SPACING, TYPOGRAPHY } from '../../ui-style-constants'

import type {
  DeckDefinition,
  ModuleLocation,
  RobotType,
} from '@opentrons/shared-data'

export type DeckLocationSelectThemes = 'default' | 'grey'

const X_CROP_MM = 0
const X_ADJUSTMENT_FOR_TC = '-50'
const Y_ADJUSTMENT_FOR_TC = '214'

const OT2_DECK_LOCATION_SELECT_LAYER_BLOCK_LIST: string[] = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
  'slotNumbers',
]

export function useDeckLocationSelect(
  robotType: RobotType,
  theme?: DeckLocationSelectThemes
): { DeckLocationSelect: JSX.Element; selectedLocation: ModuleLocation } {
  const deckDef = getDeckDefFromRobotType(robotType)
  const [
    selectedLocation,
    setSelectedLocation,
  ] = React.useState<ModuleLocation>({
    slotName: deckDef.locations.addressableAreas[0].id,
  })
  return {
    DeckLocationSelect: (
      <DeckLocationSelect
        {...{ deckDef, selectedLocation, setSelectedLocation, theme }}
      />
    ),
    selectedLocation,
  }
}

interface DeckLocationSelectProps {
  deckDef: DeckDefinition
  selectedLocation: ModuleLocation
  theme?: DeckLocationSelectThemes
  setSelectedLocation?: (loc: ModuleLocation) => void
  disabledLocations?: CutoutConfig[]
  isThermocycler?: boolean
  showTooltipOnDisabled?: boolean
}
export function DeckLocationSelect({
  deckDef,
  selectedLocation,
  setSelectedLocation,
  disabledLocations = [],
  theme = 'default',
  isThermocycler = false,
  showTooltipOnDisabled = false,
}: DeckLocationSelectProps): JSX.Element {
  const robotType = deckDef.robot.model

  return (
    <RobotCoordinateSpace
      viewBox={`${deckDef.cornerOffsetFromOrigin[0] + X_CROP_MM} ${
        deckDef.cornerOffsetFromOrigin[1]
      } ${deckDef.dimensions[0] - X_CROP_MM * 2} ${deckDef.dimensions[1]}`}
    >
      {deckDef.locations.addressableAreas
        // only render standard slot fixture components
        .filter(
          addressableArea =>
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            // special case the OT-2 trash addressable area
            addressableArea.id === 'fixedTrash'
        )
        .map(slot => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [targetProps, tooltipProps] = useHoverTooltip()
          const slotLocation = { slotName: slot.id }
          const isDisabled = disabledLocations.some(
            l =>
              typeof l === 'object' && 'slotName' in l && l.slotName === slot.id
          )
          const isSelected = isEqual(selectedLocation, slotLocation)
          let fill =
            theme === 'default'
              ? COLORS.highlightPurple2
              : COLORS.lightGreyPressed
          if (isSelected)
            fill =
              theme === 'default'
                ? COLORS.highlightPurple1
                : COLORS.darkGreyEnabled
          if (isDisabled) fill = COLORS.darkGreyDisabled
          if (isSelected && slot.id === 'B1' && isThermocycler) {
            return (
              <g key="thermocyclerSelectionArea">
                <path
                  fill={fill}
                  d="M-97.8,496.6h239c2.3,0,4.2-1.9,4.2-4.2v-282c0-2.3-1.9-4.2-4.2-4.2h-239c-2.3,0-4.2,1.9-4.2,4.2v282 C-102,494.7-100.1,496.6-97.8,496.6z"
                />
                <RobotCoordsForeignDiv
                  x={X_ADJUSTMENT_FOR_TC}
                  y={Y_ADJUSTMENT_FOR_TC}
                  width={slot.boundingBox.xDimension}
                  height="282"
                  innerDivProps={INNER_DIV_PROPS}
                >
                  <Icon
                    name="check-circle"
                    size="1.5rem"
                    color={COLORS.white}
                  />
                  <Text color={COLORS.white} fontSize="1.5rem">
                    Selected
                  </Text>
                </RobotCoordsForeignDiv>
              </g>
            )
          } else if (slot.id === 'A1' && isThermocycler) {
            return null
          }

          const slotPosition = getPositionFromSlotId(slot.id, deckDef)
          const cutoutId = FLEX_CUTOUT_BY_SLOT_ID[slot.id]

          return (
            <React.Fragment key={slot.id}>
              {robotType === FLEX_ROBOT_TYPE ? (
                <>
                  <SingleSlotFixture
                    cutoutId={cutoutId}
                    fixtureBaseColor={fill}
                    slotClipColor={COLORS.white}
                    onClick={() =>
                      !isDisabled &&
                      setSelectedLocation != null &&
                      setSelectedLocation(slotLocation)
                    }
                    cursor={
                      setSelectedLocation == null || isDisabled || isSelected
                        ? 'default'
                        : 'pointer'
                    }
                    deckDefinition={deckDef}
                  />
                  {isDisabled && showTooltipOnDisabled && slotPosition != null && (
                    <RobotCoordsForeignDiv
                      x={slotPosition[0]}
                      y={slotPosition[1]}
                      width={200}
                      height={100}
                      innerDivProps={INNER_DIV_PROPS}
                      css={css`
                        z-index: 1;
                      `}
                    >
                      <Flex height={100} width={200} {...targetProps} />
                      <Tooltip {...tooltipProps}>
                        <Text color={COLORS.white} fontSize="1.5rem">
                          {`Slot ${slot.id} disabled because of xyz`}
                        </Text>
                      </Tooltip>
                    </RobotCoordsForeignDiv>
                  )}
                </>
              ) : (
                <LegacyDeckSlotLocation
                  robotType={robotType}
                  slotBaseColor={fill}
                  slotName={slot.id}
                  slotClipColor={COLORS.white}
                  onClick={() =>
                    !isDisabled &&
                    setSelectedLocation != null &&
                    setSelectedLocation(slotLocation)
                  }
                  cursor={
                    setSelectedLocation == null || isDisabled || isSelected
                      ? 'default'
                      : 'pointer'
                  }
                />
              )}
              {isSelected && slotPosition != null ? (
                <RobotCoordsForeignDiv
                  x={slotPosition[0] - slot.offsetFromCutoutFixture[0]}
                  y={slotPosition[1] - slot.offsetFromCutoutFixture[1]}
                  width={
                    slot.id === 'fixedTrash'
                      ? OT2_FIXED_TRASH_X_DIMENSION
                      : slot.boundingBox.xDimension
                  }
                  height={
                    slot.id === 'fixedTrash'
                      ? OT2_FIXED_TRASH_Y_DIMENSION
                      : slot.boundingBox.yDimension
                  }
                  innerDivProps={INNER_DIV_PROPS}
                >
                  <Text
                    color={COLORS.white}
                    css={
                      robotType === FLEX_ROBOT_TYPE
                        ? TYPOGRAPHY.level4HeaderSemiBold
                        : TYPOGRAPHY.bodyTextSemiBold
                    }
                  >
                    Selected
                  </Text>
                </RobotCoordsForeignDiv>
              ) : null}
            </React.Fragment>
          )
        })}
      {robotType === OT2_ROBOT_TYPE ? (
        <DeckFromLayers
          robotType={robotType}
          layerBlocklist={OT2_DECK_LOCATION_SELECT_LAYER_BLOCK_LIST}
        />
      ) : null}
      <SlotLabels robotType={robotType} color={COLORS.darkGreyEnabled} />
    </RobotCoordinateSpace>
  )
}

const INNER_DIV_PROPS = {
  display: 'flex',
  alignItems: ALIGN_CENTER,
  justifyContent: JUSTIFY_CENTER,
  height: '100%',
  gridGap: SPACING.spacing4,
}
