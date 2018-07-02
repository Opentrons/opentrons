// @flow
// app info card with version and updated
import * as React from 'react'

import {Card} from '@opentrons/components'
import {LabeledButton} from '../controls'

const TITLE = 'Advanced Settings'

export default function AdvancedSettingsCard () {
  return (
    <Card title={TITLE} column>
    <LabeledButton
      label='Download Logs'
      buttonProps={{
        disabled: true,
        children: 'Download'
      }}
    >
      <p>Access logs from this robot.</p>
    </LabeledButton>
    </Card>
  )
}
