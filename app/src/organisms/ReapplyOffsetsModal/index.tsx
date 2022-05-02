import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../atoms/Modal'
import { StyledText } from '../../atoms/text'
import { useOffsetCandidatesForCurrentRun } from './hooks'

export function ReapplyOffsetsModal(): JSX.Element {
  const offsetCandidates = useOffsetCandidatesForCurrentRun()
  const { t } = useTranslation('run_details')
  const robotName = ''

  return (
    <Modal title={t('apply_stored_labware_offset_data')}>
      HERE
      <StyledText as="p">{t('robot_has_previous_offsets', {robotName: robotName})}</StyledText>
      <table>
        <tr>
          <td>{t('location')}</td>
          <td>{t('run_id')}</td>
          <td>{t('labware')}</td>
          <td>{t('labware_offset_data')}</td>
        </tr>
      </table>
      {offsetCandidates.map(offset => (
        <tr>
          <td>{offset.location.slotName}</td>
          <td>TODO</td>
          <td>{offset.definitionUri}</td>
          <td>{`X ${offset.vector.x} Y ${offset.vector.y} Z ${offset.vector.z}`}</td>
        </tr>
      ))}
    </Modal>
  )
}
