import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  Link,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  Modal,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useRobot } from '/app/redux-resources/robots'
import { CONNECTABLE } from '/app/redux/discovery'
import {
  clearWifiStatus,
  getNetworkInterfaces,
  postWifiDisconnect,
} from '/app/redux/networking'
import { useWifiList } from '/app/resources/networking/hooks'
import {
  dismissRequest,
  getRequestById,
  useDispatchApiRequest,
  PENDING,
  FAILURE,
  SUCCESS,
} from '/app/redux/robot-api'

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

  const wifiList = useWifiList(robotName)
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )

  const activeNetwork = wifiList?.find(nw => nw.active)
  const ssid = activeNetwork?.ssid ?? null

  const [dispatchApi, requestIds] = useDispatchApiRequest()

  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? getRequestById(state, lastId) : null
  })
  const isRequestPending = requestState?.status === PENDING
  const isRequestFailed = requestState?.status === FAILURE
  const isRequestSucceeded = requestState?.status === SUCCESS

  const isError =
    requestState != null &&
    'error' in requestState &&
    requestState.error != null

  const handleDone = (): void => {
    const lastId = last(requestIds)
    if (lastId != null) {
      dispatch(dismissRequest(lastId))
    }
  }

  const handleCancel = (): void => {
    handleDone()
    onCancel()
  }

  const handleDisconnect = (): void => {
    if (ssid != null) {
      dispatchApi(postWifiDisconnect(robotName, ssid))
    }
  }

  const dispatch = useDispatch<Dispatch>()

  let disconnectModalBody: string = t('are_you_sure_you_want_to_disconnect', {
    ssid,
  })

  // if the disconnect request is sent when there is no wired connection, we will not receive a success response to the request once wi-fi has disconnected
  // check for connectable robot health status and presume successful disconnection if request pending and robot not connectable
  const { status } = useRobot(robotName) ?? {}
  const isDisconnected =
    isRequestSucceeded ||
    (isRequestPending && status !== CONNECTABLE) ||
    // as a fallback, if polled wifi interface ipAddress is null presume successful disconnection
    wifi?.ipAddress == null

  if (isDisconnected) {
    disconnectModalBody = t('disconnect_from_wifi_network_success')
  } else if (isRequestPending) {
    disconnectModalBody = t('disconnecting_from_wifi_network', { ssid })
  } else if (isRequestFailed) {
    disconnectModalBody = t('disconnect_from_wifi_network_failure', { ssid })
  }

  useEffect(() => {
    if (isDisconnected) {
      dispatch(clearWifiStatus(robotName))
    }
  }, [isDisconnected])

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
        {isError ? (
          <LegacyStyledText as="p" marginBottom={SPACING.spacing24}>
            {requestState != null &&
            'error' in requestState &&
            'message' in requestState?.error
              ? requestState?.error?.message
              : t('shared:unknown_error')}
          </LegacyStyledText>
        ) : null}
        <LegacyStyledText as="p" marginBottom={SPACING.spacing24}>
          {disconnectModalBody}
        </LegacyStyledText>
        {isError ? (
          <LegacyStyledText as="p" marginBottom={SPACING.spacing24}>
            {t('branded:general_error_message')}
          </LegacyStyledText>
        ) : null}
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          {isDisconnected ? (
            <PrimaryButton onClick={handleCancel}>{t('done')}</PrimaryButton>
          ) : (
            <>
              <Link
                role="button"
                onClick={handleCancel}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
                marginRight={SPACING.spacing24}
                css={TYPOGRAPHY.linkPSemiBold}
              >
                {t('shared:cancel')}
              </Link>
              <AlertPrimaryButton onClick={handleDisconnect} width="8rem">
                {isRequestPending ? (
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
