import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'

import { EmptySelectorButton, Flex, SPACING, WRAP } from '@opentrons/components'

import { MODULES_FIELD_NAME } from '../../organisms/ModulesSection'

import type { DisplayModules } from '../../organisms/ModulesSection'

export function ControlledEmptySelectorButtonGroup({
  modules,
}: {
  modules: DisplayModules[]
}): JSX.Element | null {
  const { watch } = useFormContext()
  const modulesWatch: DisplayModules[] = watch(MODULES_FIELD_NAME) ?? []

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
                    if (modulesWatch.some(m => m.type === module.type)) {
                      return
                    }
                    field.onChange([...modulesWatch, module])
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
