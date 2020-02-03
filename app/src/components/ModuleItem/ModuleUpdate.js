// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { OutlineButton, HoverTooltip } from '@opentrons/components'
import { getConnectedRobotName } from '../../robot/selectors'
import { updateModule } from '../../modules/actions'
import type { Dispatch } from '../../types'

import styles from './styles.css'

const CONNECT_TO_UPDATE = 'Connect to robot to update module'

type Props = {|
  hasAvailableUpdate: boolean,
  moduleId: string,
|}

export function ModuleUpdate(props: Props) {
  const { hasAvailableUpdate, moduleId } = props
  const robotName = useSelector(getConnectedRobotName)
  const dispatch = useDispatch<Dispatch>()
  const buttonText = hasAvailableUpdate ? 'update' : 'updated'

  return (
    <div className={styles.module_update_wrapper}>
      <HoverTooltip tooltipComponent={robotName ? null : CONNECT_TO_UPDATE}>
        {hoverTooltipHandlers => (
          <div {...hoverTooltipHandlers}>
            <OutlineButton
              className={styles.module_update_button}
              onClick={() =>
                robotName && dispatch(updateModule(robotName, moduleId))
              }
              disabled={!robotName || !hasAvailableUpdate}
            >
              {buttonText}
            </OutlineButton>
          </div>
        )}
      </HoverTooltip>
    </div>
  )
}
