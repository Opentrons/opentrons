import React from 'react'
import {Route} from 'react-router'

import {AlertModal} from '@opentrons/components'
import UploadStatus from '../components/UploadStatus'
import Page from '../components/Page'

export default function UploadPage () {
  return (
    <Page>
      <UploadStatus />
      <Route path='/upload/cancel' component={ConfirmUploadModal} />
    </Page>
  )
}

function ConfirmUploadModal () {
  return (
    <AlertModal
      heading={'Are you sure you want to open a new protocol?'}
      buttons={[
        {children: 'cancel', onClick: () => console.log('cancel upload')},
        {children: 'continue', onClick: () => console.log('continue upload')}
      ]}
    >
      Doing so will close your current protocol and clear any unsaved calibration progress.
    </AlertModal>
  )
}
