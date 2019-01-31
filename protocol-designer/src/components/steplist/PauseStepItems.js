// @flow
import * as React from 'react'
import type {DelayArgs} from '../../step-generation'
import {PDListItem} from '../lists'

type Props = {
  pauseArgs: DelayArgs,
}

export default function PauseStepItems (props: Props) {
  const {pauseArgs} = props
  if (pauseArgs.wait === true) {
    // Show message if waiting indefinitely
    return <PDListItem>{pauseArgs.message}</PDListItem>
  }
  if (!pauseArgs.meta) {
    // No message or time, show nothing
    return null
  }
  const {hours, minutes, seconds} = pauseArgs.meta
  return <PDListItem>
    <span>{hours} hr</span>
    <span>{minutes} m</span>
    <span>{seconds} s</span>
    <span/>
    <span/>
  </PDListItem>
}
