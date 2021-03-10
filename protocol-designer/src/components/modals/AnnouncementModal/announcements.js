// @flow

import * as React from 'react'
import { css } from 'styled-components'
import { Flex, JUSTIFY_SPACE_AROUND, SPACING_3 } from '@opentrons/components'
import styles from './AnnouncementModal.css'

export type Announcement = {|
  announcementKey: string,
  image: React.Node | null,
  heading: string,
  message: React.Node,
|}

const batchEditStyles = css`
  justify-content: ${JUSTIFY_SPACE_AROUND};
  padding: ${SPACING_3};

  & img {
    height: 13rem;
  }
`

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
  {
    announcementKey: 'batchEditTransfer',
    image: (
      <Flex css={batchEditStyles}>
        <img src={require('../../../images/announcements/multi_select.gif')} />

        <img src={require('../../../images/announcements/batch_edit.gif')} />
      </Flex>
    ),
    heading: "We've updated the Protocol Designer",
    message: (
      <>
        <p>Starting today, you’ll be able to:</p>
        <ul>
          <li>Select, delete, and duplicate multiple steps at once</li>
          <li>Edit advanced settings for multiple Transfer steps at once</li>
        </ul>

        <p>
          To enter multi-select mode, simply hold <strong>SHIFT</strong> or{' '}
          <strong>CTRL/CMND</strong> and click on a step. You can select a range
          of steps by <strong>SHIFT-clicking</strong>, or select/deselect
          individual steps with <strong>CTRL/CMND</strong>, or by clicking on
          the checkbox.
        </p>

        <p>
          From here, you can duplicate or delete selected steps, expand for more
          information, or edit advanced settings for Transfer steps!
        </p>
      </>
    ),
  },
]
