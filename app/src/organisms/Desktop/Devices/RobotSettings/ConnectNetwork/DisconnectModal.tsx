import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  Link,
  Modal,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { usePostWifiDisconnectMutation } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import { CONNECTABLE } from '/app/redux/discovery'
import { clearWifiStatus, getNetworkInterfaces } from '/app/redux/networking'
import { useWifiList } from '/app/resources/networking/hooks'

import type { Dispatch, State } from '/app/redux/types'

export interface DisconnectModalProps {
  onCancel: () => unknown
  robotName: string
}

export const DisconnectModal = ({
  onCancel,
  robotName,
}: DisconnectModalProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared', 'branded'])

  const disconnectMutation = usePostWifiDisconnectMutation()

  const wifiList = useWifiList(robotName)
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )

  const activeNetwork = wifiList?.find(nw => nw.active)
  const ssid = activeNetwork?.ssid ?? null

  const handleDisconnect = (): void => {
    if (ssid != null) {
      disconnectMutation.mutate({ ssid })
    }
  }

  const dispatch = useDispatch<Dispatch>()

  // if the disconnect request is sent when there is no wired connection, we will not receive a success response to the request once wi-fi has disconnected
  // check for connectable robot health status and presume successful disconnection if request pending and robot not connectable
  const { status } = useRobot(robotName) ?? {}
  const isDisconnected =
    disconnectMutation.status === 'success' ||
    ((disconnectMutation.status === 'loading' ||
      disconnectMutation.status === 'error') &&
      (status !== CONNECTABLE || wifi?.ipAddress == null))

  let disconnectModalBody: string = t('are_you_sure_you_want_to_disconnect', {
    ssid,
  })
  if (isDisconnected) {
    disconnectModalBody = t('disconnect_from_wifi_network_success')
  } else if (disconnectMutation.status === 'loading') {
    disconnectModalBody = t('disconnecting_from_wifi_network', { ssid })
  } else if (disconnectMutation.status === 'error') {
    disconnectModalBody = t('disconnect_from_wifi_network_failure', { ssid })
  }

  useEffect(
    () => {
      if (isDisconnected) {
        dispatch(clearWifiStatus(robotName))
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDisconnected]
  )

  return (
    <Modal
      type="warning"
      title={
        isDisconnected
          ? t('disconnected_from_wifi')
          : t('disconnect_from_ssid', { ssid })
      }
      onClose={onCancel}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {disconnectMutation.status === 'error' ? (
          <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing24}>
            {disconnectMutation.error != null &&
            'message' in disconnectMutation.error
              ? disconnectMutation.error.message
              : t('shared:unknown_error')}
          </LegacyStyledText>
        ) : null}
        <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing24}>
          {disconnectModalBody}
        </LegacyStyledText>
        {disconnectMutation.status === 'error' ? (
          <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing24}>
            {t('branded:general_error_message')}
          </LegacyStyledText>
        ) : null}
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          {isDisconnected ? (
            <PrimaryButton onClick={onCancel}>{t('done')}</PrimaryButton>
          ) : (
            <>
              <Link
                role="button"
                onClick={onCancel}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
                marginRight={SPACING.spacing24}
                css={TYPOGRAPHY.linkPSemiBold}
              >
                {t('shared:cancel')}
              </Link>
              <AlertPrimaryButton onClick={handleDisconnect} width="8rem">
                {disconnectMutation.status === 'loading' ? (
                  <Flex
                    alignItems={ALIGN_CENTER}
                    justifyContent={JUSTIFY_CENTER}
                  >
                    <Icon
                      name="ot-spinner"
                      size="1.125rem"
                      aria-label="spinner"
                      spin
                    />
                  </Flex>
                ) : (
                  t('disconnect')
                )}
              </AlertPrimaryButton>
            </>
          )}
        </Flex>
      </Flex>
    </Modal>
  )
}
