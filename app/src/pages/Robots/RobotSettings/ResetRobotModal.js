// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import last from 'lodash/last'

import {
  useDispatchApiRequest,
  getRequestById,
  PENDING,
  SUCCESS,
} from '../../../redux/robot-api'

import {
  fetchResetConfigOptions,
  getResetConfigOptions,
  resetConfig,
} from '../../../redux/robot-admin'

import {
  BaseModal,
  LabeledCheckbox,
  Flex,
  Text,
  Icon,
  SecondaryBtn,
  JUSTIFY_FLEX_END,
  DISPLAY_FLEX,
  ALIGN_CENTER,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_REGULAR,
  SPACING_2,
  SIZE_2,
} from '@opentrons/components'
import { Portal } from '../../../App/portal'

import type { State, Dispatch } from '../../../redux/types'
import type { ResetConfigRequest } from '../../../redux/robot-admin/types'

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

  const CLOSE = 'close'
  const RESTART = 'restart'
  const PENDING_STATUS = resetRequestStatus === PENDING

  return (
    <Portal>
      <BaseModal
        header={
          <Text
            as="h2"
            display={DISPLAY_FLEX}
            alignItems={ALIGN_CENTER}
            fontSize={FONT_SIZE_HEADER}
            fontWeight={FONT_WEIGHT_REGULAR}
          >
            <Icon name="alert" width={SIZE_2} marginRight={SPACING_2} />
            {TITLE}
          </Text>
        }
        footer={
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <SecondaryBtn marginLeft={SPACING_2} onClick={closeModal}>
              {CLOSE}
            </SecondaryBtn>
            <SecondaryBtn
              marginLeft={SPACING_2}
              onClick={triggerReset}
              disabled={PENDING_STATUS}
            >
              {RESTART}
            </SecondaryBtn>
          </Flex>
        }
      >
        <p>
          Warning! Clicking <strong>restart</strong> will erase your selected
          configurations and <strong>restart your robot</strong>. This cannot be
          undone
        </p>
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
      </BaseModal>
    </Portal>
  )
}
