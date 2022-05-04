import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useTranslation } from 'react-i18next'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  TEXT_TRANSFORM_CAPITALIZE,
  COLORS,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import { PrimaryButton, SecondaryButton } from '../../atoms/Buttons'
import { Modal } from '../../atoms/Modal'
import { StyledText } from '../../atoms/text'
import { OffsetVector } from '../../molecules/OffsetVector'
import { useOffsetCandidatesForCurrentRun, useClearAllOffsetsForCurrentRun  } from './hooks'
import styled from 'styled-components'

const OffsetTable = styled('table')`
  ${TYPOGRAPHY.labelRegular}
  table-layout: auto;
  width: 100%;
  border-spacing: 0 ${SPACING.spacing1};
  margin: ${SPACING.spacing4} 0;
  text-align: left;
`
const OffsetTableHeader = styled('th')`
  text-transform: ${TEXT_TRANSFORM_CAPITALIZE};
  padding: ${SPACING.spacing2};
`
const OffsetTableRow = styled('tr')`
  background-color: ${COLORS.background};
  padding: ${SPACING.spacing3};
`

const OffsetTableDatum = styled('td')`
  padding: ${SPACING.spacing3};
  white-space: break-spaces;
  text-overflow: wrap;
`
interface ReapplyOffsetsModalProps {
  robotName: string
  runId: string
}

export function ReapplyOffsetsModal(
  props: ReapplyOffsetsModalProps
): JSX.Element | null {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')
  const offsetCandidates = useOffsetCandidatesForCurrentRun()
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  const clearAllOffsets = useClearAllOffsetsForCurrentRun()

  const handleApply = () => {
    if (offsetCandidates.length > 0) {
      offsetCandidates.forEach(offsetCandidate => {
        if (!isEqual(offsetCandidate.vector, IDENTITY_VECTOR)) {
          createLabwareOffset({
            runId: runId,
            data: {
              definitionUri: offsetCandidate.definitionUri,
              location: offsetCandidate.location,
              vector: offsetCandidate.vector,
            },
          }).catch((e: Error) => {
            console.error(`error applying labware offsets: ${e.message}`)
          })
        }
      })
    } else {
      console.error('no labware offset data found')
    }
  }

  return offsetCandidates.length > 0 ? (
    <Modal title={t('apply_stored_labware_offset_data')}>
      <StyledText as="p">
        {t('robot_has_previous_offsets', { robotName: robotName })}
      </StyledText>
      <OffsetTable>
          <tr>
            <OffsetTableHeader>{t('location')}</OffsetTableHeader>
            <OffsetTableHeader>{t('run_id')}</OffsetTableHeader>
            <OffsetTableHeader>{t('labware')}</OffsetTableHeader>
            <OffsetTableHeader>{t('labware_offset_data')}</OffsetTableHeader>
          </tr>
          {offsetCandidates.map(offset => (
            <OffsetTableRow>
              <OffsetTableDatum>{offset.location.slotName}</OffsetTableDatum>
              <OffsetTableDatum>TODO</OffsetTableDatum>
              <OffsetTableDatum>{offset.labwareDisplayName}</OffsetTableDatum>
              <OffsetTableDatum>
                <OffsetVector {...offset.vector} />
              </OffsetTableDatum>
            </OffsetTableRow>
          ))}
      </OffsetTable>
      <Flex justifyContent={JUSTIFY_FLEX_END} marginY={SPACING.spacing3}>
        <SecondaryButton
          marginRight={SPACING.spacing2}
          onClick={clearAllOffsets}
        >
          {t('ignore_stored_data')}
        </SecondaryButton>
        <PrimaryButton onClick={handleApply}>
          {t('apply_stored_data')}
        </PrimaryButton>
      </Flex>
    </Modal>
  ) : null
}
