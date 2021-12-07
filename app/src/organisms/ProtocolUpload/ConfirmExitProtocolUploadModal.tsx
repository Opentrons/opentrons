import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  NewSecondaryBtn,
  NewPrimaryBtn,
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
            <NewSecondaryBtn onClick={props.back}>
              {t('exit_modal_go_back')}
            </NewSecondaryBtn>
          ),
        },
        {
          Component: () => (
            <NewPrimaryBtn onClick={props.exit} marginLeft={SPACING_3}>
              {t('exit_modal_exit')}
            </NewPrimaryBtn>
          ),
        },
      ]}
      alertOverlay
    >
      {t('exit_modal_body')}
    </AlertModal>
  )
}
