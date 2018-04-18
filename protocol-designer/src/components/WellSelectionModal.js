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
  hideModal: ?boolean,
  pipette: PipetteData,
  onCloseClick: (e: SyntheticEvent<*>) => mixed,
  onSave: () => mixed,
}

export default function WellSelectionModal (props: Props) {
  if (props.hideModal) {
    return null
  }

  return (
    <Modal
      className={modalStyles.modal}
      contentsClassName={cx(modalStyles.modal_contents, modalStyles.transparent_content)}
      onCloseClick={props.onCloseClick}
    >
      <div className={styles.top_row}>
        {/* TODO how do we get name in dropdown? Do that. */}
        <LabeledValue label='Pipette' value={props.pipette.id} />
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
