import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  AppSecondaryBtn,
  AppPrimaryBtn,
  SPACING_3,
} from '@opentrons/components'

interface ConfirmExitProtocolUploadModalProps {
  back: () => unknown
  exit: () => unknown
}

export function ConfirmExitProtocolUploadModal(
  props: ConfirmExitProtocolUploadModalProps
): JSX.Element {
  const { t } = useTranslation('protocol_info')
  return (
    <AlertModal
      heading={t('exit_modal_heading')}
      buttons={[
        {
          Component: () => (
            <AppSecondaryBtn onClick={props.back}>
              {t('exit_modal_go_back')}
            </AppSecondaryBtn>
          ),
        },
        {
          Component: () => (
            <AppPrimaryBtn onClick={props.exit} marginLeft={SPACING_3}>
              {t('exit_modal_exit')}
            </AppPrimaryBtn>
          ),
        },
      ]}
      alertOverlay
    >
      {t('exit_modal_body')}
    </AlertModal>
  )
}
