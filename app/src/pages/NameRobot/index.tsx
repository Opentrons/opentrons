import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useFormik } from 'formik'
import { css } from 'styled-components'
import { useHistory } from 'react-router-dom'

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
import { SmallButton } from '../../atoms/buttons'
import { StepMeter } from '../../atoms/StepMeter'
import { useIsUnboxingFlowOngoing } from '../../organisms/RobotSettingsDashboard/NetworkSettings/hooks'
import { ConfirmRobotName } from '../../organisms/OnDeviceDisplay/NameRobot/ConfirmRobotName'

import type { UpdatedRobotName } from '@opentrons/api-client'
import type { State, Dispatch } from '../../redux/types'

const INPUT_FIELD_ODD_STYLE = css`
  padding-top: ${SPACING.spacing32};
  padding-bottom: ${SPACING.spacing32};
  font-size: 2.5rem;
  line-height: 3.25rem;
  text-align: center;
`

interface FormikErrors {
  newRobotName?: string
}

export function NameRobot(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  const trackEvent = useTrackEvent()
  const localRobot = useSelector(getLocalRobot)
  const ipAddress = localRobot?.ip
  const previousName = localRobot?.name != null ? localRobot.name : null
  const [name, setName] = React.useState<string>('')
  const [newName, setNewName] = React.useState<string>('')
  const [
    isShowConfirmRobotName,
    setIsShowConfirmRobotName,
  ] = React.useState<boolean>(false)
  const keyboardRef = React.useRef(null)
  const dispatch = useDispatch<Dispatch>()
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()

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
          robot => newName === robot.name && robot.ip !== ipAddress
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
        if (!isUnboxingFlowOngoing) {
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
      {isShowConfirmRobotName && isUnboxingFlowOngoing ? (
        <ConfirmRobotName robotName={newName} />
      ) : (
        <>
          {isUnboxingFlowOngoing ? (
            <StepMeter totalSteps={6} currentStep={5} />
          ) : null}
          <Flex
            flexDirection={DIRECTION_COLUMN}
            paddingY={SPACING.spacing32}
            paddingX={SPACING.spacing40}
          >
            <Flex
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
              justifyContent={
                isUnboxingFlowOngoing ? JUSTIFY_CENTER : JUSTIFY_SPACE_BETWEEN
              }
              position={POSITION_RELATIVE}
            >
              <Flex position={POSITION_ABSOLUTE} left="0">
                <Btn
                  data-testid="name_back_button"
                  onClick={() => {
                    if (isUnboxingFlowOngoing) {
                      history.push('/emergency-stop')
                    } else {
                      history.push('/robot-settings')
                    }
                  }}
                >
                  <Icon name="back" size="3rem" color={COLORS.black90} />
                </Btn>
              </Flex>
              <Flex marginLeft={isUnboxingFlowOngoing ? '0' : '4rem'}>
                <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
                  {isUnboxingFlowOngoing
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
                    marginRight={SPACING.spacing8}
                  />
                ) : (
                  <SmallButton
                    buttonText={t('shared:confirm')}
                    buttonCategory="rounded"
                    onClick={handleConfirm}
                  />
                )}
              </Flex>
            </Flex>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_CENTER}
            paddingX={SPACING.spacing40}
            height="15.125rem"
            paddingTop={isUnboxingFlowOngoing ? undefined : SPACING.spacing80}
          >
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginBottom={SPACING.spacing8}
              paddingX={SPACING.spacing60}
              width="100%"
            >
              {isUnboxingFlowOngoing ? (
                <StyledText
                  as="h4"
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.grey60}
                  marginBottom={SPACING.spacing24}
                >
                  {t('name_your_robot_description')}
                </StyledText>
              ) : null}
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
              as="p"
              color={COLORS.grey60}
              fontWeight={TYPOGRAPHY.fontWeightRegular}
            >
              {t('name_rule_description')}
            </StyledText>
            {formik.errors.newRobotName && (
              <StyledText
                as="p"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
                color={COLORS.red50}
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
        </>
      )}
    </>
  )
}
