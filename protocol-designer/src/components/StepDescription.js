// @flow
import * as React from 'react'
import styles from './StepDescription.css'

type StepDescriptionProps = {
  description?: string
}

export default function StepDescription (props: StepDescriptionProps) {
  if (!props.description) {
    return null
  }
  // TODO Ian 2017-01-12 Not really styled
  return (
    <div className={styles.step_description}>
      <header>Notes:</header>
      {props.description}
    </div>
  )
}
