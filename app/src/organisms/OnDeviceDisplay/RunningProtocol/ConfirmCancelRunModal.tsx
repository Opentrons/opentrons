import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import {
  useStopRunMutation,
  useDismissCurrentRunMutation,
} from '@opentrons/react-api-client'

import { StyledText } from '../../../atoms/text'
import { SmallButton } from '../../../atoms/buttons'
import { Modal } from '../../../molecules/Modal/OnDeviceDisplay/Modal'
import { useTrackProtocolRunEvent } from '../../../organisms/Devices/hooks'
import { ANALYTICS_PROTOCOL_RUN_CANCEL } from '../../../redux/analytics'
import { useCloseCurrentRun } from '../../ProtocolUpload/hooks'

import type { ModalHeaderBaseProps } from '../../../molecules/Modal/OnDeviceDisplay/types'

interface ConfirmCancelRunModalProps {
  runId: string
  setShowConfirmCancelRunModal: (showConfirmCancelRunModal: boolean) => void
  isActiveRun: boolean
  protocolId?: string | null
}

export function ConfirmCancelRunModal({
  runId,
  setShowConfirmCancelRunModal,
  isActiveRun,
  protocolId,
}: ConfirmCancelRunModalProps): JSX.Element {
  const { t } = useTranslation(['run_details', 'shared'])
  const { stopRun } = useStopRunMutation()
  const {
    dismissCurrentRun,
    isLoading: isDismissing,
  } = useDismissCurrentRunMutation()
  const { closeCurrentRun, isClosingCurrentRun } = useCloseCurrentRun()
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId)
  const history = useHistory()
  const [isCanceling, setIsCanceling] = React.useState(false)

  const modalHeader: ModalHeaderBaseProps = {
    title: t('cancel_run_modal_heading'),
    hasExitIcon: false,
    iconName: 'ot-alert',
    iconColor: COLORS.yellow2,
  }

  const handleCancelRun = (): void => {
    setIsCanceling(true)
    stopRun(runId, {
      onSuccess: () => {
        trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_CANCEL })
        dismissCurrentRun(runId)
        if (isActiveRun) {
          history.push(`/protocols/${runId}/summary`)
        } else {
          history.push('/dashboard')
        }
      },
      onError: () => {
        closeCurrentRun()
        if (isActiveRun) {
          history.push(`/protocols/${runId}/summary`)
        } else {
          history.push('/dashboard')
        }
        setIsCanceling(false)
      },
    })
  }

  return (
    <Modal
      modalSize="medium"
      header={modalHeader}
      isError={isActiveRun}
      onOutsideClick={() => setShowConfirmCancelRunModal(false)}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={SPACING.spacing6}
          gridGap="0.75rem"
        >
          <StyledText
            fontSize={TYPOGRAPHY.fontSize22}
            lineHeight={TYPOGRAPHY.lineHeight28}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('cancel_run_alert_info')}
          </StyledText>
          <StyledText
            fontSize={TYPOGRAPHY.fontSize22}
            lineHeight={TYPOGRAPHY.lineHeight28}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('cancel_run_module_info')}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing3}
          width="100%"
        >
          <SmallButton
            flex="1"
            buttonType="primary"
            buttonText={t('shared:go_back')}
            onClick={() => setShowConfirmCancelRunModal(false)}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('cancel_run')}
            onClick={handleCancelRun}
            disabled={isCanceling || isDismissing || isClosingCurrentRun}
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
