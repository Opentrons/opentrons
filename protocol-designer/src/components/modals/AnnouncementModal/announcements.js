// @flow

import * as React from 'react'
import styles from './AnnouncementModal.css'

export type Announcement = {|
  announcementKey: string,
  image: React.Node | null,
  heading: string,
  message: React.Node,
|}

export const announcements: Array<Announcement> = [
  {
    announcementKey: 'modulesRequireRunAppUpdate',
    image: (
      <div className={styles.modules_diagrams_row}>
        <img
          className={styles.modules_diagram}
          src={require('../../../images/modules/magdeck_tempdeck_combined.png')}
        />
      </div>
    ),
    heading: "We've updated the Protocol Designer",
    message: (
      <>
        <p>
          Protocol Designer now includes Beta support for Temperature and
          Magnetic modules.
        </p>
        <p>
          To use Temperature and Magnetic modules in the Protocol Designer
          protocols, update your Opentrons App and OT-2 to software version
          3.17.0 Beta.
        </p>
        <p>
          Beta releases provide early access to new software versions and
          features. While we make a best effort to test each version, Beta
          features and software versions may include bugs or incomplete
          functionality.
        </p>
        <p>
          Learn more about Beta releases{' '}
          <a href="https://support.opentrons.com/en/articles/3854833-opentrons-beta-software-releases">
            here
          </a>
          .
        </p>
      </>
    ),
  },
]
