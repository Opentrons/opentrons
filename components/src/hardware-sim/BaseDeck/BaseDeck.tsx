import { Fragment } from 'react'
import partition from 'lodash/partition'

import {
  FLEX_STACKER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getModuleDef,
  getModuleType,
  getPositionFromSlotId,
  HEATERSHAKER_MODULE_V1,
  inferModuleOrientationFromXCoordinate,
  MODULE_FIXTURES_BY_MODEL,
  MOVABLE_TRASH_CUTOUTS,
  OT2_ROBOT_TYPE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { DeckInfoLabel } from '../../molecules/DeckInfoLabel'
import { SlotLabels } from '../Deck'
import { DeckFromLayers } from '../Deck/DeckFromLayers'
import { FlexTrash } from '../Deck/FlexTrash'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import { LabwareRender } from '../Labware'
import { AlignLabwareToModule, Module } from '../Module'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { SingleSlotFixture } from './SingleSlotFixture'
import { StagingAreaFixture } from './StagingAreaFixture'
import { WasteChuteFixture } from './WasteChuteFixture'
import { WasteChuteStagingAreaFixture } from './WasteChuteStagingAreaFixture'

import type { ComponentProps, ReactNode } from 'react'
import type {
  CutoutFixtureId,
  DeckConfiguration,
  LabwareDefinition,
  LabwareLocation,
  ModuleLocation,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { TrashCutoutId } from '../Deck/FlexTrash'
import type { WellFill, WellGroup } from '../Labware'
import type { StagingAreaLocation } from './StagingAreaFixture'

export interface LabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition
  wellFill?: WellFill
  missingTips?: WellGroup
  /**
   * Additional children to render alongside this labware.
   * The SVG origin of these children is the front-left (-x,-y) corner of
   * the slot that the labware is in.
   */
  labwareChildren?: ReactNode
  onLabwareClick?: () => void
  highlight?: boolean
  highlightShadow?: boolean
  stacked?: boolean
}

export interface ModuleOnDeck {
  moduleModel: ModuleModel
  moduleLocation: ModuleLocation
  nestedLabwareDef?: LabwareDefinition | null
  nestedLabwareWellFill?: WellFill
  innerProps?: ComponentProps<typeof Module>['innerProps']
  /**
   * Additional children to render atop this module, after `nestedLabwareDef`.
   * The SVG origin of these children is the front-left (-x,-y) corner of the slot that
   * the module is in.
   */
  moduleChildren?: ReactNode
  onLabwareClick?: () => void
  highlightLabware?: boolean
  highlightShadowLabware?: boolean
  stacked?: boolean
  hopperLabware?: HopperLabwareProps
}
export interface HopperLabwareProps {
  hopperLabwareDef: LabwareDefinition | null
  hopperLabwareWellFill: WellFill
  hopperOnLabwareClick: () => void
  hopperHighlightLabware: boolean
  hopperStacked: boolean
}

// these ugly consts are unfortunately necessary as the hopper location exists
// outside of our deck definition so the render doesn't follow our normal conventions
export const STACKER_MODULE_Y_OFFSET = -6
// todo(mm, 2025-07-16): 17.5 mm is a by-eye adjustment that takes us from a little bit
// left of the hopper to inside the hopper. The fact that we were 17.5 mm left in the
// first place is weird, and suggests we're doing wrong math somewhere. A more normal
// thing to expect here would be starting at the extended shuttle position and needing
// an offset of hundreds of mm to go from there to inside the hopper.
export const STACKER_HOPPER_LABWARE_X_OFFSET = 17.5
export const STACKER_HOPPER_LABWARE_Y_OFFSET = 6
export const STACKER_DECK_VIEW_BOX_EXPANSION = 220

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
  children?: ReactNode
  showSlotLabels?: boolean
  /** whether to make wrapping svg tag animatable via @react-spring/web, defaults to false */
  animatedSVG?: boolean
  /** extra props to pass to svg tag */
  /** NOTE: typing as any because running into some TS issues with React-spring,
   * CSS Modules & Styled-components not playing together nicely
   */
  svgProps?: any
}

