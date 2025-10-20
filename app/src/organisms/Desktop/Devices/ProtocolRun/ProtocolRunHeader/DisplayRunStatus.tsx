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
  runStatus: RunStatus | null,
  t: any
): [ChipType, boolean, boolean, string, IconName?] => {
  let text: string
  if (runStatus === RUN_STATUS_AWAITING_RECOVERY) {
    text = t('paused_on_error')
  } else {
    text = runStatus != null ? t(`status_${String(runStatus)}`) : ''
  }
  const run_status_string = `${String(runStatus)}`
  switch (run_status_string) {
    case 'canceled':
    case 'paused':
    case 'idle':
      return ['neutral', false, false, text]
    case 'failed':
    case 'awaiting-recovery':
      return ['error', true, false, text]
    case 'running':
      return ['success', true, true, text, 'circle']
    case 'succeeded':
      return ['success', true, false, text]
    default:
      return ['neutral', false, false, text]
  }
}

// Styles the run status copy.
export function DisplayRunStatus(props: DisplayRunStatusProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const [chipType, icon, pulse, statusText, iconName] = getRunStatusChip(
    props.runStatus,
    t
  )
  return (
    <Flex alignItems={ALIGN_CENTER}>
      <Chip
        text={statusText}
        type={chipType}
        hasIcon={icon}
        pulseIcon={pulse}
        iconName={iconName}
        chipSize={'small'}
      />
    </Flex>
  )
}
