import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  SecondaryBtn,
  PrimaryBtn,
  C_BLUE,
  SPACING_3,
} from '@opentrons/components'

interface ConfirmExitProtocolUploadModalProps {
  back: () => unknown
  exit: () => unknown
}

export function ConfirmExitProtocolUploadModal(
  props: ConfirmExitProtocolUploadModalProps
): JSX.Element {
  const { t } = useTranslation(['protocol_info'])
  return (
    <AlertModal
      heading={t('exit_modal_heading')}
      buttons={[
        {
          Component: () => (
            <SecondaryBtn color={C_BLUE} onClick={props.back}>
              {t('exit_modal_go_back')}
            </SecondaryBtn>
          ),
        },
        {
          Component: () => (
            <PrimaryBtn
              backgroundColor={C_BLUE}
              onClick={props.exit}
              marginLeft={SPACING_3}
            >
              {t('exit_modal_exit')}
            </PrimaryBtn>
          ),
        },
      ]}
      alertOverlay
    >
      {t('exit_modal_body')}
    </AlertModal>
  )
}
