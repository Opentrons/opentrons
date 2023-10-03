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
import {
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
  TRASH_BIN_LOAD_NAME,
  WASTE_CHUTE_LOAD_NAME,
} from '@opentrons/shared-data'

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
    // temp: until modal built, just add a staging area or a trash
    if (
      fixtureLocation === 'A1' ||
      fixtureLocation === 'B1' ||
      fixtureLocation === 'C1' ||
      fixtureLocation === 'D1'
    ) {
      updateDeckConfiguration({
        fixtureLocation,
        loadName: TRASH_BIN_LOAD_NAME,
      })
    } else {
      updateDeckConfiguration({
        fixtureLocation,
        loadName: STAGING_AREA_LOAD_NAME,
      })
    }
  }

  const handleClickRemove = (fixtureLocation: string): void => {
    updateDeckConfiguration({
      fixtureLocation,
      loadName: STANDARD_SLOT_LOAD_NAME,
    })
  }

  // TODO: replace with getFixtureDisplayName
  const fixtureDisplayNameDictionary: Record<FixtureLoadName, string | null> = {
    [STAGING_AREA_LOAD_NAME]: t('staging_area_slot'),
    // do not display standard slot
    [STANDARD_SLOT_LOAD_NAME]: null,
    [TRASH_BIN_LOAD_NAME]: t('trash'),
    [WASTE_CHUTE_LOAD_NAME]: t('waste_chute'),
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
