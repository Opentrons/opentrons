import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  NewPrimaryBtn,
  NewSecondaryBtn,
  SPACING_3,
} from '@opentrons/components'

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

  const cancel = (): void => {
    stopRun()
    onClose()
  }

  return (
    <Portal>
      <AlertModal
        heading={t('cancel_run_modal_heading')}
        buttons={[
          {
            Component: () => (
              <NewSecondaryBtn onClick={onClose}>
                {t('cancel_run_modal_back')}
              </NewSecondaryBtn>
            ),
          },
          {
            Component: () => (
              <NewPrimaryBtn onClick={cancel} marginLeft={SPACING_3}>
                {t('cancel_run_modal_confirm')}
              </NewPrimaryBtn>
            ),
          },
        ]}
        alertOverlay
      >
        <p>{t('cancel_run_alert_info')}</p>
        <p>{t('cancel_run_module_info')}</p>
      </AlertModal>
    </Portal>
  )
}
