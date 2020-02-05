// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { OutlineButton, HoverTooltip, Icon } from '@opentrons/components'
import { getConnectedRobotName } from '../../robot/selectors'
import { updateModule } from '../../modules/actions'
import type { Dispatch } from '../../types'

import styles from './styles.css'

const UP_TO_DATE = 'Module Firmware is up to date'
const CONNECT_TO_UPDATE = 'Connect to Robot to update Module'

type Props = {|
  hasAvailableUpdate: boolean,
  canControl: boolean,
  moduleId: string,
|}

export function ModuleUpdate(props: Props) {
  const { hasAvailableUpdate, moduleId, canControl } = props
  const robotName = useSelector(getConnectedRobotName)
  const dispatch = useDispatch<Dispatch>()
  const [updateInProgress, setUpdateInProgress] = React.useState(false)
  const buttonText = hasAvailableUpdate ? 'update' : 'up to date'
  let tooltipText = null
  if (!canControl) tooltipText = CONNECT_TO_UPDATE
  if (!hasAvailableUpdate) tooltipText = UP_TO_DATE

  // const [dispatch, requestIds] = useDispatchApiRequest<FetchPipettesAction>()
  // - loading state and error state off of request status
  return (
    <div className={styles.module_update_wrapper}>
      <HoverTooltip tooltipComponent={tooltipText}>
        {hoverTooltipHandlers => (
          <div {...hoverTooltipHandlers}>
            <OutlineButton
              className={styles.module_update_button}
              onClick={() => {
                setUpdateInProgress(true)
                canControl &&
                  robotName &&
                  dispatch(updateModule(robotName, moduleId))
              }}
              disabled={!canControl || !hasAvailableUpdate}
            >
              {updateInProgress ? (
                <Icon name="ot-spinner" height="1em" spin />
              ) : (
                buttonText
              )}
            </OutlineButton>
          </div>
        )}
      </HoverTooltip>
    </div>
  )
}
