// @flow
import * as React from 'react'
import values from 'lodash/values'
import {
  useOnClickOutside,
  RobotWorkSpace,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import {
  getLabwareHasQuirk,
  type DeckSlot as DeckDefSlot,
} from '@opentrons/shared-data'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import i18n from '../../localization'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../steplist'
import ModuleViz from './ModuleViz'
import ModuleTag from './ModuleTag'
import moduleVizDims from './moduleVizDims'
import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../step-forms'
import type { DeckSlot } from '../../types'

import { BrowseLabwareModal } from '../labware'
import LabwareOnDeck from './LabwareOnDeck'
import { SlotControls, LabwareControls, DragPreview } from './LabwareOverlays'
import styles from './DeckSetup.css'

const deckSetupLayerBlacklist = [
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

const VIEWBOX_MIN_X = -64
const VIEWBOX_MIN_Y = -10
const VIEWBOX_WIDTH = 520
const VIEWBOX_HEIGHT = 414

// PD-specific slots that don't exist in deck definition.
// These shouldn't be rendered on deck when empty, but TODO TODO TODO
// TODO IMMEDIATELY import from somewhere else
const PSEUDO_DECK_SLOTS: { [DeckSlot]: DeckDefSlot } = {
  span7_8_10_11: {
    displayName: 'Spanning slot',
    id: 'span7_8_10_11',
    position: [0.0, 181.0, 0.0],
    matingSurfaceUnitVector: [-1, 1, -1],
    boundingBox: {
      xDimension: 128 * 2 + 4,
      yDimension: 86 * 2 + 4,
      zDimension: 0,
    },
    compatibleModules: ['thermocycler'],
  },
}
// TODO IMMEDIATELY import from somewhere else
const LEFT_SIDE_SLOTS: Array<DeckSlot> = ['1', '4', '7', '10', 'span7_8_10_11']

const getSlotsBlockedBySpanning = (
  initialDeckSetup: InitialDeckSetup
): Array<DeckSlot> => {
  // NOTE: Ian 2019-10-25 dumb heuristic since there's only one case this can happen now
  if (
    values(initialDeckSetup.modules).some(
      (module: ModuleOnDeck) =>
        module.type === 'thermocycler' && module.slot === 'span7_8_10_11'
    )
  ) {
    return ['7', '8', '10', '11']
  }
  return []
}

const getSlotIsEmpty = (
  initialDeckSetup: InitialDeckSetup,
  slot: string
): boolean => {
  // NOTE: should work for both deck slots and module slots
  return (
    [
      ...values(initialDeckSetup.modules).filter(
        (module: ModuleOnDeck) => module.slot === slot
      ),
      ...values(initialDeckSetup.labware).filter(
        (labware: LabwareOnDeckType) => labware.slot === slot
      ),
    ].length === 0
  )
}

const getSlotDefForModuleSlot = (
  module: ModuleOnDeck,
  deckSlots: { [slotId: string]: DeckDefSlot }
): DeckDefSlot => {
  const parentSlotDef = deckSlots[module.slot] || PSEUDO_DECK_SLOTS[module.slot]
  const moduleData = moduleVizDims[module.type]
  return {
    ...parentSlotDef,
    id: module.id,
    position: [
      parentSlotDef.position[0] + moduleData.childOffsetX,
      parentSlotDef.position[1] + moduleData.childOffsetY,
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

const DeckSetup = (props: Props) => {
  const deckDef = React.useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  const wrapperRef = useOnClickOutside({
    onClickOutside: props.handleClickOutside,
  })
  const headerMessage = props.selectedTerminalItemId
    ? i18n.t(
        `deck.header.${
          props.selectedTerminalItemId === START_TERMINAL_ITEM_ID
            ? 'start'
            : 'end'
        }`
      )
    : null

  const slotsBlockedBySpanning = getSlotsBlockedBySpanning(
    props.initialDeckSetup
  )

  const deckInstructions = (
    <RobotCoordsForeignDiv
      x={0}
      y={364}
      height={36}
      width={200}
      innerDivProps={{
        className: styles.deck_instructions,
      }}
    >
      {headerMessage}
    </RobotCoordsForeignDiv>
  )

  return (
    <React.Fragment>
      <div className={styles.deck_row}>
        {props.drilledDown && <BrowseLabwareModal />}
        <div ref={wrapperRef} className={styles.deck_wrapper}>
          <RobotWorkSpace
            deckLayerBlacklist={deckSetupLayerBlacklist}
            deckDef={deckDef}
            viewBox={`${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className={styles.robot_workspace}
          >
            {({ slots: deckSlotsById, getRobotCoordsFromDOMCoords }) => {
              const deckSlots: Array<DeckDefSlot> = values(deckSlotsById)
              const moduleSlots = getModuleSlotDefs(
                props.initialDeckSetup,
                deckSlotsById
              )
              // NOTE: in these arrays of slots, order affects SVG render layering
              // labware can be in a module or on the deck
              const labwareParentSlots: Array<DeckDefSlot> = [
                ...deckSlots,
                ...moduleSlots,
              ]
              // modules can be on the deck, including pseudo-slots (eg special 'spanning' slot for thermocycler position)
              const moduleParentSlots = [
                ...deckSlots,
                ...values(PSEUDO_DECK_SLOTS),
              ]

              const allLabware: Array<LabwareOnDeckType> = Object.keys(
                props.initialDeckSetup.labware
              ).reduce((acc, labwareId) => {
                const labware = props.initialDeckSetup.labware[labwareId]
                return getLabwareHasQuirk(labware.def, 'fixedTrash')
                  ? acc
                  : [...acc, labware]
              }, [])

              const allModules: Array<ModuleOnDeck> = values(
                props.initialDeckSetup.modules
              )

              return (
                <>
                  {/* all modules */}
                  {allModules.map(module => {
                    // TODO IMMEDIATELY: deal with user having module feature flag off...
                    // but maybe it doesn't matter b/c it'd always be upstream of this render?
                    // If you can't import and can't add modules,
                    // there will never be any modules to render here so no action needed here?
                    const slot = moduleParentSlots.find(
                      slot => slot.id === module.slot
                    )
                    if (!slot) {
                      console.warn(
                        `no slot ${module.slot} for module ${module.id}`
                      )
                      return null
                    }

                    const [moduleX, moduleY] = slot.position
                    const orientation = LEFT_SIDE_SLOTS.includes(slot.id)
                      ? 'left'
                      : 'right'

                    return (
                      <React.Fragment key={slot.id}>
                        <ModuleViz
                          x={moduleX}
                          y={moduleY}
                          orientation={orientation}
                          module={module}
                        />
                        <ModuleTag
                          x={moduleX}
                          y={moduleY}
                          orientation={orientation}
                          module={module}
                        />
                      </React.Fragment>
                    )
                  })}

                  {/* SlotControls for all empty deck + module slots */}
                  {labwareParentSlots
                    .filter(
                      slot =>
                        !slotsBlockedBySpanning.includes(slot.id) &&
                        getSlotIsEmpty(props.initialDeckSetup, slot.id)
                    )
                    .map(slot => {
                      console.log('empty slot', slot)
                      return (
                        <SlotControls
                          key={slot.id}
                          slot={slot}
                          selectedTerminalItemId={props.selectedTerminalItemId}
                        />
                      )
                    })}

                  {/* all labware on deck and in modules */}
                  {allLabware.map(labware => {
                    const slot = labwareParentSlots.find(
                      slot => slot.id === labware.slot
                    )
                    if (!slot) {
                      console.warn(
                        `no slot ${labware.slot} for labware ${labware.id}!`
                      )
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
                            labwareOnDeck={labware}
                            selectedTerminalItemId={
                              props.selectedTerminalItemId
                            }
                          />
                        </g>
                      </React.Fragment>
                    )
                  })}

                  {deckInstructions}
                  <DragPreview
                    getRobotCoordsFromDOMCoords={getRobotCoordsFromDOMCoords}
                  />
                </>
              )
            }}
          </RobotWorkSpace>
        </div>
      </div>
    </React.Fragment>
  )
}

export default DeckSetup
