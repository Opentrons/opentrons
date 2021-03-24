import * as React from 'react'
import styles from './styles.css'

export interface InstructionStepProps {
  step: 'one' | 'two'
  children: React.ReactNode
  diagram: string
}

export function InstructionStep(props: InstructionStepProps): JSX.Element {
  return (
    <fieldset className={styles.step}>
      <legend className={styles.step_legend}>Step {props.step}</legend>
      <div>{props.children}</div>
      <img src={props.diagram} className={styles.diagram} />
    </fieldset>
  )
}
