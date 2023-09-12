import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import last from 'lodash/last'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  AlertPrimaryButton,
  SPACING,
  Link,
  TYPOGRAPHY,
  ALIGN_CENTER,
  PrimaryButton,
} from '@opentrons/components'
import { useUpdateRobotNameMutation } from '@opentrons/react-api-client'

import { StyledText } from '../../../../../atoms/text'
import { LegacyModal } from '../../../../../molecules/LegacyModal'
import {
  useDispatchApiRequest,
  getRequestById,
  SUCCESS,
  PENDING,
} from '../../../../../redux/robot-api'
import {
  getResetConfigOptions,
  resetConfig,
} from '../../../../../redux/robot-admin'
import {
  getRobotSerialNumber,
  removeRobot,
} from '../../../../../redux/discovery'
import { useIsOT3, useRobot } from '../../../hooks'

import type { UpdatedRobotName } from '@opentrons/api-client'
import type { Dispatch, State } from '../../../../../redux/types'
import type { ResetConfigRequest } from '../../../../../redux/robot-admin/types'

interface DeviceResetModalProps {
  closeModal: () => void
  isRobotReachable: boolean
  robotName: string
  resetOptions?: ResetConfigRequest
}

export function DeviceResetModal({
  closeModal,
  isRobotReachable,
  robotName,
  resetOptions,
}: DeviceResetModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const [dispatchRequest, requestIds] = useDispatchApiRequest()
  const isOT3 = useIsOT3(robotName)
  const resetRequestStatus = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? getRequestById(state, lastId) : null
  })?.status

  const [tempRobotName, setTempRobotName] = React.useState<string>(robotName)

  const serverResetOptions = useSelector((state: State) =>
    getResetConfigOptions(state, robotName)
  )
  const dispatch = useDispatch<Dispatch>()
  const robot = useRobot(robotName)
  const serialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null

  const { updateRobotName } = useUpdateRobotNameMutation({
    onSuccess: (data: UpdatedRobotName) => {
      data.name != null && history.push(`/devices`)
      dispatch(removeRobot(robotName))
      resetOptions = {
        ...resetOptions,
        onDeviceDisplay: true,
      }
      dispatchRequest(resetConfig(data.name, resetOptions))
    },
    onError: (error: Error) => {
      console.error('error', error.message)
    },
  })

  const triggerReset = (): void => {
    if (resetOptions != null) {
      if (isOT3) {
        const totalOptionsSelected = Object.values(resetOptions).filter(
          selected => selected === true
        ).length

        const isEveryOptionSelected =
          totalOptionsSelected > 0 &&
          totalOptionsSelected ===
            // filtering out ODD setting because this gets implicitly cleared if all settings are selected
            serverResetOptions.filter(o => o.id !== 'onDeviceDisplay').length

        if (isEveryOptionSelected && serialNumber != null) {
          updateRobotName(serialNumber)
          // resetOptions = {
          //   ...resetOptions,
          //   onDeviceDisplay: true,
          // }
          // dispatchRequest(resetConfig(tempRobotName, resetOptions))
        }
      }
      dispatchRequest(resetConfig(robotName, resetOptions))
      history.push(`/devices/`)
    }
  }

  React.useEffect(() => {
    if (resetRequestStatus === SUCCESS) closeModal()
  }, [resetRequestStatus, closeModal])

  const PENDING_STATUS = resetRequestStatus === PENDING

  return (
    <>
      {isRobotReachable ? (
        <LegacyModal
          type="warning"
          title={t('reset_to_factory_settings')}
          onClose={closeModal}
        >
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText as="p" paddingBottom={SPACING.spacing24}>
              {t('factory_reset_modal_description')}
            </StyledText>
            <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
              <Link
                role="button"
                onClick={closeModal}
                textTransform={TYPOGRAPHY.textTransformCapitalize}
                marginRight={SPACING.spacing24}
                css={TYPOGRAPHY.linkPSemiBold}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {t('shared:cancel')}
              </Link>
              <AlertPrimaryButton
                onClick={triggerReset}
                disabled={PENDING_STATUS}
              >
                {t('yes_clear_data_and_restart_robot')}
              </AlertPrimaryButton>
            </Flex>
          </Flex>
        </LegacyModal>
      ) : (
        <LegacyModal
          type="warning"
          title={t('connection_to_robot_lost')}
          onClose={closeModal}
        >
          <StyledText
            as="p"
            marginBottom={SPACING.spacing24}
            paddingBottom={SPACING.spacing24}
          >
            {t('connection_lost_description')}
          </StyledText>
          <Flex justifyContent={JUSTIFY_FLEX_END}>
            <PrimaryButton
              onClick={closeModal}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
            >
              {t('shared:close')}
            </PrimaryButton>
          </Flex>
        </LegacyModal>
      )}
    </>
  )
}
