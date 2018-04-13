// @flow
import * as React from 'react'

import type {Mount} from '../../robot'
import InstructionStep, {type Channels} from './InstructionStep'
import styles from './styles.css'

type Props = {
  // TODO(mc, 2018-04-09): align channels number and string types
  mount: Mount,
  channels: Channels
}

export default function AttachPipetteInstructions (props: Props) {
  return (
    <div className={styles.instructions}>
      <InstructionStep
        step='one'
        direction='attach'
        diagram='screws'
        {...props}
      >
        Attach pipette to carriage, <strong>starting with screw 1</strong>.
      </InstructionStep>
      <InstructionStep
        step='two'
        direction='attach'
        diagram='tab'
        {...props}
      >
        Connect the pipette to robot by pushing in the white connector tab.
      </InstructionStep>
    </div>
  )
}
