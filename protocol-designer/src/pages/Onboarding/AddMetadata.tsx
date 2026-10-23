import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  SPACING,
  StyledText,
  TextAreaField,
} from '@opentrons/components'

import { analyticsEvent } from '/protocol-designer/analytics/actions'
import { ONBOARDING_FLOW_DURATION_EVENT } from '/protocol-designer/analytics/constants'
import { HandleEnter } from '/protocol-designer/components/atoms'

import { WizardBody } from './WizardBody'

import type { ReactNode } from 'react'
import type { AnalyticsEvent } from '/protocol-designer/analytics/mixpanel'
import type { WizardTileProps } from './types'

interface AddMetadataProps extends WizardTileProps {
  analyticsStartTime: Date
}
export function AddMetadata(props: AddMetadataProps): ReactNode {
  const { goBack, proceed, watch, register, analyticsStartTime } = props
  const { t } = useTranslation(['onboarding', 'shared'])
  const dispatch = useDispatch()

  const handleProceed = (): void => {
    const duration = new Date().getTime() - analyticsStartTime.getTime()
    const onboardingDuration: AnalyticsEvent = {
      name: ONBOARDING_FLOW_DURATION_EVENT,
      properties: { duration: `${duration / 1000} seconds` },
    }
    dispatch(analyticsEvent(onboardingDuration))
    proceed(1)
  }
  return (
    <HandleEnter onEnter={handleProceed}>
      <WizardBody
        subStepNumber={6}
        stepNumber={3}
        header={t('tell_us')}
        disabled={false}
        goBack={() => {
          goBack(1)
        }}
        proceed={handleProceed}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing16}
          padding={`0 ${SPACING.spacing4}`}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
              {t('name')}
            </StyledText>
            <InputField
              aria-label={t('name')}
              {...register('fields.name')}
              type="text"
              value={watch('fields.name')}
              min=""
              max=""
              autoFocus
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <TextAreaField
              label={t('description')}
              {...register('fields.description')}
              value={watch('fields.description') ?? ''}
              height="6.8125rem"
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
              {t('author_org')}
            </StyledText>
            <InputField
              aria-label={t('author_org')}
              {...register('fields.organizationOrAuthor')}
              type="text"
              value={watch('fields.organizationOrAuthor')}
              min=""
              max=""
            />
          </Flex>
        </Flex>
      </WizardBody>
    </HandleEnter>
  )
}
