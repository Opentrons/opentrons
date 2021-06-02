import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Splash,
  SpinnerModal,
  AlertItem,
  Box,
  OVERFLOW_AUTO,
  SPACING_4,
  SPACING_2,
} from '@opentrons/components'
import { Page } from '../../../atoms/Page'

import type { Robot } from '../../../redux/discovery/types'

// TODO(mc, 2018-09-13): these aren't cards; rename
import { InformationCard } from './InformationCard'
import { ProtocolPipettesCard } from './ProtocolPipettesCard'
import { ProtocolModulesCard } from './ProtocolModulesCard'
import { ProtocolLabwareCard } from './ProtocolLabwareCard'
import { Continue } from './Continue'
import { UploadError } from '../UploadError'

export interface FileInfoProps {
  robot: Robot
  filename: string | null | undefined
  uploadInProgress: boolean
  uploadError: { message: string } | null | undefined
  sessionLoaded: boolean
  sessionHasSteps: boolean
  showCustomLabwareWarning: boolean
}

export function FileInfo(props: FileInfoProps): JSX.Element {
  const {
    robot,
    filename,
    uploadInProgress,
    sessionLoaded,
    sessionHasSteps,
    showCustomLabwareWarning,
  } = props
  const { t } = useTranslation('protocol_info')

  const titleBarProps = filename
    ? { title: filename, subtitle: 'overview' }
    : { title: t('upload_and_simulate') }

  let uploadError = props.uploadError

  const sessionLoadedSuccessfully = sessionLoaded && !uploadError

  if (sessionLoadedSuccessfully && !sessionHasSteps) {
    uploadError = { message: t('error_message_no_steps') }
  }

  return (
    <Page titleBarProps={titleBarProps}>
      {showCustomLabwareWarning && !sessionLoadedSuccessfully && (
        <AlertItem type="warning" title={t('custom_labware_not_supported')}>
          {t('update_robot_for_custom_labware')}
        </AlertItem>
      )}
      {filename ? (
        <Box
          overflowY={OVERFLOW_AUTO}
          paddingX={`calc(${SPACING_4} - ${SPACING_2})`}
          paddingBottom={SPACING_2}
        >
          <InformationCard />
          <ProtocolPipettesCard robotName={robot.name} />
          <ProtocolModulesCard />
          {sessionLoaded && <ProtocolLabwareCard robotName={robot.name} />}
          {uploadError && <UploadError uploadError={uploadError} />}
          {sessionLoaded && !uploadError && <Continue />}
        </Box>
      ) : (
        <Splash />
      )}
      {uploadInProgress && (
        <SpinnerModal message={t('simulation_in_progress')} />
      )}
    </Page>
  )
}
