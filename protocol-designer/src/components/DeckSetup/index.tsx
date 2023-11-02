import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import compact from 'lodash/compact'
import values from 'lodash/values'
import {
  useOnClickOutside,
  RobotWorkSpaceRenderProps,
  Module,
  COLORS,
  TrashLocation,
  FlexTrash,
  RobotCoordinateSpaceWithDOMCoords,
  WasteChuteFixture,
  WasteChuteLocation,
  StagingAreaFixture,
  StagingAreaLocation,
  SingleSlotFixture,
  DeckFromData,
} from '@opentrons/components'
import {
  AdditionalEquipmentEntity,
  MODULES_WITH_COLLISION_ISSUES,
  ModuleTemporalProperties,
} from '@opentrons/step-generation'
import {
  getLabwareHasQuirk,
  inferModuleOrientationFromSlot,
  DeckSlot as DeckDefSlot,
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_TYPE,
  getModuleDisplayName,
  DeckDefinition,
  RobotType,
  FLEX_ROBOT_TYPE,
  Cutout,
  TRASH_BIN_LOAD_NAME,
  STAGING_AREA_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'
import {
  FLEX_TRASH_DEF_URI,
  OT_2_TRASH_DEF_URI,
  PSEUDO_DECK_SLOTS,
} from '../../constants'
import { selectors as labwareDefSelectors } from '../../labware-defs'

import { selectors as featureFlagSelectors } from '../../feature-flags'
import {
  getSlotIdsBlockedBySpanning,
  getSlotIsEmpty,
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../step-forms'
import * as labwareIngredActions from '../../labware-ingred/actions'
import { getDeckSetupForActiveItem } from '../../top-selectors/labware-locations'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { TerminalItemId } from '../../steplist'
import { getSelectedTerminalItemId } from '../../ui/steps'
import { getRobotType } from '../../file-data/selectors'
import { BrowseLabwareModal } from '../labware'
import { SlotWarning } from './SlotWarning'
import { LabwareOnDeck } from './LabwareOnDeck'
import {
  AdapterControls,
  SlotControls,
  LabwareControls,
  DragPreview,
} from './LabwareOverlays'
import { FlexModuleTag } from './FlexModuleTag'
import { Ot2ModuleTag } from './Ot2ModuleTag'
import { SlotLabels } from './SlotLabels'
import { DEFAULT_SLOTS } from './constants'
import { getHasGen1MultiChannelPipette, getSwapBlocked } from './utils'

import styles from './DeckSetup.css'

export const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

type ContentsProps = RobotWorkSpaceRenderProps & {
  activeDeckSetup: InitialDeckSetup
  selectedTerminalItemId?: TerminalItemId | null
  showGen1MultichannelCollisionWarnings: boolean
  deckDef: DeckDefinition
  robotType: RobotType
  trashSlot: string | null
}

const lightFill = COLORS.light1
const darkFill = COLORS.darkGreyEnabled

export const DeckSetupContents = (props: ContentsProps): JSX.Element => {
  const {
    activeDeckSetup,
    deckSlotsById,
    getRobotCoordsFromDOMCoords,
    showGen1MultichannelCollisionWarnings,
    deckDef,
    robotType,
    trashSlot,
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

  const handleHoverEmptySlot = React.useCallback(
    () => setHoveredLabware(null),
    []
  )

  const slotIdsBlockedBySpanning = getSlotIdsBlockedBySpanning(activeDeckSetup)
  const deckSlots: DeckDefSlot[] = values(deckSlotsById)
  // modules can be on the deck, including pseudo-slots (eg special 'spanning' slot for thermocycler position)
  const moduleParentSlots = [...deckSlots, ...values(PSEUDO_DECK_SLOTS)]

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
  const multichannelWarningSlots: DeckDefSlot[] = showGen1MultichannelCollisionWarnings
    ? compact([
        (allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '1' &&
            // @ts-expect-error(sa, 2021-6-21): ModuleModel is a super type of the elements in MODULES_WITH_COLLISION_ISSUES
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        ) &&
          deckSlotsById?.['4']) ||
          null,
        (allModules.some(
          moduleOnDeck =>
            moduleOnDeck.slot === '3' &&
            // @ts-expect-error(sa, 2021-6-21): ModuleModel is a super type of the elements in MODULES_WITH_COLLISION_ISSUES
            MODULES_WITH_COLLISION_ISSUES.includes(moduleOnDeck.model)
        ) &&
          deckSlotsById?.['6']) ||
          null,
      ])
    : []

  return (
    <>
      {/* all modules */}
      {allModules.map(moduleOnDeck => {
        const slot = moduleParentSlots.find(
          slot => slot.id === moduleOnDeck.slot
        )
        if (slot == null) {
          console.warn(
            `no slot ${moduleOnDeck.slot} for module ${moduleOnDeck.id}`
          )
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
        const labwareInterfaceSlotDef: DeckDefSlot = {
          displayName: `Labware interface on ${moduleOnDeck.model}`,
          id: moduleOnDeck.id,
          position: [0, 0, 0], // Module Component already handles nested positioning
          matingSurfaceUnitVector: [-1, 1, -1],
          boundingBox: {
            xDimension: moduleDef.dimensions.labwareInterfaceXDimension ?? 0,
            yDimension: moduleDef.dimensions.labwareInterfaceYDimension ?? 0,
            zDimension: 0,
          },
          compatibleModules: [THERMOCYCLER_MODULE_TYPE],
        }

        const moduleOrientation = inferModuleOrientationFromSlot(
          moduleOnDeck.slot
        )

        const isAdapter =
          labwareLoadedOnModule?.def.metadata.displayCategory === 'adapter'
        return (
          <Module
            key={slot.id}
            x={slot.position[0]}
            y={slot.position[1]}
            def={moduleDef}
            orientation={inferModuleOrientationFromXCoordinate(
              slot.position[0]
            )}
            innerProps={getModuleInnerProps(moduleOnDeck.moduleState)}
            targetSlotId={slot.id}
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
                  //  @ts-expect-error
                  <AdapterControls
                    allLabware={allLabware}
                    onDeck={false}
                    labwareId={labwareLoadedOnModule.id}
                    key={slot.id}
                    slot={slot}
                    selectedTerminalItemId={props.selectedTerminalItemId}
                    handleDragHover={handleHoverEmptySlot}
                  />
                ) : (
                  <LabwareControls
                    slot={labwareInterfaceSlotDef}
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
              //  @ts-expect-error (ce, 2021-06-21) once we upgrade to the react-dnd hooks api, and use react-redux hooks, typing this will be easier
              <SlotControls
                key={slot.id}
                slot={labwareInterfaceSlotDef}
                selectedTerminalItemId={props.selectedTerminalItemId}
                moduleType={moduleOnDeck.type}
                handleDragHover={handleHoverEmptySlot}
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
      {multichannelWarningSlots.map(slot => (
        <SlotWarning
          key={slot.id}
          warningType="gen1multichannel"
          x={slot.position[0]}
          y={slot.position[1]}
          xDimension={slot.boundingBox.xDimension}
          yDimension={slot.boundingBox.yDimension}
          orientation={inferModuleOrientationFromSlot(slot.id)}
        />
      ))}

      {/* SlotControls for all empty deck + module slots */}
      {deckSlots
        .filter(
          slot =>
            !slotIdsBlockedBySpanning.includes(slot.id) &&
            getSlotIsEmpty(activeDeckSetup, slot.id) &&
            slot.id !== trashSlot
        )
        .map(slot => {
          return (
            // @ts-expect-error (ce, 2021-06-21) once we upgrade to the react-dnd hooks api, and use react-redux hooks, typing this will be easier
            <SlotControls
              key={slot.id}
              slot={slot}
              selectedTerminalItemId={props.selectedTerminalItemId}
              // Module slots' ids reference their parent module
              moduleType={activeDeckSetup.modules[slot.id]?.type || null}
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
        const slot = deckSlots.find(slot => slot.id === labware.slot)
        if (slot == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        const labwareIsAdapter =
          labware.def.metadata.displayCategory === 'adapter'
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slot.position[0]}
              y={slot.position[1]}
              labwareOnDeck={labware}
            />
            <g>
              {labwareIsAdapter ? (
                <>
                  {/* @ts-expect-error */}
                  <AdapterControls
                    allLabware={allLabware}
                    onDeck={true}
                    labwareId={labware.id}
                    key={slot.id}
                    slot={slot}
                    selectedTerminalItemId={props.selectedTerminalItemId}
                    handleDragHover={handleHoverEmptySlot}
                  />
                </>
              ) : (
                <LabwareControls
                  slot={slot}
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
        const slotOnDeck = deckSlots.find(slot => slot.id === labware.slot)
        if (slotOnDeck != null) {
          return null
        }
        const slotForOnTheDeck = allLabware.find(lab => lab.id === labware.slot)
          ?.slot
        const slotForOnMod = allModules.find(mod => mod.id === slotForOnTheDeck)
          ?.slot
        const deckDefSlot = deckSlots.find(
          s => s.id === (slotForOnMod ?? slotForOnTheDeck)
        )
        if (deckDefSlot == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={deckDefSlot.position[0]}
              y={deckDefSlot.position[1]}
              labwareOnDeck={labware}
            />
            <g>
              <LabwareControls
                slot={deckDefSlot}
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
      <DragPreview getRobotCoordsFromDOMCoords={getRobotCoordsFromDOMCoords} />
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
  const trash = Object.values(activeDeckSetup.labware).find(
    lw =>
      lw.labwareDefURI === OT_2_TRASH_DEF_URI ||
      lw.labwareDefURI === FLEX_TRASH_DEF_URI
  )
  const trashSlot = trash?.slot
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
      fixtureId: trash?.id,
      fixtureLocation: trash?.slot as Cutout,
      loadName: TRASH_BIN_LOAD_NAME,
    },
  ]
  const wasteChuteFixtures = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(aE => aE.name === WASTE_CHUTE_LOAD_NAME)
  const stagingAreaFixtures: AdditionalEquipmentEntity[] = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).filter(aE => aE.name === STAGING_AREA_LOAD_NAME)
  const locations = Object.values(
    activeDeckSetup.additionalEquipmentOnDeck
  ).map(aE => aE.location)

  const filteredSlots = DEFAULT_SLOTS.filter(
    slot => !locations.includes(slot.fixtureLocation)
  )

  return (
    <div className={styles.deck_row}>
      {drilledDown && <BrowseLabwareModal />}
      <div ref={wrapperRef} className={styles.deck_wrapper}>
        <RobotCoordinateSpaceWithDOMCoords
          height="100%"
          deckDef={deckDef}
          viewBox={`${deckDef.cornerOffsetFromOrigin[0]} ${deckDef.cornerOffsetFromOrigin[1]} ${deckDef.dimensions[0]} ${deckDef.dimensions[1]}`}
        >
          {({ deckSlotsById, getRobotCoordsFromDOMCoords }) => (
            <>
              {robotType === OT2_ROBOT_TYPE ? (
                <DeckFromData def={deckDef} layerBlocklist={[]} />
              ) : (
                <>
                  {filteredSlots.map(fixture => (
                    <SingleSlotFixture
                      key={fixture.fixtureId}
                      cutoutLocation={fixture.fixtureLocation as Cutout}
                      deckDefinition={deckDef}
                      slotClipColor={darkFill}
                      showExpansion={fixture.fixtureLocation === 'A1'}
                      fixtureBaseColor={lightFill}
                    />
                  ))}
                  {stagingAreaFixtures.map(fixture => (
                    <StagingAreaFixture
                      key={fixture.id}
                      cutoutLocation={fixture.location as StagingAreaLocation}
                      deckDefinition={deckDef}
                      slotClipColor={darkFill}
                      fixtureBaseColor={lightFill}
                    />
                  ))}
                  {trash != null
                    ? trashBinFixtures.map(fixture => (
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
                            trashLocation={
                              fixture.fixtureLocation as TrashLocation
                            }
                            backgroundColor={darkFill}
                          />
                        </React.Fragment>
                      ))
                    : null}
                  {wasteChuteFixtures.map(fixture => (
                    <WasteChuteFixture
                      key={fixture.id}
                      cutoutLocation={fixture.location as WasteChuteLocation}
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
                {...{
                  deckDef,
                  deckSlotsById,
                  getRobotCoordsFromDOMCoords,
                  showGen1MultichannelCollisionWarnings,
                }}
              />
              <SlotLabels
                robotType={robotType}
                hasStagingAreas={stagingAreaFixtures.length > 0}
              />
            </>
          )}
        </RobotCoordinateSpaceWithDOMCoords>
      </div>
    </div>
  )
}
