import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  RadioButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import type { ChoiceParameter } from '@opentrons/shared-data'

interface ChooseEnumProps {
  handleGoBack: () => void
  parameter: ChoiceParameter
  setParameter: (value: boolean | string | number, variableName: string) => void
  rawValue: number | string | boolean
}

export function ChooseEnum({
  handleGoBack,
  parameter,
  setParameter,
  rawValue,
}: ChooseEnumProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'shared'])
  const options = 'choices' in parameter ? parameter.choices : null
  const handleOnClick = (newValue: string | number | boolean): void => {
    setParameter(newValue, parameter.variableName)
  }

  return (
    <>
      <ChildNavigation
        header={t('choose_enum', { displayName: parameter.displayName })}
        onClickBack={handleGoBack}
        buttonType="tertiaryLowLight"
        buttonText={t('restore_default')}
        onClickButton={() => {
          setParameter(parameter.default, parameter.variableName)
        }}
      />
      <Flex
        marginTop="7.75rem"
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        paddingBottom={SPACING.spacing40}
      >
        <LegacyStyledText
          forwardedAs="h4"
          textAlign={TYPOGRAPHY.textAlignLeft}
          marginBottom={SPACING.spacing16}
        >
          {parameter.description}
        </LegacyStyledText>

        {options?.map(option => {
          return (
            <RadioButton
              key={`${option.value}`}
              data-testid={`${option.value}`}
              buttonLabel={option.displayName}
              buttonValue={`${option.value}`}
              onChange={() => {
                handleOnClick(option.value)
              }}
              isSelected={option.value === rawValue}
            />
          )
        })}
      </Flex>
    </>
  )
}
