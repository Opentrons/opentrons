// @flow
import * as React from 'react'
import cx from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'

import {
  useDispatchApiRequest,
  getRequestById,
  PENDING,
  SUCCESS,
} from '../../robot-api'

import {
  fetchResetConfigOptions,
  getResetConfigOptions,
  resetConfig,
} from '../../robot-admin'

import {
  AlertModal,
  LabeledCheckbox,
  Box,
  Flex,
  OutlineButton,
  OVERFLOW_SCROLL,
  JUSTIFY_FLEX_END,
  DIRECTION_COLUMN,
  SIZE_5,
} from '@opentrons/components'
import { Portal } from '../portal'

import styles from './styles.css'

import type { State, Dispatch } from '../../types'
import type { ResetConfigRequest } from '../../robot-admin/types'

export type ResetRobotModalProps = {|
  robotName: string,
  closeModal: () => mixed,
|}

// TODO(bc, 2020-12-07): i18n
const TITLE = 'Robot Configuration Reset'

export function ResetRobotModal(props: ResetRobotModalProps): React.Node {
  const { robotName, closeModal } = props
  const dispatch = useDispatch<Dispatch>()
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const resetRequestStatus = useSelector((state: State) => {
    return getRequestById(state, last(requestIds))
  })?.status

  const triggerReset = () =>
    dispatchRequest(resetConfig(robotName, resetOptions))

  const [resetOptions, setResetOptions] = React.useState<ResetConfigRequest>({})
  const options = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )

  React.useEffect(() => {
    dispatch(fetchResetConfigOptions(robotName))
  }, [robotName, dispatch])

  React.useEffect(() => {
    if (resetRequestStatus === SUCCESS) closeModal()
  }, [resetRequestStatus, closeModal])

  const buttons = [
    { onClick: closeModal, children: 'close' },
    {
      onClick: triggerReset,
      disabled: resetRequestStatus === PENDING,
      children: 'restart',
    },
  ]

  return (
    <Portal>
      <AlertModal heading={TITLE} alertOverlay>
        <p>
          Warning! Clicking <strong>restart</strong> will erase your selected
          configurations and <strong>restart your robot</strong>. This cannot be
          undone
        </p>
        <Flex maxHeight={SIZE_5} flexDirection={DIRECTION_COLUMN}>
          <Box overflow={OVERFLOW_SCROLL}>
            {options.map(o => (
              <LabeledCheckbox
                label={o.name}
                onChange={() => {
                  setResetOptions({
                    ...resetOptions,
                    [o.id]: !resetOptions[o.id],
                  })
                }}
                name={o.id}
                value={resetOptions[o.id]}
                key={o.id}
              >
                <p>{o.description}</p>
              </LabeledCheckbox>
            ))}
          </Box>
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            {buttons.filter(Boolean).map((button, index) => (
              <OutlineButton
                {...button}
                className={cx(styles.alert_modal_button, button.className)}
                key={index}
              />
            ))}
          </Flex>
        </Flex>
      </AlertModal>
    </Portal>
  )
}
