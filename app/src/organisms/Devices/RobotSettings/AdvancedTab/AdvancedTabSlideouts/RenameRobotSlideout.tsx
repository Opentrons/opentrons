import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFormik } from 'formik'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  COLORS,
  PrimaryButton,
} from '@opentrons/components'
import { useUpdateRobotNameMutation } from '@opentrons/react-api-client'
import {
  removeRobot,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '../../../../../redux/discovery'
import {
  useTrackEvent,
  ANALYTICS_RENAME_ROBOT,
} from '../../../../../redux/analytics'
import { Slideout } from '../../../../../atoms/Slideout'
import { StyledText } from '../../../../../atoms/text'
import { InputField } from '../../../../../atoms/InputField'
import { Banner } from '../../../../../atoms/Banner'

import type { UpdatedRobotName } from '@opentrons/api-client'
import type { State, Dispatch } from '../../../../../redux/types'
interface RenameRobotSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string
}

interface FormikErrors {
  newRobotName?: string
}

/* max length is 17 and min length is 1
   allow users to use alphabets(a-z & A-Z) and numbers
   https://github.com/Opentrons/opentrons/issues/10214
*/
const REGEX_RENAME_ROBOT_PATTERN = /^([a-zA-Z0-9]{0,17})$/
const regexPattern = new RegExp(REGEX_RENAME_ROBOT_PATTERN)

export function RenameRobotSlideout({
  isExpanded,
  onCloseClick,
  robotName,
}: RenameRobotSlideoutProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [previousRobotName, setPreviousRobotName] = React.useState<string>(
    robotName
  )
  const trackEvent = useTrackEvent()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const connectableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  )
  const reachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )

  const formik = useFormik({
    initialValues: {
      newRobotName: '',
    },
    onSubmit: (values, { resetForm }) => {
      const newName = values.newRobotName
      setPreviousRobotName(robotName)
      const sameNameRobotInUnavailable = unreachableRobots.find(
        robot => robot.name === newName
      )
      if (sameNameRobotInUnavailable != null) {
        dispatch(removeRobot(sameNameRobotInUnavailable.name))
      }
      updateRobotName(newName)
      resetForm({ values: { newRobotName: '' } })
    },
    validate: values => {
      const errors: FormikErrors = {}
      const newName = values.newRobotName
      if (!regexPattern.test(newName)) {
        errors.newRobotName = t('name_rule_error_name_length')
      }
      if (
        [...connectableRobots, ...reachableRobots].some(
          robot => newName === robot.name
        )
      ) {
        errors.newRobotName = t('name_rule_error_exist')
      }
      return errors
    },
  })

  const { updateRobotName } = useUpdateRobotNameMutation({
    onSuccess: (data: UpdatedRobotName) => {
      // TODO: 6/10/2022 kj for the robot name, we need to use GET: /server/name
      // data.name != null && history.push(`/devices/${data.name}/robot-settings`)
      // TODO 6/9/2022 kj this is a temporary fix to avoid the issue
      // https://github.com/Opentrons/opentrons/issues/10709
      data.name != null && history.push(`/devices`)
      dispatch(removeRobot(previousRobotName))
    },
    onError: (error: Error) => {
      // TODO kj 5/25/2022: when a user lost connection while the user is renaming a robot,
      // the app needs to show a message to inform that.
      console.error('error', error.message)
    },
  })

  const handleSubmitRobotRename = (): void => {
    trackEvent({
      name: ANALYTICS_RENAME_ROBOT,
      properties: {
        previousRobotName,
        newRobotName: formik.values.newRobotName,
      },
    })
    formik.handleSubmit()
  }

  return (
    <Slideout
      title={t('rename_robot_title')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          onClick={handleSubmitRobotRename}
          disabled={!(formik.isValid && formik.dirty)}
          width="100%"
        >
          {t('rename_robot')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Banner type="informing" marginBottom={SPACING.spacing16}>
          {t('rename_robot_prefer_usb_connection')}
        </Banner>
        <StyledText as="p" marginBottom={SPACING.spacing16}>
          {t('rename_robot_input_limitation_detail')}
        </StyledText>
        <StyledText
          as="label"
          css={TYPOGRAPHY.labelSemiBold}
          marginBottom={SPACING.spacing8}
        >
          {t('robot_name')}
        </StyledText>
        <InputField
          data-testid="rename-robot_input"
          id="newRobotName"
          name="newRobotName"
          type="text"
          onChange={formik.handleChange}
          value={formik.values.newRobotName}
          error={formik.errors.newRobotName && ' '}
        />
        <StyledText as="label" color={COLORS.darkGreyEnabled}>
          {t('characters_max')}
        </StyledText>
        {formik.errors.newRobotName && (
          <StyledText as="label" color={COLORS.errorEnabled}>
            {formik.errors.newRobotName}
          </StyledText>
        )}
      </Flex>
    </Slideout>
  )
}
