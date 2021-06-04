import * as React from 'react'

import {
  C_BLUE,
  FONT_SIZE_INHERIT,
  SPACING_3,
  Btn,
  Text,
} from '@opentrons/components'

interface SkipAppUpdateMessageProps {
  onClick: React.MouseEventHandler
}

const SKIP_APP_MESSAGE =
  'If you wish to skip this app update and only sync your robot server with your current app version, please '
const CLICK_HERE = 'click here'

export function SkipAppUpdateMessage(
  props: SkipAppUpdateMessageProps
): JSX.Element {
  return (
    <Text paddingLeft={SPACING_3}>
      {SKIP_APP_MESSAGE}
      <Btn color={C_BLUE} onClick={props.onClick} fontSize={FONT_SIZE_INHERIT}>
        {CLICK_HERE}
      </Btn>
      .
    </Text>
  )
}
