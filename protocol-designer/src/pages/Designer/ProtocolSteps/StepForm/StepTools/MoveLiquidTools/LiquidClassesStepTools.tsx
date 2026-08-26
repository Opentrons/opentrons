import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'
import type { LiquidClassOption } from './hooks/useAssignLiquidClass'

interface LiquidClassesStepToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  orderedLiquidClassOptions: LiquidClassOption[]
  setShowFormErrors?: Dispatch<SetStateAction<boolean>>
  type: 'mix' | 'transfer'
}

export const LiquidClassesStepTools = ({
  propsForFields,
  formData,
  setShowFormErrors,
  type,
  orderedLiquidClassOptions,
}: LiquidClassesStepToolsProps): ReactNode => {
  const { t } = useTranslation('liquids')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      paddingY={SPACING.spacing16}
      gridGap={SPACING.spacing12}
    >
      <Flex padding={`0 ${SPACING.spacing16}`}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('apply_liquid_classes', { command: t(type) })}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
        padding={`0 ${SPACING.spacing16}`}
      >
        {orderedLiquidClassOptions.map(option => {
          const { name, subButtonLabel, value } = option
          return (
            <RadioButton
              key={name}
              onChange={(e: ChangeEvent<any>) => {
                propsForFields.liquidClass.updateValue(e.target.value)
                setShowFormErrors?.(false)
              }}
              buttonLabel={name}
              buttonValue={value}
              isSelected={formData.liquidClass === value}
              buttonSubLabel={{
                label: subButtonLabel ?? undefined,
                align: 'vertical',
              }}
              largeDesktopBorderRadius
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
