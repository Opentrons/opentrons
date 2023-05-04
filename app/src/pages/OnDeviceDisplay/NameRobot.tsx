import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useFormik } from 'formik'
import { css } from 'styled-components'
import { useLocation, useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  POSITION_FIXED,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  COLORS,
  TYPOGRAPHY,
  Icon,
  Btn,
} from '@opentrons/components'
import { useUpdateRobotNameMutation } from '@opentrons/react-api-client'

import {
  removeRobot,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getLocalRobot,
} from '../../redux/discovery'
import { useTrackEvent, ANALYTICS_RENAME_ROBOT } from '../../redux/analytics'
import { StyledText } from '../../atoms/text'
import { InputField } from '../../atoms/InputField'
import { CustomKeyboard } from '../../atoms/SoftwareKeyboard'
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { StepMeter } from '../../atoms/StepMeter'
import { ConfirmRobotName } from '../../organisms/OnDeviceDisplay/NameRobot/ConfirmRobotName'

import type { UpdatedRobotName } from '@opentrons/api-client'
import type { State, Dispatch } from '../../redux/types'

// Note: kj 12/15/2022 the current input field is optimized for the desktop
// Need to update the InputField for the ODD app
// That will be done in another PR
const INPUT_FIELD_ODD_STYLE = css`
  padding-top: ${SPACING.spacingXXL};
  padding-bottom: ${SPACING.spacingXXL};
  font-size: 2.5rem;
  line-height: 3.25rem;
  text-align: center;
`

interface FormikErrors {
  newRobotName?: string
}

export function NameRobot(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const trackEvent = useTrackEvent()
  const localRobot = useSelector(getLocalRobot)
  const previousName = localRobot?.name != null ? localRobot.name : null
  const [name, setName] = React.useState<string>('')
  const [newName, setNewName] = React.useState<string>('')
  const [
    isShowConfirmRobotName,
    setIsShowConfirmRobotName,
  ] = React.useState<boolean>(false)
  const keyboardRef = React.useRef(null)
  const dispatch = useDispatch<Dispatch>()
  const { state: fromPath } = useLocation()
  const history = useHistory()
  const isFromRobotSettings = fromPath === 'robotSettings'

  // check for robot name
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
      const newName = values.newRobotName.concat(name)
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
      const newName = values.newRobotName.concat(name)
      // In ODD users cannot input letters and numbers from software keyboard
      // so the app only checks the length of input string
      if (newName.length < 1) {
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

  const { updateRobotName, isLoading: isNaming } = useUpdateRobotNameMutation({
    onSuccess: (data: UpdatedRobotName) => {
      if (data.name != null) {
        setNewName(data.name)
        if (isFromRobotSettings) {
          history.push('/robot-settings')
        } else {
          setIsShowConfirmRobotName(true)
        }
        if (previousName != null) {
          dispatch(removeRobot(previousName))
        }
      }
    },
    onError: (error: Error) => {
      console.error('error', error.message)
    },
  })

  const handleConfirm = (): void => {
    // check robot name in the same network
    // ToDo (kj:04/09/2023) need to specify for odd
    trackEvent({
      name: ANALYTICS_RENAME_ROBOT,
      properties: {
        previousRobotName: previousName,
        newRobotName: formik.values.newRobotName,
      },
    })
    formik.handleSubmit()
  }

  return (
    <>
      {isShowConfirmRobotName && !isFromRobotSettings ? (
        <ConfirmRobotName robotName={newName} />
      ) : (
        <>
          {!isFromRobotSettings ? (
            <StepMeter totalSteps={5} currentStep={4} OnDevice />
          ) : null}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            marginTop={SPACING.spacing6}
            marginX={SPACING.spacingXXL}
          >
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              justifyContent={
                isFromRobotSettings ? JUSTIFY_SPACE_BETWEEN : JUSTIFY_CENTER
              }
              position={POSITION_RELATIVE}
              marginBottom="3.041875rem"
            >
              <Flex position={POSITION_ABSOLUTE} left="0">
                <Btn
                  onClick={() => {
                    if (!isFromRobotSettings) {
                      history.push('/robot-settings/update-robot')
                    } else {
                      history.push('/robot-settings')
                    }
                  }}
                >
                  <Icon name="back" size="3rem" color={COLORS.darkBlack100} />
                </Btn>
              </Flex>
              <Flex marginLeft={isFromRobotSettings ? '4rem' : '0'}>
                <StyledText
                  fontSize={TYPOGRAPHY.fontSize38}
                  fontWeight={TYPOGRAPHY.fontWeightBold}
                  lineHeight={TYPOGRAPHY.lineHeight48}
                >
                  {!isFromRobotSettings
                    ? t('name_your_robot')
                    : t('rename_robot')}
                </StyledText>
              </Flex>
              <Flex position={POSITION_ABSOLUTE} right="0">
                {Boolean(isNaming) ? (
                  <Icon
                    name="ot-spinner"
                    size="1.25rem"
                    spin
                    marginRight={SPACING.spacing3}
                  />
                ) : (
                  <SmallButton
                    buttonType="primary"
                    buttonText={t('shared:confirm')}
                    buttonCategory="rounded"
                    onClick={handleConfirm}
                  />
                )}
              </Flex>
            </Flex>
            <Flex
              width="100%"
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_CENTER}
            >
              {!isFromRobotSettings ? (
                <StyledText
                  color={COLORS.black}
                  fontSize="1.375rem"
                  lineHeight="1.875rem"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  // marginBottom="0.75rem"
                  marginBottom={SPACING.spacingXXL}
                >
                  {t('name_your_robot_description')}
                </StyledText>
              ) : null}
              <Flex
                flexDirection={DIRECTION_ROW}
                alignItems={ALIGN_CENTER}
                marginBottom={SPACING.spacing3}
                justifyContent={JUSTIFY_CENTER}
                width="100%"
              >
                <InputField
                  data-testid="name-robot_input"
                  id="newRobotName"
                  name="newRobotName"
                  type="text"
                  onChange={formik.handleChange}
                  value={name}
                  error={formik.errors.newRobotName && ''}
                  css={INPUT_FIELD_ODD_STYLE}
                />
              </Flex>
              <StyledText
                color={COLORS.darkGreyEnabled}
                fontSize="1.5rem"
                lineHeight="2.0625rem"
                fontWeight="500"
              >
                {t('name_rule_description')}
              </StyledText>
              {formik.errors.newRobotName && (
                <StyledText
                  fontSize="1.375rem"
                  lineHeight="1.875rem"
                  fontWeight="500"
                  color={COLORS.errorText}
                >
                  {formik.errors.newRobotName}
                </StyledText>
              )}
            </Flex>

            <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
              <CustomKeyboard
                onChange={e => e != null && setName(e)}
                keyboardRef={keyboardRef}
              />
            </Flex>
          </Flex>
        </>
      )}
    </>
  )
}
