// @flow
import * as React from 'react'
import type { CalibrateDeckStartedProps, CalibrationStep } from './types'
import { PrimaryButton, Link } from '@opentrons/components'

import styles from './styles.css'

export type AttachTipProps = {|
  ...CalibrateDeckStartedProps,
  proceed: () => mixed,
|}

type Channels = 'single' | 'multi'

const DIAGRAMS: { [step: CalibrationStep]: { [Channels]: string } } = {
  '1': {
    single: require('./images/attach-tip-single@3x.png'),
    multi: require('./images/attach-tip-multi@3x.png'),
  },
  '6': {
    single: require('./images/detach-tip-single@3x.png'),
    multi: require('./images/detach-tip-multi@3x.png'),
  },
}

const PIPETTE_CALIBRATION_URL =
  'https://support.opentrons.com/en/articles/2687641-get-started-calibrate-pipettes-and-labware'

export function AttachTip(props: AttachTipProps): React.Node {
  const multi = props.pipette.channels === 8
  const tipLocation = multi ? 'very first channel at front of' : ''

  const diagramSrc = getDiagramSrc(props)

  let instructions, buttonText
  if (props.calibrationStep === '1') {
    instructions = (
      <span>
        <p>
          Place an Opentrons tip on the {tipLocation} pipette before continuing.
        </p>
        <p>Confirm tip is attached to start calibration.</p>
      </span>
    )
    buttonText = 'confirm tip attached'
  } else {
    instructions = (
      <span>
        <p>Remove the Opentrons tip from the pipette.</p>
        <p>
          In order to effectively use this new deck calibration, please
          calibrate your pipette prior to running your next protocol.
        </p>
        <p>
          Learn more about pipette calibration &nbsp;
          <Link href={PIPETTE_CALIBRATION_URL} external>
            here
          </Link>
          &nbsp;
        </p>
      </span>
    )
    buttonText = 'save deck calibration and exit'
  }

  return (
    <div className={styles.attach_tip_contents}>
      <div className={styles.attach_tip_instructions}>
        {instructions}
        <PrimaryButton title={buttonText} onClick={props.proceed}>
          {buttonText}
        </PrimaryButton>
      </div>
      <div className={styles.attach_tip_diagram}>
        <img src={diagramSrc} />
      </div>
    </div>
  )
}

function getDiagramSrc(props: AttachTipProps): string {
  const { calibrationStep, pipette } = props
  const channelsKey = pipette.channels === 8 ? 'multi' : 'single'

  return DIAGRAMS[calibrationStep][channelsKey]
}
