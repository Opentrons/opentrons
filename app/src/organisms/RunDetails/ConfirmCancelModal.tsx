import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  SPACING,
  Flex,
  Link,
  AlertPrimaryButton,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  TYPOGRAPHY,
  COLORS,
  ALIGN_CENTER,
} from '@opentrons/components'
import {
  RUN_STATUS_STOPPED,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { Portal } from '../../App/portal'
import { StyledText } from '../../atoms/text'
import { LegacyModal } from '../../molecules/LegacyModal'
import { useTrackProtocolRunEvent } from '../Devices/hooks'
import { useRunStatus } from '../RunTimeControl/hooks'
import { ANALYTICS_PROTOCOL_RUN_CANCEL } from '../../redux/analytics'

export interface ConfirmCancelModalProps {
  onClose: () => unknown
  runId: string
}

export function ConfirmCancelModal(
  props: ConfirmCancelModalProps
): JSX.Element {
  const { onClose, runId } = props
  const { stopRun } = useStopRunMutation()
  const [isCanceling, setIsCanceling] = React.useState(false)
  const runStatus = useRunStatus(runId)
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)
  const { t } = useTranslation('run_details')

  const cancelRun: React.MouseEventHandler<HTMLButtonElement> = (e): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsCanceling(true)
    stopRun(runId, {
      onSuccess: () => {
        trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_CANCEL })
      },
      onError: () => {
        setIsCanceling(false)
      },
    })
  }
  React.useEffect(() => {
    if (
      runStatus === RUN_STATUS_STOP_REQUESTED ||
      runStatus === RUN_STATUS_STOPPED
    ) {
      onClose()
    }
  }, [runStatus, onClose])

  return (
    <Portal>
      <LegacyModal
        type="warning"
        onClose={isCanceling ? undefined : onClose}
        title={t('cancel_run_modal_heading')}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="p" marginBottom={SPACING.spacing24}>
            {t('cancel_run_alert_info')}
          </StyledText>
          <StyledText as="p" marginBottom={SPACING.spacing24}>
            {t('cancel_run_module_info')}
          </StyledText>
          <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
            {isCanceling ? null : (
              <Link
                role="button"
                onClick={onClose}
                marginRight={SPACING.spacing24}
                css={TYPOGRAPHY.linkPSemiBold}
              >
                {t('cancel_run_modal_back')}
              </Link>
            )}
            <AlertPrimaryButton
              backgroundColor={COLORS.errorEnabled}
              onClick={cancelRun}
              disabled={isCanceling}
              minWidth="8rem"
            >
              {isCanceling ? (
                <Icon size={TYPOGRAPHY.fontSizeP} spin name="ot-spinner" />
              ) : (
                t('cancel_run_modal_confirm')
              )}
            </AlertPrimaryButton>
          </Flex>
        </Flex>
      </LegacyModal>
    </Portal>
  )
}
