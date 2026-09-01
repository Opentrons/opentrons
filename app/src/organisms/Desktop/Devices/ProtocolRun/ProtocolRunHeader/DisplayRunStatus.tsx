import { useTranslation } from 'react-i18next'

import { RUN_STATUS_AWAITING_RECOVERY } from '@opentrons/api-client'
import { ALIGN_CENTER, Chip, Flex } from '@opentrons/components'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { RunStatus } from '@opentrons/api-client'
import type { ChipType, IconName } from '@opentrons/components'

interface DisplayRunStatusProps {
  runStatus: RunStatus | null
}

interface RunStatusChipResult {
  chipType: ChipType
  showIcon: boolean
  statusText: string
  pulse?: boolean
  iconOverrideName?: IconName
}
// Styles the run status chip.
const getRunStatusChip = (
  runStatus: RunStatus | null,
  t: TFunction
): RunStatusChipResult => {
  let text: string
  if (runStatus === RUN_STATUS_AWAITING_RECOVERY) {
    text = t('paused_on_error')
  } else {
    text = runStatus != null ? t(`status_${String(runStatus)}`) : ''
  }
  const run_status_string = `${String(runStatus)}`
  switch (run_status_string) {
    case 'paused':
    case 'idle':
      return { chipType: 'neutral', showIcon: false, statusText: text }
    case 'failed':
    case 'awaiting-recovery':
      return { chipType: 'error', showIcon: true, statusText: text }
    case 'running':
      return {
        chipType: 'success',
        showIcon: true,
        pulse: true,
        statusText: text,
        iconOverrideName: 'circle',
      }
    case 'succeeded':
      return { chipType: 'success', showIcon: true, statusText: text }
    case 'stopped':
      return { chipType: 'warning', showIcon: true, statusText: text }
    default:
      return { chipType: 'neutral', showIcon: false, statusText: text }
  }
}

// Styles the run status copy.
export function DisplayRunStatus(props: DisplayRunStatusProps): ReactNode {
  const { t } = useTranslation('run_details')
  const {
    chipType,
    showIcon,
    statusText,
    pulse = false,
    iconOverrideName,
  } = getRunStatusChip(props.runStatus, t as TFunction)
  return (
    <Flex alignItems={ALIGN_CENTER}>
      {props.runStatus != null && (
        <Chip
          text={statusText}
          type={chipType}
          hasIcon={showIcon}
          pulseIcon={pulse}
          iconName={iconOverrideName}
          chipSize={'small'}
        />
      )}
    </Flex>
  )
}
