import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { v4 as uuid } from 'uuid'

import { EmptySelectorButton, Flex, SPACING, WRAP } from '@opentrons/components'
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'

import { MODULES_FIELD_NAME } from '/ai-client/components/organisms/ModulesAndFixturesSection'

import type { DisplayModule } from '/ai-client/components/organisms/ModulesAndFixturesSection'

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
          <Flex
            flexWrap={WRAP}
            gap={SPACING.spacing8}
            justifyContent="flex-start"
          >
            {modules.map(module => (
              <ButtonWrapper key={module.type}>
                <EmptySelectorButton
                  key={module.type}
                  iconName="plus"
                  onClick={() => {
                    const isTempModule = module.type === TEMPERATURE_MODULE_TYPE
                    const tempModuleCount = modulesWatch.filter(
                      m => m.type === TEMPERATURE_MODULE_TYPE
                    ).length

                    if (
                      (isTempModule && tempModuleCount >= 2) ||
                      (!isTempModule &&
                        modulesWatch.some(m => m.type === module.type))
                    ) {
                      return
                    }

                    const moduleWithId = {
                      ...module,
                      id: uuid(),
                    }
                    field.onChange([...modulesWatch, moduleWithId])
                  }}
                  text={module.name}
                  textAlignment="left"
                />
              </ButtonWrapper>
            ))}
          </Flex>
        )
      }}
    />
  )
}

const ButtonWrapper = styled.div`
  display: inline-block;
  flex-grow: 0;
  flex-shrink: 1;
`
