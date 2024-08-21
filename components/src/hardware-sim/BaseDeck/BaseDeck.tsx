import * as React from 'react'

import {
  getDeckDefFromRobotType,
  getModuleDef2,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  OT2_ROBOT_TYPE,
  MOVABLE_TRASH_CUTOUTS,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
  HEATERSHAKER_MODULE_V1,
  MODULE_FIXTURES_BY_MODEL,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
} from '@opentrons/shared-data'

import { DeckInfoLabel } from '../../molecules/DeckInfoLabel'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { Module } from '../Module'
import { LabwareRender } from '../Labware'
import { FlexTrash } from '../Deck/FlexTrash'
import { DeckFromLayers } from '../Deck/DeckFromLayers'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import { SlotLabels } from '../Deck'
import { COLORS } from '../../helix-design-system'

import { SingleSlotFixture } from './SingleSlotFixture'
import { StagingAreaFixture } from './StagingAreaFixture'
import { WasteChuteFixture } from './WasteChuteFixture'
import { WasteChuteStagingAreaFixture } from './WasteChuteStagingAreaFixture'

import type { Svg } from '../../primitives'
import type {
  CutoutFixtureId,
  DeckConfiguration,
  LabwareDefinition2,
  LabwareLocation,
  ModuleLocation,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { TrashCutoutId } from '../Deck/FlexTrash'
import type { StagingAreaLocation } from './StagingAreaFixture'
import type { WellFill, WellGroup } from '../Labware'

export interface LabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition2
  wellFill?: WellFill
  missingTips?: WellGroup
  /** generic prop to render self-positioned children for each labware */
  labwareChildren?: React.ReactNode
  onLabwareClick?: () => void
  highlight?: boolean
  stacked?: boolean
}

export interface ModuleOnDeck {
  moduleModel: ModuleModel
  moduleLocation: ModuleLocation
  nestedLabwareDef?: LabwareDefinition2 | null
  nestedLabwareWellFill?: WellFill
  innerProps?: React.ComponentProps<typeof Module>['innerProps']
  /** generic prop to render self-positioned children for each module */
  moduleChildren?: React.ReactNode
  onLabwareClick?: () => void
  highlightLabware?: boolean
  stacked?: boolean
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
  svgProps?: React.ComponentProps<typeof Svg>
}

export function BaseDeck(props: BaseDeckProps): JSX.Element {
  const {
    robotType,
    modulesOnDeck = [],
    labwareOnDeck = [],
    lightFill = COLORS.grey30,
    mediumFill = COLORS.grey50,
    darkFill = COLORS.grey60,
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
      (SINGLE_SLOT_FIXTURES.includes(fixture.cutoutFixtureId) ||
        // If module fixture is loaded, still visualize singleSlotFixture underneath for consistency
        Object.entries(MODULE_FIXTURES_BY_MODEL)
          .reduce<CutoutFixtureId[]>(
            (acc, [_model, fixtures]) => [...acc, ...fixtures],
            []
          )
          .includes(fixture.cutoutFixtureId))
  )
  const stagingAreaFixtures = deckConfig.filter(
    fixture =>
      (fixture.cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE ||
        fixture.cutoutFixtureId ===
          STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE) &&
      STAGING_AREA_CUTOUTS.includes(fixture.cutoutId)
  )
  const trashBinFixtures = deckConfig.filter(
    fixture =>
      fixture.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE &&
      MOVABLE_TRASH_CUTOUTS.includes(fixture.cutoutId)
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
        <OT2Deck
          robotType={robotType}
          deckLayerBlocklist={deckLayerBlocklist}
          labwareOnDeck={labwareOnDeck}
          modulesOnDeck={modulesOnDeck}
        />
      ) : (
        <>
          {showSlotLabels ? (
            <SlotLabels
              robotType={robotType}
              color={COLORS.black90}
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
                trashCutoutId={fixture.cutoutId as TrashCutoutId}
                backgroundColor={mediumFill}
              />
            </React.Fragment>
          ))}
          {wasteChuteOnlyFixtures.map(fixture => {
            if (fixture.cutoutId === WASTE_CHUTE_CUTOUT) {
              return (
                <WasteChuteFixture
                  key={fixture.cutoutId}
                  cutoutId={fixture.cutoutId}
                  deckDefinition={deckDef}
                  fixtureBaseColor={lightFill}
                  wasteChuteColor={mediumFill}
                />
              )
            } else {
              return null
            }
          })}
          {wasteChuteStagingAreaFixtures.map(fixture => {
            if (fixture.cutoutId === WASTE_CHUTE_CUTOUT) {
              return (
                <WasteChuteStagingAreaFixture
                  key={fixture.cutoutId}
                  cutoutId={fixture.cutoutId}
                  deckDefinition={deckDef}
                  slotClipColor={darkFill}
                  fixtureBaseColor={lightFill}
                  wasteChuteColor={mediumFill}
                />
              )
            } else {
              return null
            }
          })}
          {modulesOnDeck.map(
            ({
              moduleModel,
              moduleLocation,
              nestedLabwareDef,
              nestedLabwareWellFill,
              innerProps,
              moduleChildren,
              onLabwareClick,
              highlightLabware,
              stacked = false,
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
                      shouldRotateAdapterOrientation={
                        inferModuleOrientationFromXCoordinate(
                          slotPosition[0]
                        ) === 'left' && moduleModel === HEATERSHAKER_MODULE_V1
                      }
                      highlight={highlightLabware}
                    />
                  ) : null}
                  {moduleChildren}
                  {stacked ? <StackedBadge /> : null}
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
              missingTips,
              onLabwareClick,
              highlight,
              stacked = false,
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
                    missingTips={missingTips}
                    highlight={highlight}
                  />
                  {labwareChildren}
                  {stacked ? <StackedBadge /> : null}
                </g>
              ) : null
            }
          )}
        </>
      )}
      {children}
    </RobotCoordinateSpace>
  )
}

