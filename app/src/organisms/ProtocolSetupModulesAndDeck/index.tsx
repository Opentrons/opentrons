import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { Portal } from '../../App/portal'
import { FloatingActionButton } from '../../atoms/buttons'
import { InlineNotification } from '../../atoms/InlineNotification'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import { useAttachedModules } from '../../organisms/Devices/hooks'
import { MultipleModulesModal } from '../../organisms/Devices/ProtocolRun/SetupModuleAndDeck/MultipleModulesModal'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { useMostRecentCompletedAnalysis } from '../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import {
  getAttachedProtocolModuleMatches,
  getUnmatchedModulesForProtocol,
} from './utils'
import { SetupInstructionsModal } from './SetupInstructionsModal'
import { FixtureTable } from './FixtureTable'
import { ModuleTable } from './ModuleTable'
import { ModulesAndDeckMapViewModal } from './ModulesAndDeckMapViewModal'

import type { CutoutId, CutoutFixtureId } from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/ProtocolSetup'

const ATTACHED_MODULE_POLL_MS = 5000

interface ProtocolSetupModulesAndDeckProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  setCutoutId: (cutoutId: CutoutId) => void
  setProvidedFixtureOptions: (providedFixtureOptions: CutoutFixtureId[]) => void
}

/**
 * an ODD screen on the Protocol Setup page
 */
export function ProtocolSetupModulesAndDeck({
  runId,
  setSetupScreen,
  setCutoutId,
  setProvidedFixtureOptions,
}: ProtocolSetupModulesAndDeckProps): JSX.Element {
  const { i18n, t } = useTranslation('protocol_setup')

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

  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []

  const protocolModulesInfo =
    mostRecentAnalysis != null
      ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
      : []

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )

  const hasModules = attachedProtocolModuleMatches.length > 0

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
        marginBottom={SPACING.spacing80}
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
          {hasModules ? (
            <ModuleTable
              attachedProtocolModuleMatches={attachedProtocolModuleMatches}
              deckDef={deckDef}
              protocolModulesInfo={protocolModulesInfo}
              runId={runId}
              setShowMultipleModulesModal={setShowMultipleModulesModal}
            />
          ) : null}
          <FixtureTable
            robotType={FLEX_ROBOT_TYPE}
            mostRecentAnalysis={mostRecentAnalysis}
            setSetupScreen={setSetupScreen}
            setCutoutId={setCutoutId}
            setProvidedFixtureOptions={setProvidedFixtureOptions}
          />
        </Flex>
      </Flex>
      <FloatingActionButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}
