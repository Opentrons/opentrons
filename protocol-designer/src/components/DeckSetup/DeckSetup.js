// @flow
import assert from 'assert'
import * as React from 'react'
import map from 'lodash/map'
import filter from 'lodash/filter'
import some from 'lodash/some'
import {
  useOnClickOutside,
  RobotWorkSpace,
  RobotCoordsForeignDiv,
} from '@opentrons/components'
import { getLabwareHasQuirk } from '@opentrons/shared-data'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import i18n from '../../localization'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../steplist'
import ModuleRender from './ModuleRender'
import ModuleTag from './ModuleTag'
import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
  ModuleOnDeck,
} from '../../step-forms'

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
            {({ slots, getRobotCoordsFromDOMCoords }) => (
              <>
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

                {map(slots, (slot: $Values<typeof slots>, slotId) => {
                  if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render labware or overlays

                  const containedLabware: Array<LabwareOnDeckType> = filter(
                    props.initialDeckSetup.labware,
                    labware =>
                      labware.slot === slotId &&
                      !getLabwareHasQuirk(labware.def, 'fixedTrash')
                  )
                  assert(
                    containedLabware.length <= 1,
                    `expected at most 1 labware in slot ${slotId} got ${containedLabware.length}`
                  )

                  // TODO IMMEDIATELY: deal with user having module feature flag off
                  // (maybe upstream of this render? If you can't import and can't add modules,
                  // there will never be any modules to render here so no action needed here)
                  const containedModules: Array<ModuleOnDeck> = filter(
                    props.initialDeckSetup.modules,
                    module => module.slot === slotId
                  )
                  assert(
                    containedModules.length <= 1,
                    `expected at most 1 module in slot ${slotId} got ${containedModules.length}`
                  )
                  let moduleLayer: ?React.Node = null
                  if (containedModules[0]) {
                    const module = containedModules[0]
                    console.log({ module, slotId })
                    const [moduleX, moduleY] = slots[slotId].position
                    const orientation = ['1', '4', '7', '10'].includes(slotId)
                      ? 'left'
                      : 'right'

                    moduleLayer = (
                      <>
                        <ModuleRender
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
                      </>
                    )
                  }

                  if (some(containedLabware)) {
                    // NOTE: only controlling first contained labware for now!
                    return (
                      <React.Fragment key={slot.id}>
                        {moduleLayer}
                        {map(containedLabware, labwareOnDeck => (
                          <LabwareOnDeck
                            key={labwareOnDeck.id}
                            x={slots[labwareOnDeck.slot].position[0]}
                            y={slots[labwareOnDeck.slot].position[1]}
                            labwareOnDeck={labwareOnDeck}
                          />
                        ))}
                        {map()}
                        <g>
                          <LabwareControls
                            slot={slot}
                            labwareOnDeck={containedLabware[0]}
                            selectedTerminalItemId={
                              props.selectedTerminalItemId
                            }
                          />
                        </g>
                      </React.Fragment>
                    )
                  }

                  return (
                    <SlotControls
                      key={slot.id}
                      slot={slot}
                      selectedTerminalItemId={props.selectedTerminalItemId}
                    />
                  )
                })}
                <DragPreview
                  getRobotCoordsFromDOMCoords={getRobotCoordsFromDOMCoords}
                />
              </>
            )}
          </RobotWorkSpace>
        </div>
      </div>
    </React.Fragment>
  )
}

export default DeckSetup
