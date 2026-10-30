import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  FixtureOption,
  Flex,
  Icon,
  LegacyStyledText,
  Modal,
  SecondaryButton,
  SPACING,
  TEXT_ALIGN_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useModulesQuery } from '@opentrons/react-api-client'
import {
  getCutoutFixturesForModuleModel,
  getFixtureDisplayName,
  getModuleDisplayName,
  MAGNETIC_BLOCK_V1,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { SmallButton } from '/app/atoms/buttons'
import { useModuleUSBPort } from '/app/local-resources/modules'
import { ODDFixtureOption } from '/app/molecules/ODDFixtureOption'
import { OddModal } from '/app/molecules/OddModal'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useCloseCurrentRun } from '/app/resources/runs'

import { useSendIdentifyModule } from '../ModuleWizardFlows/hooks'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { AttachedModule } from '@opentrons/api-client'
import type { DeckDefinition, ModuleModel } from '@opentrons/shared-data'

const EQUIPMENT_POLL_MS = 5000
const MODULE_IDENTIFY_TIME_MS = 10000

interface ModuleFixtureOption {
  moduleModel: ModuleModel
  usbPort?: string
  serialNumber?: string
}
interface ChooseModuleToConfigureModalProps {
  handleConfigureModule: (moduleSerialNumber?: string) => void
  onCloseClick: () => void
  deckDef: DeckDefinition
  isOnDevice: boolean
  requiredModuleModel: ModuleModel
  robotName: string
  displaySlotName: string
}

export const ChooseModuleToConfigureModal = (
  props: ChooseModuleToConfigureModalProps
): ReactNode => {
  const {
    handleConfigureModule,
    onCloseClick,
    deckDef,
    requiredModuleModel,
    isOnDevice,
    robotName,
    displaySlotName,
  } = props
  const { t, i18n } = useTranslation([
    'protocol_setup',
    'shared',
    'deck_configuration',
  ])
  const { parseModuleUSBPort } = useModuleUSBPort()
  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
  const deckConfig = useNotifyDeckConfigurationQuery()?.data ?? []
  const [configuredModuleMatches, unconfiguredModuleMatches] =
    attachedModules.reduce<[AttachedModule[], AttachedModule[]]>(
      (acc, attachedMod) => {
        if (attachedMod.moduleModel === requiredModuleModel) {
          return deckConfig.some(
            ({ opentronsModuleSerialNumber }) =>
              attachedMod.serialNumber === opentronsModuleSerialNumber
          )
            ? [[...acc[0], attachedMod], acc[1]]
            : [acc[0], [...acc[1], attachedMod]]
        }
        return acc
      },
      [[], []]
    ) ?? []

  const sendIdentifyModule = useSendIdentifyModule()
  const [identifyInUse, setIdentifyInUse] = useState<string | null>(null)
  const [identifyTimeout, setTimeoutID] = useState<NodeJS.Timeout | null>(null)

  const stackerIdentifyHandler = (module: AttachedModule): void => {
    sendIdentifyModule(module, true, 'blue')
    setIdentifyInUse(module.serialNumber)
    const timeoutID = setTimeout(() => {
      sendIdentifyModule(module, false)
      setIdentifyInUse(null)
    }, MODULE_IDENTIFY_TIME_MS)
    setTimeoutID(timeoutID)
  }

  const connectedOptions: ModuleFixtureOption[] = unconfiguredModuleMatches.map(
    attachedMod => {
      return {
        moduleModel: attachedMod.moduleModel,
        usbPort: parseModuleUSBPort(attachedMod),
        serialNumber: attachedMod.serialNumber,
      }
    }
  )
  const handleIdentifyFixture = (module: AttachedModule): void => {
    if (identifyInUse === null) {
      stackerIdentifyHandler(module)
    } else if (identifyInUse !== null) {
      const previousModule =
        unconfiguredModuleMatches.find(m => m.serialNumber === identifyInUse) ??
        null
      if (previousModule !== null && module !== null) {
        sendIdentifyModule(previousModule, false)
        if (identifyTimeout !== null) {
          clearTimeout(identifyTimeout)
        }
        stackerIdentifyHandler(module)
      }
    }
  }
  const handleStackerClearAndConfigureModule = (
    module: AttachedModule
  ): void => {
    sendIdentifyModule(module, false)
    if (identifyTimeout !== null) {
      clearTimeout(identifyTimeout)
    }
    handleConfigureModule(module.serialNumber)
  }
  const passiveOptions: ModuleFixtureOption[] =
    requiredModuleModel === MAGNETIC_BLOCK_V1
      ? [{ moduleModel: MAGNETIC_BLOCK_V1 }]
      : []
  const fixtureOptions = [...connectedOptions, ...passiveOptions].map(
    ({ moduleModel, serialNumber, usbPort }) => {
      const moduleFixtures = getCutoutFixturesForModuleModel(
        moduleModel,
        deckDef
      )
      const selectedModule =
        unconfiguredModuleMatches.find(m => m.serialNumber === serialNumber) ??
        null
      if (moduleModel === 'flexStackerModuleV1' && selectedModule !== null) {
        return isOnDevice ? (
          <ODDFixtureOption
            key={serialNumber}
            onClickHandler={() => {
              handleStackerClearAndConfigureModule(selectedModule)
            }}
            optionName={getFixtureDisplayName(
              t as TFunction,
              moduleFixtures[0].id,
              usbPort
            )}
            buttonText={i18n.format(t('shared:add'), 'capitalize')}
            secondaryButtonText={i18n.format(
              t('shared:identify'),
              'capitalize'
            )}
            secondaryOnClickHandler={() => {
              handleIdentifyFixture(selectedModule)
            }}
          />
        ) : (
          <FixtureOption
            key={serialNumber}
            onClickHandler={() => {
              handleStackerClearAndConfigureModule(selectedModule)
            }}
            optionName={getFixtureDisplayName(
              t as TFunction,
              moduleFixtures[0].id,
              usbPort
            )}
            buttonText={i18n.format(t('shared:add'), 'capitalize')}
            secondaryButtonText={i18n.format(
              t('shared:identify'),
              'capitalize'
            )}
            secondaryOnClickHandler={() => {
              handleIdentifyFixture(selectedModule)
            }}
          />
        )
      } else {
        return isOnDevice ? (
          <ODDFixtureOption
            key={serialNumber}
            onClickHandler={() => {
              handleConfigureModule(serialNumber)
            }}
            optionName={getFixtureDisplayName(
              t as TFunction,
              moduleFixtures[0].id,
              usbPort
            )}
            buttonText={i18n.format(t('shared:add'), 'capitalize')}
          />
        ) : (
          <FixtureOption
            key={serialNumber}
            onClickHandler={() => {
              handleConfigureModule(serialNumber)
            }}
            optionName={getFixtureDisplayName(
              t as TFunction,
              moduleFixtures[0].id,
              usbPort
            )}
            buttonText={i18n.format(t('shared:add'), 'capitalize')}
          />
        )
      }
    }
  )

  const moduleDisplayName = getModuleDisplayName(requiredModuleModel)

  const contents =
    fixtureOptions.length > 0 ? (
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <LegacyStyledText forwardedAs="p">
          {t('add_this_deck_hardware')}
        </LegacyStyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {fixtureOptions}
        </Flex>
      </Flex>
    ) : (
      <NoUnconfiguredModules
        {...{
          isOnDevice,
          configuredModuleMatches,
          moduleDisplayName,
          displaySlotName,
          robotName,
        }}
      />
    )

  return createPortal(
    isOnDevice ? (
      <OddModal
        onOutsideClick={onCloseClick}
        header={{
          title: t('add_to_slot', { slotName: displaySlotName }),
          hasExitIcon: true,
          onClick: onCloseClick,
        }}
      >
        {contents}
      </OddModal>
    ) : (
      <Modal
        title={
          <Flex
            flexDirection={DIRECTION_ROW}
            gridGap={SPACING.spacing10}
            alignItems={ALIGN_CENTER}
          >
            <LegacyStyledText
              forwardedAs="h3"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('add_to_slot', { slotName: displaySlotName })}
            </LegacyStyledText>
          </Flex>
        }
        onClose={onCloseClick}
        width="27.75rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {contents}
        </Flex>
      </Modal>
    ),
    getTopPortalEl()
  )
}

