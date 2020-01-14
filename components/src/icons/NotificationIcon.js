// @flow
import * as React from 'react'

import Icon, { type IconProps } from './Icon'
import iconData, { type IconName } from './icon-data'

type Props = {|
  ...IconProps,
  /** name constant of the optional notifcation icon to display */
  childName: ?IconName,
  /** classes to apply (e.g. for color) to notification icon */
  childClassName?: string,
|}

const SCALE_FACTOR = 3

/**
 * Inline SVG icon component with additional nested notification icon. Takes
 * all the same props as Icon in addition to the ones listed above.
 *
 * If you need access to the IconName type, you can:
 * ```js
 * import {type IconName} from '@opentrons/components'
 * ```
 */

export default function NotificationIcon(props: Props) {
  const { childName, childClassName, ...iconProps } = props
  if (!(iconProps.name in iconData)) {
    console.error(`"${iconProps.name}" is not a valid Icon name`)
    return null
  }
  const { viewBox } = iconData[iconProps.name]
  const [x, y, width, height] = viewBox.split(' ').map(Number)
  const scaledWidth = width / SCALE_FACTOR
  const scaledHeight = height / SCALE_FACTOR

  return (
    <Icon {...iconProps}>
      {childName && (
        <Icon
          name={childName}
          className={props.childClassName}
          x={x + (SCALE_FACTOR - 1) * scaledWidth}
          y={y + (SCALE_FACTOR - 1) * scaledHeight}
          width={scaledWidth}
          height={scaledHeight}
        />
      )}
    </Icon>
  )
}
