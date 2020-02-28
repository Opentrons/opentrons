// @flow
import * as React from 'react'

import { Icon } from './Icon'
import { ICON_DATA_BY_NAME } from './icon-data'

import type { IconProps, IconName } from './Icon'

export type NotificationIconProps = {|
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

export function NotificationIcon(props: NotificationIconProps) {
  const { childName, childClassName, ...iconProps } = props
  const { viewBox } = ICON_DATA_BY_NAME[iconProps.name]
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
