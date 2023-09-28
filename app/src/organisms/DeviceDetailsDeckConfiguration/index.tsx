import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DeckConfigurator,
  Flex,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  SIZE_5,
} from '@opentrons/components'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'

import type { FixtureLoadName } from '@opentrons/shared-data'

interface DeviceDetailsDeckConfigurationProps {
  robotName: string
}

export function DeviceDetailsDeckConfiguration({
  robotName,
}: DeviceDetailsDeckConfigurationProps): JSX.Element | null {
  const { t } = useTranslation('device_details')

  const deckConfig = useDeckConfigurationQuery().data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()

  const handleClickAdd = (fixtureLocation: string): void => {
    console.log('TODO: open add fixture modal for location', fixtureLocation)
    updateDeckConfiguration({
      fixtureLocation,
      loadName: 'extensionSlot',
    })
  }

  const handleClickRemove = (fixtureLocation: string): void => {
    updateDeckConfiguration({
      fixtureLocation,
      loadName: 'standardSlot',
    })
  }

  const fixtureDisplayNameDictionary: Record<FixtureLoadName, string | null> = {
    extensionSlot: t('staging_area_slot'),
    // do not display standard slot
    standardSlot: null,
    trashChute: t('waste_chute'),
  }

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      backgroundColor={COLORS.white}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.radiusSoftCorners}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
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
        gridGap={SPACING.spacing40}
        paddingX={SPACING.spacing16}
        paddingY={SPACING.spacing32}
        width="100%"
      >
        <Flex
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          marginLeft={`-${SPACING.spacing32}`}
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          marginTop={`-${SPACING.spacing60}`}
        >
          <DeckConfigurator
            deckConfig={deckConfig}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
          />
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          width="32rem"
        >
          <Flex
            gridGap={SPACING.spacing32}
            paddingLeft={SPACING.spacing8}
            css={TYPOGRAPHY.labelSemiBold}
          >
            <StyledText>{t('location')}</StyledText>
            <StyledText>{t('fixture')}</StyledText>
          </Flex>
          {deckConfig.map(fixture => {
            const fixtureDisplayName =
              fixtureDisplayNameDictionary[fixture.loadName]
            return fixtureDisplayName != null ? (
              <Flex
                key={fixture.fixtureId}
                backgroundColor={COLORS.fundamentalsBackground}
                gridGap={SPACING.spacing60}
                padding={SPACING.spacing8}
                width={SIZE_5}
                css={TYPOGRAPHY.labelRegular}
              >
                <StyledText>{fixture.fixtureLocation}</StyledText>
                <StyledText>{fixtureDisplayName}</StyledText>
              </Flex>
            ) : null
          })}
        </Flex>
      </Flex>
    </Flex>
  )
}
