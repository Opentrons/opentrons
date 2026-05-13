import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TouchInputField,
  TYPOGRAPHY,
} from '@opentrons/components'

import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useToaster } from '/app/organisms/ToasterOven'

import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { NumberParameter } from '@opentrons/shared-data'

interface ChooseNumberProps {
  handleGoBack: () => void
  parameter: NumberParameter
  setParameter: (value: number, variableName: string) => void
}

const getKeyboardInputMask = (value: string): string => '*'.repeat(value.length)

export function ChooseNumber({
  handleGoBack,
  parameter,
  setParameter,
}: ChooseNumberProps): JSX.Element | null {
  const { makeSnackbar } = useToaster()

  const { i18n, t } = useTranslation(['protocol_setup', 'shared'])
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  const [paramValue, setParamValue] = useState<string>(String(parameter.value))

  // We need to arbitrarily set the value of the keyboard to a string the
  // same length as the initial parameter value (as string) when the component mounts
  // so that the delete button operates properly on the existing input field value.
  const [prevKeyboardValue, setPrevKeyboardValue] = useState<string>('')
  const setParamValueAndSyncKeyboard = (value: string): void => {
    setParamValue(value)
    const keyboardInput = getKeyboardInputMask(value)
    keyboardRef.current?.setInput(keyboardInput)
    setPrevKeyboardValue(keyboardInput)
  }
  useEffect(
    () => {
      const arbitraryInput = getKeyboardInputMask(paramValue)
      keyboardRef.current?.setInput(arbitraryInput)
      setPrevKeyboardValue(arbitraryInput)
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  if (parameter.type !== 'int' && parameter.type !== 'float') {
    console.log(`Incorrect parameter type: ${parameter.type as string}`)
    return null
  }
  const handleClickGoBack = (newValue: number | null): void => {
    if (error != null || newValue === null) {
      makeSnackbar(t('value_out_of_range_generic') as string)
    } else {
      setParameter(newValue, parameter.variableName)
      handleGoBack()
    }
  }

  const handleKeyboardInput = (keyboardValue: string): void => {
    const isAddingInput = prevKeyboardValue.length < keyboardValue.length

    if (!isAddingInput) {
      setParamValueAndSyncKeyboard(paramValue.slice(0, paramValue.length - 1))
      return
    }

    const lastInput = keyboardValue.slice(-1)
    const isValidInput =
      !'.-'.includes(lastInput) ||
      (lastInput === '.' && !paramValue.includes('.')) ||
      (lastInput === '-' && paramValue.length === 0)

    if (!isValidInput) {
      keyboardRef.current?.setInput(prevKeyboardValue)
      return
    }

    setParamValueAndSyncKeyboard(paramValue + lastInput)
  }

  const paramValueAsNumber = paramValue !== '' ? Number(paramValue) : null
  const resetValueDisabled = parameter.default === paramValueAsNumber
  const { min, max } = parameter
  const error =
    Number.isNaN(paramValueAsNumber) ||
    (paramValueAsNumber != null && paramValueAsNumber < min) ||
    (paramValueAsNumber != null && paramValueAsNumber > max)
      ? t(`value_out_of_range`, {
          min: parameter.type === 'int' ? min : min.toFixed(1),
          max: parameter.type === 'int' ? max : max.toFixed(1),
        })
      : null

  const handleInputChange = (inputValue: string): void => {
    const allowsNegative = min < 0
    const intPattern = allowsNegative ? /^-?\d*$/ : /^\d*$/
    const floatPattern = allowsNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/
    const inputPattern = parameter.type === 'int' ? intPattern : floatPattern

    if (!inputPattern.test(inputValue)) {
      return
    }

    setParamValueAndSyncKeyboard(inputValue)
  }

  return (
    <>
      <ChildNavigation
        header={i18n.format(parameter.displayName, 'sentenceCase')}
        onClickBack={() => {
          handleClickGoBack(paramValueAsNumber)
        }}
        buttonType="tertiaryLowLight"
        buttonText={t('restore_default')}
        onClickButton={() => {
          if (resetValueDisabled) {
            makeSnackbar(t('no_custom_values') as string)
            return
          }
          setParamValueAndSyncKeyboard(String(parameter.default))
        }}
      />
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
          marginTop="7.75rem"
        >
          <LegacyStyledText
            forwardedAs="h4"
            textAlign={TYPOGRAPHY.textAlignLeft}
          >
            {parameter.description}
          </LegacyStyledText>
          <TouchInputField
            autoFocus
            type="text"
            units={parameter.suffix}
            placeholder={parameter.default.toString()}
            value={paramValue}
            label={parameter.displayName}
            caption={
              parameter.type === 'int'
                ? `${parameter.min}-${parameter.max}`
                : `${parameter.min.toFixed(1)}-${parameter.max.toFixed(1)}`
            }
            error={error}
            onBlur={e => {
              e.target.focus()
            }}
            onChange={e => {
              const inputValue = e.target.value
              handleInputChange(inputValue)
            }}
          />
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
        >
          <NumericalKeyboard
            keyboardRef={keyboardRef}
            isDecimal={parameter.type === 'float'}
            hasHyphen={min < 0 || max < min}
            onChange={e => {
              handleKeyboardInput(e)
            }}
          />
        </Flex>
      </Flex>
    </>
  )
}
