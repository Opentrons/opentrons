import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import compact from 'lodash/compact'
import values from 'lodash/values'
import {
  COLORS,
  DeckFromLayers,
  FlexTrash,
  Module,
  RobotCoordinateSpaceWithRef,
  SingleSlotFixture,
  StagingAreaFixture,
  useOnClickOutside,
  WasteChuteFixture,
  WasteChuteStagingAreaFixture,
} from '@opentrons/components'
import { MODULES_WITH_COLLISION_ISSUES } from '@opentrons/step-generation'
import {
  FLEX_ROBOT_TYPE,
  getAddressableAreaFromSlotId,
  getDeckDefFromRobotType,
  getLabwareHasQuirk,
  getModuleDef2,
  getModuleDisplayName,
  getPositionFromSlotId,
  inferModuleOrientationFromSlot,
  inferModuleOrientationFromXCoordinate,
  isAddressableAreaStandardSlot,
  OT2_ROBOT_TYPE,
  STAGING_AREA_CUTOUTS,
  THERMOCYCLER_MODULE_TYPE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { SPAN7_8_10_11_SLOT } from '../../constants'
import { selectors as labwareDefSelectors } from '../../labware-defs'

import { selectors as featureFlagSelectors } from '../../feature-flags'
import { getStagingAreaAddressableAreas } from '../../utils'
import { getSlotIdsBlockedBySpanning, getSlotIsEmpty } from '../../step-forms'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { getSelectedTerminalItemId } from '../../ui/steps'
import { getRobotType } from '../../file-data/selectors'
import { BrowseLabwareModal } from '../labware'
import { SlotWarning } from './SlotWarning'
import { LabwareOnDeck } from './LabwareOnDeck'
import {
  AdapterControls,
  SlotControls,
  LabwareControls,
} from './LabwareOverlays'
import { FlexModuleTag } from './FlexModuleTag'
import { Ot2ModuleTag } from './Ot2ModuleTag'
import { SlotLabels } from './SlotLabels'
import { getHasGen1MultiChannelPipette, getSwapBlocked } from './utils'

import type {
  AdditionalEquipmentEntity,
  ModuleTemporalProperties,
} from '@opentrons/step-generation'
import type { StagingAreaLocation, TrashCutoutId } from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutFixture,
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { TerminalItemId } from '../../steplist'
import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../step-forms'

import styles from './DeckSetup.module.css'

export const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

const OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

interface ContentsProps {
  activeDeckSetup: InitialDeckSetup
  selectedTerminalItemId?: TerminalItemId | null
  showGen1MultichannelCollisionWarnings: boolean
  deckDef: DeckDefinition
  robotType: RobotType
  stagingAreaCutoutIds: CutoutId[]
  trashSlot: string | null
}

const lightFill = COLORS.grey35
const darkFill = COLORS.grey60

export const DeckSetupContents = (props: ContentsProps): JSX.Element => {
  const {
    activeDeckSetup,
    showGen1MultichannelCollisionWarnings,
    deckDef,
    robotType,
    trashSlot,
    stagingAreaCutoutIds,
  } = props
  // NOTE: handling module<>labware compat when moving labware to empty module
  // is handled by SlotControls.
  // But when swapping labware when at least one is on a module, we need to be aware
  // of not only what labware is being dragged, but also what labware is **being
  // hovered over**. The intrinsic state of `react-dnd` is not designed to handle that.
  // So we need to use our own state here to determine
  // whether swapping will be blocked due to labware<>module compat:
  const [hoveredLabware, setHoveredLabware] = React.useState<
    LabwareOnDeckType | null | undefined
  >(null)
  const [draggedLabware, setDraggedLabware] = React.useState<
    LabwareOnDeckType | null | undefined
  >(null)

  const customLabwareDefs = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const swapBlocked = getSwapBlocked({
    hoveredLabware,
    draggedLabware,
    modulesById: activeDeckSetup.modules,
    customLabwareDefs,
  })

  const handleHoverEmptySlot = React.useCallback(() => {
    setHoveredLabware(null)
  }, [])

  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanning(activeDeckSetup)

  const allLabware: LabwareOnDeckType[] = Object.keys(
    activeDeckSetup.labware
  ).reduce<LabwareOnDeckType[]>((acc, labwareId) => {
    const labware = activeDeckSetup.labware[labwareId]
    return getLabwareHasQuirk(labware.def, 'fixedTrash')
      ? acc
      : [...acc, labware]
  }, [])

  const allModules: ModuleOnDeck[] = values(activeDeckSetup.modules)

  // NOTE: naively hard-coded to show warning north of slots 1 or 3 when occupied by any module
  const multichannelWarningSlotIds: AddressableAreaName[] = showGen1MultichannelCollisionWarnings
    ? compact([
        allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '1' &&
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        )
          ? deckDef.locations.addressableAreas.find(s => s.id === '4')?.id
          : null,
        allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '3' &&
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        )
          ? deckDef.locations.addressableAreas.find(s => s.id === '6')?.id
          : null,
      ])
    : []

  return (
    <>
      {/* all modules */}
      {allModules.map(moduleOnDeck => {
        const slotId =
          moduleOnDeck.slot === SPAN7_8_10_11_SLOT ? '7' : moduleOnDeck.slot

        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        if (slotPosition == null) {
          console.warn(`no slot ${slotId} for module ${moduleOnDeck.id}`)
          return null
        }
        const moduleDef = getModuleDef2(moduleOnDeck.model)

        const getModuleInnerProps = (
          moduleState: ModuleTemporalProperties['moduleState']
        ): React.ComponentProps<typeof Module>['innerProps'] => {
          if (moduleState.type === THERMOCYCLER_MODULE_TYPE) {
            let lidMotorState = 'unknown'
            if (moduleState.lidOpen === true) {
              lidMotorState = 'open'
            } else if (moduleState.lidOpen === false) {
              lidMotorState = 'closed'
            }
            return {
              lidMotorState,
              blockTargetTemp: moduleState.blockTargetTemp,
            }
          } else if (
            'targetTemperature' in moduleState &&
            moduleState.type === 'temperatureModuleType'
          ) {
            return {
              targetTemperature: moduleState.targetTemperature,
            }
          } else if ('targetTemp' in moduleState) {
            return {
              targetTemp: moduleState.targetTemp,
            }
          }
        }
        const labwareLoadedOnModule = allLabware.find(
          lw => lw.slot === moduleOnDeck.id
        )
        const shouldHideChildren =
          moduleOnDeck.moduleState.type === THERMOCYCLER_MODULE_TYPE &&
          moduleOnDeck.moduleState.lidOpen === false
        const labwareInterfaceBoundingBox = {
          xDimension: moduleDef.dimensions.labwareInterfaceXDimension ?? 0,
          yDimension: moduleDef.dimensions.labwareInterfaceYDimension ?? 0,
          zDimension: 0,
        }

        const moduleOrientation = inferModuleOrientationFromSlot(
          moduleOnDeck.slot
        )

        const isAdapter = labwareLoadedOnModule?.def.allowedRoles?.includes(
          'adapter'
        )
        return (
          <Module
            key={moduleOnDeck.slot}
            x={slotPosition[0]}
            y={slotPosition[1]}
            def={moduleDef}
            orientation={inferModuleOrientationFromXCoordinate(slotPosition[0])}
            innerProps={getModuleInnerProps(moduleOnDeck.moduleState)}
            targetSlotId={slotId}
            targetDeckId={deckDef.otId}
          >
            {labwareLoadedOnModule != null && !shouldHideChildren ? (
              <>
                <LabwareOnDeck
                  x={0}
                  y={0}
                  labwareOnDeck={labwareLoadedOnModule}
                />
                {isAdapter ? (
                  <AdapterControls
                    allLabware={allLabware}
                    onDeck={false}
                    labwareId={labwareLoadedOnModule.id}
                    key={moduleOnDeck.slot}
                    slotPosition={[0, 0, 0]} // Module Component already handles nested positioning
                    slotBoundingBox={labwareInterfaceBoundingBox}
                    selectedTerminalItemId={props.selectedTerminalItemId}
                    handleDragHover={handleHoverEmptySlot}
                  />
                ) : (
                  <LabwareControls
                    slotPosition={[0, 0, 0]} // Module Component already handles nested positioning
                    setHoveredLabware={setHoveredLabware}
                    setDraggedLabware={setDraggedLabware}
                    swapBlocked={
                      swapBlocked &&
                      (labwareLoadedOnModule.id === hoveredLabware?.id ||
                        labwareLoadedOnModule.id === draggedLabware?.id)
                    }
                    labwareOnDeck={labwareLoadedOnModule}
                    selectedTerminalItemId={props.selectedTerminalItemId}
                  />
                )}
              </>
            ) : null}

            {labwareLoadedOnModule == null &&
            !shouldHideChildren &&
            !isAdapter ? (
              <SlotControls
                key={moduleOnDeck.slot}
                slotPosition={[0, 0, 0]} // Module Component already handles nested positioning
                slotBoundingBox={labwareInterfaceBoundingBox}
                selectedTerminalItemId={props.selectedTerminalItemId}
                moduleType={moduleOnDeck.type}
                handleDragHover={handleHoverEmptySlot}
                slotId={moduleOnDeck.id}
              />
            ) : null}
            {robotType === FLEX_ROBOT_TYPE ? (
              <FlexModuleTag
                dimensions={moduleDef.dimensions}
                displayName={getModuleDisplayName(moduleOnDeck.model)}
              />
            ) : (
              <Ot2ModuleTag
                orientation={moduleOrientation}
                dimensions={moduleDef.dimensions}
                model={moduleOnDeck.model}
              />
            )}
          </Module>
        )
      })}

      {/* on-deck warnings */}
      {multichannelWarningSlotIds.map(slotId => {
        const slotPosition = getPositionFromSlotId(slotId, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(slotId, deckDef)
          ?.boundingBox
        return slotPosition != null && slotBoundingBox != null ? (
          <SlotWarning
            key={slotId}
            warningType="gen1multichannel"
            x={slotPosition[0]}
            y={slotPosition[1]}
            xDimension={slotBoundingBox.xDimension}
            yDimension={slotBoundingBox.yDimension}
            orientation={inferModuleOrientationFromSlot(slotId)}
          />
        ) : null
      })}

      {/* SlotControls for all empty deck */}
      {deckDef.locations.addressableAreas
        .filter(addressableArea => {
          const stagingAreaAddressableAreas = getStagingAreaAddressableAreas(
            stagingAreaCutoutIds
          )
          const addressableAreas =
            isAddressableAreaStandardSlot(addressableArea.id, deckDef) ||
            stagingAreaAddressableAreas.includes(addressableArea.id)
          return (
            addressableAreas &&
            !slotIdsBlockedBySpanning.includes(addressableArea.id) &&
            getSlotIsEmpty(activeDeckSetup, addressableArea.id) &&
            addressableArea.id !== trashSlot
          )
        })
        .map(addressableArea => {
          return (
            <SlotControls
              key={addressableArea.id}
              slotPosition={getPositionFromSlotId(addressableArea.id, deckDef)}
              slotBoundingBox={addressableArea.boundingBox}
              slotId={addressableArea.id}
              selectedTerminalItemId={props.selectedTerminalItemId}
              // Module slots' ids reference their parent module
              moduleType={
                activeDeckSetup.modules[addressableArea.id]?.type ?? null
              }
              handleDragHover={handleHoverEmptySlot}
            />
          )
        })}

      {/* all labware on deck NOT those in modules */}
      {allLabware.map(labware => {
        if (
          labware.slot === 'offDeck' ||
          allModules.some(m => m.id === labware.slot) ||
          allLabware.some(lab => lab.id === labware.slot)
        )
          return null

        const slotPosition = getPositionFromSlotId(labware.slot, deckDef)
        const slotBoundingBox = getAddressableAreaFromSlotId(
          labware.slot,
          deckDef
        )?.boundingBox
        if (slotPosition == null || slotBoundingBox == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        const labwareIsAdapter = labware.def.allowedRoles?.includes('adapter')
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <g>
              {labwareIsAdapter ? (
                <AdapterControls
                  allLabware={allLabware}
                  onDeck={true}
                  labwareId={labware.id}
                  key={labware.slot}
                  slotPosition={slotPosition}
                  slotBoundingBox={slotBoundingBox}
                  selectedTerminalItemId={props.selectedTerminalItemId}
                  handleDragHover={handleHoverEmptySlot}
                />
              ) : (
                <LabwareControls
                  slotPosition={slotPosition}
                  setHoveredLabware={setHoveredLabware}
                  setDraggedLabware={setDraggedLabware}
                  swapBlocked={
                    swapBlocked &&
                    (labware.id === hoveredLabware?.id ||
                      labware.id === draggedLabware?.id)
                  }
                  labwareOnDeck={labware}
                  selectedTerminalItemId={props.selectedTerminalItemId}
                />
              )}
            </g>
          </React.Fragment>
        )
      })}

      {/* all adapters on deck and not on module  */}
      {allLabware.map(labware => {
        if (
          allModules.some(m => m.id === labware.slot) ||
          labware.slot === 'offDeck'
        )
          return null
        if (
          deckDef.locations.addressableAreas.some(
            addressableArea => addressableArea.id === labware.slot
          )
        ) {
          return null
        }
        const slotForOnTheDeck = allLabware.find(lab => lab.id === labware.slot)
          ?.slot
        const slotForOnMod = allModules.find(mod => mod.id === slotForOnTheDeck)
          ?.slot
        let slotPosition = null
        if (slotForOnMod != null) {
          slotPosition = getPositionFromSlotId(slotForOnMod, deckDef)
        } else if (slotForOnTheDeck != null) {
          slotPosition = getPositionFromSlotId(slotForOnTheDeck, deckDef)
        }
        if (slotPosition == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slotPosition[0]}
              y={slotPosition[1]}
              labwareOnDeck={labware}
            />
            <g>
              <LabwareControls
                slotPosition={slotPosition}
                setHoveredLabware={setHoveredLabware}
                setDraggedLabware={setDraggedLabware}
                swapBlocked={
                  swapBlocked &&
                  (labware.id === hoveredLabware?.id ||
                    labware.id === draggedLabware?.id)
                }
                labwareOnDeck={labware}
                selectedTerminalItemId={props.selectedTerminalItemId}
              />
            </g>
          </React.Fragment>
        )
      })}
    </>
  )
}

