import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { RobotInfoLabel, StyledText } from '@opentrons/components'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { getUsbDeviceDisplayRows } from '/app/redux/system-info/selectors'

import styles from './devices.module.css'

import type { ReactNode } from 'react'
import type { SetSettingOption } from '../types'

interface DevicesProps {
  robotName: string
  setCurrentOption: SetSettingOption
}

export function Devices({
  robotName,
  setCurrentOption,
}: DevicesProps): ReactNode {
  const { t } = useTranslation('device_settings')
  const deviceRows = useSelector(getUsbDeviceDisplayRows)

  return (
    <div className={styles.devices_container}>
      <ChildNavigation
        header={t('devices')}
        onClickBack={() => {
          setCurrentOption(null)
        }}
      />
      <div className={styles.devices_content_container}>
        {deviceRows.length > 0 ? (
          <>
            <div className={styles.devices_table_header_container}>
              <StyledText oddStyle="bodyTextSemiBold">{t('device')}</StyledText>
              <StyledText oddStyle="bodyTextSemiBold">
                {t('location')}
              </StyledText>
            </div>
            <div className={styles.devices_rows}>
              {deviceRows.map(row => (
                <div key={row.id} className={styles.device_row}>
                  <StyledText oddStyle="bodyTextRegular">
                    {row.device}
                  </StyledText>
                  <div className={styles.location_cell}>
                    <RobotInfoLabel
                      deckLabel={row.location !== '' ? row.location : t('na')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <OddInfoScreen
            type="neutral"
            header={t('no_devices_connected')}
            height="100%"
          />
        )}
      </div>
    </div>
  )
}
