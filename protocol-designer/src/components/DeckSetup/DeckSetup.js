// @flow
import React, { useMemo } from 'react'
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
import type {
  InitialDeckSetup,
  LabwareOnDeck as LabwareOnDeckType,
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
  'screwHoles',
]
type Props = {|
  selectedTerminalItemId: ?TerminalItemId,
  handleClickOutside?: () => mixed,
  drilledDown: boolean,
  initialDeckSetup: InitialDeckSetup,
|}

const DeckSetup = (props: Props) => {
  const deckDef = useMemo(() => getDeckDefinitions()['ot2_standard'], [])
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
            viewBox={`-46 -70 ${488} ${514}`} // TODO: put these in variables
            className={styles.robot_workspace}
          >
            {({ slots, getRobotCoordsFromDOMCoords }) => (
              <>
                <RobotCoordsForeignDiv
                  x={30}
                  y={-44}
                  height={30}
                  width={380}
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

                  if (some(containedLabware)) {
                    // NOTE: only controlling first contained labware for now!
                    return (
                      <React.Fragment key={slot.id}>
                        {map(containedLabware, labwareOnDeck => (
                          <LabwareOnDeck
                            key={labwareOnDeck.id}
                            x={slots[labwareOnDeck.slot].position[0]}
                            y={slots[labwareOnDeck.slot].position[1]}
                            labwareOnDeck={labwareOnDeck}
                          />
                        ))}
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
