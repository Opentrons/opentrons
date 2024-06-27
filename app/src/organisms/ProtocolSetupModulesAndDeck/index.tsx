import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '../../App/portal'
import { FloatingActionButton } from '../../atoms/buttons'
import { InlineNotification } from '../../atoms/InlineNotification'
import { ChildNavigation } from '../../organisms/ChildNavigation'
import { useAttachedModules } from '../../organisms/Devices/hooks'
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
import { useNotifyDeckConfigurationQuery } from '../../resources/deck_configuration'

import type { CutoutId, CutoutFixtureId } from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/ProtocolSetup'
import { useRunStatus } from '../RunTimeControl/hooks'
import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { useHistory } from 'react-router-dom'

const ATTACHED_MODULE_POLL_MS = 5000
const DECK_CONFIG_POLL_MS = 5000

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
  const history = useHistory()
  const runStatus = useRunStatus(runId)
  React.useEffect(() => {
    if (runStatus === RUN_STATUS_STOPPED) {
      history.push('/protocols')
    }
  }, [runStatus, history])
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
  const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_POLL_MS,
  })
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
    protocolModulesInfo,
    deckConfig
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
      {createPortal(
        <>
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
        </>,
        getTopPortalEl()
      )}
      <ChildNavigation
        header={t('deck_hardware')}
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
        marginTop="5.75rem"
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
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <Flex
            color={COLORS.grey60}
            fontSize={TYPOGRAPHY.fontSize22}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            gridGap={SPACING.spacing24}
            lineHeight={TYPOGRAPHY.lineHeight28}
            paddingX={SPACING.spacing24}
          >
            <StyledText flex="3.5 0 0">
              {i18n.format(t('deck_hardware'), 'titleCase')}
            </StyledText>
            <StyledText flex="2 0 0">{t('location')}</StyledText>
            <StyledText flex="4 0 0"> {t('status')}</StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {hasModules ? (
              <ModuleTable
                attachedProtocolModuleMatches={attachedProtocolModuleMatches}
                deckDef={deckDef}
                runId={runId}
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
      </Flex>
      <FloatingActionButton onClick={() => setShowDeckMapModal(true)} />
    </>
  )
}
