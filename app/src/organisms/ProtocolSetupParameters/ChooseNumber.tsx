import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { InputField } from '../../atoms/InputField'
import { useToaster } from '../ToasterOven'
import { ChildNavigation } from '../ChildNavigation'
import type { RunTimeParameter } from '@opentrons/shared-data'

interface ChooseEnumProps {
  handleGoBack: () => void
  parameter: RunTimeParameter
  setParameter: (value: boolean | string | number, variableName: string) => void
  rawValue: number | string | boolean
}

export function ChooseNumber({
  handleGoBack,
  parameter,
  setParameter,
  rawValue,
}: ChooseEnumProps): JSX.Element {
  const { makeSnackbar } = useToaster()

  const { t } = useTranslation(['protocol_setup', 'shared'])
  const handleOnClick = (newValue: string | number | boolean): void => {
    setParameter(newValue, parameter.variableName)
  }
  const resetValueDisabled = parameter.default === rawValue

  if (parameter.type !== 'int' && parameter.type !== 'float') {
    console.log(`Incorrect parameter type ${parameter.type}`)
  }

  return (
    <>
      <ChildNavigation
        header={parameter.displayName}
        onClickBack={handleGoBack}
        buttonType="tertiaryLowLight"
        buttonText={t('restore_default')}
        onClickButton={() =>
          resetValueDisabled
            ? makeSnackbar(t('no_custom_values'))
            : setParameter(parameter.default, parameter.variableName)
        }
      />
      <Flex
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        paddingBottom={SPACING.spacing40}
      >
        <StyledText
          as="h4"
          textAlign={TYPOGRAPHY.textAlignLeft}
          marginBottom={SPACING.spacing16}
        >
          {parameter.description}
        </StyledText>
        <InputField
          key={parameter.variableName}
          type="number"
          units={parameter.suffix}
          placeholder={rawValue.toString()}
          value={rawValue}
          title={parameter.displayName}
          caption={
            parameter.type === 'int'
              ? `${parameter.min}-${parameter.max}`
              : `${parameter.min.toFixed(1)}-${parameter.max.toFixed(1)}`
          }
          id={id}
          error={error}
          onChange={e => {
            const clone = runTimeParametersOverrides.map((parameter, i) => {
              if (i === index) {
                return {
                  ...parameter,
                  value:
                    runtimeParam.type === 'int'
                      ? Math.round(e.target.valueAsNumber)
                      : e.target.valueAsNumber,
                }
              }
              return parameter
            })
            if (setRunTimeParametersOverrides != null) {
              setRunTimeParametersOverrides(clone)
            }
          }}
        />

        {/* {options?.map(option => {
          return (
            <RadioButton
              key={`${option.value}`}
              data-testid={`${option.value}`}
              buttonLabel={option.displayName}
              buttonValue={`${option.value}`}
              onChange={() => handleOnClick(option.value)}
              isSelected={option.value === rawValue}
            />
          )
        })} */}
      </Flex>
    </>
  )
}
