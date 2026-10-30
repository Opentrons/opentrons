import { useLocation, useNavigate } from 'react-router-dom'

import {
  BORDERS,
  Btn,
  COLORS,
  CURSOR_POINTER,
  Flex,
  Icon,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import styles from './settingsicon.module.css'

import type { ReactNode } from 'react'

const BUTTON_NAME = 'Settings Icon Button'

export const SettingsIcon = (): ReactNode => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNavigate = (): void => {
    if (location.pathname === '/settings') {
      navigate(-1)
    } else if (location.pathname !== '/settings') {
      navigate('/settings')
    } else {
      navigate('/')
    }
  }

  return (
    <Flex
      borderRadius={BORDERS.borderRadiusFull}
      backgroundColor={
        location.pathname === '/settings' ? COLORS.grey35 : COLORS.transparent
      }
      cursor={CURSOR_POINTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <Btn
        onClick={handleNavigate}
        className={styles.gear_icon_button}
        aria-label={BUTTON_NAME}
      >
        <Icon size="1rem" name="gear" />
      </Btn>
    </Flex>
  )
}
