import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { C_BLUE, C_SKY_BLUE, Text } from '@opentrons/components'
import {
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data/js/constants'
import { StatusLabel } from './StatusLabel'

interface MagModuleProps {
  moduleStatus: string
  moduleHeight: number
  moduleModel: typeof MAGNETIC_MODULE_V1 | typeof MAGNETIC_MODULE_V2
}

export const MagneticModuleData = (
  props: MagModuleProps
): JSX.Element | null => {
  const { moduleStatus, moduleHeight, moduleModel } = props
  const { t } = useTranslation('device_details')

  return (
    //    TODO Immediately: iconColor should be animated
    <>
      <StatusLabel
        moduleStatus={moduleStatus}
        backgroundColor={C_SKY_BLUE}
        iconColor={moduleStatus === 'disengaged' ? C_BLUE : C_BLUE}
      />
      <Text fontSize="0.625rem">
        {moduleModel === MAGNETIC_MODULE_V2
          ? t('magdeck_gen2_height', {
              height: moduleHeight,
            })
          : t('magdeck_gen1_height', {
              height: moduleHeight,
            })}
      </Text>
    </>
  )
}
