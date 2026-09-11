import { Fragment } from 'react'

import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_FIXTURES,
  FLEX_STACKER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getModuleDef,
  getModuleType,
  getPositionFromSlotId,
  HEATERSHAKER_MODULE_V1,
  inferModuleOrientationFromXCoordinate,
  locationIsOffDeck,
  locationIsOnSlot,
  MODULE_FIXTURES_BY_MODEL,
  MOVABLE_TRASH_CUTOUTS,
  OT2_ROBOT_TYPE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  VACUUM_MODULE_TYPE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_FLEX_STACKER_FIXTURES,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_STAGING_AREA_FIXTURES,
} from '@opentrons/shared-data'

import {
  AlignToModuleChildSlot,
  CenterLabwareInModuleChildSlot,
  CenterLabwareInSlot,
  CURSOR_POINTER,
  FixedTrashText,
} from '../..'
import { COLORS } from '../../helix-design-system'
import { SlotLabels } from '../Deck'
import { DeckFromLayers } from '../Deck/DeckFromLayers'
import { FlexTrash } from '../Deck/FlexTrash'
import { LabwareRender } from '../Labware'
import { Module } from '../Module'
import { RobotCoordinateSpace } from '../RobotCoordinateSpace'
import { SingleSlotFixture } from './SingleSlotFixture'
import { StackedBadge } from './StackedBadge'
import { StagingAreaFixture } from './StagingAreaFixture'
import { WasteChuteFixture } from './WasteChuteFixture'
import { WasteChuteStagingAreaFixture } from './WasteChuteStagingAreaFixture'

