import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertModal } from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { useCurrentRunControls } from './hooks'

export interface ConfirmCancelModalProps {
  onClose: () => unknown
}

export function ConfirmCancelModal(
  props: ConfirmCancelModalProps
): JSX.Element {
  const { onClose } = props
  const { stopRun } = useCurrentRunControls()
  const { t } = useTranslation('run_details')

  const HEADING = t('cancel_run_modal_heading')
  const CANCEL_TEXT = t('cancel_run_modal_confirm')
  const BACK_TEXT = t('cancel_run_modal_back')

  const cancel = (): void => {
    stopRun()
    onClose()
  }

  return (
    <Portal>
      <AlertModal
        heading={HEADING}
        buttons={[
          { children: BACK_TEXT, onClick: onClose },
          { children: CANCEL_TEXT, onClick: cancel },
        ]}
        alertOverlay
      >
        <p>{t('cancel_run_alert_info')}</p>
        <p>{t('cancel_run_module_info')}</p>
      </AlertModal>
    </Portal>
  )
}
