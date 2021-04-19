// @flow
import {
  Box,
  Flex,
  Text,
  FONT_WEIGHT_SEMIBOLD,
  TEXT_TRANSFORM_CAPITALIZE,
  SPACING_2,
  SPACING_3,
  SPACING_4,
} from '@opentrons/components'
import * as React from 'react'
import { css } from 'styled-components'
import { ModuleItem } from './ModuleItem'

import type { AttachedModule } from '../../../redux/modules/types'

const MULTIPLE_MODULES = 'Multiple modules connected'

type Props = {|
  hub: string,
  modules: Array<AttachedModule>,
  controlDisabledReason: string | null,
|}

export function UsbHubItem(props: Props): React.Node {
  const { hub, modules, controlDisabledReason } = props

  return (
    <Box>
      <Flex
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        marginBottom={SPACING_2}
      >
        <Text marginRight={SPACING_2}>{`USB Port ${hub}:`}</Text>
        <Text>{MULTIPLE_MODULES}</Text>
      </Flex>
      {modules.map(mod => (
        <Box
          key={mod.serial}
          paddingLeft={SPACING_3}
          paddingTop={SPACING_3}
          paddingBottom={SPACING_4}
          css={css`
            &:last-child {
              padding-bottom: ${SPACING_2};
            }
          `}
        >
          <ModuleItem
            key={mod.serial}
            module={mod}
            controlDisabledReason={controlDisabledReason}
          />
        </Box>
      ))}
    </Box>
  )
}
