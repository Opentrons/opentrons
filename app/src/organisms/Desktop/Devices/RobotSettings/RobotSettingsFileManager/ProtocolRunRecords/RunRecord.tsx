import { format } from 'date-fns'

import {
  CheckboxBasic,
  COLORS,
  ListAccordion,
  StyledText,
  Tag,
} from '@opentrons/components'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { DisplayRunStatus } from '../../../ProtocolRun/ProtocolRunHeader/DisplayRunStatus'
import { useRunFileCount } from '../hooks/useRunFileCount'
import styles from './protocolrunrecords.module.css'

import type { RunData } from '@opentrons/api-client'

export const formatRunDate = (isoString: string): string => {
  return format(new Date(isoString), 'M/d/yyyy HH:mm:ss')
}

interface RunRecordProps {
  run: RunData
  isSelected: boolean
  onToggle: () => void
}

export function RunRecord({
  run,
  isSelected,
  onToggle,
}: RunRecordProps): JSX.Element {
  const protocols = useAllProtocolsQuery()
  const numFiles = useRunFileCount(run)
  const protocol = protocols?.data?.data.find(p => p.id === run.protocolId)

  const checkboxIcon = (
    <div
      onClick={e => {
        e.stopPropagation()
      }}
    >
      <CheckboxBasic
        checked={isSelected}
        onChange={onToggle}
        backgroundColor={COLORS.white}
      />
    </div>
  )

  const headerContent = (
    <div className={styles.run_record_header_content}>
      <div className={styles.run_date_col}>
        <Tag
          text={formatRunDate(run.createdAt)}
          type="default"
          shrinkToContent
        />
      </div>
      <StyledText
        desktopStyle="bodyDefaultRegular"
        className={styles.run_protocol_col}
      >
        {protocol?.metadata.protocolName ?? '—'}
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
      <div>TODO: wire up drawer</div>
    </ListAccordion>
  )
}
