// @flow
import * as React from 'react'
import cx from 'classnames'

import {Modal, OutlineButton, LabeledValue} from '@opentrons/components'
import modalStyles from '../../modals/modal.css'

import styles from './WellOrderInput.css'

type Props = {
  onCloseClick: (e: SyntheticEvent<*>) => mixed,
  onSave: () => mixed,
}

const WellOrderModal = (props: Props) => (
  <Modal
    className={modalStyles.modal}
    contentsClassName={cx(modalStyles.modal_contents, modalStyles.transparent_content)}
    onCloseClick={props.onCloseClick}
  >
    <div className={styles.top_row}>
      {/* <LabeledValue
        label='Pipette'
        value={pipetteConfig && pipetteConfig.displayName}
        className={styles.inverted_text}
      /> */}
      <OutlineButton onClick={props.onSave} inverted>
        SAVE SELECTION
      </OutlineButton>
    </div>
  </Modal>
)

export default WellOrderModal
