import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'

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

import type { NavRouteParams } from '../../App/types'

interface ConnectionResultProps {
  isConnected: boolean
  requestState?: any
}

export function ConnectionResult({
  isConnected,
}: ConnectionResultProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { ssid } = useParams<NavRouteParams>()
  const history = useHistory()

  // ToDo use isConnected for rendering parts
  return (
    <>
      {isConnected ? (
        <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
          <Flex justifyContent={JUSTIFY_CENTER}>
            <StyledText
              fontSize="2rem"
              fontWeight="700"
              lineHeight="2.72375rem"
            >
              {t('connect_to_a_network')}
            </StyledText>
          </Flex>
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
                name="ot-check"
                size="4.375rem"
                color={COLORS.successEnabled}
                aria-label="spinner"
              />
              <StyledText
                fontSize="2rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                lineHeight="2.72375rem"
                marginTop={SPACING.spacingXXL}
              >
                {`Connected to ${ssid}`}
              </StyledText>
            </Flex>
          </Flex>
          <Flex gridRow="0.75rem">
            <SecondaryButton
              flex="1"
              onClick={() => history.push(`/selectNetwork`)}
            >
              {'Change network'}
            </SecondaryButton>
            <PrimaryButton
              flex="1"
              onClick={() => history.push(`/connectedNetworkInfo/${ssid}`)}
            >
              {'Done'}
            </PrimaryButton>
          </Flex>
        </Flex>
      ) : (
        <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
          <Flex justifyContent={JUSTIFY_CENTER}>
            <StyledText
              fontSize="2rem"
              fontWeight="700"
              lineHeight="2.72375rem"
            >
              {'Connect to a network'}
            </StyledText>
          </Flex>
          <Flex
            height="26.5625rem"
            backgroundColor={COLORS.errorBackgroundMed}
            justifyContent={JUSTIFY_CENTER}
            marginBottom={SPACING.spacing6}
          >
            <Flex
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_COLUMN}
            >
              <Icon
                name="ot-alert"
                size="4.375rem"
                color={COLORS.errorEnabled}
                aria-label="spinner"
              />
              <StyledText
                fontSize="2rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                lineHeight="2.72375rem"
                marginTop={SPACING.spacingXXL}
              >
                {`Connected to ${ssid}`}
              </StyledText>
            </Flex>
          </Flex>
          <Flex gridRow="0.75rem">
            <SecondaryButton
              flex="1"
              onClick={() => console.log('need to call connect again')}
            >
              {'Try again'}
            </SecondaryButton>
            <PrimaryButton
              flex="1"
              onClick={() => history.push(`/selectNetwork`)}
            >
              {'Change network'}
            </PrimaryButton>
          </Flex>
        </Flex>
      )}
    </>
  )
}
