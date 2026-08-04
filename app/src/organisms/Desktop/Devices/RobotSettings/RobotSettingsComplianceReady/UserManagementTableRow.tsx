import { useTranslation } from 'react-i18next'

import {
  OverflowBtn,
  StyledText,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import { MenuOverlay } from '/app/molecules/InstrumentCard/MenuOverlay'

import styles from './usermanagement.module.css'

import type { JSX, MouseEventHandler } from 'react'
import type { AuthUser } from '@opentrons/api-client'

export interface UserManagementTableRowProps {
  user: AuthUser
  onEdit: (user: AuthUser) => void
  onDelete: (user: AuthUser) => void
}

export function UserManagementTableRow({
  user,
  onEdit,
  onDelete,
}: UserManagementTableRowProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const closeMenu = (): void => {
    setShowOverflowMenu(false)
  }

  const handleMenuAction =
    (action: (selectedUser: AuthUser) => void): MouseEventHandler =>
    event => {
      event.preventDefault()
      event.stopPropagation()
      action(user)
      closeMenu()
    }

  const handlePlaceholderAction: MouseEventHandler = event => {
    event.preventDefault()
    event.stopPropagation()
    closeMenu()
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
            <div className={styles.overflow_menu_container}>
              <MenuOverlay
                hasDivider={false}
                menuOverlayItems={[
                  {
                    label: t('desktop_edit_user'),
                    onClick: handleMenuAction(onEdit),
                  },
                  {
                    label: t('desktop_delete_user'),
                    onClick: handleMenuAction(onDelete),
                  },
                  {
                    label: t('desktop_activate_user'),
                    onClick: handlePlaceholderAction,
                    disabled: true,
                  },
                  {
                    label: t('desktop_reset_password'),
                    onClick: handlePlaceholderAction,
                    disabled: true,
                  },
                ]}
                setShowMenuOverlay={setShowOverflowMenu}
              />
              {menuOverlay}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  )
}
