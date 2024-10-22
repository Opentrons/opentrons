import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  Box,
  StyledText,
  Link,
  SPACING,
  Banner,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  TEXT_DECORATION_UNDERLINE,
} from '@opentrons/components'

import { ProtocolAnalysisErrorBanner } from './ProtocolAnalysisErrorBanner'
import {
  TerminalRunBannerContainer,
  useTerminalRunBannerContainer,
} from './TerminalRunBannerContainer'
import { getShowGenericRunHeaderBanners } from './getShowGenericRunHeaderBanners'
import { useIsDoorOpen } from '../hooks'

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
  const isDoorOpen = useIsDoorOpen(robotName)

  const {
    showRunCanceledBanner,
    showDoorOpenBeforeRunBanner,
    showDoorOpenDuringRunBanner,
  } = getShowGenericRunHeaderBanners({
    runStatus,
    isDoorOpen,
    enteredER,
  })

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
      {showDoorOpenBeforeRunBanner ? (
        <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
          {t('shared:close_robot_door')}
        </Banner>
      ) : null}
      {showDoorOpenDuringRunBanner ? (
        <Banner type="warning" iconMarginLeft={SPACING.spacing4}>
          {t('close_door_to_resume_run')}
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
