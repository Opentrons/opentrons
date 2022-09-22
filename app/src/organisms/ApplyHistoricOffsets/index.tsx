import * as React from 'react'
import {
  Flex,
  Link,
  Icon,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  SIZE_1,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { useOffsetCandidatesForAnalysis } from '../ReapplyOffsetsModal/hooks/useOffsetCandidatesForAnalysis'
import { Portal } from '../../App/portal'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import { ModalHeader, ModalShell } from '../../molecules/Modal'
import { StyledText } from '../../atoms/text'
import { useTranslation } from 'react-i18next'
import { LabwareOffsetTable } from './LabwareOffsetTable'
import { CheckboxField } from '../../atoms/CheckboxField'

interface ApplyHistoricOffsetsProps {
  analysisOutput: ProtocolAnalysisOutput,
  robotIp: string | null
  shouldApplyOffsets: boolean
  setShouldApplyOffsets: (shouldApplyOffsets: boolean) => void
}
export function ApplyHistoricOffsets(props: ApplyHistoricOffsetsProps): JSX.Element {
  const { analysisOutput, robotIp, shouldApplyOffsets, setShouldApplyOffsets } = props
  const [showOffsetDataModal, setShowOffsetDataModal] = React.useState(false)
  const { t } = useTranslation('labware_position_check')

  if (robotIp == null) return <div>NO OFFSETS</div>
  const offsetCandidates = useOffsetCandidatesForAnalysis(analysisOutput, robotIp)
  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <CheckboxField
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setShouldApplyOffsets(e.currentTarget.checked) }}
        value={shouldApplyOffsets}
        disabled={offsetCandidates.length < 1}
        isIndeterminate={offsetCandidates.length < 1}
        label={
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing2}>
            <Icon size={SIZE_1} name="reticle" />
            <StyledText as="p">{t('apply_offset_data')}</StyledText>
          </Flex>
        } />
      <Link onClick={() => setShowOffsetDataModal(true)} css={TYPOGRAPHY.linkPSemiBold}>{t('view_data')}</Link>
      {showOffsetDataModal ? (
        <Portal level="top">
          <ModalShell
            width="40rem"
            header={
              <ModalHeader
                title={t('apply_stored_offset_data')}
                onClose={() => setShowOffsetDataModal(false)}
              />
            }>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              padding={SPACING.spacing6}
              minHeight="25rem"
            >
              <StyledText as="p">
                {t('robot_has_offsets_from_previous_runs')}
              </StyledText>
              <Link css={TYPOGRAPHY.linkPSemiBold} marginTop={SPACING.spacing3}>
                {t('see_how_offsets_work')}
              </Link>
              <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold} marginY={SPACING.spacing4}>
                {t('stored_offsets_for_this_protocol')}
              </StyledText>
              <LabwareOffsetTable offsetCandidates={offsetCandidates} />
            </Flex>
          </ModalShell>
        </Portal>
      ) : null
      }
    </Flex>
  )
}