import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  Icon,
  NewSecondaryBtn,
  NewPrimaryBtn,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import { useCurrentProtocolRun } from './hooks/useCurrentProtocolRun'

interface ConfirmExitProtocolUploadModalProps {
  back: () => unknown
  exit: () => unknown
}

export function ConfirmExitProtocolUploadModal(
  props: ConfirmExitProtocolUploadModalProps
): JSX.Element {
  const { t } = useTranslation('protocol_info')

  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const { protocolRecord, runRecord } = useCurrentProtocolRun()

  React.useEffect(() => {
    if (isLoading && protocolRecord == null && runRecord == null) {
      setIsLoading(false)
      props.back()
    }
  }, [isLoading, protocolRecord, runRecord, props])

  const handleExitClick = (): void => {
    setIsLoading(true)
    props.exit()
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
          Component: () =>
            isLoading ? (
              <NewPrimaryBtn disabled marginLeft={SPACING_3}>
                <Icon
                  name="ot-spinner"
                  size={'0.675rem'}
                  marginRight={SPACING_2}
                  spin
                />
                {t('exit_modal_closing')}
              </NewPrimaryBtn>
            ) : (
              <NewPrimaryBtn onClick={handleExitClick} marginLeft={SPACING_3}>
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
