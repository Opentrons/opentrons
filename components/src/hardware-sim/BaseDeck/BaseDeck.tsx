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
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
} from '@opentrons/shared-data'

import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { Module } from '../Module'
import { LabwareRender } from '../Labware'
import { FlexTrash } from '../Deck/FlexTrash'
// import { DeckFromLayers } from '../Deck/DeckFromLayers'
import { SlotLabels } from '../Deck'
import { COLORS } from '../../ui-style-constants'

// import { Svg } from '../../primitives'
import { SingleSlotFixture } from './SingleSlotFixture'
import { StagingAreaFixture } from './StagingAreaFixture'
import { WasteChuteFixture } from './WasteChuteFixture'
import { WasteChuteStagingAreaFixture } from './WasteChuteStagingAreaFixture'

import type {
  DeckConfiguration,
  LabwareDefinition2,
  LabwareLocation,
  ModuleLocation,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { TrashCutoutId } from '../Deck/FlexTrash'
import type { StagingAreaLocation } from './StagingAreaFixture'
import type { WellFill } from '../Labware'

export interface LabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition2
  wellFill?: WellFill
  /** user defined name for this instance of the labware */
  displayName?: string | null
  /** generic prop to render self-positioned children for each labware */
  labwareChildren?: React.ReactNode
  onLabwareClick?: () => void
}

export interface ModuleOnDeck {
  moduleModel: ModuleModel
  moduleLocation: ModuleLocation
  nestedLabwareDef?: LabwareDefinition2 | null
  nestedLabwareWellFill?: WellFill
  /** user defined name for this instance of the nested labware */
  nestedLabwareDisplayName?: string | null
  innerProps?: React.ComponentProps<typeof Module>['innerProps']
  /** generic prop to render self-positioned children for each module */
  moduleChildren?: React.ReactNode
  onLabwareClick?: () => void
}
interface BaseDeckProps {
  deckConfig: DeckConfiguration
  robotType: RobotType
  labwareOnDeck?: LabwareOnDeck[]
  modulesOnDeck?: ModuleOnDeck[]
  deckLayerBlocklist?: string[]
  showExpansion?: boolean
  lightFill?: string
  mediumFill?: string
  darkFill?: string
  children?: React.ReactNode
  showSlotLabels?: boolean
  /** whether to make wrapping svg tag animatable via @react-spring/web, defaults to false */
  animatedSVG?: boolean
  /** extra props to pass to svg tag */
  svgProps?: any 
  /** React.ComponentProps<typeof Svg> */
}

export function BaseDeck(props: BaseDeckProps): JSX.Element {
  const {
    robotType,
    modulesOnDeck = [],
    labwareOnDeck = [],
    lightFill = COLORS.light1,
    mediumFill = COLORS.grey2,
    darkFill = COLORS.darkBlack70,
    deckLayerBlocklist = [],
    deckConfig,
    showExpansion = true,
    children,
    showSlotLabels = true,
    animatedSVG = false,
    svgProps = {},
  } = props
  const deckDef = getDeckDefFromRobotType(robotType)

  const singleSlotFixtures = deckConfig.filter(
    fixture =>
      fixture.cutoutFixtureId != null &&
      SINGLE_SLOT_FIXTURES.includes(fixture.cutoutFixtureId)
  )
  const stagingAreaFixtures = deckConfig.filter(
    fixture => fixture.cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE
  )
  const trashBinFixtures = deckConfig.filter(
    fixture => fixture.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
  )
  const wasteChuteOnlyFixtures = deckConfig.filter(
    fixture =>
      fixture.cutoutFixtureId != null &&
      WASTE_CHUTE_ONLY_FIXTURES.includes(fixture.cutoutFixtureId) &&
      fixture.cutoutId === WASTE_CHUTE_CUTOUT
  )
  const wasteChuteStagingAreaFixtures = deckConfig.filter(
    fixture =>
      fixture.cutoutFixtureId != null &&
      WASTE_CHUTE_STAGING_AREA_FIXTURES.includes(fixture.cutoutFixtureId) &&
      fixture.cutoutId === WASTE_CHUTE_CUTOUT
  )

  return (
    <RobotCoordinateSpace
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
      animated={animatedSVG}
      {...svgProps}
    >
      {robotType === OT2_ROBOT_TYPE ? (
        <p>HELLO WORLD</p>
      ) : (
        <>
          {showSlotLabels ? (
            <SlotLabels
              robotType={robotType}
              color={COLORS.darkBlackEnabled}
              show4thColumn={
                stagingAreaFixtures.length > 0 ||
                wasteChuteStagingAreaFixtures.length > 0
              }
            />
          ) : null}
          {singleSlotFixtures.map(fixture => (
            <SingleSlotFixture
              key={fixture.cutoutId}
              cutoutId={fixture.cutoutId}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
              showExpansion={showExpansion}
            />
          ))}
          {stagingAreaFixtures.map(fixture => (
            <StagingAreaFixture
              key={fixture.cutoutId}
              // TODO(bh, 2023-10-09): typeguard fixture location
              cutoutId={fixture.cutoutId as StagingAreaLocation}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
            />
          ))}
          {trashBinFixtures.map(fixture => (
            <React.Fragment key={fixture.cutoutId}>
              <SingleSlotFixture
                cutoutId={fixture.cutoutId}
                deckDefinition={deckDef}
                slotClipColor={COLORS.transparent}
                fixtureBaseColor={lightFill}
              />
              <FlexTrash
                robotType={robotType}
                trashIconColor={lightFill}
                // TODO(bh, 2023-10-09): typeguard fixture location
                trashCutoutId={fixture.cutoutId as TrashCutoutId}
                backgroundColor={mediumFill}
              />
            </React.Fragment>
          ))}
          {wasteChuteOnlyFixtures.map(fixture => (
            <WasteChuteFixture
              key={fixture.cutoutId}
              // TODO(bh, 2023-10-09): typeguard fixture location
              cutoutId={fixture.cutoutId as typeof WASTE_CHUTE_CUTOUT}
              deckDefinition={deckDef}
              fixtureBaseColor={lightFill}
              wasteChuteColor={mediumFill}
            />
          ))}
          {wasteChuteStagingAreaFixtures.map(fixture => (
            <WasteChuteStagingAreaFixture
              key={fixture.cutoutId}
              // TODO(bh, 2023-10-09): typeguard fixture location
              cutoutId={fixture.cutoutId as typeof WASTE_CHUTE_CUTOUT}
              deckDefinition={deckDef}
              slotClipColor={darkFill}
              fixtureBaseColor={lightFill}
              wasteChuteColor={mediumFill}
            />
          ))}
        </>
      )}
      <>
        {modulesOnDeck.map(
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
        {labwareOnDeck.map(
          ({
            labwareLocation,
            definition,
            labwareChildren,
            wellFill,
            onLabwareClick,
          }) => {
            if (
              labwareLocation === 'offDeck' ||
              !('slotName' in labwareLocation) ||
              // for legacy protocols that list fixed trash as a labware, do not render
              definition.parameters.loadName ===
                'opentrons_1_trash_3200ml_fixed'
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
      </>
      {children}
    </RobotCoordinateSpace>
  )
}
