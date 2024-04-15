import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useRobotSettingsQuery } from '@opentrons/react-api-client'

import { ToggleButton } from '../../../../../atoms/buttons'
import { InputField } from '../../../../../atoms/InputField'
import { MultiSlideout } from '../../../../../atoms/Slideout/MultiSlideout'
import { restartRobot } from '../../../../../redux/robot-admin'
import { updateSetting } from '../../../../../redux/robot-settings'

import type { FieldError } from 'react-hook-form'
import type { Dispatch } from '../../../../../redux/types'

interface FactoryModeSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string
}

interface FormValues {
  passwordInput: string
}

export function FactoryModeSlideout({
  isExpanded,
  onCloseClick,
  robotName,
}: FactoryModeSlideoutProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared', 'branded'])

  const dispatch = useDispatch<Dispatch>()

  const { settings } = useRobotSettingsQuery().data ?? {}
  const oemModeSetting = (settings ?? []).find(
    (setting: RobotSettingsField) => setting?.id === 'enableOEMMode'
  )
  const isOEMMode = oemModeSetting?.value ?? null

  const [currentStep, setCurrentStep] = React.useState<number>(1)
  const [toggleValue, setToggleValue] = React.useState<boolean>(false)

  const validate = (
    data: FormValues,
    errors: Record<string, FieldError>
  ): Record<string, FieldError> => {
    const { passwordInput } = data
    let message: string | undefined

    if (passwordInput !== 'otie') {
      message = t('invalid_password')
    }

    const updatedErrors =
      message != null
        ? {
            ...errors,
            passwordInput: {
              type: 'error',
              message,
            },
          }
        : errors
    return updatedErrors
  }

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    trigger,
  } = useForm({
    defaultValues: {
      passwordInput: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })
  const passwordInput = watch('passwordInput')

  const onSubmit = (data: FormValues): void => {
    setCurrentStep(2)
  }

  const handleSubmitFactoryPassword = (): void => {
    // TODO: validation and errors: PLAT-281
    void handleSubmit(onSubmit)()
  }

  const handleToggleClick: React.MouseEventHandler<Element> = () => {
    setToggleValue(toggleValue => !toggleValue)
  }

  const handleCompleteClick: React.MouseEventHandler<Element> = () => {
    dispatch(updateSetting(robotName, 'enableOEMMode', toggleValue))
    dispatch(restartRobot(robotName))
    onCloseClick()
  }

  React.useEffect(() => {
    // initialize local state to OEM mode value
    if (isOEMMode != null) {
      setToggleValue(isOEMMode)
    }
  }, [isOEMMode])

  return (
    <MultiSlideout
      title={currentStep === 1 ? t('enter_password') : t('manage_oem_settings')}
      maxSteps={2}
      currentStep={currentStep}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <>
          {currentStep === 1 ? (
            <PrimaryButton onClick={handleSubmitFactoryPassword} width="100%">
              {t('shared:next')}
            </PrimaryButton>
          ) : null}
          {currentStep === 2 ? (
            <PrimaryButton onClick={handleCompleteClick} width="100%">
              {t('complete_and_restart_robot')}
            </PrimaryButton>
          ) : null}
        </>
      }
    >
      {currentStep === 1 ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Controller
            control={control}
            name="passwordInput"
            rules={{ validate }}
            render={({ field, fieldState }) => (
              <InputField
                id="passwordInput"
                name="passwordInput"
                type="text"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e)
                  trigger('passwordInput')
                }}
                value={field.value}
                error={fieldState.error?.message && ' '}
                onBlur={field.onBlur}
                title={t('enter_factory_password')}
              />
            )}
          />
          {errors.passwordInput != null ? (
            <StyledText
              as="label"
              color={COLORS.red50}
              marginTop={SPACING.spacing4}
            >
              {errors.passwordInput.message}
            </StyledText>
          ) : null}
        </Flex>
      ) : null}
      {currentStep === 2 ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            css={TYPOGRAPHY.pSemiBold}
            paddingBottom={SPACING.spacing4}
          >
            {t('oem_mode')}
          </StyledText>
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing6}>
            <ToggleButton
              label="oem_mode_toggle"
              toggledOn={toggleValue}
              onClick={handleToggleClick}
            />
            <StyledText as="p" marginBottom={SPACING.spacing4}>
              {toggleValue ? t('on') : t('off')}
            </StyledText>
          </Flex>
          <StyledText as="p">{t('branded:oem_mode_description')}</StyledText>
        </Flex>
      ) : null}
    </MultiSlideout>
  )
}
