import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getSortedLiquidClassDefs } from '@opentrons/shared-data'
import { getLiquidEntities } from '../../../../../../step-forms/selectors'

import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import type { FormData } from '../../../../../../form-types'
import type { FieldPropsByName } from '../../types'

interface LiquidClassesStepToolsProps {
  propsForFields: FieldPropsByName
  formData: FormData
  assignedLiquidClass: string
  setShowFormErrors?: Dispatch<SetStateAction<boolean>>
  type: 'mix' | 'transfer'
}

export const LiquidClassesStepTools = ({
  propsForFields,
  formData,
  setShowFormErrors,
  assignedLiquidClass,
  type,
}: LiquidClassesStepToolsProps): JSX.Element => {
  const { t } = useTranslation('liquids')
  const liquids = useSelector(getLiquidEntities)
  const sortedLiquidClassDefs = getSortedLiquidClassDefs()

  const liquidClassToLiquidsMap: Record<string, string[]> = {}
  Object.values(liquids).forEach(({ displayName, liquidClass }) => {
    if (liquidClass !== undefined) {
      if (!liquidClassToLiquidsMap[liquidClass]) {
        liquidClassToLiquidsMap[liquidClass] = []
      }
      liquidClassToLiquidsMap[liquidClass].push(displayName)
    }
  })

  const noLiquidClass = {
    name: t('dont_use_liquid_class') as string,
    value: 'none',
    subButtonLabel: t('default'),
  }

  const liquidClassOptions = [
    ...Object.entries(sortedLiquidClassDefs).map(
      ([liquidClassDefName, { displayName, description }]) => ({
        name: displayName,
        value: liquidClassDefName,
        subButtonLabel:
          liquidClassToLiquidsMap[liquidClassDefName] != null
            ? t('assigned_liquid', {
                liquidName: liquidClassToLiquidsMap[liquidClassDefName].join(
                  ', '
                ),
              })
            : description,
      })
    ),
    noLiquidClass,
  ]

  // order by assigned liquid class first
  const liquidClassOptionsOrdered = liquidClassOptions.sort((a, _) =>
    a.value === assignedLiquidClass ? -1 : 1
  )

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
        {liquidClassOptionsOrdered.map(options => {
          const { name, subButtonLabel, value } = options
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
