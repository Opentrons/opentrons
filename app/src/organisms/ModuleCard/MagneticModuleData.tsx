import { useTranslation } from 'react-i18next'

import { Chip, Flex, StyledText } from '@opentrons/components'
import { MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'

import {
  MODULE_INFO_DETAIL_CONTAINER_STYLE,
  MODULE_INFO_DETAIL_TEXT_STYLE,
} from './constants'

import type { MagneticStatus } from '@opentrons/api-client'
import type { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'

interface MagModuleProps {
  moduleStatus: MagneticStatus
  moduleHeight: number
  moduleModel: typeof MAGNETIC_MODULE_V1 | typeof MAGNETIC_MODULE_V2
}

export const MagneticModuleData = (
  props: MagModuleProps
): JSX.Element | null => {
  const { moduleStatus, moduleHeight, moduleModel } = props
  const { t } = useTranslation('device_details')

  return (
    <Flex css={MODULE_INFO_DETAIL_CONTAINER_STYLE}>
      <Chip
        text={moduleStatus}
        chipSize="small"
        type="info"
        hasIcon={true}
        pulseIcon={moduleStatus === 'engaged'}
        iconName="connection-status"
        textTransform="capitalize"
        data-testid="mag_module_chip"
      />
      <StyledText
        css={MODULE_INFO_DETAIL_TEXT_STYLE}
        data-testid="mag_module_data"
      >
        {t(
          moduleModel === MAGNETIC_MODULE_V2
            ? 'magdeck_gen2_height'
            : 'magdeck_gen1_height',
          {
            height: moduleHeight,
          }
        )}
      </StyledText>
    </Flex>
  )
}
