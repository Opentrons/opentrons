// @flow
import React, { useMemo } from 'react'
import map from 'lodash/map'
import pickBy from 'lodash/pickBy'
import some from 'lodash/some'
import {
  LabwareRender,
  useOnClickOutside,
  RobotWorkSpace,
  RobotCoordsText,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import i18n from '../../localization'
import BrowseLabwareModal from '../labware/BrowseLabwareModal'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../steplist'
import type { InitialDeckSetup } from '../../step-forms'

import { SlotControls, LabwareControls } from './LabwareOverlays'
import styles from './DeckSetup.css'

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
            deckLayerBlacklist={[
              'fixedBase',
              'removableDeckOutline',
              'doorStops',
              'metalFrame',
              'removalHandles',
              'screwHoles',
            ]}
            deckDef={deckDef}
            viewBox={`-10 -10 ${410} ${390}`}
          >
            {({ slots }) => (
              <>
                <RobotCoordsText
                  x={0}
                  y={370}
                  className={styles.deck_instructions}
                >
                  {headerMessage}
                </RobotCoordsText>
                {map(slots, (slot, slotId) => {
                  if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render labware or overlays

                  const containedLabware = pickBy(
                    props.initialDeckSetup.labware,
                    labware =>
                      labware.slot === slotId &&
                      !(
                        labware.def.parameters.quirks &&
                        labware.def.parameters.quirks.includes('fixedTrash')
                      )
                  )
                  let controls = (
                    <SlotControls
                      key={slot.id}
                      slot={slot}
                      selectedTerminalItemId={props.selectedTerminalItemId}
                    />
                  )

                  if (some(containedLabware)) {
                    // NOTE: only controlling first contained labware for now!
                    const labwareEntity = Object.values(containedLabware)[0]
                    controls = (
                      <LabwareControls
                        slot={slot}
                        labwareEntity={labwareEntity}
                        selectedTerminalItemId={props.selectedTerminalItemId}
                      />
                    )
                  }
                  return (
                    <>
                      {map(containedLabware, labwareEntity => (
                        <g
                          key={labwareEntity.id}
                          transform={`translate(${
                            slots[labwareEntity.slot].position[0]
                          }, ${slots[labwareEntity.slot].position[1]})`}
                        >
                          <LabwareRender definition={labwareEntity.def} />
                        </g>
                      ))}
                      {controls}
                    </>
                  )
                })}
              </>
            )}
          </RobotWorkSpace>

          {/* <Deck
            DragPreviewLayer={DragPreviewLayer}
            LabwareComponent={LabwareOnDeck}
          /> */}
        </div>
      </div>
    </React.Fragment>
  )
}

export default DeckSetup
