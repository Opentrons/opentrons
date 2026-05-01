import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'

import {
  COLORS,
  ListItem,
  ListItemDescriptor,
  StyledText,
} from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { getLocalRobot } from '/app/redux/discovery'
import {
  getIsLoggedInToLocalRobot,
  getLocalRobotAuthState,
  logOutOrTimeOut,
} from '/app/redux/robot-auth'

import styles from './account.module.css'

import type { Dispatch, State } from '/app/redux/types'

export function Account(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const isLoggedIn = useSelector((state: State) =>
    getIsLoggedInToLocalRobot(state)
  )
  const auth = useSelector(getLocalRobotAuthState)
  const username = auth?.username ?? ''

  if (!isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  const handleLogout = (): void => {
    if (localRobot?.name != null) {
      dispatch(logOutOrTimeOut({ robotName: localRobot.name }))
    }
    navigate('/dashboard')
  }

  return (
    <div className={styles.page}>
      <ChildNavigation
        header={t('top_navigation:account')}
        onClickBack={() => {
          navigate('/robot-settings')
        }}
        buttonText={t('access_control:log_out')}
        onClickButton={handleLogout}
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
                {username}
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
