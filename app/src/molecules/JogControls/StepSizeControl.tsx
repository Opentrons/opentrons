// jog controls component
import * as React from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import {
  RadioGroup,
  HandleKeypress,
  SPACING,
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  Icon,
  TYPOGRAPHY,
  COLORS,
  Btn,
} from '@opentrons/components'
import styles from './styles.css'
import { StyledText } from '../../atoms/text'

import type { StepSize } from './types'

interface StepSizeControlProps {
  stepSizes: StepSize[]
  currentStepSize: StepSize
  setCurrentStepSize: (stepSize: StepSize) => void
  //  TODO: remove this prop after all primary buttons are changed to blue in the next gen app work
  isLPC?: boolean
}
export function StepSizeControl(props: StepSizeControlProps): JSX.Element {
  const { stepSizes, currentStepSize, setCurrentStepSize } = props
  const { t } = useTranslation('jog_controls')

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

  console.log(currentStepSize)
  return (
    <Flex
      backgroundColor={COLORS.fundamentalsBackground}
      padding={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        <Icon
          marginTop="2px"
          marginRight="9px"
          name="ot-jump-size"
          size="1rem"
        />
        <StyledText css={TYPOGRAPHY.pSemiBold}>{t('jump_size')}</StyledText>
      </Flex>
      <StyledText
        fontSize="11px"
        color={COLORS.darkGreyEnabled}
        marginBottom={SPACING.spacing4}
      >
        {'- / +'}
      </StyledText>
      <HandleKeypress
        preventDefault
        handlers={[
          { key: '-', onPress: decreaseStepSize },
          { key: '_', onPress: decreaseStepSize },
          { key: '=', onPress: increaseStepSize },
          { key: '+', onPress: increaseStepSize },
        ]}
      >
        {stepSizes.map((stepSize: StepSize, index) => (
          <input
            key={index}
            type="button"
            value={`${currentStepSize}`}
            name={`${stepSize} mm`}
            value={`${stepSize}`}
            onChange={handleStepSelect}
          />
        ))}
        {/* {stepSizes.map((stepSize: StepSize) => (
          <Flex gridGap="8px">
            <Btn
              onChange={handleStepSelect}
              backgroundColor={COLORS.white}
              height="50px"
              width="147.5px"
            >
              <Flex flexDirection={DIRECTION_COLUMN}>{`${stepSize} mm`}</Flex>
            </Btn>
          </Flex>
        ))} */}
        {/* <RadioGroup
          labelTextClassName={styles.increment_item}
          value={`${currentStepSize}`}
          options={stepSizes.map((stepSize: StepSize) => ({
            name: `${stepSize} mm`,
            value: `${stepSize}`,
          }))}
          onChange={handleStepSelect}
          className={lpcRadiobuttonColor}
        /> */}
      </HandleKeypress>
    </Flex>
  )
}
