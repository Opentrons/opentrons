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
import { Module } from '../Module'
import { LabwareRender } from '../Labware'
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

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { TrashLocation } from '../Deck/FlexTrash'
import type { StagingAreaLocation } from './StagingAreaFixture'
import type { WasteChuteLocation } from './WasteChuteFixture'
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
    showSlotLabels = false,
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
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
    >
      {robotType === OT2_ROBOT_TYPE ? (
        <DeckFromData def={deckDef} layerBlocklist={deckLayerBlocklist} />
      ) : (
        <>
          {singleSlotFixtures.map(fixture => (
            <SingleSlotFixture
              key={fixture.fixtureId}
              cutoutLocation={fixture.fixtureLocation}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
              showExpansion={showExpansion}
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
          nestedLabwareWellFill,
          innerProps,
          moduleChildren,
          onLabwareClick,
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
      {children}
    </RobotCoordinateSpace>
  )
}
