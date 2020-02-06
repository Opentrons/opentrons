// @flow
import * as React from 'react'
import last from 'lodash/last'
import { useSelector, useDispatch } from 'react-redux'
import {
  OutlineButton,
  HoverTooltip,
  Icon,
  AlertModal,
} from '@opentrons/components'
import { Portal } from '../portal'
import { getConnectedRobotName } from '../../robot/selectors'
import {
  useDispatchApiRequest,
  getRequestById,
  PENDING,
  FAILURE,
} from '../../robot-api'
import { dismissRequest } from '../../robot-api/actions'
import { updateModule } from '../../modules/actions'
import type { UpdateModuleAction } from '../../modules/types'
import type { State, Dispatch } from '../../types'
import type { RequestState } from '../../robot-api/types'
import styles from './styles.css'

const UP_TO_DATE = 'Module Firmware is up to date'
const CONNECT_TO_UPDATE = 'Connect to Robot to update Module'
const OK_TEXT = 'Ok'

type Props = {|
  hasAvailableUpdate: boolean,
  canControl: boolean,
  moduleId: string,
|}

export function ModuleUpdate(props: Props) {
  const { hasAvailableUpdate, moduleId, canControl } = props
  const dispatch = useDispatch<Dispatch>()
  const robotName = useSelector(getConnectedRobotName)
  const [
    dispatchApiRequest,
    requestIds,
  ] = useDispatchApiRequest<UpdateModuleAction>()

  const handleClick = () => {
    canControl &&
      robotName &&
      dispatchApiRequest(updateModule(robotName, moduleId))
  }
  const latestRequestId = last(requestIds)
  const latestRequest = useSelector<State, RequestState | null>(state =>
    getRequestById(state, latestRequestId)
  )
  const isPending = latestRequest?.status === PENDING

  const buttonText = hasAvailableUpdate ? 'update' : 'up to date'
  let tooltipText = null
  if (!canControl) tooltipText = CONNECT_TO_UPDATE
  if (!hasAvailableUpdate) tooltipText = UP_TO_DATE

  const handleCloseErrorModal = () => {
    dispatch(dismissRequest(latestRequestId))
  }
  return (
    <div className={styles.module_update_wrapper}>
      <HoverTooltip tooltipComponent={tooltipText}>
        {hoverTooltipHandlers => (
          <div {...hoverTooltipHandlers}>
            <OutlineButton
              className={styles.module_update_button}
              onClick={handleClick}
              disabled={!canControl || !hasAvailableUpdate || isPending}
            >
              {isPending ? (
                <Icon name="ot-spinner" height="1em" spin />
              ) : (
                buttonText
              )}
            </OutlineButton>
          </div>
        )}
      </HoverTooltip>
      {latestRequest?.status == 'failure' && (
        <Portal>
          <AlertModal
            alertOverlay
            heading="Failed to update Module Firmware"
            buttons={[{ children: OK_TEXT, onClick: handleCloseErrorModal }]}
          >
            <p>An error occurred while attempting to update your robot.</p>
            <p>{latestRequest?.error?.message}</p>
          </AlertModal>
        </Portal>
      )}
    </div>
  )
}
