import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import {
  COLORS,
  ListItem,
  ListItemDescriptor,
  StyledText,
} from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './account.module.css'
import { useAccountInfo, useLogOut } from './hooks'

export function Account(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isLoggedIn, username, legalName } = useAccountInfo()
  const logOut = useLogOut()

  if (!isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className={styles.page}>
      <ChildNavigation
        header={t('top_navigation:account')}
        onClickBack={() => {
          navigate('/robot-settings')
        }}
        buttonText={t('access_control:log_out')}
        onClickButton={logOut}
        buttonType="tertiaryHighLight"
      />
      <div className={styles.rows}>
        <ListItem type="default">
          <ListItemDescriptor
            type="default"
            description={
              <StyledText oddStyle="bodyTextSemiBold" color={COLORS.black90}>
                {t('access_control:username')}
              </StyledText>
            }
            content={
              <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
                {username}
              </StyledText>
            }
          />
        </ListItem>
        <ListItem type="default">
          <ListItemDescriptor
            type="default"
            description={
              <StyledText oddStyle="bodyTextSemiBold" color={COLORS.black90}>
                {t('access_control:legal_name')}
              </StyledText>
            }
            content={
              <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
                {legalName}
              </StyledText>
            }
          />
        </ListItem>
      </div>
      <p className={styles.footer}>
        <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
          {t('access_control:account_page_footer')}
        </StyledText>
      </p>
    </div>
  )
}
