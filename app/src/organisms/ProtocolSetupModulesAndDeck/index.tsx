import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LocationIcon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useDeckConfigurationQuery } from '@opentrons/react-api-client'
import {
  getDeckDefFromRobotType,
  getModuleDisplayName,
  getModuleType,
  NON_CONNECTING_MODULE_TYPES,
  STANDARD_SLOT_LOAD_NAME,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { Portal } from '../../App/portal'
import { FloatingActionButton, SmallButton } from '../../atoms/buttons'
import { Chip } from '../../atoms/Chip'
import { InlineNotification } from '../../atoms/InlineNotification'
import { StyledText } from '../../atoms/text'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import {
  useAttachedModules,
  useRunCalibrationStatus,
} from '../../organisms/Devices/hooks'
import { MultipleModulesModal } from '../Devices/ProtocolRun/SetupModuleAndDeck/MultipleModulesModal'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ROBOT_MODEL_OT3, getLocalRobot } from '../../redux/discovery'
import { useChainLiveCommands } from '../../resources/runs/hooks'
import {
  getModulePrepCommands,
  ModulePrepCommandsType,
} from '../Devices/getModulePrepCommands'
import { useToaster } from '../ToasterOven'
import {
  getAttachedProtocolModuleMatches,
  getUnmatchedModulesForProtocol,
} from './utils'
import { SetupInstructionsModal } from './SetupInstructionsModal'
import { ModuleWizardFlows } from '../ModuleWizardFlows'
import { LocationConflictModal } from '../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { getModuleTooHot } from '../Devices/getModuleTooHot'
import { FixtureTable } from './FixtureTable'
import { ModulesAndDeckMapViewModal } from './ModulesAndDeckMapViewModal'

import type { CommandData } from '@opentrons/api-client'
import type { Cutout, Fixture, FixtureLoadName } from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'
import type { ProtocolCalibrationStatus } from '../../organisms/Devices/hooks'
import type { AttachedProtocolModuleMatch } from './utils'

const ATTACHED_MODULE_POLL_MS = 5000

interface RenderModuleStatusProps {
  isModuleReady: boolean
  isDuplicateModuleModel: boolean
  module: AttachedProtocolModuleMatch
  calibrationStatus: ProtocolCalibrationStatus
  setShowModuleWizard: (showModuleWizard: boolean) => void
  setPrepCommandErrorMessage: React.Dispatch<React.SetStateAction<string>>
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => Promise<CommandData[]>
  conflictedFixture?: Fixture
}

