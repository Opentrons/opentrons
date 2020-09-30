// @flow
import * as React from 'react'
import styles from './StepDescription.css'

type StepDescriptionProps = {|
  description: ?string,
|}

// TODO Ian 2018-02-21 rename TitledListDescription or whatever, it's not just for StepList but also for IngredientsList
export function StepDescription(props: StepDescriptionProps): React.Node {
  // TODO Ian 2017-01-12 Not really styled
  return (
    <div className={styles.step_description}>
      <header>{'Notes:'}</header>
      {props.description}
    </div>
  )
}
