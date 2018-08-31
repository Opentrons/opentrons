// @flow
// upload progress container
import * as React from 'react'
import {Redirect} from 'react-router'
import Page from '../../components/Page'
import UploadError from '../../components/UploadError'

type Props = {
  name: string,
  uploadError: ?{message: string},
}

export default function UploadStatusPage (props: Props) {
  const {name, uploadError} = props
  if (name && !uploadError) return (<Redirect to='/upload/file-info' />)
  return (
    <Page>
      <UploadError name={name} uploadError={uploadError}/>
    </Page>
  )
}
