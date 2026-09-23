import { useTranslation } from 'react-i18next'

import {
  CheckboxBasic,
  COLORS,
  Icon,
  ListAccordion,
  StyledText,
  Tag,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { formatTimestamp } from '/app/transformations/runs'

import { DisplayRunStatus } from '../../../ProtocolRun/ProtocolRunHeader/DisplayRunStatus'
import { useRunFileCount } from '../hooks/useRunFileCount'
import styles from './protocolrunrecords.module.css'
import { RunRecordDrawer } from './RunRecordDrawer'

import type { RunData } from '@opentrons/api-client'

interface RunRecordProps {
  run: RunData
  isSelected: boolean
  isDeleting: boolean
  onToggle: () => void
}

export function RunRecord({
  run,
  isSelected,
  isDeleting,
  onToggle,
}: RunRecordProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const protocols = useAllProtocolsQuery()
  const numFiles = useRunFileCount(run)
  const protocol = protocols?.data?.data.find(p => p.id === run.protocolId)

  const checkboxIcon = (
    <div
      onClick={e => {
        e.stopPropagation()
      }}
    >
      {isDeleting ? (
        <Icon name="ot-spinner" spin size="1rem" color={COLORS.grey60} />
      ) : (
        <CheckboxBasic
          checked={isSelected}
          onChange={onToggle}
          backgroundColor={COLORS.white}
        />
      )}
    </div>
  )

  const headerContent = (
    <div className={styles.run_record_header_content}>
      <div className={styles.run_date_col}>
        <Tag
          text={formatTimestamp(run.createdAt)}
          type="default"
          shrinkToContent
        />
      </div>
      <StyledText
        desktopStyle="bodyDefaultRegular"
        className={styles.run_protocol_col}
      >
        {protocol?.metadata.protocolName ?? t('na')}
      </StyledText>
      <div className={styles.run_status_col}>
        <DisplayRunStatus runStatus={run.status} />
      </div>
      <StyledText
        desktopStyle="bodyDefaultRegular"
        className={styles.run_files_col}
      >
        {numFiles}
      </StyledText>
    </div>
  )

  return (
    <ListAccordion
      alertKind="default"
      icon={checkboxIcon}
      headerChild={headerContent}
      tableHeaders={[]}
    >
      <RunRecordDrawer run={run} runProtocol={protocol} />
    </ListAccordion>
  )
}
