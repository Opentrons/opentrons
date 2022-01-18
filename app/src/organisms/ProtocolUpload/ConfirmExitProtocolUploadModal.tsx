import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  NewSecondaryBtn,
  NewPrimaryBtn,
  SPACING_3,
  Icon,
  SIZE_1,
  SPACING_2,
} from '@opentrons/components'

interface ConfirmExitProtocolUploadModalProps {
  back: () => unknown
  exit: () => unknown
  isRobotMoving: boolean
}

export function ConfirmExitProtocolUploadModal(
  props: ConfirmExitProtocolUploadModalProps
): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const [isCancelRunInProgress, setIsCancelRunInProgress] = React.useState(
    false
  )

  if (props.isRobotMoving) {
    setIsCancelRunInProgress(true)
  }
  
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
              {isCancelRunInProgress ? (
                <Icon
                  name="ot-spinner"
                  size={SIZE_1}
                  marginRight={SPACING_2}
                  spin
                />
              ) : (
                t('exit_modal_exit')
              )}
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
