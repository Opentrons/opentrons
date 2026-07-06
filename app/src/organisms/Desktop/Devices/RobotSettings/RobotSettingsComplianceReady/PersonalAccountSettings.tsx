import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from 'react-query'

import {
  Divider,
  Icon,
  InputField,
  PrimaryButton,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import {
  getOAuth2Token,
  OAUTH2_CLIENT_ID,
} from '@opentrons/api-client'
import {
  getSelfQueryKey,
  useHost,
  useSelfQuery,
  useUpdateSelfMutation,
} from '@opentrons/react-api-client'

import { getAuthStateForRobot, logIn } from '/app/redux/robot-auth'

import styles from './personalaccountsettings.module.css'

import type { UpdateSelfRequest } from '@opentrons/api-client'
import type { ChangeEvent, FocusEvent, JSX, ReactNode } from 'react'
import type { State } from '/app/redux/types'

export interface PersonalAccountSettingsProps {
  robotName: string
}

interface FieldRowProps {
  label: string
  children: ReactNode
}

function FieldRow({ label, children }: FieldRowProps): JSX.Element {
  return (
    <div className={styles.field_row}>
      <div className={styles.field_label}>
        <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      </div>
      <div className={styles.field_value}>{children}</div>
    </div>
  )
}

interface FieldGroupProps {
  label: string
  children: ReactNode
}

function FieldGroup({ label, children }: FieldGroupProps): JSX.Element {
  return (
    <div className={styles.field_group}>
      <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      <div className={styles.field_group_value}>{children}</div>
    </div>
  )
}

interface PasswordInputFieldProps {
  value: string
  error?: string | null
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void
}

function PasswordInputField({
  value,
  error,
  onChange,
  onBlur,
}: PasswordInputFieldProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <InputField
      type={showPassword ? 'text' : 'password'}
      value={value}
      error={error}
      onChange={onChange}
      onBlur={onBlur}
      rightElement={
        <button
          type="button"
          className={styles.password_visibility_button}
          aria-label={showPassword ? t('hide') : t('show')}
          onClick={() => {
            setShowPassword(current => !current)
          }}
        >
          <Icon name={showPassword ? 'eye-slash' : 'eye'} size="1.25rem" />
        </button>
      }
    />
  )
}

