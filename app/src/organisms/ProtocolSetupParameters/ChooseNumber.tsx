import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { InputField } from '../../atoms/InputField'
import { useToaster } from '../ToasterOven'
import { ChildNavigation } from '../ChildNavigation'
import type { RunTimeParameter } from '@opentrons/shared-data'
import { NumericalKeyboard } from '../../atoms/SoftwareKeyboard'

interface ChooseNumberProps {
  handleGoBack: () => void
  parameter: RunTimeParameter
  setParameter: (value: number, variableName: string) => void
}

export function ChooseNumber({
  handleGoBack,
  parameter,
  setParameter,
}: ChooseNumberProps): JSX.Element | null {
  const { makeSnackbar } = useToaster()

  const inputFieldRef = React.useRef(null)

  const { i18n, t } = useTranslation(['protocol_setup', 'shared'])
  const handleOnClick = (newValue: number): void => {
    if (error != null) {
      makeSnackbar(t('value_out_of_range_generic'))
    } else {
      setParameter(newValue, parameter.variableName)
      handleGoBack()
    }
  }
  const [paramValue, setParamValue] = React.useState<number>(
    parameter.value as number
  )

  const resetValueDisabled = parameter.default === paramValue

  if (parameter.type !== 'int' && parameter.type !== 'float') {
    console.log(`Incorrect parameter type: ${parameter.type}`)
    return null
  }

  const min = parameter.min
  const max = parameter.max

  const error =
    Number.isNaN(paramValue) || paramValue < min || paramValue > max
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
          handleOnClick(paramValue)
        }}
        buttonType="tertiaryLowLight"
        buttonText={t('restore_default')}
        onClickButton={() =>
          resetValueDisabled
            ? makeSnackbar(t('no_custom_values'))
            : setParamValue(parameter.default)
        }
      />
      <Flex
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing48}
        paddingX={SPACING.spacing40}
        paddingBottom={SPACING.spacing40}
        marginTop="7.75rem"
        height="22rem"
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <Flex
          width="30.5rem"
          height="100%"
          gridGap={SPACING.spacing24}
          flexDirection={DIRECTION_COLUMN}
          marginTop="7.75rem"
        >
          <StyledText as="h4" textAlign={TYPOGRAPHY.textAlignLeft}>
            {parameter.description}
          </StyledText>
          <InputField
            key={parameter.variableName}
            ref={inputFieldRef}
            type="number"
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
            onChange={e => {
              const updatedValue =
                parameter.type === 'int'
                  ? Math.round(e.target.valueAsNumber)
                  : e.target.valueAsNumber
              setParamValue(updatedValue)
            }}
          />
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
        >
          <NumericalKeyboard
            keyboardRef={inputFieldRef}
            isDecimal={parameter.type === 'float'}
            onChange={e => {
              console.log(e)
              e != null && setParamValue(Number(e))
            }}
          />
        </Flex>
      </Flex>
    </>
  )
}
