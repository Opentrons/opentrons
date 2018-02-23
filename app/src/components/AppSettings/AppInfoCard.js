// @flow
// App info card with version and updated
// TODO (ka 2018-2-22): make this a container once app info and update action are in place.
import * as React from 'react'

import {Card, LabeledValue, OutlineButton} from '@opentrons/components'

import {version} from '../../../../package.json'

const TITLE = 'Information'
const VERSION_LABEL = 'Software Version'
const VERSION_VALUE = version

export default function AppInfoCard () {
  return (
    <Card title={TITLE}>
      <LabeledValue
        label={VERSION_LABEL}
        value={VERSION_VALUE}
      />
      <OutlineButton disabled>
        updated
      </OutlineButton>
    </Card>
  )
}
