import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'

import { EmptySelectorButton, Flex, SPACING, WRAP } from '@opentrons/components'

import { FIXTURES_FIELD_NAME } from '../../organisms/ModulesAndFixturesSection'

import type { DisplayFixture } from '../../organisms/ModulesAndFixturesSection'

export function FixturesButtonGroup({
  fixtures,
}: {
  fixtures: DisplayFixture[]
}): JSX.Element | null {
  const { watch } = useFormContext()
  const fixturesWatch: DisplayFixture[] = watch(FIXTURES_FIELD_NAME) ?? []

  return (
    <Controller
      defaultValue={[]}
      name={FIXTURES_FIELD_NAME}
      render={({ field }) => {
        return (
          <Flex flexWrap={WRAP} gap={SPACING.spacing8}>
            {fixtures.map(fixture => (
              <ButtonWrapper key={fixture.type}>
                <EmptySelectorButton
                  key={fixture.type}
                  iconName="plus"
                  onClick={() => {
                    if (fixturesWatch.some(m => m.type === fixture.type)) {
                      return
                    }
                    field.onChange([...fixturesWatch, fixture])
                  }}
                  text={fixture.name}
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
