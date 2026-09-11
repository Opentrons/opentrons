import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InlineNotification,
  JUSTIFY_CENTER,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { TouchFloatingActionButton } from '/app/atoms/buttons'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useDeckConfigurationCompatibility } from '/app/resources/deck_configuration/hooks'
import { useAttachedModules } from '/app/resources/modules'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import {
  getAttachedProtocolModuleMatches,
  getProtocolModulesInfo,
} from '/app/transformations/analysis'

import { FixtureTable } from './FixtureTable'
import { ModulesAndDeckMapView } from './ModulesAndDeckMapView'
import { ModuleTable } from './ModuleTable'
import { SetupInstructionsModal } from './SetupInstructionsModal'
import { getUnmatchedModulesForProtocol } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { SetupScreens } from '../types'

const ATTACHED_MODULE_POLL_MS = 5000
const DECK_CONFIG_POLL_MS = 5000

interface ProtocolSetupModulesAndDeckProps {
  runId: string
  setSetupScreen: Dispatch<SetStateAction<SetupScreens>>
}

/**
 * an ODD screen on the Protocol Setup page
 */
export function ProtocolSetupModulesAndDeck({
  runId,
  setSetupScreen,
}: ProtocolSetupModulesAndDeckProps): JSX.Element {
  const { i18n, t } = useTranslation('protocol_setup')
  const [showSetupInstructionsModal, setShowSetupInstructionsModal] =
    useState<boolean>(false)
  const [showMapView, setShowMapView] = useState<boolean>(false)
  const [clearModuleMismatchBanner, setClearModuleMismatchBanner] =
    useState<boolean>(false)
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    FLEX_ROBOT_TYPE,
    mostRecentAnalysis
  )
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery({
    refetchInterval: DECK_CONFIG_POLL_MS,
  })
  const attachedModulesData = useAttachedModules({
    refetchInterval: ATTACHED_MODULE_POLL_MS,
  })
  const attachedModules = useMemo(
    () => attachedModulesData ?? [],
    [attachedModulesData]
  )

  const protocolModulesInfo = useMemo(
    () =>
      mostRecentAnalysis != null
        ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
        : [],
    [mostRecentAnalysis, deckDef]
  )

  const attachedProtocolModuleMatches = useMemo(
    () =>
      getAttachedProtocolModuleMatches(
        attachedModules,
        protocolModulesInfo,
        deckConfig
      ),
    [attachedModules, protocolModulesInfo, deckConfig]
  )

  const hasModules = attachedProtocolModuleMatches.length > 0

  const { missingModuleIds, remainingAttachedModules } =
    getUnmatchedModulesForProtocol(attachedModules, protocolModulesInfo)

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
        </>,
        getTopPortalEl()
      )}
      <ChildNavigation
        header={t('deck_hardware')}
        onClickBack={() => {
          setSetupScreen('prepare to run')
        }}
        buttonText={i18n.format(t('setup_instructions'), 'titleCase')}
        buttonType="tertiaryLowLight"
        iconName="information"
        iconPlacement="startIcon"
        onClickButton={() => {
          setShowSetupInstructionsModal(true)
        }}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing24}
        marginTop="5.75rem"
        marginBottom={SPACING.spacing80}
      >
        {showMapView ? (
          <Flex height="55vh" justifyContent={JUSTIFY_CENTER}>
            <ModulesAndDeckMapView
              attachedProtocolModuleMatches={attachedProtocolModuleMatches}
              runId={runId}
              protocolAnalysis={mostRecentAnalysis}
            />
          </Flex>
        ) : (
          <>
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
                <LegacyStyledText flex="3.5 0 0">
                  {i18n.format(t('deck_hardware'), 'titleCase')}
                </LegacyStyledText>
                <LegacyStyledText flex="2 0 0">
                  {t('location')}
                </LegacyStyledText>
                <LegacyStyledText flex="4 0 0"> {t('status')}</LegacyStyledText>
              </Flex>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                {hasModules ? (
                  <ModuleTable
                    attachedProtocolModuleMatches={
                      attachedProtocolModuleMatches
                    }
                    deckConfigCompatibility={deckConfigCompatibility}
                    deckDef={deckDef}
                    runId={runId}
                  />
                ) : null}
                <FixtureTable
                  robotType={FLEX_ROBOT_TYPE}
                  deckConfigCompatibility={deckConfigCompatibility}
                />
              </Flex>
            </Flex>
          </>
        )}
      </Flex>
      <TouchFloatingActionButton
        buttonText={showMapView ? t('list_view') : t('map_view')}
        onClick={() => {
          setShowMapView(mapView => !mapView)
        }}
        aria-label={
          showMapView ? t('display_list_view') : t('display_map_view')
        }
      />
    </>
  )
}
