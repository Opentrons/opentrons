// @flow
import * as React from 'react'
import i18n from '../../localization'

import { Deck, ClickOutside } from '@opentrons/components'
import BrowseLabwareModal from '../labware/BrowseLabwareModal'
import LabwareOnDeck, { DragPreviewLayer } from '../labware/LabwareOnDeck'
import { START_TERMINAL_ITEM_ID, type TerminalItemId } from '../../steplist'

import styles from './DeckSetup.css'

type Props = {
  selectedTerminalItemId: ?TerminalItemId,
  handleClickOutside?: () => mixed,
  drilledDown: boolean,
}

const DeckSetup = (props: Props) => (
  <React.Fragment>
    <div className={styles.deck_header}>
      {props.selectedTerminalItemId
        ? i18n.t(
            `deck.header.${
              props.selectedTerminalItemId === START_TERMINAL_ITEM_ID
                ? 'start'
                : 'end'
            }`
          )
        : null}
    </div>
    <div className={styles.deck_row}>
      {props.drilledDown && <BrowseLabwareModal />}
      <ClickOutside onClickOutside={props.handleClickOutside}>
        {({ ref }) => (
          <div ref={ref} className={styles.deck_wrapper}>
            <Deck
              DragPreviewLayer={DragPreviewLayer}
              LabwareComponent={LabwareOnDeck}
            />
          </div>
        )}
      </ClickOutside>
    </div>
  </React.Fragment>
)

export default DeckSetup
