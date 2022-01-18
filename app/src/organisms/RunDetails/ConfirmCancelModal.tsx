import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  DIRECTION_ROW,
  Flex,
  Icon,
  NewPrimaryBtn,
  NewSecondaryBtn,
  SIZE_1,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'

import { Portal } from '../../App/portal'
import { useRunControls } from '../RunTimeControl/hooks'

export interface ConfirmCancelModalProps {
  onClose: () => unknown
  isRunCancelling?: boolean
  isRunIdleOrStopped?: boolean
}

export function ConfirmCancelModal(
  props: ConfirmCancelModalProps
): JSX.Element {
  const { onClose } = props
  const { stop } = useRunControls()
  const { t } = useTranslation('run_details')
  const [isRunCancelling, setRunCancelling] = React.useState<boolean>(false)

  console.log('is run cancelling', props.isRunCancelling)
  console.log(props.isRunIdleOrStopped, 'run is idle')

  const cancel = (): void => {
    stop()
    setRunCancelling(true)
    if (props.isRunIdleOrStopped) {
      onClose()
    }
  }

  return (
    <Portal>
      <AlertModal
        heading={t('cancel_run_modal_heading')}
        buttons={[
          {
            Component: () => (
              <NewSecondaryBtn onClick={onClose} marginLeft={SPACING_3}>
                {t('cancel_run_modal_back')}
              </NewSecondaryBtn>
            ),
          },
          {
            Component: () => (
              <NewPrimaryBtn onClick={cancel} marginLeft={SPACING_3}>
                <Flex flexDirection={DIRECTION_ROW}>
                  {isRunCancelling ? (
                    <Icon
                      name="ot-spinner"
                      size={SIZE_1}
                      marginRight={SPACING_2}
                      spin
                    />
                  ) : null}
                  {t('cancel_run_modal_confirm')}
                </Flex>
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
