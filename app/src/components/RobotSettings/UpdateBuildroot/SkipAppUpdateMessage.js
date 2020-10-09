// @flow
import * as React from 'react'
import { C_BLUE, SPACING_3, Link, Text } from '@opentrons/components'

type SkipAppUpdateMessageProps = {|
  onClick: () => mixed,
|}

const SKIP_APP_MESSAGE =
  'If you wish to skip this app update and only sync your robot server with your current app version, please '
const CLICK_HERE = 'click here'

export function SkipAppUpdateMessage(
  props: SkipAppUpdateMessageProps
): React.Node {
  return (
    <Text paddingLeft={SPACING_3}>
      {SKIP_APP_MESSAGE}
      <Link href="#" color={C_BLUE} onClick={props.onClick}>
        {CLICK_HERE}
      </Link>
      .
    </Text>
  )
}
