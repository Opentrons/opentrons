import { useTranslation } from 'react-i18next'

import { Chip, Flex, StyledText } from '@opentrons/components'

import {
  MODULE_INFO_DETAIL_CONTAINER_STYLE,
  MODULE_INFO_DETAIL_TEXT_STYLE,
} from './constants'

import type { ChipType } from '@opentrons/components'
import type { AbsorbanceReaderModule } from '@opentrons/api-client'

interface AbsorbanceReaderProps {
  moduleData: AbsorbanceReaderModule['data']
}

export const AbsorbanceReaderData = (
  props: AbsorbanceReaderProps
): JSX.Element | null => {
  const { moduleData } = props
  const { t, i18n } = useTranslation(['device_details', 'shared'])

  let statusText: string
  let statusChipType: ChipType
  switch (moduleData.status) {
    case 'idle': {
      statusText = 'Idle'
      statusChipType = 'neutral'
      break
    }
    case 'measuring': {
      statusText = 'Reading'
      statusChipType = 'info'
      break
    }
    case 'error': {
      statusText = 'Error'
      statusChipType = 'warning'
      break
    }
  }
  const lidDisplayStatus =
    moduleData.lidStatus === 'on'
      ? i18n.format(t('shared:closed'), 'capitalize')
      : i18n.format(t('shared:open'), 'capitalize')

  return (
    <Flex css={MODULE_INFO_DETAIL_CONTAINER_STYLE}>
      <Chip
        text={statusText}
        chipSize="small"
        type={statusChipType}
        hasIcon={true}
        iconName="connection-status"
        textTransform="capitalize"
        data-testid="abs_module_status"
      />
      <StyledText
        css={MODULE_INFO_DETAIL_TEXT_STYLE}
        data-testid="abs_module_data"
      >
        {t('abs_reader_lid_status', {
          status: lidDisplayStatus,
        })}
      </StyledText>
    </Flex>
  )
}
