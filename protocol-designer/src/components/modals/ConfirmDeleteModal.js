// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import { i18n } from '../../localization'
import { Portal } from '../portals/MainPageModalPortal'
import modalStyles from './modal.css'

export const DELETE_PROFILE_CYCLE: 'deleteProfileCycle' = 'deleteProfileCycle'
export const UNSAVED_STEP_FORM_CLOSE: 'unsavedStepFormClose' =
  'unsavedStepFormClose'
export const UNSAVED_STEP_FORM_DELETE: 'unsavedStepFormDelete' =
  'unsavedStepFormDelete'

export type DeleteModalType =
  | typeof DELETE_PROFILE_CYCLE
  | typeof UNSAVED_STEP_FORM_CLOSE
  | typeof UNSAVED_STEP_FORM_DELETE

type Props = {|
  modalType: DeleteModalType,
  onCancelClick: () => mixed,
  onContinueClick: () => mixed,
|}

export function ConfirmDeleteModal(props: Props): React.Node {
  const { modalType, onCancelClick, onContinueClick } = props
  const cancelCopy = i18n.t('button.cancel')
  const continueCopy = i18n.t(
    `modal.confirm_delete_modal.${modalType}.confirm_button`,
    i18n.t('button.continue')
  )
  const buttons = [
    { title: cancelCopy, children: cancelCopy, onClick: onCancelClick },
    {
      title: continueCopy,
      children: continueCopy,
      className: modalStyles.long_button,
      onClick: onContinueClick,
    },
  ]
  return (
    <Portal>
      <AlertModal
        alertOverlay
        restrictOuterScroll={false}
        buttons={buttons}
        onCloseClick={onCancelClick}
        className={modalStyles.modal}
        heading={i18n.t(`modal.confirm_delete_modal.${modalType}.title`)}
      >
        <p>{i18n.t(`modal.confirm_delete_modal.${modalType}.body`)}</p>
      </AlertModal>
    </Portal>
  )
}
