import * as React from 'react'
import { css } from 'styled-components'

import { Flex, ALIGN_CENTER, SIZE_4 } from '@opentrons/components'
import type { ModuleModel } from '@opentrons/shared-data'

interface Props {
  model: ModuleModel
}

export function ModuleImage(props: Props): JSX.Element {
  const imgSrc = getModuleImg(props.model)

  return (
    <Flex width="42%" alignItems={ALIGN_CENTER}>
      <img
        css={css`
          max-width: 12rem;
          max-height: ${SIZE_4};
        `}
        src={imgSrc}
      />
    </Flex>
  )
}

function getModuleImg(model: ModuleModel): string {
  return MODULE_IMGS[model]
}

const MODULE_IMGS: { [m in ModuleModel]: string } = {
  temperatureModuleV1: require('../../../../assets/images/modules/temperatureModuleV1@3x.png'),
  temperatureModuleV2: require('../../../../assets/images/modules/temperatureModuleV2@3x.png'),
  magneticModuleV1: require('../../../../assets/images/modules/magneticModuleV1@3x.png'),
  magneticModuleV2: require('../../../../assets/images/modules/magneticModuleV2@3x.png'),
  thermocyclerModuleV1: require('../../../../assets/images/modules/thermocyclerModuleV1@3x.png'),
}
