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
  Flex,
  DIRECTION_ROW,
} from '@opentrons/components'

interface ConfirmExitProtocolUploadModalProps {
  back: () => unknown
  exit: () => unknown
  isRunCloseSuccessful?: boolean
}

export function ConfirmExitProtocolUploadModal(
  props: ConfirmExitProtocolUploadModalProps
): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const [isRunClosing, setRunClosing] = React.useState<boolean>(false)
  console.log(props.isRunCloseSuccessful, 'run close successful')

  const close = (): void => {
    setRunClosing(true)
    if (props.isRunCloseSuccessful === true) {
      props.exit()
    }
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
            <NewPrimaryBtn onClick={close} marginLeft={SPACING_3}>
              <Flex flexDirection={DIRECTION_ROW}>
                {isRunClosing ? (
                  <Icon
                    name="ot-spinner"
                    size={SIZE_1}
                    marginRight={SPACING_2}
                    spin
                  />
                ) : null}
                {t('exit_modal_exit')}
              </Flex>
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