interface NoUnconfiguredModulesProps {
  moduleDisplayName: string
  displaySlotName: string
  configuredModuleMatches: AttachedModule[]
  isOnDevice: boolean
  robotName: string
}
function NoUnconfiguredModules(props: NoUnconfiguredModulesProps): ReactNode {
  const {
    moduleDisplayName,
    configuredModuleMatches,
    displaySlotName,
    isOnDevice,
    robotName,
  } = props
  const { t } = useTranslation('protocol_setup')
  const navigate = useNavigate()
  const { closeCurrentRun } = useCloseCurrentRun()
  const handleCancelRun = (): void => {
    closeCurrentRun()
  }
  const handleNavigateToDeviceDetails = (): void => {
    navigate(`/devices/${robotName}`)
  }
  const exitButton = isOnDevice ? (
    <SmallButton
      onClick={handleCancelRun}
      buttonType="secondary"
      buttonText={t('exit_to_deck_configuration')}
    />
  ) : (
    <SecondaryButton onClick={handleNavigateToDeviceDetails}>
      {t('exit_to_deck_configuration')}
    </SecondaryButton>
  )

  const loadingBlock = (
    <Flex
      paddingX={SPACING.spacing80}
      paddingY={SPACING.spacing40}
      gridGap={isOnDevice ? SPACING.spacing32 : SPACING.spacing10}
      borderRadius={isOnDevice ? BORDERS.borderRadius12 : BORDERS.borderRadius8}
      backgroundColor={isOnDevice ? COLORS.grey35 : COLORS.grey30}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
    >
      <Icon
        size={isOnDevice ? '2rem' : '1.25rem'}
        marginLeft={SPACING.spacing8}
        color={COLORS.grey60}
        name="ot-spinner"
        spin
      />
      <LegacyStyledText
        as={isOnDevice ? 'h4' : 'p'}
        color={COLORS.grey60}
        textAlign={TEXT_ALIGN_CENTER}
      >
        {t('plug_in_module_to_configure', { module: moduleDisplayName })}
      </LegacyStyledText>
    </Flex>
  )
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={isOnDevice ? SPACING.spacing32 : SPACING.spacing24}
    >
      {configuredModuleMatches.length > 0 ? (
        <>
          <LegacyStyledText forwardedAs="p">
            {t('there_are_other_configured_modules', {
              module: moduleDisplayName,
            })}
          </LegacyStyledText>
          {loadingBlock}
          {exitButton}
        </>
      ) : (
        <>
          <LegacyStyledText forwardedAs="p">
            {t('there_are_no_unconfigured_modules', {
              module: moduleDisplayName,
              slot: displaySlotName,
            })}
          </LegacyStyledText>
          {loadingBlock}
        </>
      )}
    </Flex>
  )
}
