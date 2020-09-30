// @flow
import * as React from 'react'

import { Splash, SpinnerModal, AlertItem } from '@opentrons/components'
import { Page } from '../../components/Page'
import { FileInfo as FileInfoContents } from '../../components/FileInfo'

import type { Robot } from '../../discovery/types'

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
    uploadError,
    sessionLoaded,
    sessionHasSteps,
    showCustomLabwareWarning,
  } = props

  const titleBarProps = filename
    ? { title: filename, subtitle: 'overview' }
    : { title: UPLOAD_AND_SIMULATE_PROTOCOL }

  const sessionLoadedSuccessfully = sessionLoaded && !uploadError

  return (
    <Page titleBarProps={titleBarProps}>
      {showCustomLabwareWarning && !sessionLoadedSuccessfully && (
        <AlertItem type="warning" title={ROBOT_DOESNT_SUPPORT_CUSTOM_LABWARE}>
          {YOU_HAVE_CUSTOM_LABWARE_BUT_THIS_ROBOT_NEEDS_UPDATE}
        </AlertItem>
      )}
      {filename ? (
        <FileInfoContents
          robot={robot}
          sessionLoaded={sessionLoaded}
          sessionHasSteps={sessionHasSteps}
          uploadError={uploadError}
        />
      ) : (
        <Splash />
      )}
      {uploadInProgress && <SpinnerModal message={SIMULATION_IN_PROGRESS} />}
    </Page>
  )
}
