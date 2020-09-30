// @flow
import * as React from 'react'
import capitalize from 'lodash/capitalize'

import { ListItem, HoverTooltip } from '@opentrons/components'
import styles from './styles.css'

import type { IconName } from '@opentrons/components'
import type { Pipette as ProtocolPipette } from '../../robot/types'
import type { Mount } from '../../pipettes/types'

export type PipetteListItemProps = {|
  mount: Mount,
  pipette: ProtocolPipette | null,
  calibrateUrl: string | null,
  disabledReason: string | null,
|}

export function PipetteListItem(props: PipetteListItemProps): React.Node {
  const { mount, pipette, calibrateUrl, disabledReason } = props
  const confirmed = pipette?.probed
  const displayName = pipette?.modelSpecs?.displayName || 'N/A'
  const iconName: IconName = confirmed
    ? 'check-circle'
    : 'checkbox-blank-circle-outline'

  return (
    <HoverTooltip placement="bottom" tooltipComponent={disabledReason}>
      {tooltipHandlers => (
        <ListItem
          ref={tooltipHandlers?.ref}
          onMouseEnter={tooltipHandlers?.onMouseEnter}
          onMouseLeave={tooltipHandlers?.onMouseLeave}
          isDisabled={disabledReason !== null}
          url={disabledReason === null ? calibrateUrl : null}
          iconName={iconName}
          activeClassName={styles.active}
        >
          <div className={styles.item_info}>
            <span className={styles.item_info_location}>
              {capitalize(mount)}
            </span>
            <span>{displayName}</span>
          </div>
        </ListItem>
      )}
    </HoverTooltip>
  )
}
