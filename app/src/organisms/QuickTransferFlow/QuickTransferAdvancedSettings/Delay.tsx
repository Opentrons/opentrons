import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  POSITION_FIXED,
  COLORS,
  ALIGN_CENTER,
} from '@opentrons/components'
import { getTopPortalEl } from '../../../App/portal'
import { LargeButton } from '../../../atoms/buttons'
import { ChildNavigation } from '../../ChildNavigation'
import { InputField } from '../../../atoms/InputField'
import { ACTIONS } from '../constants'

import type {
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
  FlowRateKind,
} from '../types'
import { i18n } from '../../../i18n'
import { NumericalKeyboard } from '../../../atoms/SoftwareKeyboard'

interface DelayProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Delay(props: DelayProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const keyboardRef = React.useRef(null)

  const [selectedOption, setSelectedOption] = React.useState<string>('')
  const [currentStep, setCurrentStep] = React.useState<number>(0)
  const [delayDuration, setDelayDuration] = React.useState<number | null>(
    kind === 'aspirate'
      ? state.delayAspirate?.delayDuration ?? null
      : kind === 'dispense'
      ? state.delayDispense?.delayDuration ?? null
      : null
  )
  const [position, setPosition] = React.useState<number | null>(
    kind === 'aspirate'
      ? state.delayAspirate?.positionFromBottom ?? null
      : kind === 'dispense'
      ? state.delayDispense?.positionFromBottom ?? null
      : null
  )

  let headerCopy: string = ''
  let Action:
    | typeof ACTIONS.SET_DELAY_ASPIRATE
    | typeof ACTIONS.SET_DELAY_DISPENSE
    | null = null

  if (kind === 'aspirate') {
    headerCopy = t('delay_before_aspirating')
    Action = ACTIONS.SET_DELAY_ASPIRATE
  } else if (kind === 'dispense') {
    headerCopy = t('delay_before_dispensing')
    Action = ACTIONS.SET_DELAY_DISPENSE
  }

  const displayItems = [
    {
      option: 'Enabled',
      value: t('option_enabled'),
      onClick: () => {
        setSelectedOption('option_enabled')
      },
    },
    {
      option: 'Disabled',
      value: t('option_disabled'),
      onClick: () => {
        setSelectedOption('option_disabled')
      },
    },
  ]

  const flowSteps: string[] = [
    'enable_delay',
    'select_delay',
    'select_position',
  ]

  const handleClickBackOrExit = (): void => {
    currentStep > 0 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (selectedOption === 'Enabled') {
      if (currentStep < flowSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        if (Action != null && delayDuration != null && position != null) {
          dispatch({
            type: Action,
            delaySettings: {
              delayDuration: delayDuration,
              positionFromBottom: position,
            },
          })
        }
        onBack()
      }
    } else {
      if (Action != null) {
        dispatch({
          type: Action,
          delaySettings: undefined,
        })
      }
      onBack()
    }
  }

  const setSaveOrContinueButtonText = (): string => {
    return t(
      selectedOption === 'Enabled' && currentStep < flowSteps.length - 1
        ? 'shared:continue'
        : 'shared:save'
    )
  }

  // TODO: find the actual min and max for these values.
  const delayRange = { min: 1, max: 100 }

  const delayError =
    delayDuration !== null &&
    (delayDuration < delayRange.min || delayDuration > delayRange.max)
      ? t(`value_out_of_range`, {
          min: delayRange.min,
          max: delayRange.max,
        })
      : null

  const positionRange = { min: 1, max: 100 }
  const positionError =
    position !== null &&
    (position < positionRange.min || position > positionRange.max)
      ? t(`value_out_of_range`, {
          min: positionRange.min,
          max: positionRange.max,
        })
      : null

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={headerCopy}
        buttonText={i18n.format(setSaveOrContinueButtonText(), 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        top={SPACING.spacing8}
        buttonIsDisabled={
          delayError !== null || positionError != null || selectedOption === ''
        }
      />
      {flowSteps[currentStep] === 'enable_delay' ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {displayItems.map(option => (
            <LargeButton
              key={option.option}
              buttonType={
                selectedOption === option.option ? 'primary' : 'secondary'
              }
              onClick={() => {
                setSelectedOption(option.option)
              }}
              buttonText={option.value}
            />
          ))}
        </Flex>
      ) : null}
      {flowSteps[currentStep] === 'select_delay' ? (
        <Flex
          alignSelf={ALIGN_CENTER}
          gridGap={SPACING.spacing48}
          paddingX={SPACING.spacing40}
          padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
          marginTop="7.75rem" // using margin rather than justify due to content moving with error message
          alignItems={ALIGN_CENTER}
          height="22rem"
        >
          <Flex
            width="30.5rem"
            height="100%"
            gridGap={SPACING.spacing24}
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing68}
          >
            <InputField
              type="number"
              value={delayDuration}
              title={t('delay_duration_s')}
              error={delayError}
              readOnly
            />
          </Flex>
          <Flex
            paddingX={SPACING.spacing24}
            height="21.25rem"
            marginTop="7.75rem"
            borderRadius="0"
          >
            <NumericalKeyboard
              keyboardRef={keyboardRef}
              onChange={e => {
                setDelayDuration(Number(e))
              }}
            />
          </Flex>
        </Flex>
      ) : null}
      {flowSteps[currentStep] === 'select_position' ? (
        <Flex
          alignSelf={ALIGN_CENTER}
          gridGap={SPACING.spacing48}
          paddingX={SPACING.spacing40}
          padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
          marginTop="7.75rem" // using margin rather than justify due to content moving with error message
          alignItems={ALIGN_CENTER}
          height="22rem"
        >
          <Flex
            width="30.5rem"
            height="100%"
            gridGap={SPACING.spacing24}
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing68}
          >
            <InputField
              type="number"
              value={position}
              title={t('delay_position_mm')}
              error={positionError}
              readOnly
            />
          </Flex>
          <Flex
            paddingX={SPACING.spacing24}
            height="21.25rem"
            marginTop="7.75rem"
            borderRadius="0"
          >
            <NumericalKeyboard
              keyboardRef={keyboardRef}
              onChange={e => {
                setPosition(Number(e))
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
