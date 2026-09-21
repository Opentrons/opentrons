import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { COLORS, ListButton, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { EditLegalName } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/EditLegalName'
import { EditPassword } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/EditPassword'
import { EditUsername } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/EditUsername'
import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'

import styles from './account.module.css'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { State } from '/app/redux/types'
import type { PasswordComplexityRequirements } from '/app/resources/auth'

export function Account({
  onBack,
  usernames,
  passwordComplexity,
  username,
  fullName,
  onSaveNewPassword,
  onSaveNewLegalName,
  onSaveNewUsername,
}: {
  onBack?: () => void
  usernames: string[]
  passwordComplexity: PasswordComplexityRequirements | null
  username: string
  fullName: string
  onSaveNewPassword: (password: string) => Promise<void>
  onSaveNewLegalName: (legalName: string) => Promise<void>
  onSaveNewUsername: (username: string) => Promise<void>
}): ReactNode {
  const { t } = useTranslation('device_settings')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )

  const [editInfo, setEditInfo] = useState<
    'password' | 'legalName' | 'username' | null
  >(null)

  if (editInfo === 'password') {
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
      />
    )
  }
  if (editInfo === 'legalName') {
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
      />
    )
  }
  if (editInfo === 'username') {
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
      />
    )
  }

  return (
    <div className={styles.page}>
      <ChildNavigation
        header={t('account_title')}
        onClickBack={
          onBack ??
          (() => {
            navigate(-1)
          })
        }
        buttonText={t('log_out')}
        onClickButton={() => {
          if (localRobotName == null) {
            console.warn("Couldn't identify the robot to log out of.")
          } else {
            dispatch(logOut({ robotName: localRobotName }))
          }
        }}
        buttonType="tertiaryHighLight"
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
        <AccountRow
          label={t('account_password')}
          value={t('account_password_placeholder')}
          onClickEdit={() => {
            setEditInfo('password')
          }}
          t={t}
        />
      </div>
    </div>
  )
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
