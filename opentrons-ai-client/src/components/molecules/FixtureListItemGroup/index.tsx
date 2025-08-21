import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  ListItem,
  ListItemCustomize,
  SPACING,
} from '@opentrons/components'

import { FIXTURES_FIELD_NAME } from '/ai-client/components/organisms/ModulesAndFixturesSection'

import { FixtureDiagram } from '../FixtureDiagram'

import type { DisplayFixture } from '/ai-client/components/organisms/ModulesAndFixturesSection'

export function FixtureListItemGroup(): JSX.Element | null {
  const { watch, setValue } = useFormContext()
  const { t } = useTranslation('create_protocol')
  const fixturesWatch: DisplayFixture[] = watch(FIXTURES_FIELD_NAME) ?? []

  return (
    <>
      {fixturesWatch.map(fixture => (
        <ListItem type="default" key={fixture.type}>
          <ListItemCustomize
            linkText={t('fixture_remove_label')}
            onClick={() => {
              setValue(
                FIXTURES_FIELD_NAME,
                fixturesWatch.filter(f => f.type !== fixture.type),
                { shouldValidate: true }
              )
            }}
            header={fixture.name}
            leftHeaderItem={
              <Flex
                padding={SPACING.spacing2}
                backgroundColor={COLORS.white}
                borderRadius={BORDERS.borderRadius8}
                alignItems={ALIGN_CENTER}
                width="3.75rem"
                height="3.625rem"
              >
                <FixtureDiagram type={fixture.type} />
              </Flex>
            }
          />
        </ListItem>
      ))}
    </>
  )
}
