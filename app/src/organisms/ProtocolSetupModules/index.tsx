import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Icon,
  Module,
  RobotWorkSpace,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getModuleDisplayName,
  getModuleType,
  inferModuleOrientationFromXCoordinate,
  NON_CONNECTING_MODULE_TYPES,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { Portal } from '../../App/portal'
import { FloatingActionButton, SmallButton } from '../../atoms/buttons'
import { Chip } from '../../atoms/Chip'
import { InlineNotification } from '../../atoms/InlineNotification'
import { Modal } from '../../molecules/Modal'
import { StyledText } from '../../atoms/text'
import { ODDBackButton } from '../../molecules/ODDBackButton'
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
  const isNonConnectingModule = NON_CONNECTING_MODULE_TYPES.includes(
    module.moduleDef.moduleType
  )
  const isModuleReady =
    isNonConnectingModule || module.attachedModuleMatch != null
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={isModuleReady ? COLORS.green3 : COLORS.yellow3}
      borderRadius={BORDERS.borderRadiusSize3}
      cursor={isDuplicateModuleModel ? 'pointer' : 'inherit'}
      gridGap={SPACING.spacing24}
      padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
      onClick={() =>
        isDuplicateModuleModel ? setShowMultipleModulesModal(true) : null
      }
    >
      <Flex
        flex="4 0 0"
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        lineHeight={TYPOGRAPHY.lineHeight28}
      >
        <StyledText>{getModuleDisplayName(module.moduleDef.model)}</StyledText>
      </Flex>
      <Flex alignItems={ALIGN_CENTER} flex="2 0 0">
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
      {isNonConnectingModule ? (
        <Flex
          flex="3 0 0"
          alignItems={ALIGN_CENTER}
          padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
        >
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('n_a')}
          </StyledText>
        </Flex>
      ) : (
        <Flex
          flex="3 0 0"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Chip
            text={
              isModuleReady ? t('module_connected') : t('module_disconnected')
            }
            type={isModuleReady ? 'success' : 'warning'}
            background={false}
            iconName="connection-status"
          />
          {isDuplicateModuleModel ? (
            <Icon name="information" size="2rem" />
          ) : null}
        </Flex>
      )}
    </Flex>
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
      <Flex
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <ODDBackButton
          label={t('modules')}
          onClick={() => setSetupScreen('prepare to run')}
        />
        <SmallButton
          alignSelf={ALIGN_FLEX_END}
          buttonText={t('setup_instructions')}
          buttonType="tertiaryLowLight"
          iconName="information"
          iconPlacement="startIcon"
          onClick={() => setShowSetupInstructionsModal(true)}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        marginTop={SPACING.spacing32}
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
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <Flex
            color={COLORS.darkBlack70}
            fontSize={TYPOGRAPHY.fontSize22}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            gridGap={SPACING.spacing24}
            lineHeight={TYPOGRAPHY.lineHeight28}
            paddingX={SPACING.spacing24}
          >
            <StyledText flex="4 0 0">{'Module Name'}</StyledText>
            <StyledText flex="2 0 0">{'Location'}</StyledText>
            <StyledText flex="3 0 0"> {'Status'}</StyledText>
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
      </Flex>
      <FloatingActionButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}
