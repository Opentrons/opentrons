// @flow
import * as React from 'react'

import SelectablePlate from '../containers/SelectablePlate'
import SingleLabwareWrapper from '../components/SingleLabware'

import {Modal, OutlineButton, LabeledValue} from '@opentrons/components'

import type {PipetteData} from '../step-generation/types'

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
    <Modal className={modalStyles.modal} onCloseClick={props.onCloseClick}>
      <div>
        {/* TODO how do we get name in dropdown? Do that. */}
        <LabeledValue label='Pipette' value={props.pipette.id} />
        <OutlineButton onClick={props.onSave}>
          SAVE SELECTION
        </OutlineButton>
      </div>

      <SingleLabwareWrapper>
        <SelectablePlate
          selectable
        />
      </SingleLabwareWrapper>

      <div>De-select: Shift + Click (NOT IMPLEMENTED TODO)</div>
    </Modal>
  )
}
