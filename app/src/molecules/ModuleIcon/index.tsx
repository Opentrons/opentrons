import * as React from 'react'
import { css } from 'styled-components'
import {
  LEGACY_COLORS,
  COLORS,
  Flex,
  ModuleIcon as SharedModuleIcon,
  POSITION_RELATIVE,
  SPACING,
  useHoverTooltip,
} from '@opentrons/components'
import { Tooltip } from '../../atoms/Tooltip'

import type { AttachedModule } from '../../redux/modules/types'

const MODULE_ICON_STYLE = css`
  &:hover {
    color: ${COLORS.black90};
  }
`
interface ModuleIconProps {
  module: AttachedModule
  tooltipText: string
}

export function ModuleIcon(props: ModuleIconProps): JSX.Element {
  const { module, tooltipText } = props
  const [targetProps, tooltipProps] = useHoverTooltip()

  return (
    <>
      <Flex {...targetProps}>
        <SharedModuleIcon
          moduleType={module.moduleType}
          size={SPACING.spacing16}
          marginX={SPACING.spacing2}
          color={LEGACY_COLORS.darkGreyEnabled}
          css={MODULE_ICON_STYLE}
        />
      </Flex>

      <Flex position={POSITION_RELATIVE} marginTop={SPACING.spacing20}>
        <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
      </Flex>
    </>
  )
}
