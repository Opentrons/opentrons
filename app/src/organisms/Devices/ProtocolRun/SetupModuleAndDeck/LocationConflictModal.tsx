import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  useDeckConfigurationQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client/src/deck_configuration'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  PrimaryButton,
  SecondaryButton,
  Icon,
  DIRECTION_ROW,
  COLORS,
  JUSTIFY_END,
  ALIGN_CENTER,
  Box,
  JUSTIFY_SPACE_BETWEEN,
  BORDERS,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  getModuleDisplayName,
  STANDARD_SLOT_LOAD_NAME,
} from '@opentrons/shared-data'
import { Portal } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { StyledText } from '../../../../atoms/text'
import { Modal } from '../../../../molecules/Modal'
import { SmallButton } from '../../../../atoms/buttons/SmallButton'

import type {
  Cutout,
  Fixture,
  FixtureLoadName,
  ModuleModel,
} from '@opentrons/shared-data'

interface LocationConflictModalProps {
  onCloseClick: () => void
  cutout: Cutout
  requiredFixture?: FixtureLoadName
  requiredModule?: ModuleModel
  isOnDevice?: boolean
}

export const LocationConflictModal = (
  props: LocationConflictModalProps
): JSX.Element => {
  const {
    onCloseClick,
    cutout,
    requiredFixture,
    requiredModule,
    isOnDevice = false,
  } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])
  const deckConfig = useDeckConfigurationQuery().data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckConfigurationAtLocationLoadName = deckConfig.find(
    (deckFixture: Fixture) => deckFixture.fixtureLocation === cutout
  )?.loadName
  const currentFixtureDisplayName =
    deckConfigurationAtLocationLoadName != null
      ? getFixtureDisplayName(deckConfigurationAtLocationLoadName)
      : ''

  const handleUpdateDeck = (): void => {
    if (requiredFixture != null) {
      updateDeckConfiguration({
        fixtureLocation: cutout,
        loadName: requiredFixture,
      })
    } else {
      updateDeckConfiguration({
        fixtureLocation: cutout,
        loadName: STANDARD_SLOT_LOAD_NAME,
      })
    }
    onCloseClick()
  }

  return (
    <Portal level="top">
      {isOnDevice ? (
        <Modal
          onOutsideClick={onCloseClick}
          header={{
            title: t('deck_conflict'),
            hasExitIcon: true,
            onClick: onCloseClick,
            iconName: 'ot-alert',
            iconColor: COLORS.warningEnabled,
          }}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <Trans
              t={t}
              i18nKey="deck_conflict_info"
              values={{
                currentFixture: currentFixtureDisplayName,
                cutout: getCutoutDisplayName(cutout),
              }}
              components={{
                block: <StyledText as="p" />,
                strong: <strong />,
              }}
            />
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightBold}
                paddingBottom={SPACING.spacing8}
              >
                {t('slot_location', { slotName: getCutoutDisplayName(cutout) })}
              </StyledText>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingTop={SPACING.spacing8}
                gridGap={SPACING.spacing8}
              >
                <Flex
                  padding={SPACING.spacing24}
                  backgroundColor={COLORS.light1}
                  flexDirection={DIRECTION_ROW}
                  alignItems={ALIGN_CENTER}
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  borderRadius={BORDERS.borderRadiusSize3}
                >
                  <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                    {t('protocol_specifies')}
                  </StyledText>

                  <StyledText as="p">
                    {requiredFixture != null &&
                      getFixtureDisplayName(requiredFixture)}
                    {requiredModule != null &&
                      getModuleDisplayName(requiredModule)}
                  </StyledText>
                </Flex>
                <Flex
                  padding={SPACING.spacing24}
                  backgroundColor={COLORS.light1}
                  flexDirection={DIRECTION_ROW}
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  alignItems={ALIGN_CENTER}
                  borderRadius={BORDERS.borderRadiusSize3}
                >
                  <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                    {t('currently_configured')}
                  </StyledText>

                  <StyledText as="p">{currentFixtureDisplayName}</StyledText>
                </Flex>
              </Flex>
            </Flex>
            <Flex
              flexDirection={DIRECTION_ROW}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              gridGap={SPACING.spacing8}
            >
              <SmallButton
                buttonType="secondary"
                onClick={onCloseClick}
                buttonText={i18n.format(t('shared:cancel'), 'capitalize')}
                width="100%"
              />
              <SmallButton
                onClick={handleUpdateDeck}
                buttonText={i18n.format(t('confirm_removal'), 'capitalize')}
                width="100%"
              />
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <LegacyModal
          title={
            <Flex
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing10}
              alignItems={ALIGN_CENTER}
            >
              <Icon name="ot-alert" size="1rem" color={COLORS.warningEnabled} />
              <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {t('deck_conflict')}
              </StyledText>
            </Flex>
          }
          onClose={onCloseClick}
          width="27.75rem"
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <Trans
              t={t}
              i18nKey="deck_conflict_info"
              values={{
                currentFixture: currentFixtureDisplayName,
                cutout: getCutoutDisplayName(cutout),
              }}
              components={{
                block: <StyledText fontSize={TYPOGRAPHY.fontSizeH4} />,
                strong: <strong />,
              }}
            />
            <Flex paddingY={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
              <StyledText
                fontSize={TYPOGRAPHY.fontSizeH4}
                fontWeight={TYPOGRAPHY.fontWeightBold}
              >
                {t('slot_location', { slotName: getCutoutDisplayName(cutout) })}
              </StyledText>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                paddingTop={SPACING.spacing8}
                gridGap={SPACING.spacing8}
              >
                <Flex
                  padding={SPACING.spacing8}
                  backgroundColor={COLORS.fundamentalsBackground}
                  flexDirection={DIRECTION_ROW}
                  gridGap={SPACING.spacing20}
                  alignItems={ALIGN_CENTER}
                >
                  <Box width="107px">
                    <StyledText as="label">
                      {t('protocol_specifies')}
                    </StyledText>
                  </Box>
                  <StyledText as="label">
                    {requiredFixture != null &&
                      getFixtureDisplayName(requiredFixture)}
                    {requiredModule != null &&
                      getModuleDisplayName(requiredModule)}
                  </StyledText>
                </Flex>
                <Flex
                  padding={SPACING.spacing8}
                  backgroundColor={COLORS.fundamentalsBackground}
                  flexDirection={DIRECTION_ROW}
                  gridGap={SPACING.spacing20}
                  alignItems={ALIGN_CENTER}
                >
                  <Box width="max-content">
                    <StyledText as="label">
                      {t('currently_configured')}
                    </StyledText>
                  </Box>
                  <StyledText as="label">
                    {currentFixtureDisplayName}
                  </StyledText>
                </Flex>
              </Flex>
            </Flex>

            <Flex
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing8}
              justifyContent={JUSTIFY_END}
            >
              <SecondaryButton onClick={onCloseClick}>
                {i18n.format(t('shared:cancel'), 'capitalize')}
              </SecondaryButton>
              <PrimaryButton onClick={handleUpdateDeck}>
                {t('update_deck')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </LegacyModal>
      )}
    </Portal>
  )
}
