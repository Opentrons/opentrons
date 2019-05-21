// @flow
import React, { useMemo } from 'react'
import cx from 'classnames'
import map from 'lodash/map'
import pickBy from 'lodash/pickBy'
import isEmpty from 'lodash/isEmpty'
import {
  LabwareRender,
  useOnClickOutside,
  RobotWorkSpace,
  RobotCoordsText,
  RobotCoordsForeignDiv,
  humanizeLabwareType,
} from '@opentrons/components'
import { getDeckDefinitions } from '@opentrons/components/src/deck/getDeckDefinitions'
import i18n from '../../localization'
import BrowseLabwareModal from '../labware/BrowseLabwareModal'
// import LabwareOnDeck, { DragPreviewLayer } from '../labware/LabwareOnDeck'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../steplist'
import type { InitialDeckSetup } from '../../step-forms'

import { LabwareName } from './LabwareOverlays'
import EditLabwareOverlay from './EditLabwareOverlay'
import NameThisLabwareOverlay from './NameThisLabwareOverlay'
import AddLabwareOverlay from './AddLabwareOverlay'
import styles from './DeckSetup.css'

type Props = {
  selectedTerminalItemId: ?TerminalItemId,
  handleClickOutside?: () => mixed,
  drilledDown: boolean,
  initialDeckSetup: InitialDeckSetup,
}

const DeckSetup = (props: Props) => {
  const deckDef = useMemo(() => getDeckDefinitions()['ot2_standard'], [])
  const wrapperRef = useOnClickOutside(props.handleClickOutside)
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
          <RobotWorkSpace deckDef={deckDef} viewBox={`-10 -10 ${410} ${380}`}>
            {({ slots }) => (
              <>
                <RobotCoordsText x={0} y={500}>
                  {headerMessage}
                </RobotCoordsText>
                {props.initialDeckSetup &&
                  map(props.initialDeckSetup.labware, labwareEntity => {
                    return (
                      <g
                        transform={`translate(${
                          slots[labwareEntity.slot].position[0]
                        }, ${slots[labwareEntity.slot].position[1]})`}
                      >
                        <LabwareRender definition={labwareEntity.def} />
                      </g>
                    )
                  })}
                {map(slots, (slot, slotId) => {
                  if (!slot.matingSurfaceUnitVector) return null // if slot has no mating surface, don't render labware or overlays

                  const containedLabware = pickBy(
                    props.initialDeckSetup.labware,
                    labware => labware.slot === slotId
                  )
                  if (isEmpty(containedLabware)) {
                    return <AddLabwareOverlay key={slot.id} slot={slot} />
                  } else {
                    // NOTE: only grabbing first contained labware
                    const labwareEntity = Object.values(containedLabware)[0]
                    const title =
                      labwareEntity.def.metadata.displayName ||
                      humanizeLabwareType(labwareEntity.type)
                    return (
                      <RobotCoordsForeignDiv
                        key={slot.id}
                        x={slot.position[0]}
                        y={slot.position[1]}
                        width={slot.boundingBox.xDimension}
                        height={slot.boundingBox.yDimension}
                        innerDivProps={{ className: styles.slot_ui }}
                      >
                        <LabwareName labwareEntity={labwareEntity} />
                        <EditLabwareOverlay labwareEntity={labwareEntity} />
                      </RobotCoordsForeignDiv>
                    )
                  }
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
