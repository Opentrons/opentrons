import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  SIZE_4,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'

import type { FixtureLocation } from '@opentrons/api-client'

interface DeviceDetailsDeckConfigurationProps {
  robotName: string
}

export function DeviceDetailsDeckConfiguration({
  robotName,
}: DeviceDetailsDeckConfigurationProps): JSX.Element | null {
  const { t } = useTranslation('device_details')

  const { data: deckConfig } = useDeckConfigurationQuery()
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()

  // TODO(bh, 2023-09-27): this is all temp POC of the api stubs, to be built out in follow on work
  const handleClickAdd = (): void => {
    updateDeckConfiguration({
      fixtureLocation: 'B3',
      loadName: 'extensionSlot',
    })
  }

  const handleClickRemove = (fixtureLocation: FixtureLocation): void => {
    updateDeckConfiguration({ fixtureLocation, loadName: 'standardSlot' })
  }

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.white}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.radiusSoftCorners}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      padding={`0 0 ${SPACING.spacing8}`}
      width="100%"
      marginBottom="6rem"
    >
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        borderBottom={BORDERS.lineBorder}
        padding={SPACING.spacing16}
        width="100%"
        id="DeckConfiguration_title"
      >
        {`${robotName} ${t('deck_configuration')}`}
      </StyledText>
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        minHeight={SIZE_4}
        paddingX={SPACING.spacing16}
        width="100%"
      >
        {deckConfig?.map(fixture => (
          <StyledText key={fixture.fixtureId}>
            {`${fixture.fixtureLocation} ${fixture.loadName}`}
            <TertiaryButton
              marginLeft={SPACING.spacing16}
              onClick={() => handleClickRemove(fixture.fixtureLocation)}
            >
              remove
            </TertiaryButton>
          </StyledText>
        ))}
        <TertiaryButton onClick={handleClickAdd}>{t('add')}</TertiaryButton>
      </Flex>
    </Flex>
  )
}
