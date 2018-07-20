// @flow
import * as React from 'react'
import cx from 'classnames'

import SelectablePlate from '../containers/SelectablePlate'
import SingleLabwareWrapper from '../components/SingleLabware'
import WellSelectionInstructions from './WellSelectionInstructions'

import {Modal, OutlineButton, LabeledValue} from '@opentrons/components'
import {getPipette} from '@opentrons/shared-data'

import type {PipetteData} from '../step-generation/types'

import styles from './WellSelectionModal.css'
import modalStyles from './modals/modal.css'

type Props = {
  pipette: ?PipetteData,
  onCloseClick: (e: SyntheticEvent<*>) => mixed,
  onSave: () => mixed,
}

export default function WellSelectionModal (props: Props) {
  const pipetteConfig = props.pipette && getPipette(props.pipette.model)

  return (
    <Modal
      className={modalStyles.modal}
      contentsClassName={cx(modalStyles.modal_contents, modalStyles.transparent_content)}
      onCloseClick={props.onCloseClick}
    >
      <div className={styles.top_row}>
        <LabeledValue
          label='Pipette'
          value={pipetteConfig && pipetteConfig.displayName}
          className={styles.inverted_text}
        />
        <OutlineButton onClick={props.onSave} inverted>
          SAVE SELECTION
        </OutlineButton>
      </div>

      <SingleLabwareWrapper>
        <SelectablePlate
          selectable
          pipetteChannels={props.pipette && props.pipette.channels}
        />
      </SingleLabwareWrapper>

      <WellSelectionInstructions />
    </Modal>
  )
}
