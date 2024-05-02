import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Chip,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LocationIcon,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getCutoutFixturesForModuleModel,
  getCutoutIdsFromModuleSlotName,
  getModuleDisplayName,
  getModuleType,
  MAGNETIC_BLOCK_TYPE,
  NON_CONNECTING_MODULE_TYPES,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { getModulePrepCommands } from '../../organisms/Devices/getModulePrepCommands'
import { getModuleTooHot } from '../../organisms/Devices/getModuleTooHot'
import { useRunCalibrationStatus } from '../../organisms/Devices/hooks'
import { LocationConflictModal } from '../../organisms/Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { ModuleWizardFlows } from '../../organisms/ModuleWizardFlows'
import { useToaster } from '../../organisms/ToasterOven'
import { getLocalRobot } from '../../redux/discovery'
import { useChainLiveCommands } from '../../resources/runs'
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'

import type { CommandData } from '@opentrons/api-client'
import type { CutoutConfig, DeckDefinition } from '@opentrons/shared-data'
import type { ModulePrepCommandsType } from '../../organisms/Devices/getModulePrepCommands'
import type { ProtocolCalibrationStatus } from '../../organisms/Devices/hooks'
import type { AttachedProtocolModuleMatch } from './utils'

const DECK_CONFIG_REFETCH_INTERVAL = 5000

interface ModuleTableProps {
  attachedProtocolModuleMatches: AttachedProtocolModuleMatch[]
  deckDef: DeckDefinition
  runId: string
}

export function ModuleTable(props: ModuleTableProps): JSX.Element {
  const { attachedProtocolModuleMatches, deckDef, runId } = props

  const [
    prepCommandErrorMessage,
    setPrepCommandErrorMessage,
  ] = React.useState<string>('')

  const { data: deckConfig } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
  })
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : ''
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)
  const { chainLiveCommands, isCommandMutationLoading } = useChainLiveCommands()

  return (
    <>
      {attachedProtocolModuleMatches.map(module => {
        // filter out the magnetic block here, because it is handled by the SetupFixturesList
        if (module.moduleDef.moduleType === MAGNETIC_BLOCK_TYPE) return null
        const moduleFixtures = getCutoutFixturesForModuleModel(
          module.moduleDef.model,
          deckDef
        )
        const moduleCutoutIds = getCutoutIdsFromModuleSlotName(
          module.slotName,
          moduleFixtures,
          deckDef
        )
        const conflictedFixture =
          deckConfig?.find(
            ({ cutoutId, cutoutFixtureId }) =>
              moduleCutoutIds.includes(cutoutId) &&
              !moduleFixtures.some(({ id }) => cutoutFixtureId === id) &&
              module.attachedModuleMatch == null
          ) ?? null
        return (
          <ModuleTableItem
            key={module.moduleId}
            module={module}
            calibrationStatus={calibrationStatus}
            chainLiveCommands={chainLiveCommands}
            isLoading={isCommandMutationLoading}
            prepCommandErrorMessage={prepCommandErrorMessage}
            setPrepCommandErrorMessage={setPrepCommandErrorMessage}
            conflictedFixture={conflictedFixture}
            deckDef={deckDef}
            robotName={robotName}
          />
        )
      })}
    </>
  )
}

interface ModuleTableItemProps {
  calibrationStatus: ProtocolCalibrationStatus
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => Promise<CommandData[]>
  conflictedFixture: CutoutConfig | null
  isLoading: boolean
  module: AttachedProtocolModuleMatch
  prepCommandErrorMessage: string
  setPrepCommandErrorMessage: React.Dispatch<React.SetStateAction<string>>
  deckDef: DeckDefinition
  robotName: string
}

