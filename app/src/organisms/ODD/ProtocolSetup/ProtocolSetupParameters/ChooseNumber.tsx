import { useRef, useState } from 'react'
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
import { parseNumericalInput } from '/app/organisms/ODD/utils/parseNumericalInput'
import { useToaster } from '/app/organisms/ToasterOven'

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
  const inputElementRef = useRef<HTMLInputElement>(null)
  const [paramValue, setParamValue] = useState<string>(String(parameter.value))

  if (parameter.type !== 'int' && parameter.type !== 'float') {
    console.log(`Incorrect parameter type: ${parameter.type as string}`)
    return null
  }

  const { min, max } = parameter
  const allowDecimal = parameter.type === 'float'
  const parsedValue = parseNumericalInput(paramValue, {
    allowDecimal,
    allowNegative: true,
    min,
    max,
  })
  const valueErrorMessage =
    parsedValue.result === 'rangeError'
      ? t('value_out_of_range', {
          min: parameter.type === 'int' ? min : min.toFixed(1),
          max: parameter.type === 'int' ? max : max.toFixed(1),
        })
      : parsedValue.result === 'syntaxError'
        ? t('enter_a_valid_number')
        : null

  const handleClickGoBack = (): void => {
    if (parsedValue.result !== 'success') {
      makeSnackbar(
        (valueErrorMessage ?? t('value_out_of_range_generic')) as string
      )
    } else {
      setParameter(parsedValue.data, parameter.variableName)
      handleGoBack()
    }
  }

  return (
    <>
      <ChildNavigation
        header={i18n.format(parameter.displayName, 'sentenceCase')}
        onClickBack={handleClickGoBack}
        buttonType="tertiaryLowLight"
        buttonText={t('restore_default')}
        onClickButton={() => {
          setParamValue(String(parameter.default))
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
            ref={inputElementRef}
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
            error={valueErrorMessage}
            onChange={e => {
              setParamValue(e.target.value)
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
            inputElementRef={inputElementRef}
            isDecimal={allowDecimal}
            hasHyphen={min < 0 || max < min}
          />
        </Flex>
      </Flex>
    </>
  )
}