function RenderModuleStatus({
  isModuleReady,
  isDuplicateModuleModel,
  module,
  calibrationStatus,
  setShowModuleWizard,
  setPrepCommandErrorMessage,
  chainLiveCommands,
  conflictedFixture,
}: RenderModuleStatusProps): JSX.Element {
  const { makeSnackbar } = useToaster()
  const { i18n, t } = useTranslation(['protocol_setup', 'module_setup_wizard'])

  const handleCalibrate = (): void => {
    if (module.attachedModuleMatch != null) {
      if (getModuleTooHot(module.attachedModuleMatch)) {
        makeSnackbar(t('module_setup_wizard:module_too_hot'))
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

  let moduleStatus: JSX.Element = (
    <>
      <Chip
        text={t('module_disconnected')}
        type="warning"
        background={false}
        iconName="connection-status"
      />
      {isDuplicateModuleModel ? <Icon name="information" size="2rem" /> : null}
    </>
  )
  if (conflictedFixture != null) {
    moduleStatus = (
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} width="100%">
        <Chip
          text={t('location_conflict')}
          type="warning"
          background={false}
          iconName="connection-status"
        />

        <Icon name="more" size="3rem" />
      </Flex>
    )
  } else if (
    isModuleReady &&
    module.attachedModuleMatch?.moduleOffset?.last_modified != null
  ) {
    moduleStatus = (
      <>
        <Chip
          text={t('module_connected')}
          type="success"
          background={false}
          iconName="connection-status"
        />
        {isDuplicateModuleModel ? (
          <Icon name="information" size="2rem" />
        ) : null}
      </>
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
  return moduleStatus
}

interface RowModuleProps {
  isDuplicateModuleModel: boolean
  module: AttachedProtocolModuleMatch
  setShowMultipleModulesModal: (showMultipleModulesModal: boolean) => void
  calibrationStatus: ProtocolCalibrationStatus
  isLoading: boolean
  chainLiveCommands: (
    commands: ModulePrepCommandsType[],
    continuePastCommandFailure: boolean
  ) => Promise<CommandData[]>
  prepCommandErrorMessage: string
  setPrepCommandErrorMessage: React.Dispatch<React.SetStateAction<string>>
  conflictedFixture?: Fixture
}

function RowModule({
  isDuplicateModuleModel,
  module,
  setShowMultipleModulesModal,
  calibrationStatus,
  chainLiveCommands,
  isLoading,
  prepCommandErrorMessage,
  setPrepCommandErrorMessage,
  conflictedFixture,
}: RowModuleProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const isNonConnectingModule = NON_CONNECTING_MODULE_TYPES.includes(
    module.moduleDef.moduleType
  )
  const isModuleReady =
    isNonConnectingModule || module.attachedModuleMatch != null

  const [showModuleWizard, setShowModuleWizard] = React.useState<boolean>(false)
  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = React.useState<boolean>(false)

  return (
    <>
      {showModuleWizard && module.attachedModuleMatch != null ? (
        <ModuleWizardFlows
          attachedModule={module.attachedModuleMatch}
          closeFlow={() => setShowModuleWizard(false)}
          initialSlotName={module.slotName}
          isPrepCommandLoading={isLoading}
          prepCommandErrorMessage={
            prepCommandErrorMessage === '' ? undefined : prepCommandErrorMessage
          }
        />
      ) : null}
      {showLocationConflictModal && conflictedFixture != null ? (
        <LocationConflictModal
          onCloseClick={() => setShowLocationConflictModal(false)}
          cutout={conflictedFixture.fixtureLocation}
          requiredModule={module.moduleDef.model}
          isOnDevice={true}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        backgroundColor={
          isModuleReady &&
          module.attachedModuleMatch?.moduleOffset?.last_modified != null &&
          conflictedFixture == null
            ? COLORS.green3
            : COLORS.yellow3
        }
        borderRadius={BORDERS.borderRadiusSize3}
        cursor={isDuplicateModuleModel ? 'pointer' : 'inherit'}
        gridGap={SPACING.spacing24}
        padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        onClick={() =>
          isDuplicateModuleModel ? setShowMultipleModulesModal(true) : null
        }
      >
        <Flex flex="4 0 0" alignItems={ALIGN_CENTER}>
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
        {isNonConnectingModule ? (
          <Flex flex="3 0 0" alignItems={ALIGN_CENTER}>
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {t('n_a')}
            </StyledText>
          </Flex>
        ) : (
          <Flex
            flex="3 0 0"
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            onClick={
              conflictedFixture != null
                ? () => setShowLocationConflictModal(true)
                : undefined
            }
          >
            <RenderModuleStatus
              isModuleReady={isModuleReady}
              isDuplicateModuleModel={isDuplicateModuleModel}
              module={module}
              calibrationStatus={calibrationStatus}
              setShowModuleWizard={setShowModuleWizard}
              chainLiveCommands={chainLiveCommands}
              setPrepCommandErrorMessage={setPrepCommandErrorMessage}
              conflictedFixture={conflictedFixture}
            />
          </Flex>
        )}
      </Flex>
    </>
  )
}

interface ProtocolSetupModulesAndDeckProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  setFixtureLocation: (fixtureLocation: Cutout) => void
  setProvidedFixtureOptions: (providedFixtureOptions: FixtureLoadName[]) => void
}

/**
 * an ODD screen on the Protocol Setup page
 */
export function ProtocolSetupModulesAndDeck({
  runId,
  setSetupScreen,
  setFixtureLocation,
  setProvidedFixtureOptions,
}: ProtocolSetupModulesAndDeckProps): JSX.Element {
  const { i18n, t } = useTranslation('protocol_setup')
  const { chainLiveCommands, isCommandMutationLoading } = useChainLiveCommands()
  const [
    showMultipleModulesModal,
    setShowMultipleModulesModal,
  ] = React.useState<boolean>(false)
  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)
  const [showDeckMapModal, setShowDeckMapModal] = React.useState<boolean>(false)
  const [
    clearModuleMismatchBanner,
    setClearModuleMismatchBanner,
  ] = React.useState<boolean>(false)
  const [
    prepCommandErrorMessage,
    setPrepCommandErrorMessage,
  ] = React.useState<string>('')
  const { data: deckConfig } = useDeckConfigurationQuery()
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  const deckDef = getDeckDefFromRobotType(ROBOT_MODEL_OT3)

  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []

  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : ''
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)

  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )

  const {
    missingModuleIds,
    remainingAttachedModules,
  } = getUnmatchedModulesForProtocol(attachedModules, protocolModulesInfo)

  const isModuleMismatch =
    remainingAttachedModules.length > 0 && missingModuleIds.length > 0

  return (
    <>
      <Portal level="top">
        {showMultipleModulesModal ? (
          <MultipleModulesModal
            onCloseClick={() => setShowMultipleModulesModal(false)}
          />
        ) : null}
        {showSetupInstructionsModal ? (
          <SetupInstructionsModal
            setShowSetupInstructionsModal={setShowSetupInstructionsModal}
          />
        ) : null}
        {showDeckMapModal ? (
          <ModulesAndDeckMapViewModal
            setShowDeckMapModal={setShowDeckMapModal}
            attachedProtocolModuleMatches={attachedProtocolModuleMatches}
            runId={runId}
            protocolAnalysis={mostRecentAnalysis}
          />
        ) : null}
      </Portal>
      <ChildNavigation
        header={t('modules_and_deck')}
        onClickBack={() => setSetupScreen('prepare to run')}
        buttonText={i18n.format(t('setup_instructions'), 'titleCase')}
        buttonType="tertiaryLowLight"
        iconName="information"
        iconPlacement="startIcon"
        onClickButton={() => setShowSetupInstructionsModal(true)}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        marginTop="7.75rem"
      >
        {isModuleMismatch && !clearModuleMismatchBanner ? (
          <InlineNotification
            type="alert"
            onCloseClick={e => {
              e.stopPropagation()
              setClearModuleMismatchBanner(true)
            }}
            heading={t('extra_module_attached')}
            message={t('module_mismatch_body')}
          />
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <Flex
              color={COLORS.darkBlack70}
              fontSize={TYPOGRAPHY.fontSize22}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              gridGap={SPACING.spacing24}
              lineHeight={TYPOGRAPHY.lineHeight28}
              paddingX={SPACING.spacing24}
            >
              <StyledText flex="4 0 0">{t('module')}</StyledText>
              <StyledText flex="2 0 0">{t('location')}</StyledText>
              <StyledText flex="3 0 0"> {t('status')}</StyledText>
            </Flex>
            {attachedProtocolModuleMatches.map(module => {
              // check for duplicate module model in list of modules for protocol
              const isDuplicateModuleModel = protocolModulesInfo
                // filter out current module
                .filter(otherModule => otherModule.moduleId !== module.moduleId)
                // check for existence of another module of same model
                .some(
                  otherModule =>
                    otherModule.moduleDef.model === module.moduleDef.model
                )
              return (
                <RowModule
                  key={module.moduleId}
                  module={module}
                  isDuplicateModuleModel={isDuplicateModuleModel}
                  setShowMultipleModulesModal={setShowMultipleModulesModal}
                  calibrationStatus={calibrationStatus}
                  chainLiveCommands={chainLiveCommands}
                  isLoading={isCommandMutationLoading}
                  prepCommandErrorMessage={prepCommandErrorMessage}
                  setPrepCommandErrorMessage={setPrepCommandErrorMessage}
                  conflictedFixture={deckConfig?.find(
                    fixture =>
                      fixture.fixtureLocation === module.slotName &&
                      fixture.loadName !== STANDARD_SLOT_LOAD_NAME
                  )}
                />
              )
            })}
          </Flex>
          <FixtureTable
            mostRecentAnalysis={mostRecentAnalysis}
            setSetupScreen={setSetupScreen}
            setFixtureLocation={setFixtureLocation}
            setProvidedFixtureOptions={setProvidedFixtureOptions}
          />
        </Flex>
      </Flex>
      <FloatingActionButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}
