import { useTranslation } from 'react-i18next'

import {
  Chip,
  ListItem,
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
    <ListItem type="default">
      <div className={styles.row}>
        <StyledText desktopStyle="bodyDefaultRegular" className={styles.cell}>
          {user.username}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular" className={styles.cell}>
          {user.fullName}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular" className={styles.cell}>
          {t(`desktop_user_role_${user.accountType}`)}
        </StyledText>
        <div className={styles.cell}>
          <Chip
            type={user.locked ? 'warning' : 'neutral'}
            background={user.locked}
            hasIcon={false}
            text={
              user.locked
                ? t('desktop_user_status_locked')
                : t('desktop_user_status_active')
            }
          />
        </div>
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
      </div>
    </ListItem>
  )
}
