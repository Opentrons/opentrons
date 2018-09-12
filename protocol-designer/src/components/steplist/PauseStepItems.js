// @flow
import * as React from 'react'
import type {PauseFormData} from '../../step-generation'
import {PDListItem} from '../lists'

type Props = {
  substeps: PauseFormData,
}

export default function PauseStepItems (props: Props) {
  const {substeps} = props
  if (substeps.wait === true) {
    // Show message if waiting indefinitely
    return <PDListItem>{substeps.message}</PDListItem>
  }
  if (!substeps.meta) {
    // No message or time, show nothing
    return null
  }
  const {hours, minutes, seconds} = substeps.meta
  return <PDListItem>
    <span>{hours} hr</span>
    <span>{minutes} m</span>
    <span>{seconds} s</span>
    <span/>
    <span/>
  </PDListItem>
}
