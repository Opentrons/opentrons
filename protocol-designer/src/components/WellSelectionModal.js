// @flow
import * as React from 'react'
import cx from 'classnames'

import SelectablePlate from '../containers/SelectablePlate'
import SingleLabwareWrapper from '../components/SingleLabware'

import {Modal, OutlineButton, LabeledValue} from '@opentrons/components'

import type {PipetteData} from '../step-generation/types'

import styles from './WellSelectionModal.css'
import modalStyles from './modals/modal.css'

type Props = {
  pipette: PipetteData,
  onCloseClick: (e: SyntheticEvent<*>) => mixed,
  onSave: () => mixed,
}

export default function WellSelectionModal (props: Props) {
  return (
    <Modal
      className={modalStyles.modal}
      contentsClassName={cx(modalStyles.modal_contents, modalStyles.transparent_content)}
      onCloseClick={props.onCloseClick}
    >
      <div className={styles.top_row}>
        {/* TODO Ian 2018-04-18 once we have pipette model strings, use model to get name instead of parsing ID */}
        <LabeledValue
          label='Pipette'
          value={props.pipette && props.pipette.id && props.pipette.id.split(':')[1]}
          className={styles.inverted_text}
        />
        <OutlineButton onClick={props.onSave} inverted>
          SAVE SELECTION
        </OutlineButton>
      </div>

      <SingleLabwareWrapper>
        <SelectablePlate
          selectable
        />
      </SingleLabwareWrapper>

      <div className={styles.bottom_row}>
        De-select: Shift + Click (NOT IMPLEMENTED TODO)
      </div>
    </Modal>
  )
}
