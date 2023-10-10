import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client/src/deck_configuration'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  BORDERS,
  ALIGN_CENTER,
} from '@opentrons/components'
import { FixtureLoadName, getFixtureDisplayName } from '@opentrons/shared-data'
import { TertiaryButton } from '../../../../atoms/buttons/TertiaryButton'
import { Portal } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { StyledText } from '../../../../atoms/text'

interface NotConfiguredModalProps {
  onCloseClick: () => void
  requiredFixture: FixtureLoadName
  cutout: string
}

export const NotConfiguredModal = (
  props: NotConfiguredModalProps
): JSX.Element => {
  const { onCloseClick, cutout, requiredFixture } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()

  const handleUpdateDeck = (): void => {
    updateDeckConfiguration({
      fixtureLocation: cutout,
      loadName: requiredFixture,
    })
    onCloseClick()
  }

  return (
    <Portal level="top">
      <LegacyModal
        title={
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('add_fixture', {
              fixtureName: getFixtureDisplayName(requiredFixture),
            })}
          </StyledText>
        }
        onClose={onCloseClick}
        width="27.75rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="p">{t('add_fixture_to_deck')}</StyledText>
          <Flex paddingTop={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
            <Flex
              padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
              backgroundColor={COLORS.medGreyEnabled}
              borderRadius={BORDERS.radiusSoftCorners}
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {getFixtureDisplayName(requiredFixture)}
              </StyledText>
              <TertiaryButton onClick={handleUpdateDeck}>
                {i18n.format(t('add'), 'capitalize')}
              </TertiaryButton>
            </Flex>
          </Flex>
        </Flex>
      </LegacyModal>
    </Portal>
  )
}
