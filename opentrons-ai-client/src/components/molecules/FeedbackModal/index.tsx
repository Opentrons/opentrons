import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAtom } from 'jotai'

import {
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ANALYTICS } from '/ai-client/analytics/constants'
import { feedbackModalAtom } from '/ai-client/resources/atoms'
import {
  LOCAL_FEEDBACK_END_POINT,
  PROD_FEEDBACK_END_POINT,
  STAGING_FEEDBACK_END_POINT,
} from '/ai-client/resources/constants'
import { useApiCall } from '/ai-client/resources/hooks'
import { useGetAccessToken } from '/ai-client/resources/hooks/useGetAccessToken'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'

import type { AxiosRequestConfig } from 'axios'

type Env = 'production' | 'development' | 'staging'

const getEnv = (): Env =>
  _NODE_ENV_ === 'production'
    ? 'production'
    : _NODE_ENV_ === 'development'
      ? 'development'
      : 'staging'

const pickEndpoint = (endpoints: {
  production: string
  development: string
  staging: string
}): string => endpoints[getEnv()]

export function FeedbackModal(): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const trackEvent = useTrackEvent()

  const [feedbackValue, setFeedbackValue] = useState<string>('')
  const [, setShowFeedbackModal] = useAtom(feedbackModalAtom)
  const { getAccessToken } = useGetAccessToken()
  const { callApi, error, isLoading, data } = useApiCall()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSendFeedback = async (): Promise<void> => {
    let token: string
    try {
      token = await getAccessToken()
    } catch {
      return
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    const url = pickEndpoint({
      production: PROD_FEEDBACK_END_POINT,
      development: LOCAL_FEEDBACK_END_POINT,
      staging: STAGING_FEEDBACK_END_POINT,
    })

    const config = {
      url,
      method: 'POST',
      headers,
      data: {
        feedbackText: feedbackValue,
        fake: false,
      },
    }
    setIsSubmitting(true)
    await callApi(config as AxiosRequestConfig)
  }

  useEffect(
    () => {
      if (isSubmitting && !isLoading) {
        if (!error && data) {
          // Success - track event and close modal
          trackEvent({
            name: ANALYTICS.FEEDBACK_SENT,
            properties: {
              feedback: feedbackValue,
            },
          })
          setShowFeedbackModal(false)
        }
        setIsSubmitting(false)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSubmitting, isLoading, error, data, feedbackValue]
  )

  return (
    <Modal
      title={t(`send_feedback_to_opentrons`)}
      onClose={() => {
        setShowFeedbackModal(false)
      }}
      footer={
        <Flex
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          gridGap={SPACING.spacing8}
          justifyContent={ALIGN_FLEX_END}
        >
          <SecondaryButton
            onClick={() => {
              setShowFeedbackModal(false)
            }}
          >
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t(`cancel`)}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton
            disabled={feedbackValue === '' || isLoading}
            onClick={async () => {
              await handleSendFeedback()
            }}
          >
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t(`send_feedback`)}
            </StyledText>
          </PrimaryButton>
        </Flex>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        {error != null && (
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.red50}>
            {error.message}
          </StyledText>
        )}
        <InputField
          title={t(`send_feedback_input_title`)}
          size="medium"
          value={feedbackValue}
          onChange={event => {
            setFeedbackValue(event.target.value as string)
          }}
        />
      </Flex>
    </Modal>
  )
}
