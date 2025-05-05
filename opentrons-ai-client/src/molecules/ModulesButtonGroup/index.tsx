import { Controller, useFormContext } from 'react-hook-form'

import { EmptySelectorButton, Flex, SPACING, WRAP } from '@opentrons/components'

import { MODULES_FIELD_NAME } from '../../organisms/ModulesAndFixturesSection'

import type { DisplayModule } from '../../organisms/ModulesAndFixturesSection'

export function ModulesButtonGroup({
  modules,
}: {
  modules: DisplayModule[]
}): JSX.Element | null {
  const { watch } = useFormContext()
  const modulesWatch: DisplayModule[] = watch(MODULES_FIELD_NAME) ?? []

  return (
    <Controller
      defaultValue={[]}
      name={MODULES_FIELD_NAME}
      render={({ field }) => {
        return (
          <Flex flexWrap={WRAP} gap={SPACING.spacing8}>
            {modules.map(module => (
              <EmptySelectorButton
                key={module.type}
                iconName="plus"
                onClick={() => {
                  if (modulesWatch.some(m => m.type === module.type)) {
                    return
                  }
                  field.onChange([...modulesWatch, module])
                }}
                text={module.name}
                textAlignment="left"
              />
            ))}
          </Flex>
        )
      }}
    />
  )
}
