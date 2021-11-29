import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  RUN_STATUS_RUNNING,
  RUN_STATUS_PAUSE_REQUESTED,
  RUN_STATUS_PAUSED,
  RUN_STATUS_STOP_REQUESTED,
  RUN_STATUS_STOPPED,
  RUN_STATUS_FAILED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import {
  DIRECTION_COLUMN,
  SPACING_2,
  SPACING_3,
  FONT_SIZE_BODY_2,
  C_DARK_GRAY,
  AlertItem,
  AlertType,
  Box,
  Flex,
  Text,
  Link,
  SPACING_1,
} from '@opentrons/components'

import { useRunStatus } from '../RunTimeControl/hooks'
import { RunSetupCard } from './RunSetupCard'
import { MetadataCard } from './MetadataCard'
import { LPCSuccessToastContext } from './hooks'
import { LabwareOffsetSuccessToast } from './LabwareOffsetSuccessToast'

const feedbackFormLink =
  'https://docs.google.com/forms/d/e/1FAIpQLSd6oSV82IfgzSi5t_FP6n_pB_Y8wPGmAgFHsiiFho9qhxr-UQ/viewform'

export function ProtocolSetup(): JSX.Element {
  const [showLPCSuccessToast, setShowLPCSuccessToast] = React.useState(true)
  const { t } = useTranslation(['protocol_setup'])

  const runStatus = useRunStatus()

  let alertType: AlertType | null = null
  let alertTitle: string = ''

  if (
    runStatus === RUN_STATUS_RUNNING ||
    runStatus === RUN_STATUS_PAUSED ||
    runStatus === RUN_STATUS_PAUSE_REQUESTED
  ) {
    alertType = 'warning'
    alertTitle = `${t('protocol_run_started')} ${t(
      'recalibrating_not_available'
    )}`
  } else if (runStatus === RUN_STATUS_SUCCEEDED) {
    alertType = 'success'
    alertTitle = `${t('protocol_run_complete')} ${t('protocol_can_be_closed')}`
  } else if (runStatus === RUN_STATUS_FAILED) {
    alertType = 'error'
    alertTitle = `${t('protocol_run_failed')} ${t(
      'recalibrating_not_available'
    )}`
  } else if (
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_STOP_REQUESTED
  ) {
    alertType = 'error'
    alertTitle = `${t('protocol_run_canceled')} ${t(
      'recalibrating_not_available'
    )}`
  }

  return (
    <>
      {alertType != null ? (
        <Box padding={SPACING_2} width="100%">
          <AlertItem type={alertType} title={alertTitle} />
        </Box>
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING_1} ${SPACING_3} ${SPACING_3} ${SPACING_3}`}
      >
        {showLPCSuccessToast && (
          <LabwareOffsetSuccessToast
            onCloseClick={() => setShowLPCSuccessToast(false)}
          />
        )}
        <MetadataCard />
        <LPCSuccessToastContext.Provider
          value={{
            setShowLPCSuccessToast,
          }}
        >
          <RunSetupCard />
        </LPCSuccessToastContext.Provider>
        <Text
          fontSize={FONT_SIZE_BODY_2}
          paddingTop={SPACING_3}
          color={C_DARK_GRAY}
        >
          {t('protocol_upload_revamp_feedback')}
          <Link href={feedbackFormLink} external>
            {' '}
            {t('feedback_form_link')}
          </Link>
        </Text>
      </Flex>
    </>
  )
}
