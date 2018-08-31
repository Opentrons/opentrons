// @flow
import * as React from 'react'
import type {Robot} from '../../robot'
import Page from '../../components/Page'
import FileInfo from '../../components/FileInfo'

type Props = {
  name: string,
  robot: Robot,
}

export default function FileInfoPage (props: Props) {
  return (
    <Page
      titleBarProps = {{
        title: props.name,
        subtitle: 'overview'
      }}
    >
      <FileInfo {...props} />
    </Page>
  )
}
