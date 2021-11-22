import * as React from 'react'
import {
  DIRECTION_COLUMN,
  Flex,
  AlertItem,
  SPACING_1,
  SPACING_2,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useCurrentProtocolRun } from '../ProtocolUpload/hooks'

interface LabwareOffsetSuccessToastProps {
  onCloseClick: () => unknown
}
export function LabwareOffsetSuccessToast(
  props: LabwareOffsetSuccessToastProps
): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const currentProtocolRun = useCurrentProtocolRun()
  const labwareOffsets = currentProtocolRun.runRecord?.data.labwareOffsets

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={`${SPACING_1} ${SPACING_2}`}
    >
      <AlertItem
        type="success"
        onCloseClick={() => props.onCloseClick}
        title={t('labware_positon_check_complete_toast', {
          num_offsets: labwareOffsets?.length,
        })}
      />
    </Flex>
  )
}
