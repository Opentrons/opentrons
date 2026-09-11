import { useTranslation } from 'react-i18next'

import { Banner, DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { DataFilesInfoBanner } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader/RunHeaderBannerContainer/DataFilesInfoBanner'

import { useIsDoorOpen } from '../hooks'
import { getShowGenericRunHeaderBanners } from './getShowGenericRunHeaderBanners'
import { ProtocolAnalysisErrorBanner } from './ProtocolAnalysisErrorBanner'
import {
  TerminalRunBannerContainer,
  useTerminalRunBannerContainer,
} from './TerminalRunBannerContainer'

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
  hasImages: boolean
  hasCsvFiles: boolean
  closeCurrentRun: () => void
  isClosingCurrentRun: boolean
}

// Holds all the various banners that render in ProtocolRunHeader.
export function RunHeaderBannerContainer(
  props: RunHeaderBannerContainerProps
): JSX.Element | null {
  const {
    runStatus,
    enteredER,
    runHeaderModalContainerUtils,
    hasImages,
    hasCsvFiles,
    robotName,
  } = props
  const { analysisErrorModalUtils } = runHeaderModalContainerUtils

  const { t } = useTranslation(['run_details', 'shared'])
  const doorStatus = useIsDoorOpen(robotName)

  const {
    showDoorOpenBeforeRunBanner,
    showDoorOpenDuringRunBanner,
    showStackerDoorOpenBeforeRunBanner,
    showStackerDoorOpenDuringRunBanner,
    showUnconfiguredStackerDoorOpenBeforeRunBanner,
    showUnconfiguredStackerDoorOpenDuringRunBanner,
  } = getShowGenericRunHeaderBanners({
    runStatus,
    doorStatus,
    enteredER,
  })

  let doorBannerText: string | null = null
  if (showDoorOpenBeforeRunBanner) {
    doorBannerText = t('shared:close_robot_door')
  } else if (showDoorOpenDuringRunBanner) {
    doorBannerText = t('close_door_to_resume_run')
  } else if (showStackerDoorOpenBeforeRunBanner) {
    doorBannerText = t('shared:close_stacker_door', {
      module_door_location: doorStatus.moduleDoorLocation,
    })
  } else if (showUnconfiguredStackerDoorOpenBeforeRunBanner) {
    doorBannerText = t('shared:close_unconfigured_stacker_door', {
      module_door_location: doorStatus.moduleDoorLocation,
    })
  } else if (showStackerDoorOpenDuringRunBanner) {
    doorBannerText = t('close_stacker_to_resume_run', {
      module_door_location: doorStatus.moduleDoorLocation,
    })
  } else if (showUnconfiguredStackerDoorOpenDuringRunBanner) {
    doorBannerText = t('close_unconfigured_stacker_to_resume_run')
  }

  const terminalBannerType = useTerminalRunBannerContainer(props)

  return (
    <Flex gap={SPACING.spacing4} flexDirection={DIRECTION_COLUMN}>
      {analysisErrorModalUtils.showModal ? (
        <ProtocolAnalysisErrorBanner
          errors={analysisErrorModalUtils.modalProps.errors}
        />
      ) : null}
      {doorBannerText ? (
        <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
          {doorBannerText}
        </Banner>
      ) : null}
      {terminalBannerType != null ? (
        <TerminalRunBannerContainer
          bannerType={terminalBannerType}
          {...props}
        />
      ) : null}
      {hasImages || hasCsvFiles ? (
        <DataFilesInfoBanner
          hasImages={hasImages}
          hasCsvFiles={hasCsvFiles}
          robotName={robotName}
        />
      ) : null}
    </Flex>
  )
}