function OT2Deck(
  props: Pick<
    BaseDeckProps,
    'robotType' | 'modulesOnDeck' | 'labwareOnDeck' | 'deckLayerBlocklist'
  >
): JSX.Element {
  const {
    robotType,
    modulesOnDeck = [],
    labwareOnDeck = [],
    deckLayerBlocklist = [],
  } = props

  const deckDef = getDeckDefFromRobotType(robotType)

  /**
   * TODO(bh, 2024-08-20):
   * Unlike HTML elements, SVGs layer according to DOM render order. To layer a labware
   * with a top-right stacked badge that occludes another labware, which occurs as an
   * OT-2-only artifact of current stacked labware designs, we need to render SVGs
   * such that slots with badges render later in the DOM than top- and right-adjacent slots.
   *
   * For the OT-2, as an emergent property of deck map numbering this can be achieved by
   * sorting modules/labware in reverse numerical order, 11 -> 10 -> ... -> 1.
   *
   * As a means of layering SVG renderings on top of an adjacent labware, this "escape hatch"
   * should only be done once - to programmatically occlude an adjacent labware again will
   * require changing the BaseDeck approach to labware SVG rendering layers.
   */
  const deckItems: Array<ModuleOnDeck | LabwareOnDeck> = [
    ...modulesOnDeck,
    ...labwareOnDeck,
  ]

  const filteredDeckItems = deckItems.filter(
    item =>
      'moduleLocation' in item ||
      (item.labwareLocation !== 'offDeck' && 'slotName' in item.labwareLocation)
  )

  const sortedDeckItems = filteredDeckItems.sort((a, b) => {
    let locationA = 0
    if ('moduleLocation' in a) {
      locationA = Number(a.moduleLocation.slotName)
    } else if (
      a.labwareLocation !== 'offDeck' &&
      'slotName' in a.labwareLocation
    ) {
      locationA = Number(a.labwareLocation.slotName)
    }

    let locationB = 0
    if ('moduleLocation' in b) {
      locationB = Number(b.moduleLocation.slotName)
    } else if (
      b.labwareLocation !== 'offDeck' &&
      'slotName' in b.labwareLocation
    ) {
      locationB = Number(b.labwareLocation.slotName)
    }

    return locationA < locationB ? 1 : -1
  })

  console.log('deckItems', deckItems, 'sortedDeckItems', sortedDeckItems)

  return (
    <>
      <DeckFromLayers
        robotType={robotType}
        layerBlocklist={deckLayerBlocklist}
      />
      {sortedDeckItems.map(item => {
        if ('moduleModel' in item) {
          const {
            moduleModel,
            moduleLocation,
            nestedLabwareDef,
            nestedLabwareWellFill,
            innerProps,
            moduleChildren,
            onLabwareClick,
            highlightLabware,
            stacked = false,
          } = item

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
                  shouldRotateAdapterOrientation={
                    inferModuleOrientationFromXCoordinate(slotPosition[0]) ===
                      'left' && moduleModel === HEATERSHAKER_MODULE_V1
                  }
                  highlight={highlightLabware}
                />
              ) : null}
              {moduleChildren}
              {stacked ? <StackedBadge /> : null}
            </Module>
          ) : null
        } else {
          const {
            labwareLocation,
            definition,
            labwareChildren,
            wellFill,
            missingTips,
            onLabwareClick,
            highlight,
            stacked = false,
          } = item

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
                missingTips={missingTips}
                highlight={highlight}
              />
              {labwareChildren}
              {stacked ? <StackedBadge /> : null}
            </g>
          ) : null
        }
      })}
    </>
  )
}

function StackedBadge(): JSX.Element {
  return (
    <RobotCoordsForeignObject height="2.5rem" width="2.5rem" x={113} y={53}>
      <DeckInfoLabel
        height="1.25rem"
        svgSize="0.875rem"
        highlight
        iconName="stacked"
      />
    </RobotCoordsForeignObject>
  )
}
