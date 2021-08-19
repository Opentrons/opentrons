import * as React from 'react'

import {
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_2,
  SPACING_1,
  ALIGN_CENTER,
} from '@opentrons/components'

import { ModuleInfo } from './ModuleInfo'
import type { AttachedModule } from '../../../../redux/modules/types'
import { getModuleDisplayName } from '@opentrons/shared-data'

interface Props {
  module: AttachedModule
  controlDisabledReason: string | null
  usbPort?: string | null
  hubPort?: string | null
}

export function ModuleItem(props: Props): JSX.Element {
  const { module, controlDisabledReason, usbPort, hubPort } = props

  {() => {
    return (
      <React.Fragment>
        {map(moduleRenderCoords, ({ x, y, moduleModel }) => {
          const orientation = inferModuleOrientationFromXCoordinate(x)
          return (
        <ModuleInfo
          x={x}
          y={y}
          moduleModel={moduleModel}
          orientation={orientation}
          mode={'present'}
          usbPort={'1'}
          hubPort={null}
        />
        )
        </React.Fragment>
      )
    })}
  </>
)
}}
