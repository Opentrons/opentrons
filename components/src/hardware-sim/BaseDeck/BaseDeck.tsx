import * as React from 'react'

import {
  getDeckDefFromRobotType,
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  OT2_ROBOT_TYPE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { Module } from '../Module'
import { LabwareRender } from '../Labware'
import { FlexTrash } from '../Deck/FlexTrash'
import { DeckFromLayers } from '../Deck/DeckFromLayers'
import { SlotLabels } from '../Deck'
import { COLORS } from '../../ui-style-constants'

import {
  // EXTENDED_DECK_CONFIG_FIXTURE,
  STANDARD_SLOT_DECK_CONFIG_FIXTURE,
} from './__fixtures__'
import { SingleSlotFixture } from './SingleSlotFixture'
import { StagingAreaFixture } from './StagingAreaFixture'
import { WasteChuteFixture } from './WasteChuteFixture'
// import { WasteChuteStagingAreaFixture } from './WasteChuteStagingAreaFixture'

import type {
  DeckConfiguration,
  LabwareDefinition2,
  LabwareLocation,
  ModuleLocation,
  ModuleModel,
  RobotType,
  SingleSlotCutoutFixtureId,
  WasteChuteCutoutFixtureId,
} from '@opentrons/shared-data'
import type { TrashLocation } from '../Deck/FlexTrash'
import type { StagingAreaLocation } from './StagingAreaFixture'
import type { WellFill } from '../Labware'

interface BaseDeckProps {
  robotType: RobotType
  labwareLocations: Array<{
    labwareLocation: LabwareLocation
    definition: LabwareDefinition2
    wellFill?: WellFill
    // generic prop to render self-positioned children for each labware
    labwareChildren?: React.ReactNode
    onLabwareClick?: () => void
  }>
  moduleLocations: Array<{
    moduleModel: ModuleModel
    moduleLocation: ModuleLocation
    nestedLabwareDef?: LabwareDefinition2 | null
    nestedLabwareWellFill?: WellFill
    innerProps?: React.ComponentProps<typeof Module>['innerProps']
    // generic prop to render self-positioned children for each module
    moduleChildren?: React.ReactNode
    onLabwareClick?: () => void
  }>
  deckConfig?: DeckConfiguration
  deckLayerBlocklist?: string[]
  showExpansion?: boolean
  lightFill?: string
  darkFill?: string
  children?: React.ReactNode
  showSlotLabels?: boolean
}

export function BaseDeck(props: BaseDeckProps): JSX.Element {
  const {
    robotType,
    moduleLocations,
    labwareLocations,
    lightFill = COLORS.light1,
    darkFill = COLORS.darkGreyEnabled,
    deckLayerBlocklist = [],
    // TODO(bh, 2023-10-09): remove deck config fixture for Flex after migration to v4
    // deckConfig = EXTENDED_DECK_CONFIG_FIXTURE,
    deckConfig = STANDARD_SLOT_DECK_CONFIG_FIXTURE,
    showExpansion = true,
    children,
    showSlotLabels = true,
  } = props
  const deckDef = getDeckDefFromRobotType(robotType)

  const singleSlotFixtures = deckConfig.filter(fixture =>
    SINGLE_SLOT_FIXTURES.includes(
      fixture.fixtureId as SingleSlotCutoutFixtureId
    )
  )
  const stagingAreaFixtures = deckConfig.filter(
    fixture => fixture.fixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
  )
  const trashBinFixtures = deckConfig.filter(
    fixture => fixture.fixtureId === TRASH_BIN_ADAPTER_FIXTURE
  )
  const wasteChuteFixtures = deckConfig.filter(
    fixture =>
      WASTE_CHUTE_FIXTURES.includes(
        fixture.fixtureId as WasteChuteCutoutFixtureId
      ) && fixture.fixtureLocation === WASTE_CHUTE_CUTOUT
  )

  return (
    <RobotCoordinateSpace
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {robotType === OT2_ROBOT_TYPE ? (
        <DeckFromLayers
          robotType={robotType}
          layerBlocklist={deckLayerBlocklist}
        />
      ) : (
        <>
          {singleSlotFixtures.map(fixture => (
            <SingleSlotFixture
              key={fixture.fixtureLocation}
              cutoutId={fixture.fixtureLocation}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
              showExpansion={showExpansion}
            />
          ))}
          {stagingAreaFixtures.map(fixture => (
            <StagingAreaFixture
              key={fixture.fixtureLocation}
              // TODO(bh, 2023-10-09): typeguard fixture location
              cutoutId={fixture.fixtureLocation as StagingAreaLocation}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
            />
          ))}
          {trashBinFixtures.map(fixture => (
            <React.Fragment key={fixture.fixtureLocation}>
              <SingleSlotFixture
                cutoutId={fixture.fixtureLocation}
                deckDefinition={deckDef}
                slotClipColor={COLORS.transparent}
                fixtureBaseColor={lightFill}
              />
              <FlexTrash
                robotType={robotType}
                trashIconColor={lightFill}
                // TODO(bh, 2023-10-09): typeguard fixture location
                trashLocation={fixture.fixtureLocation as TrashLocation}
                backgroundColor={darkFill}
              />
            </React.Fragment>
          ))}
          {wasteChuteFixtures.map(fixture => (
            <WasteChuteFixture
              key={fixture.fixtureLocation}
              // TODO(bh, 2023-10-09): typeguard fixture location
              cutoutId={fixture.fixtureLocation as typeof WASTE_CHUTE_CUTOUT}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
            />
          ))}
        </>
      )}
      <>
        {moduleLocations.map(
          ({
            moduleModel,
            moduleLocation,
            nestedLabwareDef,
            nestedLabwareWellFill,
            innerProps,
            moduleChildren,
            onLabwareClick,
          }) => {
            const slotPosition = getPositionFromSlotId(
              moduleLocation.slotName,
              deckDef
            )

            const moduleDef = getModuleDef2(moduleModel)
            return slotPosition != null ? (
              <Module
                key={`${moduleModel} ${moduleLocation.slotName}`}
                def={moduleDef}
                x={slotPosition[0]}
                y={slotPosition[1]}
                orientation={inferModuleOrientationFromXCoordinate(
                  slotPosition[0]
                )}
                innerProps={innerProps}
              >
                {nestedLabwareDef != null ? (
                  <LabwareRender
                    definition={nestedLabwareDef}
                    onLabwareClick={onLabwareClick}
                    wellFill={nestedLabwareWellFill}
                  />
                ) : null}
                {moduleChildren}
              </Module>
            ) : null
          }
        )}
        {labwareLocations.map(
          ({
            labwareLocation,
            definition,
            labwareChildren,
            wellFill,
            onLabwareClick,
          }) => {
            if (
              labwareLocation === 'offDeck' ||
              !('slotName' in labwareLocation)
            ) {
              return null
            }

            const slotPosition = getPositionFromSlotId(
              labwareLocation.slotName,
              deckDef
            )

            return slotPosition != null ? (
              <g
                key={labwareLocation.slotName}
                transform={`translate(${slotPosition[0].toString()},${slotPosition[1].toString()})`}
                cursor={onLabwareClick != null ? 'pointer' : ''}
              >
                <LabwareRender
                  definition={definition}
                  onLabwareClick={onLabwareClick}
                  wellFill={wellFill ?? undefined}
                />
                {labwareChildren}
              </g>
            ) : null
          }
        )}
        {showSlotLabels ? (
          <SlotLabels robotType={robotType} color={darkFill} />
        ) : null}
      </>
      {children}
    </RobotCoordinateSpace>
  )
}
