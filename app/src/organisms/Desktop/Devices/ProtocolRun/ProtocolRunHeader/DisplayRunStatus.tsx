import { useTranslation } from 'react-i18next'

import { RUN_STATUS_AWAITING_RECOVERY } from '@opentrons/api-client'
import { ALIGN_CENTER, Chip, Flex } from '@opentrons/components'

import type { RunStatus } from '@opentrons/api-client'
import type { ChipType, IconName } from '@opentrons/components'

interface DisplayRunStatusProps {
  runStatus: RunStatus | null
}

// Styles the run status chip.
const getRunStatusChip = (
  runStatus: RunStatus | null
): [ChipType, boolean, boolean, IconName?] => {
  const run_status_string = `${String(runStatus)}`
  switch (run_status_string) {
    case 'canceled':
    case 'paused':
    case 'idle':
      return ['neutral', false, false]
    case 'failed':
    case 'awaiting-recovery':
      return ['error', true, false]
    case 'running':
      return ['success', true, true, 'circle']
    case 'succeeded':
      return ['success', true, false]
    default:
      return ['neutral', false, false]
  }
}

// Styles the run status copy.
export function DisplayRunStatus(props: DisplayRunStatusProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const [chipType, icon, pulse, iconName] = getRunStatusChip(props.runStatus)
  let text: string
  if (props.runStatus === RUN_STATUS_AWAITING_RECOVERY) {
    text = 'Paused on error'
  } else {
    text = props.runStatus != null ? t(`status_${String(props.runStatus)}`) : ''
  }
  return (
    <Flex alignItems={ALIGN_CENTER}>
      <Chip
        text={text}
        type={chipType}
        hasIcon={icon}
        pulseIcon={pulse}
        iconName={iconName}
        chipSize={'small'}
      />
    </Flex>
  )
}
