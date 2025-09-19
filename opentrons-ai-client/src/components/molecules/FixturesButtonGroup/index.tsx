import { Controller, useFormContext } from 'react-hook-form'

import {
  EmptySelectorButton,
  Flex,
  FLEX_MAX_CONTENT,
  SPACING,
  WRAP,
} from '@opentrons/components'

import { FIXTURES_FIELD_NAME } from '/ai-client/components/organisms/ModulesAndFixturesSection'

import type { DisplayFixture } from '/ai-client/components/organisms/ModulesAndFixturesSection'

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
          <Flex flexWrap={WRAP} gap={SPACING.spacing8} flexDirection="row">
            {fixtures.map(fixture => (
              <Flex width={FLEX_MAX_CONTENT} key={fixture.type}>
                <EmptySelectorButton
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
              </Flex>
            ))}
          </Flex>
        )
      }}
    />
  )
}
