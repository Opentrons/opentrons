import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertModal, SecondaryBtn, SPACING_3 } from '@opentrons/components'

import { Portal } from '../../../App/portal'
import { useCurrentRunControls } from './hooks'

export interface ConfirmCancelModalProps {
  onClose: () => unknown
  secondaryBtnColor?: string
  primaryBtnColor?: string
  primaryBtnColorText?: string
}

export function ConfirmCancelModal(
  props: ConfirmCancelModalProps
): JSX.Element {
  const {
    onClose,
    secondaryBtnColor,
    primaryBtnColor,
    primaryBtnColorText,
  } = props
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
              <SecondaryBtn onClick={onClose} color={secondaryBtnColor}>
                {t('cancel_run_modal_back')}
              </SecondaryBtn>
            ),
          },
          {
            Component: () => (
              <SecondaryBtn
                onClick={cancel}
                marginLeft={SPACING_3}
                backgroundColor={primaryBtnColor}
                color={primaryBtnColorText}
              >
                {t('cancel_run_modal_confirm')}
              </SecondaryBtn>
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
