import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  LocationIcon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  getFixtureDisplayName,
  STANDARD_SLOT_LOAD_NAME,
} from '@opentrons/shared-data'

import { StyledText } from '../../atoms/text'

export function FixtureTable(): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const deckConfig = useDeckConfigurationQuery().data ?? []
  const fixtureDisplayList = deckConfig.filter(
    fixture => fixture.loadName !== STANDARD_SLOT_LOAD_NAME
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <Flex
        color={COLORS.darkBlack70}
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        gridGap={SPACING.spacing24}
        lineHeight={TYPOGRAPHY.lineHeight28}
        paddingX={SPACING.spacing24}
      >
        <StyledText flex="4 0 0">{t('fixture')}</StyledText>
        <StyledText flex="2 0 0">{t('location')}</StyledText>
        <StyledText flex="3 0 0"> {t('status')}</StyledText>
      </Flex>
      {/* ToDo (kk:10/10/2023) Add status will be implemented in a following PR */}
      {fixtureDisplayList.map(fixture => {
        return (
          <Flex
            flexDirection={DIRECTION_ROW}
            key={fixture.fixtureId}
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.green3}
            borderRadius={BORDERS.borderRadiusSize3}
            gridGap={SPACING.spacing24}
            padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
            onClick={() => {}}
          >
            <Flex flex="4 0 0" alignItems={ALIGN_CENTER}>
              <StyledText
                StyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {getFixtureDisplayName(fixture.loadName)}
              </StyledText>
            </Flex>
            <Flex flex="3 0 0" alignItems={ALIGN_CENTER}>
              <LocationIcon slotName={fixture.fixtureLocation} />
            </Flex>
            <Flex flex="3 0 0" alignItems={ALIGN_CENTER}>
              <StyledText
                StyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {'N/A'}
              </StyledText>
            </Flex>
          </Flex>
        )
      })}
    </Flex>
  )
}
