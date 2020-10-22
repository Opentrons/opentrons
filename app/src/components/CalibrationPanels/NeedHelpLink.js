// @flow
import * as React from 'react'
import * as Sessions from '../../sessions'
import {
  Flex,
  Link,
  C_BLUE,
  FONT_SIZE_BODY_1,
  POSITION_ABSOLUTE,
  SIZE_1,
} from '@opentrons/components'

import type { CalibrationSessionStep } from '../../sessions/types'

const NEED_HELP = 'Need Help?'
const SUPPORT_PAGE =
  'https://support.opentrons.com/en/collections/2426956-ot-2-calibration'

const isTargetStep: CalibrationSessionStep => boolean = currentStep =>
  [
    Sessions.TIP_LENGTH_STEP_LABWARE_LOADED,
    Sessions.PIP_OFFSET_STEP_LABWARE_LOADED,
    Sessions.DECK_STEP_LABWARE_LOADED,
  ].includes(currentStep)

export type NeedHelpLinkProps = {|
  currentStep: CalibrationSessionStep,
|}

export function NeedHelpLink(props: NeedHelpLinkProps): React.Node {
  const { currentStep } = props
  const top_prop = isTargetStep(currentStep) ? 0 : SIZE_1
  return (
    <Flex position={POSITION_ABSOLUTE} right={SIZE_1} top={top_prop}>
      <Link
        external
        fontSize={FONT_SIZE_BODY_1}
        color={C_BLUE}
        href={SUPPORT_PAGE}
      >
        {NEED_HELP}
      </Link>
    </Flex>
  )
}
