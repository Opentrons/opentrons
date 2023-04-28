import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  Link,
  TOOLTIP_LEFT,
  useHoverTooltip,
  JUSTIFY_FLEX_END,
  SecondaryButton,
} from '@opentrons/components'
import { useRunQuery } from '@opentrons/react-api-client'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useLPCSuccessToast } from '../../hooks/useLPCSuccessToast'
import { Tooltip } from '../../../../atoms/Tooltip'
import { useLPCDisabledReason, useStoredProtocolAnalysis } from '../../hooks'
import { CurrentOffsetsTable } from './CurrentOffsetsTable'
import { useLaunchLPC } from '../../../LabwarePositionCheck/useLaunchLPC'
import { HowLPCWorksModal } from './HowLPCWorksModal'

interface SetupLabwarePositionCheckProps {
  robotName: string
  runId: string
}

export function SetupLabwarePositionCheck(
  props: SetupLabwarePositionCheckProps
): JSX.Element {
  const { robotName, runId } = props
  const { t } = useTranslation('protocol_setup')

  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const currentOffsets = runRecord?.data?.labwareOffsets ?? []
  const lpcDisabledReason = useLPCDisabledReason(robotName, runId)
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)
  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const [showHelpModal, setShowHelpModal] = React.useState(false)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()

  const { launchLPC, LPCWizard } = useLaunchLPC(runId)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing4} gridGap={SPACING.spacing4}>
      {currentOffsets.length > 0 ? (
        <CurrentOffsetsTable
          currentOffsets={currentOffsets}
          commands={protocolData?.commands ?? []}
          labware={protocolData?.labware ?? []}
          modules={protocolData?.modules ?? []}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        flex="1 0 auto"
        gridGap={SPACING.spacing4}
      >
        <Link
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
          onClick={() => setShowHelpModal(true)}
        />
        <SecondaryButton
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          title={t('run_labware_position_check')}
          onClick={() => {
            launchLPC()
            setIsShowingLPCSuccessToast(false)
          }}
          id="LabwareSetup_checkLabwarePositionsButton"
          {...targetProps}
          disabled={lpcDisabledReason !== null}
        >
          {t('run_labware_position_check')}
        </SecondaryButton>
        {lpcDisabledReason !== null ? (
          <Tooltip tooltipProps={tooltipProps}>{lpcDisabledReason}</Tooltip>
        ) : null}
      </Flex>
      {LPCWizard}
      {showHelpModal ? <HowLPCWorksModal onCloseClick={() => setShowHelpModal(false)} /> : null}
    </Flex>
  )
}
