// @flow
import * as React from 'react'
import ReactDom from 'react-dom'
import {ContinueModal} from '@opentrons/components'
import modalStyles from '../modals/modal.css'
import {CONFIRM_MODAL_ROOT_ID} from '../../constants'

const CONFIRM_DELETE_TEXT = 'Are you sure you want to delete this step?'

type Props = React.ElementProps<typeof ContinueModal>

export default function ConfirmDeleteModal (props: Props) {
  return ReactDom.createPortal(
    <ContinueModal className={modalStyles.modal} {...props}>
      {CONFIRM_DELETE_TEXT}
    </ContinueModal>,
    document.getElementById(CONFIRM_MODAL_ROOT_ID)
  )
}
