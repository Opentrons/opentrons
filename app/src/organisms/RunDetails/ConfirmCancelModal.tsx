import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertModal,
  NewPrimaryBtn,
  NewSecondaryBtn,
  SPACING_3,
} from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { Portal } from '../../App/portal'
import { useTrackProtocolRunEvent } from '../Devices/hooks'

export interface ConfirmCancelModalProps {
  onClose: () => unknown
  runId: string | null
}

export function ConfirmCancelModal(
  props: ConfirmCancelModalProps
): JSX.Element {
  const { onClose, runId } = props
  const { stopRun } = useStopRunMutation()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)
  const { t } = useTranslation('run_details')

  const cancel: React.MouseEventHandler<HTMLButtonElement> = (e): void => {
    e.preventDefault()
    e.stopPropagation()
    onClose()

    if (runId != null) {
      stopRun(runId)

      trackProtocolRunEvent({ name: 'runCancel' })
    }
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
