import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import compact from 'lodash/compact'
import values from 'lodash/values'
import {
  RobotCoordsText,
  RobotWorkSpace,
  useOnClickOutside,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_BOLD,
  TEXT_TRANSFORM_UPPERCASE,
  RobotWorkSpaceRenderProps,
  Module,
  RobotCoordsForeignDiv,
  Text,
  COLORS,
  SPACING,
} from '@opentrons/components'
import {
  MODULES_WITH_COLLISION_ISSUES,
  ModuleTemporalProperties,
} from '@opentrons/step-generation'
import {
  getLabwareHasQuirk,
  inferModuleOrientationFromSlot,
  GEN_ONE_MULTI_PIPETTES,
  DeckSlot as DeckDefSlot,
  ModuleType,
  getDeckDefFromRobotType,
  OT2_ROBOT_TYPE,
  getModuleDef2,
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_TYPE,
  getModuleDisplayName,
  DeckDefinition,
} from '@opentrons/shared-data'
import { getDeckDefinitions } from '@opentrons/components/src/hardware-sim/Deck/getDeckDefinitions'
import { PSEUDO_DECK_SLOTS } from '../../constants'
import { i18n } from '../../localization'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '../../utils/labwareModuleCompatibility'
import {
  selectors as labwareDefSelectors,
  LabwareDefByDefURI,
} from '../../labware-defs'

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
import { SlotControls, LabwareControls, DragPreview } from './LabwareOverlays'
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
}

export const VIEWBOX_MIN_X = -64
export const VIEWBOX_MIN_Y = -10
export const VIEWBOX_WIDTH = 520
export const VIEWBOX_HEIGHT = 414

const OT2_VIEWBOX = `${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`
const FLEX_VIEWBOX = '-144.31 -76.59 750 580'

export interface SwapBlockedArgs {
  hoveredLabware?: LabwareOnDeckType | null
  draggedLabware?: LabwareOnDeckType | null
  modulesById: InitialDeckSetup['modules']
  customLabwareDefs: LabwareDefByDefURI
}

export const getSwapBlocked = (args: SwapBlockedArgs): boolean => {
  const {
    hoveredLabware,
    draggedLabware,
    modulesById,
    customLabwareDefs,
  } = args
  if (!hoveredLabware || !draggedLabware) {
    return false
  }

  const sourceModuleType: ModuleType | null =
    modulesById[draggedLabware.slot]?.type || null
  const destModuleType: ModuleType | null =
    modulesById[hoveredLabware.slot]?.type || null

  const draggedLabwareIsCustom = getLabwareIsCustom(
    customLabwareDefs,
    draggedLabware
  )
  const hoveredLabwareIsCustom = getLabwareIsCustom(
    customLabwareDefs,
    hoveredLabware
  )

  // dragging custom labware to module gives not compat error
  const labwareSourceToDestBlocked = sourceModuleType
    ? !getLabwareIsCompatible(hoveredLabware.def, sourceModuleType) &&
      !hoveredLabwareIsCustom
    : false
  const labwareDestToSourceBlocked = destModuleType
    ? !getLabwareIsCompatible(draggedLabware.def, destModuleType) &&
      !draggedLabwareIsCustom
    : false

  return labwareSourceToDestBlocked || labwareDestToSourceBlocked
}

export const DeckSetupContents = (props: ContentsProps): JSX.Element => {
  const {
    activeDeckSetup,
    deckSlotsById,
    getRobotCoordsFromDOMCoords,
    showGen1MultichannelCollisionWarnings,
    deckDef,
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
              </>
            ) : null}
            {labwareLoadedOnModule == null && !shouldHideChildren ? (
              // @ts-expect-error (ce, 2021-06-21) once we upgrade to the react-dnd hooks api, and use react-redux hooks, typing this will be easier
              <SlotControls
                key={slot.id}
                slot={labwareInterfaceSlotDef}
                selectedTerminalItemId={props.selectedTerminalItemId}
                moduleType={moduleOnDeck.type}
                handleDragHover={handleHoverEmptySlot}
              />
            ) : null}
            <RobotCoordsForeignDiv
              width={moduleDef.dimensions.labwareInterfaceXDimension}
              height={16}
              y={-22}
              innerDivProps={{
                backgroundColor: COLORS.darkGreyEnabled,
                padding: SPACING.spacing4,
                height: '100%',
                color: COLORS.white,
              }}
            >
              <Text as="p" fontSize="0.5rem">
                {getModuleDisplayName(moduleOnDeck.model)}
              </Text>
            </RobotCoordsForeignDiv>
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
            getSlotIsEmpty(activeDeckSetup, slot.id)
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
        if (allModules.some(m => m.id === labware.slot)) return null
        const slot = deckSlots.find(slot => slot.id === labware.slot)
        if (slot == null) {
          console.warn(`no slot ${labware.slot} for labware ${labware.id}!`)
          return null
        }
        return (
          <React.Fragment key={labware.id}>
            <LabwareOnDeck
              x={slot.position[0]}
              y={slot.position[1]}
              labwareOnDeck={labware}
            />
            <g>
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
            </g>
          </React.Fragment>
        )
      })}

      <DragPreview getRobotCoordsFromDOMCoords={getRobotCoordsFromDOMCoords} />
    </>
  )
}

const getHasGen1MultiChannelPipette = (
  pipettes: InitialDeckSetup['pipettes']
): boolean => {
  const pipetteIds = Object.keys(pipettes)
  return pipetteIds.some(pipetteId =>
    GEN_ONE_MULTI_PIPETTES.includes(pipettes[pipetteId]?.name)
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

  return (
    <div className={styles.deck_row}>
      {drilledDown && <BrowseLabwareModal />}
      <div ref={wrapperRef} className={styles.deck_wrapper}>
        <RobotWorkSpace
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
          deckDef={deckDef}
          viewBox={robotType === OT2_ROBOT_TYPE ? OT2_VIEWBOX : FLEX_VIEWBOX}
          width="100%"
          height="100%"
        >
          {({ deckSlotsById, getRobotCoordsFromDOMCoords }) => (
            <DeckSetupContents
              activeDeckSetup={activeDeckSetup}
              selectedTerminalItemId={selectedTerminalItemId}
              {...{
                deckDef,
                deckSlotsById,
                getRobotCoordsFromDOMCoords,
                showGen1MultichannelCollisionWarnings,
              }}
            />
          )}
        </RobotWorkSpace>
      </div>
    </div>
  )
}

export const NullDeckState = (): JSX.Element => {
  const deckDef = React.useMemo(() => getDeckDefinitions().ot2_standard, [])

  return (
    <div className={styles.deck_row}>
      <div className={styles.deck_wrapper}>
        <RobotWorkSpace
          deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
          deckDef={deckDef}
          viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          width="100%"
          height="100%"
        >
          {() => (
            <>
              {/* TODO(IL, 2021-03-15): use styled-components for RobotCoordsText instead of style prop */}
              <RobotCoordsText
                x={5}
                y={375}
                style={{ textTransform: TEXT_TRANSFORM_UPPERCASE }}
                fill="#cccccc"
                fontWeight={FONT_WEIGHT_BOLD}
                fontSize={FONT_SIZE_BODY_1}
              >
                {i18n.t('deck.inactive_deck')}
              </RobotCoordsText>
            </>
          )}
        </RobotWorkSpace>
      </div>
    </div>
  )
}
