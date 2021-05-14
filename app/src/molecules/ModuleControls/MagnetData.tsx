import * as React from 'react'

import {
  ALIGN_CENTER,
  COLOR_SUCCESS,
  COLOR_WARNING_LIGHT,
  FONT_SIZE_BODY_1,
  TEXT_TRANSFORM_CAPITALIZE,
  Flex,
  Icon,
  Text,
  SPACING_3,
} from '@opentrons/components'
import { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'

import type { MagneticModule } from '../../redux/modules/types'

interface Props {
  module: MagneticModule
}

export function MagnetData(props: Props): JSX.Element {
  const { module } = props
  return (
    <Flex
      fontSize={FONT_SIZE_BODY_1}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING_3}
    >
      <Icon
        name="circle"
        width="10px"
        color={
          module.status === 'engaged' ? COLOR_SUCCESS : COLOR_WARNING_LIGHT
        }
        marginRight="0.375rem"
        marginTop="0"
      />
      <Text textTransform={TEXT_TRANSFORM_CAPITALIZE}>{module.status}</Text>
      {module.status === 'engaged' && (
        <Text>{`, ${module.data.height}${
          module.model === MAGNETIC_MODULE_V1 ? '' : ' mm'
        }`}</Text>
      )}
    </Flex>
  )
}
