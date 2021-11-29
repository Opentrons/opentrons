import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'
import { getLatestLabwareOffsetCount } from './LabwarePositionCheck/utils/getLatestLabwareOffsetCount'

interface LabwareOffsetSuccessToastProps {
  onCloseClick: () => unknown
}
export function LabwareOffsetSuccessToast(
  props: LabwareOffsetSuccessToastProps
): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const currentProtocolRun = useCurrentProtocolRun()
  const currentRunData = currentProtocolRun.runRecord?.data
  const labwareOffsetCount = getLatestLabwareOffsetCount(
    currentRunData?.labwareOffsets ?? []
  )

  return (
    <AlertItem
      type="success"
      onCloseClick={props.onCloseClick}
      title={
        labwareOffsetCount === 0
          ? t('labware_positon_check_complete_toast_no_offsets')
          : t('labware_positon_check_complete_toast_with_offsets', {
              count: labwareOffsetCount,
            })
      }
    />
  )
}
