import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  COLORS,
  ListItem,
  ListItemDescriptor,
  StyledText,
} from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useLogOut } from '/app/resources/access-control/useLogOut'

import styles from './account.module.css'
import { useAccountInfo } from './hooks'

export function Account(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isLoggedIn, username, fullName } = useAccountInfo()
  const logOut = useLogOut()

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(-1)
    }
  }, [isLoggedIn, navigate])

  return (
    <div className={styles.page}>
      <ChildNavigation
        header={t('top_navigation:account')}
        onClickBack={() => {
          navigate(-1)
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
                {fullName}
              </StyledText>
            }
          />
        </ListItem>
      </div>
      <p className={styles.footer}>
        <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
          {t('branded:account_page_footer')}
        </StyledText>
      </p>
    </div>
  )
}
