import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { SPACING } from '@opentrons/components'

import { ProtocolAnalysisErrorBanner } from './ProtocolAnalysisErrorBanner'
import { Banner } from '../../../../../atoms/Banner'
import { TerminalRunBanner } from './TerminalRunBanner'
import { getShowGenericRunHeaderBanners } from './getShowGenericRunHeaderBanners'
import { useIsDoorOpen } from '../hooks'
import { useMostRecentRunId } from '../../../../ProtocolUpload/hooks/useMostRecentRunId'

import type { RunStatus } from '@opentrons/api-client'
import type { ProtocolRunHeaderProps } from '..'
import type { UseRunErrorsResult } from '../hooks'
import type { UseRunHeaderModalContainerResult } from '../RunHeaderModalContainer'

export type RunHeaderBannerContainerProps = ProtocolRunHeaderProps & {
  runStatus: RunStatus | null
  enteredER: boolean
  isResetRunLoading: boolean
  runErrors: UseRunErrorsResult
  runHeaderModalContainerUtils: UseRunHeaderModalContainerResult
}

// Holds all the various banners that render in ProtocolRunHeader.
export function RunHeaderBannerContainer(
  props: RunHeaderBannerContainerProps
): JSX.Element | null {
  const { runStatus, enteredER, runId, runHeaderModalContainerUtils } = props
  const {
    analysisErrorModalUtils,
    runFailedModalUtils,
  } = runHeaderModalContainerUtils

  const { t } = useTranslation(['run_details', 'shared'])
  const isDoorOpen = useIsDoorOpen(props.robotName)
  const mostRecentRunId = useMostRecentRunId()
  const isMostRecentRun = mostRecentRunId === runId

  const {
    showRunCanceledBanner,
    showDoorOpenBeforeRunBanner,
    showDoorOpenDuringRunBanner,
  } = getShowGenericRunHeaderBanners({
    runStatus,
    isDoorOpen,
    enteredER,
  })

  return (
    <>
      {analysisErrorModalUtils.showModal ? (
        <ProtocolAnalysisErrorBanner
          errors={analysisErrorModalUtils.modalProps.errors}
        />
      ) : null}
      {showRunCanceledBanner ? (
        <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
          {t('run_canceled')}
        </Banner>
      ) : null}
      {showDoorOpenBeforeRunBanner ? (
        <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
          {t('shared:close_robot_door')}
        </Banner>
      ) : null}
      {showDoorOpenDuringRunBanner ? (
        <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
          {t('close_door_to_resume')}
        </Banner>
      ) : null}
      {isMostRecentRun ? (
        <TerminalRunBanner
          {...props}
          toggleRunFailedModal={runFailedModalUtils.toggleModal}
        />
      ) : null}
    </>
  )
}
