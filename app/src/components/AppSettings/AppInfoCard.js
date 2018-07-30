// @flow
// app info card with version and updated
import * as React from 'react'
import {Link} from 'react-router-dom'

import type {ShellUpdate} from '../../shell'
import {IntervalWrapper, Card, LabeledValue, OutlineButton} from '@opentrons/components'

type Props = {
  update: ShellUpdate,
  checkForUpdates: () => mixed
}

const TITLE = 'Information'
const VERSION_LABEL = 'Software Version'

export default function AppInfoCard (props: Props) {
  const {
    checkForUpdates,
    update: {current, available}
  } = props

  return (
    <IntervalWrapper
      refresh={checkForUpdates}
      interval={1000}
    >
      <Card title={TITLE}>
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
      </Card>
    </IntervalWrapper>
  )
}
