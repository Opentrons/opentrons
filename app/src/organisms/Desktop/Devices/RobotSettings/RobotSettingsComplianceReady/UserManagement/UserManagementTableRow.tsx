import { useTranslation } from 'react-i18next'

import {
  MenuItem,
  OverflowBtn,
  StyledText,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import styles from './usermanagement.module.css'

import type { JSX, MouseEventHandler } from 'react'
import type { AuthUser } from '@opentrons/api-client'

export interface UserManagementTableRowProps {
  user: AuthUser
  onEdit: (user: AuthUser) => void
  onDelete: (user: AuthUser) => void
  onActivate: (user: AuthUser) => void
  onResetPassword: (user: AuthUser) => void
  onDeactivate: (user: AuthUser) => void
}

export function UserManagementTableRow({
  user,
  onEdit,
  onDelete,
  onActivate,
  onResetPassword,
  onDeactivate,
}: UserManagementTableRowProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const handleMenuAction =
    (action: (selectedUser: AuthUser) => void): MouseEventHandler =>
    () => {
      setShowOverflowMenu(false)
      action(user)
    }

  return (
    <tr>
      <td className={styles.body_cell}>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.body_cell_text}
        >
          {user.username}
        </StyledText>
      </td>
      <td className={styles.body_cell}>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.body_cell_text}
        >
          {user.fullName}
        </StyledText>
      </td>
      <td className={styles.body_cell}>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.body_cell_text}
        >
          {t(`desktop_user_role_${user.accountType}`)}
        </StyledText>
      </td>
      <td className={styles.body_cell}>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.body_cell_text}
        >
          {user.locked
            ? t('desktop_user_status_locked')
            : t('desktop_user_status_active')}
        </StyledText>
      </td>
      <td className={styles.overflow_cell}>
        <div className={styles.overflow_cell_inner}>
          <OverflowBtn
            onClick={handleOverflowClick}
            aria-label={`UserManagement_overflowMenu_${user.username}`}
          />
          {showOverflowMenu ? (
            <>
              <div className={styles.overflow_menu}>
                <MenuItem onClick={handleMenuAction(onEdit)}>
                  {t('desktop_edit_user')}
                </MenuItem>
                <MenuItem onClick={handleMenuAction(onDelete)}>
                  {t('desktop_delete_user')}
                </MenuItem>
                {user.locked ? (
                  <MenuItem onClick={handleMenuAction(onActivate)}>
                    {t('desktop_unlock_user')}
                  </MenuItem>
                ) : null}
                {!user.locked ? (
                  <MenuItem onClick={handleMenuAction(onResetPassword)}>
                    {t('desktop_reset_password')}
                  </MenuItem>
                ) : null}
                {!user.locked ? (
                  <MenuItem onClick={handleMenuAction(onDeactivate)}>
                    {t('desktop_lock_user')}
                  </MenuItem>
                ) : null}
              </div>
              {menuOverlay}
            </>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
