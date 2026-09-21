import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import {
  isDocumentedMutationError,
  useUpdateSelfMutation,
  useUsersQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { ComplianceReadySettings } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/ComplianceReadySettings'
import { SettingsListButton } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/SettingsListButton'
import { UserManagement } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/UserManagement'
import { useToaster } from '/app/organisms/ToasterOven'
import { useLocalRobotName } from '/app/redux-resources/robots/hooks/useLocalRobotName'
import {
  updateLoggedInUserProfile,
  useIsAdminForRobot,
  useLogout,
} from '/app/redux/robot-auth'
import { usePasswordComplexity } from '/app/resources/auth/hooks/usePasswordComplexity'

import { Account } from '../Account'
import { useAccountInfo } from '../Account/hooks'
import styles from './adminhub.module.css'

import type { ReactNode } from 'react'
import type { UpdateSelfRequest } from '@opentrons/api-client'

type AdminHubPages =
  'user_management' | 'crs_settings' | 'personal_account_settings'

export function AdminHub(): ReactNode {
  const robotName = useLocalRobotName()
  const isAdmin = useIsAdminForRobot(robotName ?? '')
  const navigate = useNavigate()
  const [selectedPage, setSelectedPage] = useState<AdminHubPages | null>(null)

  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch()
  const { makeToast } = useToaster()
  const documentationState = useDocumentationState()
  const { updateSelf } = useUpdateSelfMutation(documentationState)

  const logout = useLogout()

  const { data: users } = useUsersQuery()
  const usersData = users?.data ?? []
  const usernames = useMemo(() => {
    return users?.data.map(user => user.username) ?? []
  }, [users])
  const { passwordComplexity } = usePasswordComplexity()
  const { isLoggedIn, username, fullName } = useAccountInfo()

  const saveSelfAccountChanges = (
    data: UpdateSelfRequest['data']
  ): Promise<void> => {
    return updateSelf({ data })
      .then(updatedSelf => {
        if (robotName != null) {
          dispatch(
            updateLoggedInUserProfile({
              robotName,
              username: updatedSelf.data.username,
              fullName: updatedSelf.data.fullName,
            })
          )
        }
      })
      .catch((error: unknown) => {
        if (!isDocumentedMutationError(error)) {
          makeToast('' + t('account_save_error'), 'error', {
            duration: 5000,
          })
          throw error
        }
      })
  }

  const onSaveNewPassword = (password: string): Promise<void> => {
    return saveSelfAccountChanges({ password })
  }

  const onSaveNewUsername = (newUsername: string): Promise<void> => {
    return saveSelfAccountChanges({ username: newUsername })
  }

  const onSaveNewLegalName = (legalName: string): Promise<void> => {
    return saveSelfAccountChanges({ fullName: legalName })
  }

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(-1)
    }
  }, [isLoggedIn, navigate])

  if (!isAdmin || selectedPage === 'personal_account_settings') {
    return (
      <Account
        onBack={
          isAdmin
            ? () => {
                setSelectedPage(null)
              }
            : () => {
                navigate(-1)
              }
        }
        usernames={usernames}
        passwordComplexity={passwordComplexity}
        username={username ?? ''}
        fullName={fullName ?? ''}
        onSaveNewPassword={onSaveNewPassword}
        onSaveNewUsername={onSaveNewUsername}
        onSaveNewLegalName={onSaveNewLegalName}
      />
    )
  }

  if (selectedPage === 'crs_settings') {
    return (
      <ComplianceReadySettings
        onBack={() => {
          setSelectedPage(null)
        }}
      />
    )
  }
  if (selectedPage === 'user_management') {
    return (
      <UserManagement
        onClickBack={() => {
          setSelectedPage(null)
        }}
        users={usersData}
      />
    )
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_admin_hub_title')}
        onClickBack={() => {
          navigate(-1)
        }}
        buttonText={'' + t('log_out')}
        onClickButton={logout}
        buttonType="tertiaryHighLight"
      />
      <div className={styles.content}>
        <SettingsListButton
          title={t('odd_personal_account_settings')}
          key="personal_account_settings"
          onClick={() => {
            setSelectedPage('personal_account_settings')
          }}
        />
        <SettingsListButton
          title={t('odd_user_management')}
          key="user_management"
          onClick={() => {
            setSelectedPage('user_management')
          }}
        />
        <SettingsListButton
          title={t('odd_compliance_ready_software_settings')}
          key="crs_settings"
          onClick={() => {
            setSelectedPage('crs_settings')
          }}
        />
      </div>
    </div>
  )
}
