// @flow
import * as React from 'react'
import {ContinueModal} from '@opentrons/components'
import {Portal} from '../portals/MainPageModalPortal'
import modalStyles from '../modals/modal.css'

const CONFIRM_DELETE_TEXT = 'Are you sure you want to delete this step?'

type Props = $Diff<React.ElementProps<typeof ContinueModal>, {children: *}>

function ConfirmDeleteModal (props: Props) {
  return (
    <Portal>
      <ContinueModal className={modalStyles.modal} {...props}>
        {CONFIRM_DELETE_TEXT}
      </ContinueModal>
    </Portal>
  )
}

export default ConfirmDeleteModal
