// @flow
import * as React from 'react'
import {ToggleInfo} from '../toggles'

// TODO(mc, 2018-05-30): "Read full policy" link at end of first paragraph
export default function AnalyticsInfo () {
  return (
    <ToggleInfo>
      <p>
        Help Opentrons improve its products and services by automatically sending anonymous diagnostic and usage data.
      </p>
      <p>
        This will allow us to learn things such as which features get used the most, which parts of the process are taking longest to complete, and how errors are generated. You can change this setting at any time.
      </p>
    </ToggleInfo>
  )
}
