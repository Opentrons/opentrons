import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  AlertItem,
  SPACING_1,
  SPACING_2,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { Portal } from '../../App/portal'
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
    <Portal level="page">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING_1} ${SPACING_2}`}
      >
        <AlertItem
          type="success"
          onCloseClick={() => props.onCloseClick}
          title={t('labware_positon_check_complete_toast', {
            num_offsets:
              labwareOffsetCount === 0
                ? t('no_labware_offsets')
                : labwareOffsetCount,
          })}
        />
      </Flex>
    </Portal>
  )
}
