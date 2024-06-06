import * as React from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  getModuleDisplayName,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  getCutoutFixturesForModuleModel,
  getFixtureIdByCutoutIdFromModuleSlotName,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '../../../../App/portal'
import { LegacyModal } from '../../../../molecules/LegacyModal'
import { Modal } from '../../../../molecules/Modal'
import { SmallButton } from '../../../../atoms/buttons/SmallButton'
import { useNotifyDeckConfigurationQuery } from '../../../../resources/deck_configuration'

import type {
  CutoutConfig,
  CutoutId,
  CutoutFixtureId,
  ModuleModel,
  DeckDefinition,
} from '@opentrons/shared-data'
import { ChooseModuleToConfigureModal } from './ChooseModuleToConfigureModal'

interface LocationConflictModalProps {
  onCloseClick: () => void
  cutoutId: CutoutId
  deckDef: DeckDefinition
  robotName: string
  missingLabwareDisplayName?: string | null
  requiredFixtureId?: CutoutFixtureId
  requiredModule?: ModuleModel
  isOnDevice?: boolean
}

export const LocationConflictModal = (
  props: LocationConflictModalProps
): JSX.Element => {
  const {
    onCloseClick,
    cutoutId,
    robotName,
    missingLabwareDisplayName,
    requiredFixtureId,
    requiredModule,
    deckDef,
    isOnDevice = false,
  } = props
  const { t, i18n } = useTranslation(['protocol_setup', 'shared'])

  const [showModuleSelect, setShowModuleSelect] = React.useState(false)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckConfigurationAtLocationFixtureId = deckConfig.find(
    (deckFixture: CutoutConfig) => deckFixture.cutoutId === cutoutId
  )?.cutoutFixtureId

  const isThermocycler =
    requiredModule === THERMOCYCLER_MODULE_V1 ||
    requiredModule === THERMOCYCLER_MODULE_V2

  const currentFixtureDisplayName =
    deckConfigurationAtLocationFixtureId != null
      ? getFixtureDisplayName(deckConfigurationAtLocationFixtureId)
      : ''

  // get fixture display name at A1 for themocycler if B1 is slot
  const deckConfigurationAtA1 = deckConfig.find(
    (deckFixture: CutoutConfig) => deckFixture.cutoutId === 'cutoutA1'
  )?.cutoutFixtureId

  const currentThermocyclerFixtureDisplayName =
    currentFixtureDisplayName === 'Slot' && deckConfigurationAtA1 != null
      ? getFixtureDisplayName(deckConfigurationAtA1)
      : currentFixtureDisplayName

  const handleConfigureModule = (moduleSerialNumber?: string): void => {
    if (requiredModule != null) {
      const slotName = cutoutId.replace('cutout', '')
      const moduleFixtures = getCutoutFixturesForModuleModel(
        requiredModule,
        deckDef
      )
      const moduleFixtureIdByCutoutId = getFixtureIdByCutoutIdFromModuleSlotName(
        slotName,
        moduleFixtures,
        deckDef
      )

      const newDeckConfig = deckConfig.map(existingCutoutConfig => {
        const replacementCutoutFixtureId =
          moduleFixtureIdByCutoutId[existingCutoutConfig.cutoutId]
        return existingCutoutConfig.cutoutId in moduleFixtureIdByCutoutId &&
          replacementCutoutFixtureId != null
          ? {
              ...existingCutoutConfig,
              cutoutFixtureId: replacementCutoutFixtureId,
              opentronsModuleSerialNumber: moduleSerialNumber,
            }
          : existingCutoutConfig
      })
      updateDeckConfiguration(newDeckConfig)
    }
    onCloseClick()
  }

  const handleUpdateDeck = (): void => {
    if (requiredModule != null) {
      setShowModuleSelect(true)
    } else if (requiredFixtureId != null) {
      const newRequiredFixtureDeckConfig = deckConfig.map(fixture =>
        fixture.cutoutId === cutoutId
          ? {
              ...fixture,
              cutoutFixtureId: requiredFixtureId,
              opentronsModuleSerialNumber: undefined,
            }
          : fixture
      )
      updateDeckConfiguration(newRequiredFixtureDeckConfig)
      onCloseClick()
    } else {
      onCloseClick()
    }
  }

  let protocolSpecifiesDisplayName = ''
  if (missingLabwareDisplayName != null) {
    protocolSpecifiesDisplayName = missingLabwareDisplayName
  } else if (requiredFixtureId != null) {
    protocolSpecifiesDisplayName = getFixtureDisplayName(requiredFixtureId)
  } else if (requiredModule != null) {
    protocolSpecifiesDisplayName = getModuleDisplayName(requiredModule)
  }

  const displaySlotName = isThermocycler
    ? 'A1 + B1'
    : getCutoutDisplayName(cutoutId)

  if (showModuleSelect && requiredModule != null) {
    return createPortal(
      <ChooseModuleToConfigureModal
        handleConfigureModule={handleConfigureModule}
        requiredModuleModel={requiredModule}
        onCloseClick={onCloseClick}
        isOnDevice={isOnDevice}
        deckDef={deckDef}
        robotName={robotName}
        displaySlotName={displaySlotName}
      />,
      getTopPortalEl()
    )
  }

  return createPortal(
    isOnDevice ? (
      <Modal
        onOutsideClick={onCloseClick}
        header={{
          title: t('deck_conflict'),
          hasExitIcon: true,
          onClick: onCloseClick,
          iconName: 'ot-alert',
          iconColor: COLORS.yellow50,
        }}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
          <Trans
            t={t}
            i18nKey={
              isThermocycler
                ? 'deck_conflict_info_thermocycler'
                : 'deck_conflict_info'
            }
            values={{
              currentFixture: currentFixtureDisplayName,
              cutout: getCutoutDisplayName(cutoutId),
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
              {t('slot_location', { slotName: displaySlotName })}
            </StyledText>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingTop={SPACING.spacing8}
              gridGap={SPACING.spacing8}
            >
              <Flex
                padding={SPACING.spacing24}
                backgroundColor={COLORS.grey35}
                flexDirection={DIRECTION_ROW}
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                borderRadius={BORDERS.borderRadius4}
              >
                <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {t('protocol_specifies')}
                </StyledText>

                <StyledText as="p" color={COLORS.grey60}>
                  {protocolSpecifiesDisplayName}
                </StyledText>
              </Flex>
              <Flex
                padding={SPACING.spacing24}
                backgroundColor={COLORS.grey35}
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                alignItems={ALIGN_CENTER}
                borderRadius={BORDERS.borderRadius4}
              >
                <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {t('currently_configured')}
                </StyledText>

                <StyledText as="p" color={COLORS.grey60}>
                  {currentFixtureDisplayName}
                </StyledText>
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
              buttonText={i18n.format(t('update_deck'), 'capitalize')}
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
            <Icon name="ot-alert" size="1rem" color={COLORS.yellow50} />
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
            i18nKey={
              isThermocycler
                ? 'deck_conflict_info_thermocycler'
                : 'deck_conflict_info'
            }
            values={{
              currentFixture: currentFixtureDisplayName,
              cutout: getCutoutDisplayName(cutoutId),
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
              {t('slot_location', { slotName: displaySlotName })}
            </StyledText>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              paddingTop={SPACING.spacing8}
              gridGap={SPACING.spacing8}
            >
              <Flex
                padding={SPACING.spacing8}
                backgroundColor={COLORS.grey20}
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing20}
                alignItems={ALIGN_CENTER}
                borderRadius={BORDERS.borderRadius4}
              >
                <StyledText as="label" width={SPACING.spacing120}>
                  {t('protocol_specifies')}
                </StyledText>
                <StyledText as="label" flex="1">
                  {protocolSpecifiesDisplayName}
                </StyledText>
              </Flex>
              <Flex
                padding={SPACING.spacing8}
                backgroundColor={COLORS.grey20}
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing20}
                alignItems={ALIGN_CENTER}
                borderRadius={BORDERS.borderRadius4}
              >
                <StyledText as="label" width={SPACING.spacing120}>
                  {t('currently_configured')}
                </StyledText>
                <StyledText as="label" flex="1">
                  {isThermocycler
                    ? currentThermocyclerFixtureDisplayName
                    : currentFixtureDisplayName}
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
    ),
    getTopPortalEl()
  )
}
