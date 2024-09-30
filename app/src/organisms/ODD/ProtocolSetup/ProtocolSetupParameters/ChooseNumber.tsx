import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useToaster } from '/app/organisms/ToasterOven'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import type { NumberParameter } from '@opentrons/shared-data'

interface ChooseNumberProps {
  handleGoBack: () => void
  parameter: NumberParameter
  setParameter: (value: number, variableName: string) => void
}

export function ChooseNumber({
  handleGoBack,
  parameter,
  setParameter,
}: ChooseNumberProps): JSX.Element | null {
  const { makeSnackbar } = useToaster()

  const { i18n, t } = useTranslation(['protocol_setup', 'shared'])
  const keyboardRef = useRef(null)
  const [paramValue, setParamValue] = useState<string>(String(parameter.value))

  // We need to arbitrarily set the value of the keyboard to a string the
  // same length as the initial parameter value (as string) when the component mounts
  // so that the delete button operates properly on the exisiting input field value.
  const [prevKeyboardValue, setPrevKeyboardValue] = useState<string>('')
  useEffect(() => {
    const arbitraryInput = new Array(paramValue).join('*')
    // @ts-expect-error keyboard should expose for `setInput` method
    keyboardRef.current?.setInput(arbitraryInput)
    setPrevKeyboardValue(arbitraryInput)
  }, [])

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

  const handleKeyboardInput = (e: string): void => {
    if (prevKeyboardValue.length < e.length) {
      const lastDigit = e.slice(-1)
      if (
        !'.-'.includes(lastDigit) ||
        (lastDigit === '.' && !paramValue.includes('.')) ||
        (lastDigit === '-' && paramValue.length === 0)
      ) {
        setParamValue(paramValue + lastDigit)
      }
    } else {
      setParamValue(paramValue.slice(0, paramValue.length - 1))
    }
    setPrevKeyboardValue(e)
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
          resetValueDisabled
            ? makeSnackbar(t('no_custom_values') as string)
            : setParamValue(String(parameter.default))
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
          <LegacyStyledText as="h4" textAlign={TYPOGRAPHY.textAlignLeft}>
            {parameter.description}
          </LegacyStyledText>
          <InputField
            autoFocus
            type="text"
            units={parameter.suffix}
            placeholder={parameter.default.toString()}
            value={paramValue}
            title={parameter.displayName}
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
              const updatedValue =
                parameter.type === 'int'
                  ? Math.round(e.target.valueAsNumber)
                  : e.target.valueAsNumber
              setParamValue(
                Number.isNaN(updatedValue) ? '' : String(updatedValue)
              )
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
