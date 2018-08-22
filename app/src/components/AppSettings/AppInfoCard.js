// @flow
// app info card with version and updated
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {ShellUpdate} from '../../shell'
import {RefreshCard, LabeledValue, OutlineButton} from '@opentrons/components'
import {CardContentHalf} from '../layout'

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
      <CardContentHalf>
        <LabeledValue
          label={VERSION_LABEL}
          value={current}
        />
      </CardContentHalf>
      <CardContentHalf>
        <OutlineButton
          Component={Link}
          to='/menu/app/update'
          disabled={!available}
        >
          {available ? 'update' : 'updated'}
        </OutlineButton>
      </CardContentHalf>
    </RefreshCard>
  )
}
