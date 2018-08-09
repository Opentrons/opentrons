// @flow
// app info card with version and updated
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {ShellUpdate} from '../../shell'
import {RefreshCard, LabeledValue, OutlineButton} from '@opentrons/components'

import styles from './styles.css'

type Props = {
  update: ShellUpdate,
  checkForUpdates: () => mixed
}

const TITLE = 'Information'
const VERSION_LABEL = 'Software Version'

export default function AppInfoCard (props: Props) {
  const {
    checkForUpdates,
    update: {current, available, checkInProgress}
  } = props

  return (
    <RefreshCard
      title={TITLE}
      refreshing={checkInProgress}
      refresh={checkForUpdates}
    >
      <div className={styles.card_content_50}>
        <LabeledValue
          label={VERSION_LABEL}
          value={current}
        />
      </div>
      <div className={styles.card_content_50}>
        <OutlineButton
          Component={Link}
          to='/menu/app/update'
          disabled={!available}
        >
          {available ? 'update' : 'updated'}
        </OutlineButton>
      </div>
    </RefreshCard>
  )
}