export function PersonalAccountSettings({
  robotName,
}: PersonalAccountSettingsProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const host = useHost()
  const authState = useSelector((state: State) =>
    getAuthStateForRobot(state, robotName)
  )
  const selfQuery = useSelfQuery({ enabled: authState != null })
  const { updateSelf, isLoading: isSaving } = useUpdateSelfMutation()
  const username = authState?.username ?? ''
  const fullName = selfQuery.data?.data.fullName ?? ''

  const [isEditing, setIsEditing] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [fullNameInput, setFullNameInput] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const resetEditForm = (): void => {
    setUsernameInput(username)
    setFullNameInput(fullName)
    setPassword('')
    setConfirmPassword('')
    setConfirmPasswordError(null)
    setSaveError(null)
  }

  const handleStartEditing = (): void => {
    resetEditForm()
    setIsEditing(true)
  }

  const handleCancelEditing = (): void => {
    resetEditForm()
    setIsEditing(false)
  }

  const hasProfileChanges =
    usernameInput.trim() !== username || fullNameInput.trim() !== fullName
  const hasPasswordChange = password !== '' || confirmPassword !== ''

  const validatePasswords = (): boolean => {
    if (!hasPasswordChange) {
      setConfirmPasswordError(null)
      return true
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('desktop_password_mismatch'))
      return false
    }
    setConfirmPasswordError(null)
    return true
  }

  const handleSave = (): void => {
    if (!validatePasswords()) {
      return
    }

    if (!hasProfileChanges && !hasPasswordChange) {
      setIsEditing(false)
      return
    }

    const updateData: UpdateSelfRequest['data'] = {}
    const trimmedUsername = usernameInput.trim()
    const trimmedFullName = fullNameInput.trim()

    if (trimmedUsername !== username) {
      updateData.username = trimmedUsername
    }
    if (trimmedFullName !== fullName) {
      updateData.fullName = trimmedFullName
    }
    if (password !== '') {
      updateData.password = password
    }

    void updateSelf({ data: updateData })
      .then(async () => {
        void queryClient.invalidateQueries(getSelfQueryKey(host))

        if (password !== '' && host != null) {
          const tokenResponse = await getOAuth2Token(host, {
            grant_type: 'password',
            username: trimmedUsername,
            password,
            client_id: OAUTH2_CLIENT_ID,
          })
          dispatch(
            logIn({
              robotName,
              username: trimmedUsername,
              accessToken: tokenResponse.data.access_token,
              refreshToken: tokenResponse.data.refresh_token ?? null,
              expiresAt:
                tokenResponse.data.expires_in == null
                  ? null
                  : Date.now() + tokenResponse.data.expires_in * 1000,
            })
          )
        } else if (
          trimmedUsername !== username &&
          authState?.accessToken != null
        ) {
          dispatch(
            logIn({
              robotName,
              username: trimmedUsername,
              accessToken: authState.accessToken,
              refreshToken: authState.refreshToken,
              expiresAt: authState.expiresAt,
            })
          )
        }

        setPassword('')
        setConfirmPassword('')
        setIsEditing(false)
      })
      .catch(() => {
        setSaveError(t('desktop_personal_account_settings_save_error'))
      })
  }

  const isSaveDisabled =
    isSaving ||
    (!hasProfileChanges && !hasPasswordChange) ||
    (hasPasswordChange && (password === '' || confirmPassword === ''))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('desktop_personal_account_settings')}
        </StyledText>
        {isEditing ? (
          <button
            type="button"
            className={styles.edit_button}
            onClick={handleCancelEditing}
          >
            <StyledText desktopStyle="bodyDefaultRegLink">
              {t('shared:cancel')}
            </StyledText>
          </button>
        ) : (
          <button
            type="button"
            className={styles.edit_button}
            onClick={handleStartEditing}
          >
            <StyledText desktopStyle="bodyDefaultRegLink">
              {t('desktop_edit')}
            </StyledText>
          </button>
        )}
      </div>
      <div className={styles.content}>
        {isEditing ? (
          <>
            <div className={styles.fields_row}>
              <FieldGroup label={t('desktop_username')}>
                <InputField
                  value={usernameInput}
                  onChange={event => {
                    setUsernameInput(event.target.value)
                    setSaveError(null)
                  }}
                />
              </FieldGroup>
              <FieldGroup label={t('desktop_legal_name')}>
                <InputField
                  value={fullNameInput}
                  onChange={event => {
                    setFullNameInput(event.target.value)
                    setSaveError(null)
                  }}
                />
              </FieldGroup>
            </div>
            <div className={styles.fields_row}>
              <FieldGroup label={t('desktop_password')}>
                <PasswordInputField
                  value={password}
                  onChange={event => {
                    setPassword(event.target.value)
                    setSaveError(null)
                    if (confirmPasswordError != null) {
                      setConfirmPasswordError(null)
                    }
                  }}
                  onBlur={validatePasswords}
                />
              </FieldGroup>
              <FieldGroup label={t('desktop_confirm_password')}>
                <PasswordInputField
                  value={confirmPassword}
                  error={confirmPasswordError ?? saveError}
                  onChange={event => {
                    setConfirmPassword(event.target.value)
                    setSaveError(null)
                    if (confirmPasswordError != null) {
                      setConfirmPasswordError(null)
                    }
                  }}
                  onBlur={validatePasswords}
                />
              </FieldGroup>
            </div>
            <div className={styles.actions}>
              <SecondaryButton onClick={handleCancelEditing}>
                {t('shared:cancel')}
              </SecondaryButton>
              <PrimaryButton disabled={isSaveDisabled} onClick={handleSave}>
                {t('shared:save')}
              </PrimaryButton>
            </div>
          </>
        ) : (
          <>
            <FieldRow label={t('desktop_username')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                {username}
              </StyledText>
            </FieldRow>
            <Divider />
            <FieldRow label={t('desktop_legal_name')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                {fullName}
              </StyledText>
            </FieldRow>
            <Divider />
            <FieldRow label={t('desktop_password')}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.field_value_text}
              >
                ••••••••
              </StyledText>
            </FieldRow>
          </>
        )}
      </div>
    </div>
  )
}
