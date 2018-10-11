// @flow
import * as React from 'react'

import {SpinnerModal} from '@opentrons/components'
import Page from '../../components/Page'
import FileInfo from '../../components/FileInfo'

import type {Robot} from '../../discovery'

type Props = {
  robot: Robot,
  filename: string,
  uploadInProgress: boolean,
  uploadError: ?{message: string},
  sessionLoaded: boolean,
}

export default function FileInfoPage (props: Props) {
  const {robot, filename, uploadInProgress, uploadError, sessionLoaded} = props

  return (
    <Page
      titleBarProps={{
        title: filename,
        subtitle: 'overview',
      }}
    >
      <FileInfo
        robot={robot}
        sessionLoaded={sessionLoaded}
        uploadError={uploadError}
      />
      {uploadInProgress && <SpinnerModal message="Upload in Progress" />}
    </Page>
  )
}
