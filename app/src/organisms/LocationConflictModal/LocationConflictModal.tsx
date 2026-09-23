import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'

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
  LegacyStyledText,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useUpdateDeckConfigurationMutation } from '@opentrons/react-api-client'
import {
  FLEX_STACKER_MODULE_V1,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE,
  FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE,
  getCutoutDisplayName,
  getCutoutFixturesForModuleModel,
  getFixtureDisplayName,
  getFixtureIdByCutoutIdFromModuleSlotName,
  getModuleDisplayName,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
  WASTE_CHUTE_FLEX_STACKER_FIXTURES,
  WASTE_CHUTE_ONLY_FIXTURES,
  WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { SmallButton } from '/app/atoms/buttons/SmallButton'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { OddModal } from '/app/molecules/OddModal'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { ChooseModuleToConfigureModal } from './ChooseModuleToConfigureModal'
import { patchDeckConfigForRequiredFixture } from './patchDeckConfigForRequiredFixture'

import type { TFunction } from 'i18next'
import type {
  CutoutConfig,
  CutoutFixtureId,
  CutoutId,
  DeckDefinition,
  ModuleModel,
} from '@opentrons/shared-data'

interface LocationConflictModalProps {
  onCloseClick: () => void
  cutoutId: CutoutId
  deckDef: DeckDefinition
  robotName: string
  requiredFixtureId?: CutoutFixtureId
  requiredModule?: ModuleModel
  isOnDevice?: boolean
  moduleSerialNumber?: string
}

export const LocationConflictModal = (
  props: LocationConflictModalProps
): JSX.Element => {
  const {
    onCloseClick,
    cutoutId,
    robotName,
    requiredFixtureId,
    requiredModule,
    deckDef,
    moduleSerialNumber,
    isOnDevice = false,
  } = props
  const { t, i18n } = useTranslation([
    'protocol_setup',
    'shared',
    'deck_configuration',
  ])

  const [showModuleSelect, setShowModuleSelect] = useState(false)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const documentationState = useDocumentationState()
  const { updateDeckConfiguration } =
    useUpdateDeckConfigurationMutation(documentationState)
  const deckConfigurationAtLocationFixtureId = deckConfig.find(
    (deckFixture: CutoutConfig) => deckFixture.cutoutId === cutoutId
  )?.cutoutFixtureId

  // skip past fix conflict screen if D3 can remain the same when you attach
  // a flex stacker module, ie mag block or waste chute only fixture
  useEffect(
    () => {
      if (requiredModule != null && requiredModule === FLEX_STACKER_MODULE_V1) {
        if (
          deckConfigurationAtLocationFixtureId != null &&
          (deckConfigurationAtLocationFixtureId === MAGNETIC_BLOCK_V1_FIXTURE ||
            WASTE_CHUTE_ONLY_FIXTURES.includes(
              deckConfigurationAtLocationFixtureId
            ))
        ) {
          setShowModuleSelect(true)
        }
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const isThermocyclerRequired =
    requiredModule === THERMOCYCLER_MODULE_V1 ||
    requiredModule === THERMOCYCLER_MODULE_V2

  // check if current fixture in cutoutId is thermocycler
  const isThermocyclerCurrentFixture =
    deckConfigurationAtLocationFixtureId === THERMOCYCLER_V2_REAR_FIXTURE ||
    deckConfigurationAtLocationFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE

  const getCurrentFixtureDisplayName = (): string => {
    if (
      requiredFixtureId === SINGLE_RIGHT_SLOT_FIXTURE &&
      deckConfigurationAtLocationFixtureId ===
        FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE
    ) {
      return getFixtureDisplayName(t as TFunction, MAGNETIC_BLOCK_V1_FIXTURE)
    } else if (
      requiredFixtureId === SINGLE_RIGHT_SLOT_FIXTURE &&
      (deckConfigurationAtLocationFixtureId ===
        FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE ||
        deckConfigurationAtLocationFixtureId ===
          FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE)
    ) {
      return getFixtureDisplayName(
        t as TFunction,
        WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
      )
    } else {
      return deckConfigurationAtLocationFixtureId != null
        ? getFixtureDisplayName(
            t as TFunction,
            deckConfigurationAtLocationFixtureId
          )
        : ''
    }
  }
  const currentFixtureDisplayName = getCurrentFixtureDisplayName()

  const handleConfigureModule = (moduleSerialNumber?: string): void => {
    if (requiredModule != null) {
      const slotName = getCutoutDisplayName(cutoutId)
      const moduleFixtures = getCutoutFixturesForModuleModel(
        requiredModule,
        deckDef
      )
      const moduleFixtureIdByCutoutId =
        getFixtureIdByCutoutIdFromModuleSlotName(
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
          if (
            requiredFixtureId != null &&
            WASTE_CHUTE_FLEX_STACKER_FIXTURES.includes(requiredFixtureId)
          ) {
            // if the required fixture is a combo waste chute fixture, use the required fixture id
            // instead of the module fixture id
            return {
              ...existingCutoutConfig,
              cutoutFixtureId: requiredFixtureId,
              opentronsModuleSerialNumber: moduleSerialNumber,
            }
          } else if (
            WASTE_CHUTE_ONLY_FIXTURES.includes(
              existingCutoutConfig.cutoutFixtureId
            ) &&
            replacementCutoutFixtureId === FLEX_STACKER_V1_FIXTURE
          ) {
            // if current fixture is a waste chute and we are adding a flex stacker,
            // don't remove the waste chute
            const replacementCutoutFixtureId =
              existingCutoutConfig.cutoutFixtureId ===
              WASTE_CHUTE_RIGHT_ADAPTER_COVERED_FIXTURE
                ? FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_COVERED_FIXTURE
                : FLEX_STACKER_WITH_WASTE_CHUTE_ADAPTER_NO_COVER_FIXTURE
            return {
              ...existingCutoutConfig,
              cutoutFixtureId: replacementCutoutFixtureId,
              opentronsModuleSerialNumber: moduleSerialNumber,
            }
          } else if (
            existingCutoutConfig.cutoutFixtureId ===
              MAGNETIC_BLOCK_V1_FIXTURE &&
            replacementCutoutFixtureId === FLEX_STACKER_V1_FIXTURE
          ) {
            // if current fixture is a magnetic block and we are adding a flex stacker,
            // don't remove the mag block
            return {
              ...existingCutoutConfig,
              cutoutFixtureId: FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
              opentronsModuleSerialNumber: moduleSerialNumber,
            }
          } else {
            return {
              ...existingCutoutConfig,
              cutoutFixtureId: replacementCutoutFixtureId,
              opentronsModuleSerialNumber: moduleSerialNumber,
            }
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
    if (requiredModule != null && moduleSerialNumber != null) {
      // if there is a conflict for a combo fixture that includes a module
      // and the module is already matched then we can skip the configure module screen
      handleConfigureModule(moduleSerialNumber)
    } else if (requiredModule != null) {
      setShowModuleSelect(true)
    } else if (requiredFixtureId != null) {
      const newRequiredFixtureDeckConfig = patchDeckConfigForRequiredFixture(
        deckConfig,
        cutoutId,
        requiredFixtureId
      )

      updateDeckConfiguration(newRequiredFixtureDeckConfig)
      onCloseClick()
    } else {
      onCloseClick()
    }
  }

  let protocolSpecifiesDisplayName = ''
  if (requiredFixtureId != null) {
    protocolSpecifiesDisplayName = getFixtureDisplayName(
      t as TFunction,
      requiredFixtureId
    )
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
              block: <LegacyStyledText forwardedAs="p" />,
              strong: <strong />,
            }}
          />
          <Flex flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText
              forwardedAs="p"
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
                  forwardedAs="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('protocol_specifies')}
                </LegacyStyledText>

                <LegacyStyledText forwardedAs="p" color={COLORS.grey60}>
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
                  forwardedAs="p"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('currently_configured')}
                </LegacyStyledText>

                <LegacyStyledText forwardedAs="p" color={COLORS.grey60}>
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
              forwardedAs="h3"
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
                <LegacyStyledText
                  forwardedAs="label"
                  width={SPACING.spacing120}
                >
                  {t('protocol_specifies')}
                </LegacyStyledText>
                <LegacyStyledText forwardedAs="label" flex="1">
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
                <LegacyStyledText
                  forwardedAs="label"
                  width={SPACING.spacing120}
                >
                  {t('currently_configured')}
                </LegacyStyledText>
                <LegacyStyledText forwardedAs="label" flex="1">
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
