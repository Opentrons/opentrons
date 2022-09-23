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
import { Portal } from '../../App/portal'
import { ModalHeader, ModalShell } from '../../molecules/Modal'
import { StyledText } from '../../atoms/text'
import { useTranslation } from 'react-i18next'
import { LabwareOffsetTable } from './LabwareOffsetTable'
import { CheckboxField } from '../../atoms/CheckboxField'
import type { LabwareOffset } from '@opentrons/api-client'

export interface OffsetCandidate extends LabwareOffset {
  runCreatedAt: string
  labwareDisplayName: string
}

interface ApplyHistoricOffsetsProps {
  offsetCandidates: OffsetCandidate[]
  shouldApplyOffsets: boolean
  setShouldApplyOffsets: (shouldApplyOffsets: boolean) => void
}
export function ApplyHistoricOffsets(
  props: ApplyHistoricOffsetsProps
): JSX.Element {
  const { offsetCandidates, shouldApplyOffsets, setShouldApplyOffsets } = props
  const [showOffsetDataModal, setShowOffsetDataModal] = React.useState(false)
  const { t } = useTranslation('labware_position_check')
  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <CheckboxField
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setShouldApplyOffsets(e.currentTarget.checked)
        }}
        value={shouldApplyOffsets}
        disabled={offsetCandidates.length < 1}
        isIndeterminate={offsetCandidates.length < 1}
        label={
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing2}>
            <Icon size={SIZE_1} name="reticle" />
            <StyledText as="p">{t('apply_offset_data')}</StyledText>
          </Flex>
        }
      />
      <Link
        onClick={() => setShowOffsetDataModal(true)}
        css={TYPOGRAPHY.linkPSemiBold}
      >
        {t('view_data')}
      </Link>
      {showOffsetDataModal ? (
        <Portal level="top">
          <ModalShell
            width="40rem"
            header={
              <ModalHeader
                title={t('apply_stored_offset_data')}
                onClose={() => setShowOffsetDataModal(false)}
              />
            }
          >
            <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing6}>
              <StyledText as="p">
                {offsetCandidates.length > 0
                  ? t('robot_has_offsets_from_previous_runs')
                  : t('this_robot_has_no_stored_offsets_for_this_run')}
              </StyledText>
              <Link css={TYPOGRAPHY.linkPSemiBold} marginTop={SPACING.spacing3}>
                {t('see_how_offsets_work')}
              </Link>
              {offsetCandidates.length > 0 ? (
                <>
                  <StyledText
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    marginY={SPACING.spacing4}
                  >
                    {t('stored_offsets_for_this_protocol')}
                  </StyledText>
                  <LabwareOffsetTable offsetCandidates={offsetCandidates} />
                </>
              ) : null}
            </Flex>
          </ModalShell>
        </Portal>
      ) : null}
    </Flex>
  )
}
