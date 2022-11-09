import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'

import type { RequestState } from '../../redux/robot-api/types'

interface ConnectedResultProps {
  ssid: string
  isConnected: boolean
  requestState?: RequestState
  onConnect: () => void
}

export function ConnectedResult({
  ssid,
  isConnected,
  requestState,
  onConnect,
}: ConnectedResultProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const history = useHistory()

  return (
    <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
      <Flex
        height="26.5625rem"
        backgroundColor={COLORS.successBackgroundMed}
        justifyContent={JUSTIFY_CENTER}
        marginBottom={SPACING.spacing6}
      >
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
        >
          <Icon
            name={isConnected ? 'ot-check' : 'ot-alert'}
            size="4.375rem"
            color={isConnected ? COLORS.successEnabled : COLORS.errorEnabled}
            aria-label={
              isConnected ? 'connected_to_network' : 'failed_to_connect'
            }
          />
          <StyledText
            fontSize="2rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            lineHeight="2.72375rem"
            marginTop={SPACING.spacingXXL}
          >
            {isConnected
              ? t('connected_to_ssid', { ssid: ssid })
              : t('failed_to_connect_to_ssid', { ssid: ssid })}
          </StyledText>
          {!isConnected && requestState?.error.message && (
            <StyledText marginTop={SPACING.spacing4}>
              {requestState.error.message}
            </StyledText>
          )}
        </Flex>
      </Flex>
      <Flex gridRow="0.75rem">
        {isConnected ? (
          <>
            <SecondaryButton
              flex="1"
              onClick={() => history.push(`/selectNetwork`)}
            >
              {t('change_network')}
            </SecondaryButton>
            <PrimaryButton
              flex="1"
              onClick={() => history.push(`/connectedNetworkInfo/${ssid}`)}
            >
              {t('done')}
            </PrimaryButton>
          </>
        ) : (
          <>
            <SecondaryButton flex="1" onClick={onConnect}>
              {t('try_again')}
            </SecondaryButton>
            <PrimaryButton
              flex="1"
              onClick={() => history.push(`/selectNetwork`)}
            >
              {t('change_network')}
            </PrimaryButton>
          </>
        )}
      </Flex>
    </Flex>
  )
}
