// @flow
import * as React from 'react'
import type {PauseFormData} from '../../step-generation'

type Props = {
  substeps: PauseFormData
}

export default function PauseStepItems (props: Props) { // TODO IMMEDIATELY type this; factor out as component
  const {substeps} = props
  if (substeps.wait === true) {
    // Show message if waiting indefinitely
    return <li>{substeps.message}</li>
  }
  if (!substeps.meta) {
    // No message or time, show nothing
    return null
  }
  const {hours, minutes, seconds} = substeps.meta
  return <li>{hours} hr {minutes} m {seconds} s</li>
}
