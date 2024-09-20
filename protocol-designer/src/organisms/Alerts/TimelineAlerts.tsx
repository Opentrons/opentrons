import * as React from 'react'

import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  Banner,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getRobotStateTimeline } from '../../file-data/selectors'
import { ErrorContents } from './ErrorContents'
import type { CommandCreatorError } from '@opentrons/step-generation'
import type { AlertData, AlertType } from './types'

type MakeAlert = (
  alertType: AlertType,
  data: AlertData,
  key: number | string
) => JSX.Element

const TimelineAlertsComponent = (): JSX.Element => {
  const { t } = useTranslation('alert')

  const timeline = useSelector(getRobotStateTimeline)

  const timelineErrors = (timeline.errors || ([] as CommandCreatorError[])).map(
    (error: CommandCreatorError) => ({
      title: t(`timeline.error.${error.type}.title`, error.message),
      description: <ErrorContents level="timeline" errorType={error.type} />,
    })
  )

  const makeAlert: MakeAlert = (alertType, data, key) => (
    <Banner
      type={alertType === 'error' ? 'error' : 'warning'}
      key={`${alertType}:${key}`}
      width="50vw"
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        alignItems={ALIGN_CENTER}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">{data.title}</StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {data.description}
        </StyledText>
      </Flex>
    </Banner>
  )

  return (
    <>{timelineErrors.map((error, key) => makeAlert('error', error, key))}</>
  )
}

export const TimelineAlerts = React.memo(TimelineAlertsComponent)
