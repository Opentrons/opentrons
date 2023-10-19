import * as React from 'react'
import {
  RobotType,
  getDeckDefFromRobotType,
  ModuleModel,
  ModuleLocation,
  getModuleDef2,
  LabwareDefinition2,
  inferModuleOrientationFromXCoordinate,
  LabwareLocation,
  OT2_ROBOT_TYPE,
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { ModuleInformation } from '../Module/ModuleInformation'
import { Module } from '../Module'
import { LabwareInformation, LabwareRender } from '../Labware'
import { FlexTrash } from '../Deck/FlexTrash'
import { DeckFromData } from '../Deck/DeckFromData'
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

import type { DeckConfiguration, VectorOffset } from '@opentrons/shared-data'
import type { TrashLocation } from '../Deck/FlexTrash'
import type { StagingAreaLocation } from './StagingAreaFixture'
import type { WasteChuteLocation } from './WasteChuteFixture'

interface BaseDeckProps {
  robotType: RobotType
  labwareLocations: Array<{
    labwareLocation: LabwareLocation
    definition: LabwareDefinition2
    topLabwareId: string
    topLabwareDisplayName: string | null
    offsetVector?: VectorOffset
  }>
  moduleLocations: Array<{
    moduleModel: ModuleModel
    moduleLocation: ModuleLocation
    nestedLabwareDef?: LabwareDefinition2 | null
    innerProps?: React.ComponentProps<typeof Module>['innerProps']
    // props for labware information, subject to change as design refines deck map
    labwareInformation?: Omit<
      React.ComponentProps<typeof LabwareInformation>,
      'definition'
    >
    // props for module info/connection, subject to change as design refines deck map
    moduleInformation?: Omit<
      React.ComponentProps<typeof ModuleInformation>,
      'moduleDef'
    >
  }>
  deckConfig?: DeckConfiguration
  lightFill?: string
  darkFill?: string
  children?: React.ReactNode
}

export function BaseDeck(props: BaseDeckProps): JSX.Element {
  const {
    robotType,
    moduleLocations,
    labwareLocations,
    lightFill = COLORS.light1,
    darkFill = COLORS.darkGreyEnabled,
    // TODO(bh, 2023-10-09): remove deck config fixture for Flex after migration to v4
    // deckConfig = EXTENDED_DECK_CONFIG_FIXTURE,
    deckConfig = STANDARD_SLOT_DECK_CONFIG_FIXTURE,
    children,
  } = props
  const deckDef = getDeckDefFromRobotType(robotType)

  const singleSlotFixtures = deckConfig.filter(
    fixture => fixture.loadName === STANDARD_SLOT_LOAD_NAME
  )
  const stagingAreaFixtures = deckConfig.filter(
    fixture => fixture.loadName === STAGING_AREA_LOAD_NAME
  )
  const trashBinFixtures = deckConfig.filter(
    fixture => fixture.loadName === TRASH_BIN_LOAD_NAME
  )
  const wasteChuteFixtures = deckConfig.filter(
    fixture => fixture.loadName === WASTE_CHUTE_LOAD_NAME
  )

  return (
    <RobotCoordinateSpace
      height="400px"
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {robotType === OT2_ROBOT_TYPE ? (
        <DeckFromData def={deckDef} layerBlocklist={[]} />
      ) : (
        <>
          {singleSlotFixtures.map(fixture => (
            <SingleSlotFixture
              key={fixture.fixtureId}
              cutoutLocation={fixture.fixtureLocation}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
            />
          ))}
          {stagingAreaFixtures.map(fixture => (
            <StagingAreaFixture
              key={fixture.fixtureId}
              // TODO(bh, 2023-10-09): typeguard fixture location
              cutoutLocation={fixture.fixtureLocation as StagingAreaLocation}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
            />
          ))}
          {trashBinFixtures.map(fixture => (
            <React.Fragment key={fixture.fixtureId}>
              <SingleSlotFixture
                cutoutLocation={fixture.fixtureLocation}
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
              key={fixture.fixtureId}
              // TODO(bh, 2023-10-09): typeguard fixture location
              cutoutLocation={fixture.fixtureLocation as WasteChuteLocation}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
            />
          ))}
        </>
      )}
      {moduleLocations.map(
        ({
          moduleModel,
          moduleLocation,
          nestedLabwareDef,
          innerProps,
          labwareInformation,
          moduleInformation,
        }) => {
          const slotDef = deckDef.locations.orderedSlots.find(
            s => s.id === moduleLocation.slotName
          )
          const moduleDef = getModuleDef2(moduleModel)
          return slotDef != null ? (
            <Module
              key={`${moduleModel} ${slotDef.id}`}
              def={moduleDef}
              x={slotDef.position[0]}
              y={slotDef.position[1]}
              orientation={inferModuleOrientationFromXCoordinate(
                slotDef.position[0]
              )}
              innerProps={innerProps}
            >
              {moduleInformation != null ? (
                <ModuleInformation
                  moduleDef={moduleDef}
                  {...moduleInformation}
                />
              ) : null}
              {nestedLabwareDef != null ? (
                <>
                  <LabwareRender definition={nestedLabwareDef} />
                  {labwareInformation?.labwareId != null ? (
                    <LabwareInformation
                      definition={nestedLabwareDef}
                      labwareId={labwareInformation.labwareId}
                      displayName={labwareInformation.displayName}
                      offsetVector={labwareInformation.offsetVector}
                    />
                  ) : null}
                </>
              ) : null}
            </Module>
          ) : null
        }
      )}
      {labwareLocations.map(
        ({
          labwareLocation,
          definition,
          offsetVector,
          topLabwareId,
          topLabwareDisplayName,
        }) => {
          const slotDef = deckDef.locations.orderedSlots.find(
            s =>
              labwareLocation !== 'offDeck' &&
              'slotName' in labwareLocation &&
              s.id === labwareLocation.slotName
          )
          return slotDef != null ? (
            <g
              key={slotDef.id}
              transform={`translate(${slotDef.position[0]},${slotDef.position[1]})`}
            >
              <LabwareRender definition={definition} />
              <LabwareInformation
                definition={definition}
                labwareId={topLabwareId}
                displayName={topLabwareDisplayName}
                offsetVector={offsetVector}
              />
            </g>
          ) : null
        }
      )}
      <SlotLabels robotType={robotType} color={darkFill} />
      {children}
    </RobotCoordinateSpace>
  )
}
