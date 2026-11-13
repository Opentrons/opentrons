import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  Link,
  Modal,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { isDocumentedMutationError } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useResetRobotConfigMutation } from '/app/resources/devices/hooks/useResetRobotConfigMutation'

import type { ReactNode } from 'react'
import type { ResetConfigRequest } from '@opentrons/api-client'

interface DeviceResetModalProps {
  closeModal: () => void
  isRobotReachable: boolean
  robotName: string
  resetOptions?: ResetConfigRequest
}

export function DeviceResetModal({
  closeModal,
  isRobotReachable,
  robotName,
  resetOptions,
}: DeviceResetModalProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'shared', 'branded'])
  const navigate = useNavigate()
  const documentationState = useDocumentationState()
  const { postResetConfig, isLoading, reset } = useResetRobotConfigMutation(
    documentationState,
    robotName,
    {
      onSuccess: () => {
        closeModal()
        navigate('/devices/')
      },
      onError: error => {
        if (isDocumentedMutationError(error)) {
          reset()
        }
      },
    }
  )

  const triggerReset = (): void => {
    if (resetOptions != null) {
      postResetConfig(resetOptions)
    }
  }

  return (
    <>
      {isRobotReachable ? (
        <Modal
          type="warning"
          title={t('reset_to_factory_settings')}
          onClose={closeModal}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText forwardedAs="p" paddingBottom={SPACING.spacing24}>
              {t('factory_reset_modal_description')}
            </LegacyStyledText>
            <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
              <Link
                role="button"
                onClick={closeModal}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
                marginRight={SPACING.spacing24}
                css={TYPOGRAPHY.linkPSemiBold}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {t('shared:cancel')}
              </Link>
              <PrimaryButton
                variant="warning"
                onClick={triggerReset}
                disabled={isLoading}
              >
                {t('shared:confirm')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <Modal
          type="warning"
          title={t('connection_to_robot_lost')}
          onClose={closeModal}
        >
          <LegacyStyledText
            forwardedAs="p"
            marginBottom={SPACING.spacing24}
            paddingBottom={SPACING.spacing24}
          >
            {t('branded:connection_lost_description')}
          </LegacyStyledText>
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <PrimaryButton
              onClick={closeModal}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
            >
              {t('shared:close')}
            </PrimaryButton>
          </Flex>
        </Modal>
      )}
    </>
  )
}
