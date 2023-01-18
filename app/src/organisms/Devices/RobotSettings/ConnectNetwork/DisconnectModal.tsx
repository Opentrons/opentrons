import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  Flex,
  Link,
  Icon,
  useInterval,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { AlertPrimaryButton, PrimaryButton } from '../../../../atoms/buttons'
import { StyledText } from '../../../../atoms/text'
import { Modal } from '../../../../molecules/Modal'
import {
  fetchWifiList,
  getWifiList,
  postWifiDisconnect,
} from '../../../../redux/networking'
import {
  dismissRequest,
  getRequestById,
  useDispatchApiRequest,
  PENDING,
  FAILURE,
  SUCCESS,
} from '../../../../redux/robot-api'

import type { Dispatch, State } from '../../../../redux/types'

export interface DisconnectModalProps {
  onCancel: () => unknown
  robotName: string
}

const LIST_REFRESH_MS = 10000

export const DisconnectModal = ({
  onCancel,
  robotName,
}: DisconnectModalProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])

  const list = useSelector((state: State) => getWifiList(state, robotName))

  const activeNetwork = list?.find(nw => nw.active)
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

  useInterval(() => dispatch(fetchWifiList(robotName)), LIST_REFRESH_MS, true)

  let disconnectModalBody: string = t('are_you_sure_you_want_to_disconnect', {
    ssid,
  })

  if (isRequestPending) {
    disconnectModalBody = t('disconnecting_from_wifi_network', { ssid })
  } else if (isRequestFailed) {
    disconnectModalBody = t('disconnect_from_wifi_network_failure', { ssid })
  } else if (isRequestSucceeded) {
    disconnectModalBody = t('disconnect_from_wifi_network_success')
  }

  return (
    <Modal
      type="warning"
      title={
        isRequestSucceeded
          ? t('disconnected_from_wifi')
          : t('disconnect_from_ssid', { ssid })
      }
      onClose={onCancel}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {isError ? (
          <StyledText as="p" marginBottom={SPACING.spacing5}>
            {requestState != null &&
            'error' in requestState &&
            'message' in requestState?.error
              ? requestState?.error?.message
              : t('shared:unknown_error')}
          </StyledText>
        ) : null}
        <StyledText as="p" marginBottom={SPACING.spacing5}>
          {disconnectModalBody}
        </StyledText>
        {isError ? (
          <StyledText as="p" marginBottom={SPACING.spacing5}>
            {t('shared:general_error_message')}
          </StyledText>
        ) : null}
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          {isRequestSucceeded ? (
            <PrimaryButton onClick={handleCancel}>{t('done')}</PrimaryButton>
          ) : (
            <>
              <Link
                role="button"
                onClick={handleCancel}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
                marginRight={SPACING.spacing5}
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
