import { useTranslation } from 'react-i18next'

import { Chip, Flex, StyledText } from '@opentrons/components'

import {
  MODULE_INFO_CONTAINER_STYLE,
  MODULE_INFO_HEADER_TEXT_STYLE,
  MODULE_INFO_SUB_CONTAINER_STYLE,
} from './constants'

import type { ChipType } from '@opentrons/components'
import type { FlexStackerModule } from '@opentrons/api-client'

interface FlexStackerModuleProps {
  moduleData: FlexStackerModule['data']
}

export function FlexStackerModuleData(
  props: FlexStackerModuleProps
): JSX.Element | null {
  const { moduleData } = props
  const { t, i18n } = useTranslation(['device_details', 'shared'])

  const getShuttleStatusText = (): string => {
    switch (moduleData.platformState) {
      case 'extended':
        return t('flex_stacker_extended')
      case 'retracted':
        return t('flex_stacker_retracted')
      default:
        return t('shared:missing')
    }
  }

  const shuttleDisplayStatus = i18n.format(getShuttleStatusText(), 'capitalize')
  const doorDisplayStatus = i18n.format(
    moduleData.hopperDoorState === 'closed'
      ? t('shared:closed')
      : t('shared:open'),
    'capitalize'
  )

  const doorType = moduleData.hopperDoorState === 'opened' ? 'info' : 'neutral'

  let shuttleType: ChipType
  switch (moduleData.platformState) {
    case 'missing':
      shuttleType = 'error'
      break
    case 'unknown':
      shuttleType = 'neutral'
      break
    default:
      shuttleType = 'info'
      break
  }
  return (
    <Flex css={MODULE_INFO_CONTAINER_STYLE}>
      <Flex
        css={MODULE_INFO_SUB_CONTAINER_STYLE}
        data-testid="stacker_door_data"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
          {t('flex_stacker_door_status')}
        </StyledText>
        <Chip
          data-testid="stacker_door_label"
          text={doorDisplayStatus}
          chipSize="small"
          type={doorType}
          hasIcon={false}
        />
      </Flex>
      <Flex
        css={MODULE_INFO_SUB_CONTAINER_STYLE}
        data-testid="stacker_shuttle_data"
      >
        <StyledText css={MODULE_INFO_HEADER_TEXT_STYLE}>
          {t('flex_stacker_shuttle_status')}
        </StyledText>
        <Chip
          data-testid="stacker_shuttle_label"
          text={shuttleDisplayStatus}
          chipSize="small"
          type={shuttleType}
          iconName="connection-status"
        />
      </Flex>
    </Flex>
  )
}