function ModuleTableItem({
  module,
  calibrationStatus,
  chainLiveCommands,
  isLoading,
  prepCommandErrorMessage,
  setPrepCommandErrorMessage,
  conflictedFixture,
  deckDef,
  robotName,
}: ModuleTableItemProps): JSX.Element {
  const { i18n, t } = useTranslation(['protocol_setup', 'module_wizard_flows'])

  const { makeSnackbar } = useToaster()

  const handleCalibrate = (): void => {
    if (module.attachedModuleMatch != null) {
      if (getModuleTooHot(module.attachedModuleMatch)) {
        makeSnackbar(t('module_wizard_flows:module_too_hot'))
      } else {
        chainLiveCommands(
          getModulePrepCommands(module.attachedModuleMatch),
          false
        ).catch((e: Error) => {
          setPrepCommandErrorMessage(e.message)
        })
        setShowModuleWizard(true)
      }
    } else {
      makeSnackbar(t('attach_module'))
    }
  }

  const isNonConnectingModule = NON_CONNECTING_MODULE_TYPES.includes(
    module.moduleDef.moduleType
  )
  const isModuleReady = module.attachedModuleMatch != null

  const [showModuleWizard, setShowModuleWizard] = React.useState<boolean>(false)
  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = React.useState<boolean>(false)

  let moduleStatus: JSX.Element = (
    <>
      <Chip
        text={t('module_disconnected')}
        type="warning"
        background={false}
        iconName="connection-status"
      />
    </>
  )
  if (conflictedFixture != null) {
    moduleStatus = (
      <>
        <Chip
          text={t('location_conflict')}
          type="warning"
          background={false}
          iconName="connection-status"
        />
        <SmallButton
          buttonCategory="rounded"
          buttonText={t('resolve')}
          onClick={() => {
            setShowLocationConflictModal(true)
          }}
        />
      </>
    )
  } else if (isNonConnectingModule) {
    moduleStatus = (
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('n_a')}
      </StyledText>
    )
  } else if (
    isModuleReady &&
    module.attachedModuleMatch?.moduleOffset?.last_modified != null
  ) {
    moduleStatus = (
      <Chip
        text={t('module_connected')}
        type="success"
        background={false}
        iconName="connection-status"
      />
    )
  } else if (
    isModuleReady &&
    calibrationStatus.complete &&
    module.attachedModuleMatch?.moduleOffset?.last_modified == null
  ) {
    moduleStatus = (
      <SmallButton
        buttonCategory="rounded"
        buttonText={i18n.format(t('calibrate'), 'capitalize')}
        onClick={handleCalibrate}
      />
    )
  } else if (!calibrationStatus?.complete) {
    moduleStatus = (
      <StyledText as="p">
        {calibrationStatus?.reason === 'attach_pipette_failure_reason'
          ? t('calibration_required_attach_pipette_first')
          : t('calibration_required_calibrate_pipette_first')}
      </StyledText>
    )
  }

  return (
    <>
      {showModuleWizard && module.attachedModuleMatch != null ? (
        <ModuleWizardFlows
          attachedModule={module.attachedModuleMatch}
          closeFlow={() => {
            setShowModuleWizard(false)
          }}
          isPrepCommandLoading={isLoading}
          prepCommandErrorMessage={
            prepCommandErrorMessage === '' ? undefined : prepCommandErrorMessage
          }
        />
      ) : null}
      {showLocationConflictModal && conflictedFixture != null ? (
        <LocationConflictModal
          onCloseClick={() => {
            setShowLocationConflictModal(false)
          }}
          cutoutId={conflictedFixture.cutoutId}
          requiredModule={module.moduleDef.model}
          deckDef={deckDef}
          isOnDevice={true}
          robotName={robotName}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={
          isModuleReady &&
          module.attachedModuleMatch?.moduleOffset?.last_modified != null &&
          conflictedFixture == null
            ? COLORS.green35
            : isNonConnectingModule && conflictedFixture == null
            ? COLORS.grey35
            : COLORS.yellow35
        }
        borderRadius={BORDERS.borderRadius8}
        cursor="inherit"
        gridGap={SPACING.spacing24}
        padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      >
        <Flex flex="3.5 0 0" alignItems={ALIGN_CENTER}>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {getModuleDisplayName(module.moduleDef.model)}
          </StyledText>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} flex="2 0 0">
          <LocationIcon
            slotName={
              getModuleType(module.moduleDef.model) === THERMOCYCLER_MODULE_TYPE
                ? TC_MODULE_LOCATION_OT3
                : module.slotName
            }
          />
        </Flex>
        <Flex
          flex="4 0 0"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          {moduleStatus}
        </Flex>
      </Flex>
    </>
  )
}
