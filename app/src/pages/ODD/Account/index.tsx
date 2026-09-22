import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { COLORS, ListButton, StyledText } from '@opentrons/components'

import { MediumButton, SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { EditLegalName } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/EditLegalName'
import { EditPassword } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/EditPassword'
import { EditRole } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/EditRole'
import { EditUsername } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/EditUsername'
import { useToaster } from '/app/organisms/ToasterOven'
import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'

import styles from './account.module.css'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { AuthUserAccountType } from '@opentrons/api-client'
import type { State } from '/app/redux/types'
import type { PasswordComplexityRequirements } from '/app/resources/auth'

export function Account({
  onBack,
  usernames,
  passwordComplexity,
  username,
  fullName,
  locked,
  onSaveNewPassword,
  onSaveNewLegalName,
  onSaveNewUsername,
  adminView,
  accountType,
  onSaveNewRole,
  onLockAccount,
  onDeleteAccount,
  onResetPassword,
  onUnlockAccount,
  isLoading,
}: {
  onBack?: () => void
  usernames: string[]
  passwordComplexity: PasswordComplexityRequirements | null
  username: string
  fullName: string
  locked?: boolean
  accountType?: AuthUserAccountType
  onSaveNewPassword?: (password: string) => Promise<void>
  onSaveNewLegalName: (legalName: string) => Promise<void>
  onSaveNewUsername: (username: string) => Promise<void>
  onSaveNewRole?: (role: AuthUserAccountType) => Promise<void>
  onLockAccount?: () => Promise<void>
  onDeleteAccount?: () => Promise<void>
  onResetPassword?: () => Promise<string | undefined>
  onUnlockAccount?: () => Promise<string | undefined>
  isLoading?: boolean
  adminView?: boolean
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )

  const [editInfo, setEditInfo] = useState<
    | 'password'
    | 'legalName'
    | 'username'
    | 'role'
    | 'reset'
    | 'lock'
    | 'unlock'
    | 'delete'
    | null
  >(null)

  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null)
  const { makeToast } = useToaster()

  const confirmModal = useMemo(() => {
    switch (editInfo) {
      case 'reset':
        return (
          <ConfirmModal
            title={t('odd_reset_password_title')}
            description={t('odd_reset_password_description')}
            confirmButtonText={t('odd_reset_password_button')}
            onCancel={() => {
              setEditInfo(null)
            }}
            onConfirm={() => {
              void onResetPassword?.().then(password => {
                if (password == null) {
                  makeToast('' + t('odd_reset_password_error'), 'error')
                  return
                }
                setOneTimePassword(password)
                makeToast('' + t('odd_reset_password_success'), 'success', {
                  duration: 5000,
                })
                setEditInfo(null)
              })
            }}
            t={t}
            isLoading={isLoading}
          />
        )
      case 'delete':
        return (
          <ConfirmModal
            title={t('odd_delete_account_title')}
            description={t('odd_delete_account_description')}
            confirmButtonText={t('odd_delete_account_button')}
            onCancel={() => {
              setEditInfo(null)
            }}
            onConfirm={() => {
              void onDeleteAccount?.().then(() => {
                onBack?.()
                makeToast('' + t('odd_delete_account_success'), 'success', {
                  duration: 5000,
                })
              })
            }}
            t={t}
            isLoading={isLoading}
          />
        )
      case 'lock':
        return (
          <ConfirmModal
            title={t('odd_lock_account_title')}
            description={t('odd_lock_account_description')}
            confirmButtonText={t('odd_lock_account_button')}
            onCancel={() => {
              setEditInfo(null)
            }}
            onConfirm={() => {
              void onLockAccount?.().then(() => {
                setEditInfo(null)
                makeToast('' + t('odd_lock_account_success'), 'success', {
                  duration: 5000,
                })
              })
            }}
            t={t}
            isLoading={isLoading}
          />
        )
      case 'unlock':
        return (
          <ConfirmModal
            title={t('odd_unlock_account_title')}
            description={t('odd_unlock_account_description')}
            confirmButtonText={t('odd_unlock_account_button')}
            onCancel={() => {
              setEditInfo(null)
            }}
            onConfirm={() => {
              void onUnlockAccount?.().then(password => {
                if (password == null) {
                  makeToast('' + t('odd_reset_password_error'), 'error')
                  return
                }
                setOneTimePassword(password)
                makeToast('' + t('odd_unlock_account_success'), 'success', {
                  duration: 5000,
                })
                setEditInfo(null)
              })
            }}
            t={t}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }, [
    editInfo,
    onDeleteAccount,
    onLockAccount,
    onResetPassword,
    onBack,
    onUnlockAccount,
    makeToast,
    isLoading,
    t,
  ])

  switch (editInfo) {
    case 'password':
      if (!onSaveNewPassword) {
        return null
      }
      return (
        <EditPassword
          onCancel={() => {
            setEditInfo(null)
          }}
          onSave={(password: string) => {
            void onSaveNewPassword(password).then(() => {
              setEditInfo(null)
            })
          }}
          passwordComplexity={passwordComplexity}
          isLoading={isLoading}
        />
      )

    case 'legalName':
      return (
        <EditLegalName
          onCancel={() => {
            setEditInfo(null)
          }}
          onSave={(legalName: string) => {
            void onSaveNewLegalName(legalName).then(() => {
              setEditInfo(null)
            })
          }}
          isLoading={isLoading}
        />
      )

    case 'username':
      return (
        <EditUsername
          onCancel={() => {
            setEditInfo(null)
          }}
          onSave={(newUsername: string) => {
            void onSaveNewUsername(newUsername).then(() => {
              setEditInfo(null)
            })
          }}
          takenUsernames={usernames}
          isLoading={isLoading}
        />
      )
    case 'role':
      if (!onSaveNewRole || accountType === 'auditor') {
        return null
      }
      return (
        <EditRole
          onCancel={() => {
            setEditInfo(null)
          }}
          savedRole={accountType}
          onSubmit={(role: AuthUserAccountType) => {
            if (role === accountType) {
              setEditInfo(null)
              return
            }
            void onSaveNewRole(role).then(() => {
              setEditInfo(null)
            })
          }}
          isLoading={isLoading}
        />
      )
    default:
      return (
        <>
          {confirmModal}
          {oneTimePassword != null && (
            <OneTimePasswordModal
              onConfirm={() => {
                setOneTimePassword(null)
              }}
              password={oneTimePassword}
              t={t}
            />
          )}
          <div className={styles.page}>
            <ChildNavigation
              header={
                !adminView ? t('account_title') : t('odd_account_details_title')
              }
              onClickBack={
                onBack ??
                (() => {
                  navigate(-1)
                })
              }
              buttonText={
                !adminView
                  ? t('log_out')
                  : locked
                    ? t('odd_unlock_account_button')
                    : t('odd_reset_password_button')
              }
              onClickButton={
                !adminView
                  ? () => {
                      if (localRobotName == null) {
                        console.warn(
                          "Couldn't identify the robot to log out of."
                        )
                      } else {
                        dispatch(logOut({ robotName: localRobotName }))
                      }
                    }
                  : locked
                    ? () => {
                        setEditInfo('unlock')
                      }
                    : () => {
                        setEditInfo('reset')
                      }
              }
              buttonType={!adminView ? 'tertiaryHighLight' : 'primary'}
              buttonCategory={adminView ? 'rounded' : undefined}
            />
            <div className={styles.rows}>
              <AccountRow
                label={t('account_username')}
                value={username ?? ''}
                onClickEdit={() => {
                  setEditInfo('username')
                }}
                t={t}
              />
              <AccountRow
                label={t('account_legal_name')}
                value={fullName ?? ''}
                onClickEdit={() => {
                  setEditInfo('legalName')
                }}
                t={t}
              />
              {!adminView ? (
                <AccountRow
                  label={t('account_password')}
                  value={t('account_password_placeholder')}
                  onClickEdit={() => {
                    setEditInfo('password')
                  }}
                  t={t}
                />
              ) : (
                <AccountRow
                  label={t('account_role')}
                  value={`${t(`odd_${accountType}_role`)}`}
                  onClickEdit={() => {
                    setEditInfo('role')
                  }}
                  t={t}
                />
              )}
            </div>
            {adminView && (
              <div className={styles.admin_view_buttons}>
                {!locked && (
                  <MediumButton
                    onClick={() => {
                      setEditInfo('lock')
                    }}
                    buttonText={t('odd_lock_account_button')}
                    buttonType="alertSecondary"
                    width="100%"
                  />
                )}
                <MediumButton
                  onClick={() => {
                    setEditInfo('delete')
                  }}
                  buttonText={t('odd_delete_account_button')}
                  buttonType="alert"
                  width="100%"
                />
              </div>
            )}
          </div>
        </>
      )
  }
}

function AccountRow({
  label,
  value,
  onClickEdit,
  t,
}: {
  label: string
  value: string
  onClickEdit: () => void
  t: TFunction
}): ReactNode {
  return (
    <ListButton type="noActive" className={styles.list_button}>
      <div className={styles.button_content}>
        <StyledText oddStyle="level4HeaderSemiBold">{label}</StyledText>
        <div className={styles.right_container}>
          <div className={styles.value_container}>
            <StyledText
              oddStyle="level4HeaderRegular"
              width="100%"
              color={COLORS.grey60}
            >
              {value}
            </StyledText>
          </div>
          <SmallButton
            onClick={onClickEdit}
            buttonText={'' + t('account_edit')}
            buttonType="secondary"
            buttonCategory="rounded"
          />
        </div>
      </div>
    </ListButton>
  )
}

const ConfirmModal = ({
  title,
  description,
  confirmButtonText,
  onCancel,
  onConfirm,
  t,
  isLoading,
}: {
  title: string
  description: string
  confirmButtonText: string
  onCancel: () => void
  onConfirm: () => void
  t: TFunction
  isLoading?: boolean
}): ReactNode => {
  return (
    <OddModal
      header={{
        title,
        iconName: 'information',
        iconColor: COLORS.yellow50,
      }}
      onOutsideClick={onCancel}
    >
      <div className={styles.modal_content}>
        <StyledText oddStyle="bodyTextRegular">{description}</StyledText>
        <div className={styles.modal_buttons}>
          <SmallButton
            onClick={onCancel}
            buttonText={t('odd_cancel_button')}
            buttonType="secondary"
            width="100%"
          />
          <SmallButton
            onClick={onConfirm}
            buttonText={confirmButtonText}
            buttonType="alert"
            width="100%"
            iconName={isLoading ? 'ot-spinner' : undefined}
            disabled={isLoading}
          />
        </div>
      </div>
    </OddModal>
  )
}

function OneTimePasswordModal({
  onConfirm,
  password,
  t,
}: {
  onConfirm: () => void
  password: string
  t: TFunction
}): ReactNode {
  return (
    <OddModal
      header={{
        title: t('odd_one_time_password_title'),
      }}
      onOutsideClick={onConfirm}
      modalSize="smallMedium"
    >
      <div className={styles.modal_content}>
        <StyledText oddStyle="bodyTextRegular">
          {t('odd_one_time_password_description')}
        </StyledText>
        <div className={styles.one_time_password_container}>
          <StyledText
            oddStyle="bodyTextRegular"
            className={styles.one_time_password_text}
          >
            {password}
          </StyledText>
        </div>
        <SmallButton
          onClick={onConfirm}
          buttonText={t('confirm')}
          buttonType="primary"
          width="100%"
        />
      </div>
    </OddModal>
  )
}
