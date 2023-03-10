import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Btn,
  Flex,
  Icon,
  Module,
  RobotWorkSpace,
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getModuleDisplayName,
  getModuleType,
  inferModuleOrientationFromXCoordinate,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { Portal } from '../../App/portal'
import { Banner } from '../../atoms/Banner'
import { BackButton } from '../../atoms/buttons'
import { Modal } from '../../molecules/Modal'
import { StyledText } from '../../atoms/text'
import { useAttachedModules } from '../../organisms/Devices/hooks'
import { ModuleInfo } from '../../organisms/Devices/ModuleInfo'
import { MultipleModulesModal } from '../../organisms/Devices/ProtocolRun/SetupModules/MultipleModulesModal'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ROBOT_MODEL_OT3 } from '../../redux/discovery'
import {
  getAttachedProtocolModuleMatches,
  getUnmatchedModulesForProtocol,
} from './utils'

import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'
import type { AttachedProtocolModuleMatch } from './utils'

const OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST: string[] = [
  'DECK_BASE',
  'BARCODE_COVERS',
  'SLOT_SCREWS',
  'SLOT_10_EXPANSION',
  'CALIBRATION_CUTOUTS',
]

interface RowModuleProps {
  isDuplicateModuleModel: boolean
  module: AttachedProtocolModuleMatch
  setShowMultipleModulesModal: (showMultipleModulesModal: boolean) => void
}

function RowModule({
  isDuplicateModuleModel,
  module,
  setShowMultipleModulesModal,
}: RowModuleProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={
        module.attachedModuleMatch != null
          ? `${COLORS.successEnabled}${COLORS.opacity20HexCode}`
          : COLORS.warningBackgroundMed
      }
      borderRadius="1rem"
      cursor={isDuplicateModuleModel ? 'pointer' : 'inherit'}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing4}
      paddingLeft={SPACING.spacing5}
      onClick={() =>
        isDuplicateModuleModel ? setShowMultipleModulesModal(true) : null
      }
    >
      <Flex width="50%">
        <StyledText>{getModuleDisplayName(module.moduleDef.model)}</StyledText>
      </Flex>
      <Flex width="20%">
        <StyledText>
          {/* TODO(bh, 2023-02-07): adjust slot location when hi-fi designs finalized */}
          {t('slot_location', {
            slotName:
              getModuleType(module.moduleDef.model) === THERMOCYCLER_MODULE_TYPE
                ? TC_MODULE_LOCATION_OT3
                : module.slotName,
          })}
        </StyledText>
      </Flex>
      <Flex
        width="30%"
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <StyledText>
          {module.attachedModuleMatch != null
            ? t('module_connected')
            : t('module_disconnected')}
        </StyledText>
        {isDuplicateModuleModel ? (
          <Icon name="information" size="1.5rem" />
        ) : null}
      </Flex>
    </Flex>
  )
}

function SetupInstructionsButton(
  props: React.HTMLProps<HTMLButtonElement>
): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  return (
    <Btn
      alignItems="center"
      backgroundColor={`${COLORS.darkBlackEnabled}${COLORS.opacity20HexCode}`}
      borderRadius={BORDERS.size_five}
      display="flex"
      gridGap="0.5rem"
      padding="1rem 2rem"
      whiteSpace="nowrap"
      onClick={props.onClick}
    >
      <Icon name="information" size="1.5rem" />
      <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('setup_instructions')}
      </StyledText>
    </Btn>
  )
}

export function ContinueButton(
  props: React.HTMLProps<HTMLButtonElement>
): JSX.Element {
  const { t } = useTranslation('shared')
  return (
    <Btn
      backgroundColor={COLORS.blueEnabled}
      borderRadius={BORDERS.size_five}
      color={COLORS.white}
      padding="1rem 2rem"
      onClick={props.onClick}
    >
      <StyledText
        as="h1"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {t('continue')}
      </StyledText>
    </Btn>
  )
}

export function DeckMapButton(
  props: React.HTMLProps<HTMLButtonElement>
): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  return (
    <Btn
      position="fixed"
      bottom="1.5rem"
      right="1.5rem"
      backgroundColor={COLORS.blueEnabled}
      borderRadius={BORDERS.size_five}
      color={COLORS.white}
      padding="1rem 2rem"
      onClick={props.onClick}
    >
      <StyledText as="h1" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t('deck_map')}
      </StyledText>
    </Btn>
  )
}

interface ProtocolSetupModulesProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

/**
 * an ODD screen on the Protocol Setup page
 */
export function ProtocolSetupModules({
  runId,
  setSetupScreen,
}: ProtocolSetupModulesProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
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

  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)

  const deckDef = getDeckDefFromRobotType(ROBOT_MODEL_OT3)

  const attachedModules = useAttachedModules()

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
          <Modal
            title={t('setup_instructions')}
            onClose={() => setShowSetupInstructionsModal(false)}
          >
            TODO: setup instructions modal
          </Modal>
        ) : null}
        {showDeckMapModal ? (
          <Modal
            title={t('map_view')}
            onClose={() => setShowDeckMapModal(false)}
            fullPage
          >
            <RobotWorkSpace
              deckDef={deckDef}
              deckLayerBlocklist={OT3_STANDARD_DECK_VIEW_LAYER_BLOCK_LIST}
              id="ModuleSetup_deckMap"
            >
              {() =>
                attachedProtocolModuleMatches.map(module => (
                  <Module
                    key={module.moduleId}
                    x={module.x}
                    y={module.y}
                    orientation={inferModuleOrientationFromXCoordinate(
                      module.x
                    )}
                    def={module.moduleDef}
                  >
                    <ModuleInfo
                      moduleModel={module.moduleDef.model}
                      isAttached={module.attachedModuleMatch != null}
                      usbPort={module.attachedModuleMatch?.usbPort.port ?? null}
                      hubPort={module.attachedModuleMatch?.usbPort.hub ?? null}
                      runId={runId}
                    />
                  </Module>
                ))
              }
            </RobotWorkSpace>
          </Modal>
        ) : null}
      </Portal>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <BackButton onClick={() => setSetupScreen('prepare to run')}>
          {t('modules')}
        </BackButton>
        <Flex gridGap="2.5rem">
          <SetupInstructionsButton
            onClick={() => setShowSetupInstructionsModal(true)}
          />
          <ContinueButton onClick={() => setSetupScreen('labware')} />
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        marginTop={SPACING.spacing6}
      >
        {isModuleMismatch && !clearModuleMismatchBanner ? (
          <Banner
            type="warning"
            onCloseClick={() => setClearModuleMismatchBanner(true)}
          >
            {`${t('module_mismatch_error')}. ${t('module_mismatch_body')}`}
          </Banner>
        ) : null}
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex paddingLeft={SPACING.spacing5} width="50%">
            <StyledText>{'Module Name'}</StyledText>
          </Flex>
          <Flex width="20%">
            <StyledText>{'Location'}</StyledText>
          </Flex>
          <Flex width="30%">
            <StyledText>{'Status'}</StyledText>
          </Flex>
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
            />
          )
        })}
      </Flex>
      <DeckMapButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}
