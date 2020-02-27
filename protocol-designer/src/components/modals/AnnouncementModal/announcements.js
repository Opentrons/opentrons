// @flow

import * as React from 'react'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { ModuleDiagram } from '../../modules'
import styles from './AnnouncementModal.css'

export type Announcement = {|
  version: string,
  image: React.Node | null,
  heading: string,
  message: React.Node,
|}

export const announcements: Array<Announcement> = [
  {
    version: '4.0.0',
    image: (
      <div className={styles.modules_diagrams_row}>
        <ModuleDiagram type={MAGNETIC_MODULE_TYPE} />
        <ModuleDiagram type={TEMPERATURE_MODULE_TYPE} />
      </div>
    ),
    heading: "We've updated the Protocol Designer",
    message: (
      <>
        <p>
          Protocol Designer BETA now supports Temperature and Magnetic modules.
        </p>

        <p>
          Note: Protocols with modules{' '}
          <strong>may require an app and robot update to run</strong>. You will
          need to have the OT-2 app and robot on the latest versions (
          <strong>3.17 and higher</strong>).
        </p>
      </>
    ),
  },
]
