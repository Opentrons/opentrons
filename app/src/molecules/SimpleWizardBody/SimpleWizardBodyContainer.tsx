import * as React from 'react'
import { css } from 'styled-components'

import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  RESPONSIVENESS,
} from '@opentrons/components'
import type { StyleProps } from '@opentrons/components'

const WIZARD_CONTAINER_STYLE = css`
  min-height: 394px;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  height: 'auto';
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    height: 472px;
  }
`

export interface SimpleWizardBodyContainerProps extends StyleProps {
  children?: JSX.Element | JSX.Element[] | null
}

export function SimpleWizardBodyContainer({
  children,
  ...styleProps
}: SimpleWizardBodyContainerProps): JSX.Element {
  return (
    <Flex css={WIZARD_CONTAINER_STYLE} {...styleProps}>
      {children}
    </Flex>
  )
}