const LABWARE_OFFSET_DISPLAY_THRESHOLD = 2

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

  const [singleLocationModules, stackerModules] = partition(
    modulesOnDeck,
    module => getModuleType(module.moduleModel) !== FLEX_STACKER_MODULE_TYPE
  )

  return (
    <RobotCoordinateSpace
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${
        deckDef.cornerOffsetFromOrigin[1]
      } ${
        stackerModules.length > 0
          ? deckDef.dimensions[0] + STACKER_DECK_VIEW_BOX_EXPANSION
          : deckDef.dimensions[0]
      } ${deckDef.dimensions[1]}`}
      animated={animatedSVG}
      {...svgProps}
    >
      {robotType === OT2_ROBOT_TYPE ? (
        <DeckFromLayers
          robotType={robotType}
          layerBlocklist={deckLayerBlocklist}
        />
      ) : (
        <>
          {showSlotLabels ? (
            <SlotLabels
              robotType={robotType}
              color={COLORS.black90}
              show4thColumn={
                stagingAreaFixtures.length > 0 ||
                wasteChuteStagingAreaFixtures.length > 0 ||
                modulesOnDeck.findIndex(
                  module =>
                    module.moduleModel === 'absorbanceReaderV1' ||
                    module.moduleModel === 'flexStackerModuleV1'
                ) >= 0
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
            <Fragment key={fixture.cutoutId}>
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
            </Fragment>
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
        </>
      )}
      <>
        {/* render modules, nested labware, and overlays */}
        {singleLocationModules.map(
          ({
            moduleModel,
            moduleLocation,
            nestedLabwareDef,
            nestedLabwareWellFill,
            innerProps,
            moduleChildren,
            onLabwareClick,
            highlightLabware,
            highlightShadowLabware,
          }) => {
            const slotPosition = getPositionFromSlotId(
              moduleLocation.slotName,
              deckDef
            )
            const moduleDef = getModuleDef(moduleModel)
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
                targetDeckId={deckDef.otId}
                targetSlotId={moduleLocation.slotName}
                childrenPositioningMode="passThrough"
              >
                {nestedLabwareDef != null ? (
                  <AlignLabwareToModule
                    deckId={deckDef.otId}
                    slotId={moduleLocation.slotName}
                    moduleDefinition={moduleDef}
                    labwareDefinition={nestedLabwareDef}
                  >
                    <g cursor={onLabwareClick != null ? 'pointer' : ''}>
                      <LabwareRender
                        definition={nestedLabwareDef}
                        positioningMode="passThrough"
                        onLabwareClick={onLabwareClick}
                        wellFill={nestedLabwareWellFill}
                        shouldRotateAdapterOrientation={
                          inferModuleOrientationFromXCoordinate(
                            slotPosition[0]
                          ) === 'left' && moduleModel === HEATERSHAKER_MODULE_V1
                        }
                        highlight={highlightLabware}
                        highlightShadow={highlightShadowLabware}
                      />
                    </g>
                  </AlignLabwareToModule>
                ) : null}
                {moduleChildren}
              </Module>
            ) : null
          }
        )}
        {stackerModules.map(
          ({
            moduleModel,
            moduleLocation,
            nestedLabwareDef,
            nestedLabwareWellFill,
            innerProps,
            moduleChildren,
            onLabwareClick,
            highlightLabware,
            highlightShadowLabware,
          }) => {
            const stackerSlotName = getStackerLocationFromSlot(
              moduleLocation.slotName
            )
            const slotPosition = getPositionFromSlotId(stackerSlotName, deckDef)
            const moduleDef = getModuleDef(moduleModel)
            return slotPosition != null ? (
              <>
                <StagingAreaFixture
                  cutoutId={
                    `cutout${moduleLocation.slotName}` as StagingAreaLocation
                  }
                  deckDefinition={deckDef}
                  slotClipColor={darkFill}
                  fixtureBaseColor={lightFill}
                />
                <Module
                  key={`${moduleModel} ${moduleLocation.slotName}`}
                  def={moduleDef}
                  x={slotPosition[0]}
                  y={slotPosition[1] + STACKER_MODULE_Y_OFFSET}
                  orientation={inferModuleOrientationFromXCoordinate(
                    slotPosition[0]
                  )}
                  innerProps={innerProps}
                  targetDeckId={deckDef.otId}
                  targetSlotId={moduleLocation.slotName}
                  childrenPositioningMode="passThrough"
                >
                  {nestedLabwareDef != null ? (
                    <AlignLabwareToModule
                      // todo(mm, 2025-07-16): Investigate whether <AlignLabwareToModule> is correct to use in the face of
                      // STACKER_MODULE_Y_OFFSET / STACKER_HOPPER_LABWARE_X_OFFSET / STACKER_HOPPER_LABWARE_Y_OFFSET.
                      deckId={deckDef.otId}
                      slotId={moduleLocation.slotName}
                      moduleDefinition={moduleDef}
                      labwareDefinition={nestedLabwareDef}
                    >
                      <g
                        cursor={onLabwareClick != null ? 'pointer' : ''}
                        transform={`translate(${STACKER_HOPPER_LABWARE_X_OFFSET}, ${STACKER_HOPPER_LABWARE_Y_OFFSET})`}
                      >
                        <LabwareRender
                          definition={nestedLabwareDef}
                          positioningMode="passThrough"
                          onLabwareClick={onLabwareClick}
                          wellFill={nestedLabwareWellFill}
                          shouldRotateAdapterOrientation={
                            inferModuleOrientationFromXCoordinate(
                              slotPosition[0]
                            ) === 'left' &&
                            moduleModel === HEATERSHAKER_MODULE_V1
                          }
                          highlight={highlightLabware}
                          highlightShadow={highlightShadowLabware}
                        />
                      </g>
                    </AlignLabwareToModule>
                  ) : null}
                  {moduleChildren}
                </Module>
              </>
            ) : null
          }
        )}
        {/* render non-module labware and overlays */}
        {labwareOnDeck.map(
          ({
            labwareLocation,
            definition,
            labwareChildren,
            wellFill,
            missingTips,
            onLabwareClick,
            highlight,
            highlightShadow,
          }) => {
            if (
              labwareLocation === 'offDeck' ||
              labwareLocation === 'systemLocation' ||
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
                  positioningMode="offsetInSlot"
                  onLabwareClick={onLabwareClick}
                  wellFill={wellFill ?? undefined}
                  missingTips={missingTips}
                  highlight={highlight}
                  highlightShadow={highlightShadow}
                />
                {labwareChildren}
              </g>
            ) : null
          }
        )}
        {/* render stacked badge on module labware */}
        {modulesOnDeck.map(
          ({ moduleModel, moduleLocation, stacked = false }) => {
            const moduleDef = getModuleDef(moduleModel)
            const slotPosition = getPositionFromSlotId(
              moduleDef.moduleType === FLEX_STACKER_MODULE_TYPE
                ? getStackerLocationFromSlot(moduleLocation.slotName)
                : moduleLocation.slotName,
              deckDef
            )
            let {
              x: nestedLabwareOffsetX,
              y: nestedLabwareOffsetY,
            } = moduleDef.labwareOffset
            if (moduleDef.moduleType === FLEX_STACKER_MODULE_TYPE) {
              nestedLabwareOffsetX += STACKER_HOPPER_LABWARE_X_OFFSET
            }
            // labwareOffset values are more accurate than our SVG renderings, so ignore any deviations under a certain threshold
            const clampedLabwareOffsetX =
              Math.abs(nestedLabwareOffsetX) > LABWARE_OFFSET_DISPLAY_THRESHOLD
                ? nestedLabwareOffsetX
                : 0
            const clampedLabwareOffsetY =
              Math.abs(nestedLabwareOffsetY) > LABWARE_OFFSET_DISPLAY_THRESHOLD
                ? nestedLabwareOffsetY
                : 0
            // transform to be applied to children which render within the labware interfacing surface of the module
            const childrenTransform = `translate(${clampedLabwareOffsetX}, ${clampedLabwareOffsetY})`

            return slotPosition != null && stacked ? (
              <g
                key={`stacked_${moduleLocation.slotName}`}
                transform={`translate(${slotPosition[0].toString()},${slotPosition[1].toString()})`}
              >
                <g transform={childrenTransform}>
                  <StackedBadge />
                </g>
              </g>
            ) : null
          }
        )}
        {/* render stacked badge on non-module labware */}
        {labwareOnDeck.map(
          ({ labwareLocation, definition, stacked = false }) => {
            if (
              labwareLocation === 'offDeck' ||
              labwareLocation === 'systemLocation' ||
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

            return slotPosition != null && stacked ? (
              <g
                key={`stacked_${labwareLocation.slotName}`}
                transform={`translate(${slotPosition[0].toString()},${slotPosition[1].toString()})`}
              >
                <StackedBadge />
              </g>
            ) : null
          }
        )}
      </>
      {children}
    </RobotCoordinateSpace>
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

function getStackerLocationFromSlot(slotName: string): string {
  return `${slotName.charAt(0)}4`
}
