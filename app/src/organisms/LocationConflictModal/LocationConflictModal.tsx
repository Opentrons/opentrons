import { useState } from 'react'
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
  LegacyStyledText,
  TYPOGRAPHY,
  Modal,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  getModuleDisplayName,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  getCutoutFixturesForModuleModel,
  getFixtureIdByCutoutIdFromModuleSlotName,
  SINGLE_LEFT_SLOT_FIXTURE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { OddModal } from '/app/molecules/OddModal'
import { SmallButton } from '/app/atoms/buttons/SmallButton'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

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

  const [showModuleSelect, setShowModuleSelect] = useState(false)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const deckConfigurationAtLocationFixtureId = deckConfig.find(
    (deckFixture: CutoutConfig) => deckFixture.cutoutId === cutoutId
  )?.cutoutFixtureId

  const isThermocyclerRequired =
    requiredModule === THERMOCYCLER_MODULE_V1 ||
    requiredModule === THERMOCYCLER_MODULE_V2

  // check if current fixture in cutoutId is thermocycler
  const isThermocyclerCurrentFixture =
    deckConfigurationAtLocationFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
    deckConfigurationAtLocationFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE

  const currentFixtureDisplayName =
    deckConfigurationAtLocationFixtureId != null
      ? getFixtureDisplayName(deckConfigurationAtLocationFixtureId)
      : ''

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
        if (
          existingCutoutConfig.cutoutId in moduleFixtureIdByCutoutId &&
          replacementCutoutFixtureId != null
        ) {
          return {
            ...existingCutoutConfig,
            cutoutFixtureId: replacementCutoutFixtureId,
            opentronsModuleSerialNumber: moduleSerialNumber,
          }
        } else if (
          isThermocyclerCurrentFixture &&
          ((cutoutId === 'cutoutA1' &&
            existingCutoutConfig.cutoutId === 'cutoutB1') ||
            (cutoutId === 'cutoutB1' &&
              existingCutoutConfig.cutoutId === 'cutoutA1'))
        ) {
          /**
           * special-case for removing current thermocycler:
           * set paired cutout (B1 for A1, A1 for B1) to single slot left fixture
           * TODO(bh, 2024-08-29): generalize to remove all entities from FixtureGroup
           */
          return {
            ...existingCutoutConfig,
            cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
            opentronsModuleSerialNumber: undefined,
          }
        } else {
          return existingCutoutConfig
        }
      })
      updateDeckConfiguration(newDeckConfig)
    }
    onCloseClick()
  }

  const handleUpdateDeck = (): void => {
    if (requiredModule != null) {
      setShowModuleSelect(true)
    } else if (requiredFixtureId != null) {
      const newRequiredFixtureDeckConfig = deckConfig.map(fixture => {
        if (fixture.cutoutId === cutoutId) {
          return {
            ...fixture,
            cutoutFixtureId: requiredFixtureId,
            opentronsModuleSerialNumber: undefined,
          }
        } else if (
          isThermocyclerCurrentFixture &&
          ((cutoutId === 'cutoutA1' && fixture.cutoutId === 'cutoutB1') ||
            (cutoutId === 'cutoutB1' && fixture.cutoutId === 'cutoutA1'))
        ) {
          /**
           * special-case for removing current thermocycler:
           * set paired cutout (B1 for A1, A1 for B1) to single slot left fixture
           * TODO(bh, 2024-08-29): generalize to remove all entities from FixtureGroup
           */
          return {
            ...fixture,
            cutoutFixtureId: SINGLE_LEFT_SLOT_FIXTURE,
            opentronsModuleSerialNumber: undefined,
          }
        } else {
          return fixture
        }
      })

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

  const displaySlotName =
    isThermocyclerRequired || isThermocyclerCurrentFixture
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
      <OddModal
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
              isThermocyclerRequired
                ? 'deck_conflict_info_thermocycler'
                : 'deck_conflict_info'
            }
            values={{
              currentFixture: currentFixtureDisplayName,
              cutout: displaySlotName,
            }}
            components={{
              block: <LegacyStyledText as="p" />,
              strong: <strong />,
            }}
          />
          <Flex flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightBold}
              paddingBottom={SPACING.spacing8}
            >
              {t('slot_location', { slotName: displaySlotName })}
            </LegacyStyledText>
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
                <LegacyStyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('protocol_specifies')}
                </LegacyStyledText>

                <LegacyStyledText as="p" color={COLORS.grey60}>
                  {protocolSpecifiesDisplayName}
                </LegacyStyledText>
              </Flex>
              <Flex
                padding={SPACING.spacing24}
                backgroundColor={COLORS.grey35}
                flexDirection={DIRECTION_ROW}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                alignItems={ALIGN_CENTER}
                borderRadius={BORDERS.borderRadius4}
              >
                <LegacyStyledText
                  as="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('currently_configured')}
                </LegacyStyledText>

                <LegacyStyledText as="p" color={COLORS.grey60}>
                  {currentFixtureDisplayName}
                </LegacyStyledText>
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
      </OddModal>
    ) : (
      <Modal
        title={
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing10}
            alignItems={ALIGN_CENTER}
          >
            <Icon name="ot-alert" size="1rem" color={COLORS.yellow50} />
            <LegacyStyledText
              as="h3"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('deck_conflict')}
            </LegacyStyledText>
          </Flex>
        }
        onClose={onCloseClick}
        width="27.75rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Trans
            t={t}
            i18nKey={
              isThermocyclerRequired
                ? 'deck_conflict_info_thermocycler'
                : 'deck_conflict_info'
            }
            values={{
              currentFixture: currentFixtureDisplayName,
              cutout: displaySlotName,
            }}
            components={{
              block: <LegacyStyledText fontSize={TYPOGRAPHY.fontSizeH4} />,
              strong: <strong />,
            }}
          />
          <Flex paddingY={SPACING.spacing16} flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText
              fontSize={TYPOGRAPHY.fontSizeH4}
              fontWeight={TYPOGRAPHY.fontWeightBold}
            >
              {t('slot_location', { slotName: displaySlotName })}
            </LegacyStyledText>
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
                <LegacyStyledText as="label" width={SPACING.spacing120}>
                  {t('protocol_specifies')}
                </LegacyStyledText>
                <LegacyStyledText as="label" flex="1">
                  {protocolSpecifiesDisplayName}
                </LegacyStyledText>
              </Flex>
              <Flex
                padding={SPACING.spacing8}
                backgroundColor={COLORS.grey20}
                flexDirection={DIRECTION_ROW}
                gridGap={SPACING.spacing20}
                alignItems={ALIGN_CENTER}
                borderRadius={BORDERS.borderRadius4}
              >
                <LegacyStyledText as="label" width={SPACING.spacing120}>
                  {t('currently_configured')}
                </LegacyStyledText>
                <LegacyStyledText as="label" flex="1">
                  {currentFixtureDisplayName}
                </LegacyStyledText>
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
      </Modal>
    ),
    getTopPortalEl()
  )
}
