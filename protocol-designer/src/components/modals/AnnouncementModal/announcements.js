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
          Protocol Designer Beta now includes support for Temperature and
          Magnetic modules.
        </p>
        <p>
          Note: Protocols with modules{' '}
          <strong>may require an app and robot update to run</strong>. You will
          need to have the OT-2 app and robot on the latest versions (
          <strong>3.17 or higher</strong>).
        </p>
      </>
    ),
  },
  {
    announcementKey: 'thermocyclerSupport',
    image: (
      <div className={styles.thermocycler_diagram_row}>
        <img
          className={styles.modules_diagram}
          src={require('../../../images/modules/thermocycler.jpg')}
        />
      </div>
    ),
    heading: "We've updated the Protocol Designer",
    message: (
      <>
        <p>Protocol Designer Beta now includes support for the Thermocycler!</p>
        <p>
          Note: Protocols with modules{' '}
          <strong>may require an app and robot update to run</strong>. You will
          need to have the OT-2 app and robot on the latest versions (
          <strong>3.18 or higher</strong>).
        </p>
      </>
    ),
  },
  {
    announcementKey: 'airGapDelaySettings',
    heading: "We've updated the Protocol Designer",
    image: null,
    message: (
      <>
        <p>
          Protocol Designer Beta now includes support for more pipetting
          settings: Air gap and Delay.{' '}
        </p>
        <p>
          Note: Protocols using new features{' '}
          <strong>may require an app and robot update to run.</strong> You will
          need to have the OT-2 app and orbot on the latest versions (
          <strong>3.20 or higher</strong>).{' '}
        </p>
      </>
    ),
  },
]
