import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFormik } from 'formik'
import {
  Flex,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
  COLORS,
} from '@opentrons/components'
import { useUpdateRobotNameMutation } from '@opentrons/react-api-client'
import { removeRobot } from '../../../../../redux/discovery'
import { Slideout } from '../../../../../atoms/Slideout'
import { StyledText } from '../../../../../atoms/text'
import { PrimaryButton } from '../../../../../atoms/Buttons'
import { InputField } from '../../../../../atoms/InputField'

import type { UpdatedRobotName } from '@opentrons/api-client'
import type { Dispatch } from '../../../../../redux/types'
interface RenameRobotSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string
}

interface FormikErrors {
  newRobotName?: string
}

/* max length is 35 and min length is 1
   allow users to use alphabets, numbers, space, ', !, ?, $, _, and -
   not allow users to use space at the beginning of a new name
*/
const REGEX_RENAME_ROBOT_PATTERN = /^\S([a-zA-Z0-9\s-_!$?*]{0,35})$/
const regexPattern = new RegExp(REGEX_RENAME_ROBOT_PATTERN)

export function RenameRobotSlideout({
  isExpanded,
  onCloseClick,
  robotName,
}: RenameRobotSlideoutProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  // const [newRobotName, setNewRobotName] = React.useState<string>('')
  // const [isValidName, setIsValidName] = React.useState<boolean>(false)
  const [previousRobotName, setPreviousRobotName] = React.useState<string>(
    robotName
  )
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  const formik = useFormik({
    initialValues: {
      newRobotName: '',
    },
    onSubmit: (values, { resetForm }) => {
      const newName = values.newRobotName
      // const inputForm = document.getElementById('newRobotName')
      // if (inputForm) inputForm.style.border = `1px solid ${COLORS.medGrey}`
      setPreviousRobotName(robotName)
      updateRobotName(newName)
      // resetForm({ values: undefined })
    },
    validate: values => {
      const errors: FormikErrors = {}
      const newName = values.newRobotName
      console.log(newName, regexPattern.test(newName) ? 'valid' : 'invalid')
      if (!regexPattern.test(newName)) {
        errors.newRobotName = t('rename_robot_input_error_message')
        // const inputForm = document.getElementById('newRobotName')
        // if (inputForm) inputForm.style.border = `1px solid ${COLORS.error}`
      }
      return errors
    },
  })

  const { updateRobotName } = useUpdateRobotNameMutation({
    onSuccess: (data: UpdatedRobotName) => {
      dispatch(removeRobot(previousRobotName))
      data.name != null &&
        history.push(`/devices/${data.name as string}/robot-settings`)
    },
    onError: error => {
      console.error('error', error.message)
    },
  })

  // const handleRenameRobot = (): void => {
  //   setPreviousRobotName(robotName)
  //   updateRobotName(newRobotName as string)
  // }

  // const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
  //   e.preventDefault()
  //   // console.log('value', value)
  //   // TODO error message handling

  //   setIsValidName(regexPattern.test(e.target.value))
  //   setNewRobotName(e.target.value)
  //   console.log(
  //     e.target.value,
  //     regexPattern.test(e.target.value) ? 'valid' : 'invalid'
  //   )
  // }

  return (
    <Slideout
      title={t('rename_robot_slideout_title')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          disabled={
            formik.errors.newRobotName != null ||
            formik.values.newRobotName === ''
          }
          onClick={formik.handleSubmit}
          width="100%"
        >
          {t('rename_robot_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p" marginBottom={SPACING.spacing4}>
          {t('rename_robot_slideout_description')}
        </StyledText>
        <StyledText
          as="label"
          css={TYPOGRAPHY.labelSemiBold}
          marginBottom={SPACING.spacing3}
        >
          {t('rename_robot_slideout_label')}
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
          {t('rename_robot_input_limitation_label')}
        </StyledText>
        {formik.errors.newRobotName && (
          <StyledText as="label" color={COLORS.error}>
            {formik.errors.newRobotName}
          </StyledText>
        )}
      </Flex>
    </Slideout>
  )
}
