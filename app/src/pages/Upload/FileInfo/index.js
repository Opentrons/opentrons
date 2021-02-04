// @flow
import * as React from 'react'

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

const NO_STEPS_MESSAGE = `This protocol has no steps in it - there's nothing for your robot to do! Your protocol needs at least one aspirate/dispense to import properly`

// TODO(mc, 2019-11-25): i18n
const UPLOAD_AND_SIMULATE_PROTOCOL = 'Upload and Simulate Protocol'

const SIMULATION_IN_PROGRESS = 'Simulation in Progress'

const ROBOT_DOESNT_SUPPORT_CUSTOM_LABWARE =
  "Robot doesn't support custom labware"

const YOU_HAVE_CUSTOM_LABWARE_BUT_THIS_ROBOT_NEEDS_UPDATE =
  'You have custom labware definitions saved to your app, but this robot needs to be updated before you can use these definitions with Python protocols'

export type FileInfoProps = {|
  robot: Robot,
  filename: ?string,
  uploadInProgress: boolean,
  uploadError: ?{ message: string },
  sessionLoaded: boolean,
  sessionHasSteps: boolean,
  showCustomLabwareWarning: boolean,
|}

export function FileInfo(props: FileInfoProps): React.Node {
  const {
    robot,
    filename,
    uploadInProgress,
    sessionLoaded,
    sessionHasSteps,
    showCustomLabwareWarning,
  } = props

  const titleBarProps = filename
    ? { title: filename, subtitle: 'overview' }
    : { title: UPLOAD_AND_SIMULATE_PROTOCOL }

  let uploadError = props.uploadError

  const sessionLoadedSuccessfully = sessionLoaded && !uploadError

  if (sessionLoadedSuccessfully && !sessionHasSteps) {
    uploadError = { message: NO_STEPS_MESSAGE }
  }

  return (
    <Page titleBarProps={titleBarProps}>
      {showCustomLabwareWarning && !sessionLoadedSuccessfully && (
        <AlertItem type="warning" title={ROBOT_DOESNT_SUPPORT_CUSTOM_LABWARE}>
          {YOU_HAVE_CUSTOM_LABWARE_BUT_THIS_ROBOT_NEEDS_UPDATE}
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
          <ProtocolModulesCard robot={robot} />
          {sessionLoaded && <ProtocolLabwareCard robotName={robot.name} />}
          {uploadError && <UploadError uploadError={uploadError} />}
          {sessionLoaded && !uploadError && <Continue />}
        </Box>
      ) : (
        <Splash />
      )}
      {uploadInProgress && <SpinnerModal message={SIMULATION_IN_PROGRESS} />}
    </Page>
  )
}
