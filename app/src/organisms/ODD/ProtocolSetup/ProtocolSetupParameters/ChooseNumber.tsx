import { useState } from 'react'
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

import {
  isValidNumericalInput,
  StatelessNumericalKeyboard,
} from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
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
  const [paramValue, setParamValue] = useState<string>(String(parameter.value))

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

  const paramValueAsNumber = paramValue !== '' ? Number(paramValue) : null
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
    const isValidInput = isValidNumericalInput(inputValue, {
      allowDecimal: parameter.type === 'float',
      allowNegative: min < 0,
    })
    if (isValidInput === false) {
      return
    }
    setParamValue(inputValue)
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
          <StatelessNumericalKeyboard
            value={paramValue}
            isDecimal={parameter.type === 'float'}
            hasHyphen={min < 0 || max < min}
            onChange={handleInputChange}
          />
        </Flex>
      </Flex>
    </>
  )
}
