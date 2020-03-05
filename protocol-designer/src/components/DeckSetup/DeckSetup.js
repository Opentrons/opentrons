// @flow
import React, { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import compact from 'lodash/compact'
import values from 'lodash/values'
import {
  useOnClickOutside,
  RobotWorkSpace,
  type RobotWorkSpaceRenderProps,
} from '@opentrons/components'
import {
  getLabwareHasQuirk,
  type DeckSlot as DeckDefSlot,
  type ModuleRealType,
} from '@opentrons/shared-data'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import { PSEUDO_DECK_SLOTS, GEN_ONE_MULTI_PIPETTES } from '../../constants'
import type { TerminalItemId } from '../../steplist'
import { getLabwareIsCompatible } from '../../utils/labwareModuleCompatibility'
import {
  getModuleVizDims,
  inferModuleOrientationFromSlot,
} from './getModuleVizDims'

import { selectors as labwareDefSelectors } from '../../labware-defs'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { getSlotsBlockedBySpanning, getSlotIsEmpty } from '../../step-forms'
import { BrowseLabwareModal } from '../labware'
import { ModuleViz } from './ModuleViz'
import { ModuleTag } from './ModuleTag'
import { SlotWarning } from './SlotWarning'
import { LabwareOnDeck } from './LabwareOnDeck'
import { SlotControls, LabwareControls, DragPreview } from './LabwareOverlays'

import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../step-forms'
import type { LabwareDefByDefURI } from '../../labware-defs'

import styles from './DeckSetup.css'

const DECK_LAYER_BLACKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

type Props = {|
  selectedTerminalItemId: ?TerminalItemId,
  handleClickOutside?: () => mixed,
  drilledDown: boolean,
  initialDeckSetup: InitialDeckSetup,
|}

type ContentsProps = {|
  ...RobotWorkSpaceRenderProps,
  selectedTerminalItemId: ?TerminalItemId,
  initialDeckSetup: InitialDeckSetup,
  showGen1MultichannelCollisionWarnings: boolean,
|}

const VIEWBOX_MIN_X = -64
const VIEWBOX_MIN_Y = -10
const VIEWBOX_WIDTH = 520
const VIEWBOX_HEIGHT = 414

const getSlotDefForModuleSlot = (
  module: ModuleOnDeck,
  deckSlots: { [slotId: string]: DeckDefSlot }
): DeckDefSlot => {
  const parentSlotDef = deckSlots[module.slot] || PSEUDO_DECK_SLOTS[module.slot]
  const moduleOrientation = inferModuleOrientationFromSlot(module.slot)
  const moduleData = getModuleVizDims(moduleOrientation, module.type)

  return {
    ...parentSlotDef,
    id: module.id,
    position: [
      parentSlotDef.position[0] + moduleData.childXOffset,
      parentSlotDef.position[1] + moduleData.childYOffset,
      0,
    ],
    boundingBox: {
      xDimension: moduleData.childXDimension,
      yDimension: moduleData.childYDimension,
      zDimension: 0,
    },
    displayName: `Slot of ${module.type} in slot ${module.slot}`,
  }
}

const getModuleSlotDefs = (
  initialDeckSetup: InitialDeckSetup,
  deckSlots: { [slotId: string]: DeckDefSlot }
): Array<DeckDefSlot> => {
  return values(initialDeckSetup.modules).map((module: ModuleOnDeck) =>
    getSlotDefForModuleSlot(module, deckSlots)
  )
}

export const getSwapBlocked = (args: {
  hoveredLabware: ?LabwareOnDeckType,
  draggedLabware: ?LabwareOnDeckType,
  modulesById: $PropertyType<InitialDeckSetup, 'modules'>,
  customLabwares: LabwareDefByDefURI,
}): boolean => {
  const { hoveredLabware, draggedLabware, modulesById, customLabwares } = args

  if (!hoveredLabware || !draggedLabware) {
    return false
  }

  const sourceModuleType: ?ModuleRealType =
    modulesById[draggedLabware.slot]?.type || null
  const destModuleType: ?ModuleRealType =
    modulesById[hoveredLabware.slot]?.type || null

  const draggedLabwareIsCustom = customLabwares[draggedLabware.labwareDefURI]
  const hoveredLabwareIsCustom = customLabwares[hoveredLabware.labwareDefURI]

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

// TODO IL 2020-01-12: to support dynamic labware/module movement during a protocol,
// don't use initialDeckSetup here. Use some version of timelineFrameForActiveItem
export const DeckSetupContents = (props: ContentsProps) => {
  const {
    initialDeckSetup,
    deckSlotsById,
    getRobotCoordsFromDOMCoords,
    showGen1MultichannelCollisionWarnings,
  } = props

  // NOTE: handling module<>labware compat when moving labware to empty module
  // is handled by SlotControls.
  // But when swapping labware when at least one is on a module, we need to be aware
  // of not only what labware is being dragged, but also what labware is **being
  // hovered over**. The intrinsic state of `react-dnd` is not designed to handle that.
  // So we need to use our own state here to determine
  // whether swapping will be blocked due to labware<>module compat:

  const [hoveredLabware, setHoveredLabware] = useState<?LabwareOnDeckType>(null)
  const [draggedLabware, setDraggedLabware] = useState<?LabwareOnDeckType>(null)

  const customLabwares = useSelector(
    labwareDefSelectors.getCustomLabwareDefsByURI
  )
  const swapBlocked = getSwapBlocked({
    hoveredLabware,
    draggedLabware,
    modulesById: initialDeckSetup.modules,
    customLabwares,
  })
  const handleHoverEmptySlot = useCallback(() => setHoveredLabware(null), [])

  const slotsBlockedBySpanning = getSlotsBlockedBySpanning(
    props.initialDeckSetup
  )
  const deckSlots: Array<DeckDefSlot> = values(deckSlotsById)
  const moduleSlots = getModuleSlotDefs(initialDeckSetup, deckSlotsById)
  // NOTE: in these arrays of slots, order affects SVG render layering
  // labware can be in a module or on the deck
  const labwareParentSlots: Array<DeckDefSlot> = [...deckSlots, ...moduleSlots]
  // modules can be on the deck, including pseudo-slots (eg special 'spanning' slot for thermocycler position)
  const moduleParentSlots = [...deckSlots, ...values(PSEUDO_DECK_SLOTS)]

  const allLabware: Array<LabwareOnDeckType> = Object.keys(
    initialDeckSetup.labware
  ).reduce((acc, labwareId) => {
    const labware = initialDeckSetup.labware[labwareId]
    return getLabwareHasQuirk(labware.def, 'fixedTrash')
      ? acc
      : [...acc, labware]
  }, [])

  const allModules: Array<ModuleOnDeck> = values(initialDeckSetup.modules)

  // NOTE: naively hard-coded to show warning north of slots 1 or 3 when occupied by any module
  let multichannelWarningSlots: Array<DeckDefSlot> = showGen1MultichannelCollisionWarnings
    ? compact([
        (allModules.some(module => module.slot === '1') &&
          deckSlotsById?.['4']) ||
          null,
        (allModules.some(module => module.slot === '3') &&
          deckSlotsById?.['6']) ||
          null,
      ])
    : []

  return (
    <>
      {/* all modules */}
      {allModules.map(module => {
        const slot = moduleParentSlots.find(slot => slot.id === module.slot)
        if (!slot) {
          console.warn(`no slot ${module.slot} for module ${module.id}`)
          return null
        }

        const [moduleX, moduleY] = slot.position
        const orientation = inferModuleOrientationFromSlot(slot.id)

        return (
          <React.Fragment key={slot.id}>
            <ModuleViz
              x={moduleX}
              y={moduleY}
              orientation={orientation}
              module={module}
              slotName={slot.id}
            />
            <ModuleTag
              x={moduleX}
              y={moduleY}
              orientation={orientation}
              id={module.id}
            />
          </React.Fragment>
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
      {labwareParentSlots
        .filter(
          slot =>
            !slotsBlockedBySpanning.includes(slot.id) &&
            getSlotIsEmpty(props.initialDeckSetup, slot.id)
        )
        .map(slot => {
          return (
            <SlotControls
              key={slot.id}
              slot={slot}
              selectedTerminalItemId={props.selectedTerminalItemId}
              // Module slots' ids reference their parent module
              moduleType={initialDeckSetup.modules[slot.id]?.type || null}
              handleDragHover={handleHoverEmptySlot}
            />
          )
        })}

      {/* all labware on deck and in modules */}
      {allLabware.map(labware => {
        const slot = labwareParentSlots.find(slot => slot.id === labware.slot)
        if (!slot) {
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
  pipettes: $PropertyType<InitialDeckSetup, 'pipettes'>
) => {
  const pipetteIds = Object.keys(pipettes)
  return pipetteIds.some(pipetteId =>
    GEN_ONE_MULTI_PIPETTES.includes(pipettes[pipetteId]?.name)
  )
}

export const DeckSetup = (props: Props) => {
  const _disableCollisionWarnings = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const _hasGen1MultichannelPipette = React.useMemo(
    () => getHasGen1MultiChannelPipette(props.initialDeckSetup.pipettes),
    [props.initialDeckSetup.pipettes]
  )
  const showGen1MultichannelCollisionWarnings =
    !_disableCollisionWarnings && _hasGen1MultichannelPipette

  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  const wrapperRef = useOnClickOutside({
    onClickOutside: props.handleClickOutside,
  })

  return (
    <React.Fragment>
      <div className={styles.deck_row}>
        {props.drilledDown && <BrowseLabwareModal />}
        <div ref={wrapperRef} className={styles.deck_wrapper}>
          <RobotWorkSpace
            deckLayerBlacklist={DECK_LAYER_BLACKLIST}
            deckDef={deckDef}
            viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className={styles.robot_workspace}
          >
            {({ deckSlotsById, getRobotCoordsFromDOMCoords }) => (
              <>
                <DeckSetupContents
                  initialDeckSetup={props.initialDeckSetup}
                  selectedTerminalItemId={props.selectedTerminalItemId}
                  {...{
                    deckSlotsById,
                    getRobotCoordsFromDOMCoords,
                    showGen1MultichannelCollisionWarnings,
                  }}
                />
              </>
            )}
          </RobotWorkSpace>
        </div>
      </div>
    </React.Fragment>
  )
}
