import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  Link,
  Icon,
  TOOLTIP_LEFT,
  useHoverTooltip,
  JUSTIFY_FLEX_END,
  SecondaryButton,
} from '@opentrons/components'
import { useRunQuery } from '@opentrons/react-api-client'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useLPCSuccessToast } from '../../hooks/useLPCSuccessToast'
import { Tooltip } from '../../../../atoms/Tooltip'
import { StyledText } from '../../../../atoms/text'
import { useLPCDisabledReason, useStoredProtocolAnalysis } from '../../hooks'
import { CurrentOffsetsModal } from './CurrentOffsetsModal'
import { useLaunchLPC } from '../../../LabwarePositionCheck/useLaunchLPC'
import { HowLPCWorksModal } from './HowLPCWorksModal'

const ROBOT_CAL_HELP_ARTICLE =
  'https://support.opentrons.com/s/article/How-positional-calibration-works-on-the-OT-2'
const OFFSET_DATA_HELP_ARTICLE =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

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
  const [showCurrentOffsetsModal, setShowCurrentOffsetsModal] = React.useState(
    false
  )
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()

  const { launchLPC, LPCWizard } = useLaunchLPC(runId)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING.spacing4} gridGap={SPACING.spacing4}>
      {currentOffsets.length > 0 ? (
        <CurrentOffsetsModal
          currentOffsets={currentOffsets}
          commands={protocolData?.commands ?? []}
          labware={protocolData?.labware ?? []}
          modules={protocolData?.modules ?? []}
          onCloseClick={() => setShowCurrentOffsetsModal(false)}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        flex="1 0 auto"
        gridGap={SPACING.spacing4}
      >
        
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
