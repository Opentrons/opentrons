import { useTranslation } from 'react-i18next'

import {
  COLORS,
  ListItem,
  ListItemDescriptor,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import styles from './peripherals.module.css'

import type { ReactNode } from 'react'
import type { RobotType } from '@opentrons/shared-data'

interface PeripheralsInfoProps {
  robotType: RobotType
}

export function PeripheralsInfo({
  robotType,
}: PeripheralsInfoProps): ReactNode {
  const { t } = useTranslation('protocol_overview')
  const isFlex = robotType === FLEX_ROBOT_TYPE

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StyledText desktopStyle="headingSmallBold">
          {t('peripherals')}
        </StyledText>
      </div>
      <div className={styles.list_container}>
        <ListItem type="default" key="InputDeviceInfo_camera">
          <ListItemDescriptor
            type="large"
            description={
              <div className={styles.description}>
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('on_deck')}
                </StyledText>
              </div>
            }
            content={
              <StyledText desktopStyle="bodyDefaultRegular">
                {isFlex ? t('flex_camera') : t('ot2_camera')}
              </StyledText>
            }
          />
        </ListItem>
      </div>
    </div>
  )
}
