import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  JUSTIFY_CENTER,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  Link,
  TOOLTIP_LEFT,
  useHoverTooltip,
  SecondaryButton,
  PrimaryButton,
} from '@opentrons/components'
import { useRunQuery } from '@opentrons/react-api-client'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useLPCSuccessToast } from '../../hooks/useLPCSuccessToast'
import { Tooltip } from '../../../../atoms/Tooltip'
import { useLPCDisabledReason, useStoredProtocolAnalysis } from '../../hooks'
import { CurrentOffsetsTable } from './CurrentOffsetsTable'
import { useLaunchLPC } from '../../../LabwarePositionCheck/useLaunchLPC'
import { HowLPCWorksModal } from './HowLPCWorksModal'
import { StyledText } from '../../../../atoms/text'

interface SetupLabwarePositionCheckProps {
  expandLabwareStep: () => void
  robotName: string
  runId: string
}

export function SetupLabwarePositionCheck(
  props: SetupLabwarePositionCheckProps
): JSX.Element {
  const { robotName, runId, expandLabwareStep } = props
  const { t } = useTranslation('protocol_setup')

  const { data: runRecord } = useRunQuery(runId, { staleTime: Infinity })
  const currentOffsets = runRecord?.data?.labwareOffsets ?? []
  const lpcDisabledReason = useLPCDisabledReason({ robotName, runId })
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
    <Flex
      flexDirection={DIRECTION_COLUMN}
      marginTop={SPACING.spacing16}
      gridGap={SPACING.spacing16}
    >
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        flex="1 0 auto"
        gridGap={SPACING.spacing16}
      >
        <Link
          css={TYPOGRAPHY.linkPSemiBold}
          onClick={() => setShowHelpModal(true)}
        >
          {t('learn_how_it_works')}
        </Link>
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
      {currentOffsets.length > 0 ? (
        <CurrentOffsetsTable
          currentOffsets={currentOffsets}
          commands={protocolData?.commands ?? []}
          labware={protocolData?.labware ?? []}
          modules={protocolData?.modules ?? []}
        />
      ) : (
        <Flex
          paddingY={SPACING.spacing32}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <StyledText as="p">{t('no_labware_offset_data')}</StyledText>
        </Flex>
      )}

      <Flex justifyContent={JUSTIFY_CENTER}>
        <PrimaryButton
          onClick={expandLabwareStep}
          id="ModuleSetup_proceedToLabwareSetup"
          padding={`${SPACING.spacing8} ${SPACING.spacing16}`}
          {...targetProps}
        >
          {t('proceed_to_labware_setup_step')}
        </PrimaryButton>
      </Flex>
      {LPCWizard}
      {showHelpModal ? (
        <HowLPCWorksModal onCloseClick={() => setShowHelpModal(false)} />
      ) : null}
    </Flex>
  )
}
