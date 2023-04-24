import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  COLORS,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  Icon,
  TOOLTIP_LEFT,
  useHoverTooltip,
  JUSTIFY_FLEX_END,
  SecondaryButton,
  BORDERS,
} from '@opentrons/components'
import { useRunQuery } from '@opentrons/react-api-client'
import { useLPCSuccessToast } from '../../hooks/useLPCSuccessToast'
import { Tooltip } from '../../../../atoms/Tooltip'
import { StyledText } from '../../../../atoms/text'
import { LabwarePositionCheck } from '../../../LabwarePositionCheck'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { HowLPCWorksModal } from './HowLPCWorksModal'
import { useLPCDisabledReason, useStoredProtocolAnalysis } from '../../hooks'
import { CurrentOffsetsModal } from './CurrentOffsetsModal'

interface LaunchLabwarePositionCheckProps {
  robotName: string
  runId: string
}

export function LaunchLabwarePositionCheck(
  props: LaunchLabwarePositionCheckProps
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
  const [
    showLabwarePositionCheckModal,
    setShowLabwarePositionCheckModal,
  ] = React.useState(false)
  const [showCurrentOffsetsModal, setShowCurrentOffsetsModal] = React.useState(
    false
  )
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  const { setIsShowingLPCSuccessToast } = useLPCSuccessToast()

  const handleClickViewCurrentOffsets: React.MouseEventHandler<HTMLAnchorElement> = () => {
    setShowCurrentOffsetsModal(true)
  }

  return (
    <Flex
      gridGap={SPACING.spacing4}
      backgroundColor={COLORS.lightBlue}
      padding={SPACING.spacing4}
      borderRadius={BORDERS.radiusSoftCorners}
    >
      <Icon name="reticle" size="18px" />
      <Flex
        flex="5"
        gridGap={SPACING.spacing3}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <StyledText
              as="h3"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
            >
              {t('run_labware_position_check')}
            </StyledText>
          </Flex>
          <StyledText as="p">
            <Trans
              t={t}
              i18nKey="recommended_workflow_for_labware_positioning"
              components={{
                anchor: (
                  <Link
                    textDecoration={TYPOGRAPHY.textDecorationUnderline}
                    onClick={() => setShowHelpModal(true)}
                  />
                ),
              }}
            />
          </StyledText>
        </Flex>
      </Flex>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        flex="1 0 auto"
        gridGap={SPACING.spacing4}
      >
        {currentOffsets.length > 0 ? (
          <Link
            css={TYPOGRAPHY.linkPSemiBold}
            onClick={handleClickViewCurrentOffsets}
            role="button"
          >
            {t('view_current_offsets')}
          </Link>
        ) : null}
        <SecondaryButton
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          title={t('run_labware_position_check')}
          onClick={() => {
            setShowLabwarePositionCheckModal(true)
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
      {showHelpModal && (
        <HowLPCWorksModal onCloseClick={() => setShowHelpModal(false)} />
      )}
      {showLabwarePositionCheckModal && (
        <LabwarePositionCheck
          onCloseClick={() => setShowLabwarePositionCheckModal(false)}
          runId={runId}
        />
      )}
      {showCurrentOffsetsModal && (
        <CurrentOffsetsModal
          currentOffsets={currentOffsets}
          commands={protocolData?.commands ?? []}
          labware={protocolData?.labware ?? []}
          modules={protocolData?.modules ?? []}
          onCloseClick={() => setShowCurrentOffsetsModal(false)}
        />
      )}
    </Flex>
  )
}
