import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertModal } from '@opentrons/components'
import { Portal } from '../portals/MainPageModalPortal'
import modalStyles from './modal.css'

export const DELETE_PROFILE_CYCLE: 'deleteProfileCycle' = 'deleteProfileCycle'
export const CLOSE_STEP_FORM_WITH_CHANGES: 'closeStepFormWithChanges' =
  'closeStepFormWithChanges'
export const CLOSE_UNSAVED_STEP_FORM: 'closeUnsavedStepForm' =
  'closeUnsavedStepForm'
export const CLOSE_BATCH_EDIT_FORM: 'closeBatchEditForm' = 'closeBatchEditForm'
export const DELETE_STEP_FORM: 'deleteStepForm' = 'deleteStepForm'
export const DELETE_MULTIPLE_STEP_FORMS: 'deleteMultipleStepForms' =
  'deleteMultipleStepForms'

export type DeleteModalType =
  | typeof DELETE_PROFILE_CYCLE
  | typeof CLOSE_STEP_FORM_WITH_CHANGES
  | typeof CLOSE_UNSAVED_STEP_FORM
  | typeof DELETE_STEP_FORM
  | typeof CLOSE_BATCH_EDIT_FORM
  | typeof DELETE_MULTIPLE_STEP_FORMS

interface Props {
  modalType: DeleteModalType
  onCancelClick: () => unknown
  // TODO(sa, 2021-7-2): iron out this type, I think the weirdness comes from the return type of onConditionalConfirm
  onContinueClick: ((event: React.MouseEvent) => unknown) | (() => unknown)
}

export function ConfirmDeleteModal(props: Props): JSX.Element {
  const { t } = useTranslation(['modal', 'button'])
  const { modalType, onCancelClick, onContinueClick } = props
  const cancelCopy = t('button:cancel')
  const continueCopy = t(
    `confirm_delete_modal.${modalType}.confirm_button`,
    t('button:continue')
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
        heading={t(`confirm_delete_modal.${modalType}.title`)}
      >
        <p>{t(`confirm_delete_modal.${modalType}.body`)}</p>
      </AlertModal>
    </Portal>
  )
}
