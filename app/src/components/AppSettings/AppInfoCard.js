// @flow
// app info card with version and updated
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {ShellUpdate} from '../../shell'
import {RefreshCard, LabeledValue, OutlineButton} from '@opentrons/components'

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
      <LabeledValue
        label={VERSION_LABEL}
        value={current}
      />
      <OutlineButton
        Component={Link}
        to='/menu/app/update'
        disabled={!available}
      >
        {available ? 'update' : 'updated'}
      </OutlineButton>
    </RefreshCard>
  )
}
