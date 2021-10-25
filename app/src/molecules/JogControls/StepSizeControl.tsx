// jog controls component
import * as React from 'react'
import cx from 'classnames'
import { RadioGroup, HandleKeypress } from '@opentrons/components'
import { ControlContainer } from './ControlContainer'
import styles from './styles.css'

import type { StepSize } from './types'

const STEP_SIZE_TITLE = 'Jump Size'
const STEP_SIZE_SUBTITLE = 'Change with + and -'

interface StepSizeControlProps {
  stepSizes: StepSize[]
  currentStepSize: StepSize
  setCurrentStepSize: (stepSize: StepSize) => void
  //  TODO: remove this prop after all primary buttons are changed to blue in the next gen app work
  isLPC?: boolean
}
export function StepSizeControl(props: StepSizeControlProps): JSX.Element {
  const { stepSizes, currentStepSize, setCurrentStepSize } = props

  const lpcRadiobuttonColor = cx({
    [styles.radio_button]: props.isLPC,
  })

  const increaseStepSize: () => void = () => {
    const i = stepSizes.indexOf(currentStepSize)
    if (i < stepSizes.length - 1) setCurrentStepSize(stepSizes[i + 1])
  }

  const decreaseStepSize: () => void = () => {
    const i = stepSizes.indexOf(currentStepSize)
    if (i > 0) setCurrentStepSize(stepSizes[i - 1])
  }

  const handleStepSelect: React.ChangeEventHandler<HTMLInputElement> = event => {
    setCurrentStepSize(Number(event.target.value))
    event.target.blur()
  }
  return (
    <ControlContainer title={STEP_SIZE_TITLE} subtitle={STEP_SIZE_SUBTITLE}>
      <HandleKeypress
        preventDefault
        handlers={[
          { key: '-', onPress: decreaseStepSize },
          { key: '_', onPress: decreaseStepSize },
          { key: '=', onPress: increaseStepSize },
          { key: '+', onPress: increaseStepSize },
        ]}
      >
        <RadioGroup
          labelTextClassName={styles.increment_item}
          value={`${currentStepSize}`}
          options={stepSizes.map((stepSize: StepSize) => ({
            name: `${stepSize} mm`,
            value: `${stepSize}`,
          }))}
          onChange={handleStepSelect}
          className={lpcRadiobuttonColor}
        />
      </HandleKeypress>
    </ControlContainer>
  )
}
