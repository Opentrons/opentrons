// @flow
import * as React from 'react'
import { SidePanel } from '@opentrons/components'
import styles from './SettingsPage.css'

type Props = {
  loadFile: (event: SyntheticInputEvent<HTMLInputElement>) => mixed,
  createNewFile?: () => mixed,
  downloadData: ?{
    fileContents: string,
    fileName: string
  },
  onDownload: (event: SyntheticEvent<*>) => mixed
}

const SettingsSidebar = (props: Props) => {
  return (
    <SidePanel title='Settings'>
      PRIVACY
    </SidePanel>
  )
}

export default SettingsSidebar
