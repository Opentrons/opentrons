// @flow
// app info card with version and updated
import * as React from 'react'
import {Link} from 'react-router-dom'

import {CURRENT_VERSION} from '../../shell'
import {RefreshCard, LabeledValue, OutlineButton} from '@opentrons/components'
import {CardContentHalf} from '../layout'

import type {ShellUpdateState} from '../../shell'

type Props = {
  update: ShellUpdateState,
  checkUpdate: () => mixed,
}

const TITLE = 'Information'
const VERSION_LABEL = 'Software Version'

export default function AppInfoCard (props: Props) {
  const {checkUpdate, update: {available, checking}} = props

  return (
    <RefreshCard
      refreshing={checking}
      refresh={checkUpdate}
      title={TITLE}
    >
      <CardContentHalf>
        <LabeledValue
          label={VERSION_LABEL}
          value={CURRENT_VERSION}
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
