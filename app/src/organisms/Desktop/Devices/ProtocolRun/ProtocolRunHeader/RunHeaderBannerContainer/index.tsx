import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Banner,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  StyledText,
  TEXT_DECORATION_UNDERLINE,
} from '@opentrons/components'

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
  hasDownloadableFiles: boolean
}

// Holds all the various banners that render in ProtocolRunHeader.
export function RunHeaderBannerContainer(
  props: RunHeaderBannerContainerProps
): JSX.Element | null {
  const navigate = useNavigate()
  const {
    runStatus,
    enteredER,
    runHeaderModalContainerUtils,
    hasDownloadableFiles,
    robotName,
  } = props
  const { analysisErrorModalUtils } = runHeaderModalContainerUtils

  const { t } = useTranslation(['run_details', 'shared'])
  const doorStatus = useIsDoorOpen(robotName)

  const {
    showRunCanceledBanner,
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
    <Box>
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
      {hasDownloadableFiles ? (
        <Banner type="informing" marginTop={SPACING.spacing16}>
          <Flex
            width="100%"
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText
                desktopStyle="captionSemiBold"
                marginBottom={SPACING.spacing4}
              >
                {t('download_files')}
              </StyledText>
              <StyledText desktopStyle="captionRegular">
                {t('files_available_robot_details')}
              </StyledText>
            </Flex>
            <Link
              textDecoration={TEXT_DECORATION_UNDERLINE}
              onClick={() => {
                navigate(`/devices/${robotName}`)
              }}
            >
              {t('device_details')}
            </Link>
          </Flex>
        </Banner>
      ) : null}
    </Box>
  )
}