export const DeckSetup = (): JSX.Element => {
  const drilledDown =
    useSelector(labwareIngredSelectors.getDrillDownLabwareId) != null
  const selectedTerminalItemId = useSelector(getSelectedTerminalItemId)
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const _disableCollisionWarnings = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const trash = Object.values(activeDeckSetup.additionalEquipmentOnDeck).find(
    ae => ae.name === 'trashBin'
  )

  const trashSlot = trash?.location
  const robotType = useSelector(getRobotType)
  const dispatch = useDispatch()

  const _hasGen1MultichannelPipette = React.useMemo(
    () => getHasGen1MultiChannelPipette(activeDeckSetup.pipettes),
    [activeDeckSetup.pipettes]
  )
  const showGen1MultichannelCollisionWarnings =
    !_disableCollisionWarnings && _hasGen1MultichannelPipette

  const deckDef = React.useMemo(() => getDeckDefFromRobotType(robotType), [])
  const wrapperRef: React.RefObject<HTMLDivElement> = useOnClickOutside({
    onClickOutside: () => {
      if (drilledDown) dispatch(labwareIngredActions.drillUpFromLabware())
    },
  })
  const trashBinFixtures = [
    {
      cutoutId: trash?.location as CutoutId,
      cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    },
  ]
  const wasteChuteFixtures = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      WASTE_CHUTE_CUTOUT.includes(aE.location as CutoutId) &&
      aE.name === 'wasteChute'
  )
  const stagingAreaFixtures: AdditionalEquipmentEntity[] = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea'
  )

  const wasteChuteStagingAreaFixtures = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(
    aE =>
      STAGING_AREA_CUTOUTS.includes(aE.location as CutoutId) &&
      aE.name === 'stagingArea' &&
      aE.location === WASTE_CHUTE_CUTOUT &&
      wasteChuteFixtures.length > 0
  )

  const hasWasteChute =
    wasteChuteFixtures.length > 0 || wasteChuteStagingAreaFixtures.length > 0

  const filteredAddressableAreas = deckDef.locations.addressableAreas.filter(
    aa => isAddressableAreaStandardSlot(aa.id, deckDef)
  )
  return (
    <div className={styles.deck_row}>
      {drilledDown && <BrowseLabwareModal />}

      <div ref={wrapperRef} className={styles.deck_wrapper}>
        <RobotCoordinateSpaceWithRef
          height="100%"
          deckDef={deckDef}
          viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${
            hasWasteChute
              ? deckDef.cornerOffsetFromOrigin[1] - 30
              : deckDef.cornerOffsetFromOrigin[1]
          } ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
        >
          {() => (
            <>
              {robotType === OT2_ROBOT_TYPE ? (
                <DeckFromLayers
                  robotType={robotType}
                  layerBlocklist={OT2_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
                />
              ) : (
                <>
                  {filteredAddressableAreas.map(addressableArea => {
                    const cutoutId = getCutoutIdForAddressableArea(
                      addressableArea.id,
                      deckDef.cutoutFixtures
                    )
                    return cutoutId != null ? (
                      <SingleSlotFixture
                        key={addressableArea.id}
                        cutoutId={cutoutId}
                        deckDefinition={deckDef}
                        slotClipColor={darkFill}
                        showExpansion={cutoutId === 'cutoutA1'}
                        fixtureBaseColor={lightFill}
                      />
                    ) : null
                  })}
                  {stagingAreaFixtures.map(fixture => (
                    <StagingAreaFixture
                      key={fixture.id}
                      cutoutId={fixture.location as StagingAreaLocation}
                      deckDefinition={deckDef}
                      slotClipColor={darkFill}
                      fixtureBaseColor={lightFill}
                    />
                  ))}
                  {trash != null
                    ? trashBinFixtures.map(({ cutoutId }) =>
                        cutoutId != null ? (
                          <React.Fragment key={cutoutId}>
                            <SingleSlotFixture
                              cutoutId={cutoutId}
                              deckDefinition={deckDef}
                              slotClipColor={COLORS.transparent}
                              fixtureBaseColor={lightFill}
                            />
                            <FlexTrash
                              robotType={robotType}
                              trashIconColor={lightFill}
                              trashCutoutId={cutoutId as TrashCutoutId}
                              backgroundColor={COLORS.grey50}
                            />
                          </React.Fragment>
                        ) : null
                      )
                    : null}
                  {wasteChuteFixtures.map(fixture => (
                    <WasteChuteFixture
                      key={fixture.id}
                      cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                      deckDefinition={deckDef}
                      fixtureBaseColor={lightFill}
                    />
                  ))}
                  {wasteChuteStagingAreaFixtures.map(fixture => (
                    <WasteChuteStagingAreaFixture
                      key={fixture.id}
                      cutoutId={fixture.location as typeof WASTE_CHUTE_CUTOUT}
                      deckDefinition={deckDef}
                      slotClipColor={darkFill}
                      fixtureBaseColor={lightFill}
                    />
                  ))}
                </>
              )}
              <DeckSetupContents
                trashSlot={trashSlot ?? null}
                robotType={robotType}
                activeDeckSetup={activeDeckSetup}
                selectedTerminalItemId={selectedTerminalItemId}
                stagingAreaCutoutIds={stagingAreaFixtures.map(
                  //  TODO(jr, 11/13/23): fix this type since AdditionalEquipment['location'] is type string
                  //  instead of CutoutId
                  areas => areas.location as CutoutId
                )}
                {...{
                  deckDef,

                  showGen1MultichannelCollisionWarnings,
                }}
              />
              <SlotLabels
                robotType={robotType}
                hasStagingAreas={stagingAreaFixtures.length > 0}
                hasWasteChute={hasWasteChute}
              />
            </>
          )}
        </RobotCoordinateSpaceWithRef>
      </div>
    </div>
  )
}

function getCutoutIdForAddressableArea(
  addressableArea: AddressableAreaName,
  cutoutFixtures: CutoutFixture[]
): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] =
      Object.entries(
        cutoutFixture.providesAddressableAreas
      ).find(([_cutoutId, providedAAs]) =>
        providedAAs.includes(addressableArea)
      ) ?? []
    return (cutoutId as CutoutId) ?? acc
  }, null)
}
