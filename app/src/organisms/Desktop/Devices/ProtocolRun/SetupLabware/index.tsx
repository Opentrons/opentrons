import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  PrimaryButton,
  SPACING,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToggleGroup } from '/app/molecules/ToggleGroup/useToggleGroup'
import { useIsFlex } from '/app/redux-resources/robots'
import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import {
  useModuleRenderInfoForProtocolById,
  useMostRecentCompletedAnalysis,
  useRunHasStarted,
} from '/app/resources/runs'

import { getModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'
import { SetupLabwareList } from './SetupLabwareList'
import { SetupLabwareMap } from './SetupLabwareMap'

interface SetupLabwareProps {
  robotName: string
  runId: string
  labwareConfirmed: boolean
  setLabwareConfirmed: (confirmed: boolean) => void
}

export function SetupLabware(props: SetupLabwareProps): JSX.Element {
  const { robotName, runId, labwareConfirmed, setLabwareConfirmed } = props
  const { t } = useTranslation(['protocol_setup', 'audit_log'])
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolAnalysis = robotProtocolAnalysis ?? storedProtocolAnalysis
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view') as string,
    t('map_view') as string,
    undefined,
    true
  )
  const isFlex = useIsFlex(robotName)

  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(runId)
  const moduleModels = map(
    moduleRenderInfoById,
    ({ moduleDef }) => moduleDef.model
  )
  const moduleTypesThatRequireExtraAttention =
    getModuleTypesThatRequireExtraAttention(moduleModels)

  const documentationState = useDocumentationState()
  const { postLogMessage } = usePostLogMessageMutation(
    documentationState,
    'confirm_placements'
  )

  // TODO(jh, 11-13-24): These disabled tooltips are used throughout setup flows. Let's consolidate them.
  const [targetProps, tooltipProps] = useHoverTooltip()
  const runHasStarted = useRunHasStarted(runId)
  const tooltipText = runHasStarted ? t('protocol_run_started') : null

  const handleProceed = useCallback(() => {
    if (documentationState.isLoading) return
    if (documentationState.accessControlEnabled) {
      postLogMessage(
        {
          action: 'confirm liquid and labware placements',
          message:
            'user confirmed liquid and labware placements before running protocol',
        },
        {
          onSuccess: () => {
            setLabwareConfirmed(true)
          },
        }
      )
    } else {
      setLabwareConfirmed(true)
    }
  }, [documentationState, postLogMessage, setLabwareConfirmed])

  return (
    <>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING.spacing32}
      >
        {toggleGroup}
        {selectedValue === t('list_view') ? (
          <SetupLabwareList
            attachedModuleInfo={moduleRenderInfoById}
            protocolAnalysis={protocolAnalysis}
            extraAttentionModules={moduleTypesThatRequireExtraAttention}
            isFlex={isFlex}
          />
        ) : (
          <SetupLabwareMap runId={runId} protocolAnalysis={protocolAnalysis} />
        )}
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing16}>
        <PrimaryButton
          onClick={handleProceed}
          disabled={labwareConfirmed || runHasStarted}
          {...targetProps}
        >
          {t('confirm_placements')}
        </PrimaryButton>
        {tooltipText != null ? (
          <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
        ) : null}
      </Flex>
    </>
  )
}