import type { ComponentProps, ReactNode } from 'react'
import type {
  DeckConfiguration,
  LabwareDefinition,
  LabwareLocation,
  ModuleLocation,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { TrashCutoutId } from '../Deck/FlexTrash'
import type { WellFillByName, WellGroup } from '../Labware'
import type { StagingAreaLocation } from './StagingAreaFixture'

export interface LabwareOnDeck {
  labwareLocation: LabwareLocation
  definition: LabwareDefinition
  wellFill?: WellFillByName
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
  nestedLabwareDefsBottomToTop: LabwareDefinition[]
  nestedLabwareWellFill?: WellFillByName
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
  hopperLabwareWellFill: WellFillByName
  hopperOnLabwareClick: () => void
  hopperHighlightLabware: boolean
  hopperStacked: boolean
}

// these ugly consts are unfortunately necessary as the hopper location exists
// outside of our deck definition so the render doesn't follow our normal conventions
// todo(mm, 2025-07-16): 17.5 mm is a by-eye adjustment that takes us from a little bit
// left of the hopper to inside the hopper. The fact that we were 17.5 mm left in the
// first place is weird, and suggests we're doing wrong math somewhere. A more normal
// thing to expect here would be starting at the extended shuttle position and needing
// an offset of hundreds of mm to go from there to inside the hopper.
export const STACKER_HOPPER_LABWARE_X_OFFSET = 17.5
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

  const singleSlotFixtures = deckConfig.filter(fixture => {
    if (fixture.cutoutFixtureId == null) return false

    const isSingleSlotLike =
      SINGLE_SLOT_FIXTURES.includes(fixture.cutoutFixtureId) ||
      Object.values(MODULE_FIXTURES_BY_MODEL)
        .flat()
        .includes(fixture.cutoutFixtureId)

    const isFlexStacker = FLEX_STACKER_FIXTURES.includes(
      fixture.cutoutFixtureId
    )

    return isSingleSlotLike && !isFlexStacker
  })

  const stagingAreaFixtures = deckConfig.filter(
    fixture =>
      ((fixture.cutoutFixtureId === STAGING_AREA_RIGHT_SLOT_FIXTURE ||
        fixture.cutoutFixtureId ===
          STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE) &&
        STAGING_AREA_CUTOUTS.includes(fixture.cutoutId)) ||
      FLEX_STACKER_FIXTURES.includes(fixture.cutoutFixtureId)
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
  const wasteChuteStackerFixtures = deckConfig.filter(
    fixture =>
      fixture.cutoutFixtureId != null &&
      WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(fixture.cutoutFixtureId) &&
      fixture.cutoutId === WASTE_CHUTE_CUTOUT
  )

  const { singleLocationModules, stackerModules, vacuumModules } =
    modulesOnDeck.reduce<{
      singleLocationModules: ModuleOnDeck[]
      stackerModules: ModuleOnDeck[]
      vacuumModules: ModuleOnDeck[]
    }>(
      (acc, module) => {
        const moduleType = getModuleType(module.moduleModel)
        if (moduleType === FLEX_STACKER_MODULE_TYPE) {
          acc.stackerModules.push(module)
        } else if (moduleType === VACUUM_MODULE_TYPE) {
          acc.vacuumModules.push(module)
        } else {
          acc.singleLocationModules.push(module)
        }
        return acc
      },
      {
        singleLocationModules: [],
        stackerModules: [],
        vacuumModules: [],
      }
    )

  return (
    <RobotCoordinateSpace
      viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${
        deckDef.cornerOffsetFromOrigin[1]
      } ${
        [...stackerModules, ...vacuumModules].length > 0
          ? deckDef.dimensions[0] + STACKER_DECK_VIEW_BOX_EXPANSION
          : deckDef.dimensions[0]
      } ${deckDef.dimensions[1]}`}
      animated={animatedSVG}
      {...svgProps}
    >
      {robotType === OT2_ROBOT_TYPE ? (
        <>
          <DeckFromLayers
            robotType={robotType}
            layerBlocklist={deckLayerBlocklist}
          />
          <FixedTrashText />
        </>
      ) : (
        <>
          {showSlotLabels ? (
            <SlotLabels
              robotType={robotType}
              color={COLORS.black90}
              show4thColumn={
                stagingAreaFixtures.length > 0 ||
                wasteChuteStagingAreaFixtures.length > 0 ||
                modulesOnDeck.some(module => {
                  const moduleType = getModuleType(module.moduleModel)
                  return (
                    moduleType === ABSORBANCE_READER_TYPE ||
                    moduleType === FLEX_STACKER_MODULE_TYPE ||
                    moduleType === VACUUM_MODULE_TYPE
                  )
                })
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
        {stackerModules.map(
          ({
            moduleModel,
            moduleLocation,
            nestedLabwareDefsBottomToTop,
            nestedLabwareWellFill,
            innerProps,
            moduleChildren,
            onLabwareClick,
            highlightLabware,
            highlightShadowLabware,
          }) => {
            // enforce that module is a stacker
            if (getModuleType(moduleModel) !== FLEX_STACKER_MODULE_TYPE) {
              return null
            }
            const stackerSlotName = getStagingColumnSlotName(
              moduleLocation.slotName
            )
            const slotPosition = getPositionFromSlotId(stackerSlotName, deckDef)
            const moduleDef = getModuleDef(moduleModel)
            return slotPosition != null ? (
              <Fragment
                key={`stacker_${moduleModel}_${moduleLocation.slotName}`}
              >
                <StagingAreaFixture
                  cutoutId={
                    `cutout${moduleLocation.slotName}` as StagingAreaLocation
                  }
                  deckDefinition={deckDef}
                  slotClipColor={darkFill}
                  fixtureBaseColor={lightFill}
                />
                {wasteChuteStackerFixtures.map(fixture => {
                  if (
                    fixture.cutoutId === WASTE_CHUTE_CUTOUT &&
                    moduleLocation.slotName === 'D3'
                  ) {
                    return (
                      <WasteChuteFixture
                        key={fixture.cutoutId}
                        cutoutId={fixture.cutoutId}
                        deckDefinition={deckDef}
                        fixtureBaseColor={lightFill}
                        wasteChuteColor={mediumFill}
                      />
                    )
                  }
                })}
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
                  {nestedLabwareDefsBottomToTop.length > 0 ? (
                    <CenterLabwareInModuleChildSlot
                      deckId={deckDef.otId}
                      slotId={moduleLocation.slotName}
                      moduleDefinition={moduleDef}
                      labwareDefinition={nestedLabwareDefsBottomToTop[0]}
                    >
                      <g
                        cursor={onLabwareClick != null ? 'pointer' : ''}
                        transform={`translate(${STACKER_HOPPER_LABWARE_X_OFFSET}, 0)`}
                      >
                        <LabwareRender
                          definition={nestedLabwareDefsBottomToTop[0]}
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
                    </CenterLabwareInModuleChildSlot>
                  ) : null}
                  {moduleChildren}
                </Module>
              </Fragment>
            ) : null
          }
        )}
        {vacuumModules.map(
          ({
            moduleModel,
            moduleLocation,
            nestedLabwareDefsBottomToTop,
            nestedLabwareWellFill,
            innerProps,
            moduleChildren,
            onLabwareClick,
            highlightLabware,
            highlightShadowLabware,
          }) => {
            // enforce that module is a vacuum
            if (getModuleType(moduleModel) !== VACUUM_MODULE_TYPE) {
              return null
            }
            const slotPosition = getPositionFromSlotId(
              moduleLocation.slotName,
              deckDef
            )
            const moduleDef = getModuleDef(moduleModel)
            return slotPosition != null ? (
              <Fragment
                key={`vacuum_${moduleModel}_${moduleLocation.slotName}`}
              >
                <StagingAreaFixture
                  cutoutId={
                    `cutout${moduleLocation.slotName}` as StagingAreaLocation
                  }
                  deckDefinition={deckDef}
                  slotClipColor={darkFill}
                  fixtureBaseColor={lightFill}
                />
                {wasteChuteStackerFixtures.map(fixture => {
                  if (
                    fixture.cutoutId === WASTE_CHUTE_CUTOUT &&
                    moduleLocation.slotName === 'D3'
                  ) {
                    return (
                      <WasteChuteFixture
                        key={fixture.cutoutId}
                        cutoutId={fixture.cutoutId}
                        deckDefinition={deckDef}
                        fixtureBaseColor={lightFill}
                        wasteChuteColor={mediumFill}
                      />
                    )
                  }
                })}
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
                  {nestedLabwareDefsBottomToTop.length > 0 ? (
                    <CenterLabwareInModuleChildSlot
                      deckId={deckDef.otId}
                      slotId={moduleLocation.slotName}
                      moduleDefinition={moduleDef}
                      labwareDefinition={nestedLabwareDefsBottomToTop[0]}
                    >
                      <g cursor={onLabwareClick != null ? CURSOR_POINTER : ''}>
                        <LabwareRender
                          definition={nestedLabwareDefsBottomToTop[0]}
                          positioningMode="passThrough"
                          onLabwareClick={onLabwareClick}
                          wellFill={nestedLabwareWellFill}
                          highlight={highlightLabware}
                          highlightShadow={highlightShadowLabware}
                        />
                      </g>
                    </CenterLabwareInModuleChildSlot>
                  ) : null}
                  {moduleChildren}
                </Module>
              </Fragment>
            ) : null
          }
        )}
        {/* render modules, nested labware, and overlays */}
        {singleLocationModules.map(
          ({
            moduleModel,
            moduleLocation,
            nestedLabwareDefsBottomToTop,
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
                {nestedLabwareDefsBottomToTop.length > 0 ? (
                  <g cursor={onLabwareClick != null ? 'pointer' : ''}>
                    {nestedLabwareDefsBottomToTop.map((def, index) => (
                      <CenterLabwareInModuleChildSlot
                        key={`${index}_${def.parameters.loadName}`}
                        deckId={deckDef.otId}
                        slotId={moduleLocation.slotName}
                        moduleDefinition={moduleDef}
                        labwareDefinition={def}
                      >
                        <LabwareRender
                          definition={def}
                          positioningMode="passThrough"
                          onLabwareClick={onLabwareClick}
                          wellFill={
                            index === 0 ? nestedLabwareWellFill : undefined
                          }
                          shouldRotateAdapterOrientation={
                            inferModuleOrientationFromXCoordinate(
                              slotPosition[0]
                            ) === 'left' &&
                            moduleModel === HEATERSHAKER_MODULE_V1
                          }
                          highlight={highlightLabware}
                          highlightShadow={highlightShadowLabware}
                        />
                      </CenterLabwareInModuleChildSlot>
                    ))}
                  </g>
                ) : null}
                {moduleChildren}
              </Module>
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
              locationIsOffDeck(labwareLocation) ||
              !locationIsOnSlot(labwareLocation) ||
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
                <CenterLabwareInSlot definition={definition}>
                  <LabwareRender
                    definition={definition}
                    positioningMode="passThrough"
                    onLabwareClick={onLabwareClick}
                    wellFill={wellFill ?? undefined}
                    missingTips={missingTips}
                    highlight={highlight}
                    highlightShadow={highlightShadow}
                  />
                </CenterLabwareInSlot>
                {labwareChildren}
              </g>
            ) : null
          }
        )}
        {/* render stacked badge on module labware */}
        {modulesOnDeck.map(
          ({ moduleModel, moduleLocation, stacked = false }) => {
            const moduleDef = getModuleDef(moduleModel)
            const parentSlotName =
              moduleDef.moduleType === FLEX_STACKER_MODULE_TYPE
                ? getStagingColumnSlotName(moduleLocation.slotName)
                : moduleLocation.slotName
            const parentSlotPosition = getPositionFromSlotId(
              parentSlotName,
              deckDef
            )

            const xAdjustment =
              moduleDef.moduleType === FLEX_STACKER_MODULE_TYPE
                ? STACKER_HOPPER_LABWARE_X_OFFSET
                : 0

            return parentSlotPosition != null && stacked ? (
              <g
                key={`stacked_${moduleLocation.slotName}`}
                transform={`translate(${parentSlotPosition[0]},${parentSlotPosition[1]})`}
              >
                <AlignToModuleChildSlot
                  deckId={deckDef.otId}
                  slotId={parentSlotName}
                  moduleDefinition={moduleDef}
                >
                  <g transform={`translate(${xAdjustment}, 0)`}>
                    <StackedBadge />
                  </g>
                </AlignToModuleChildSlot>
              </g>
            ) : null
          }
        )}
        {/* render stacked badge on non-module labware */}
        {labwareOnDeck.map(
          ({ labwareLocation, definition, stacked = false }) => {
            if (
              locationIsOffDeck(labwareLocation) ||
              !locationIsOnSlot(labwareLocation) ||
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

/** Slot used as the deck SVG anchor for modules that span the right slot + column 4. */
function getStagingColumnSlotName(slotName: string): string {
  return `${slotName.charAt(0)}4`
}
