import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './devices.module.css'

import type { SetSettingOption } from '../types'

// ToDo update the interface when implemented lsusb info function
interface DeviceInformation {
  device: string
  location: string
}

interface DevicesProps {
  robotName: string
  setCurrentOption: SetSettingOption
}

export function Devices({
  robotName,
  setCurrentOption,
}: DevicesProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  // ToDo replace dummy data with the actual data
  // const dummyDeviceRows = [
  //   {
  //     device: 'External keyboard',
  //     location: 'USB-1',
  //   },
  //   {
  //     device: 'USB drive',
  //     location: 'USB-1',
  //   },
  //   {
  //     device: 'Rear panel',
  //     location: 'INTERNAL',
  //   },
  // ] as const

  const dummyDeviceRows: DeviceInformation[] = []

  return (
    <div className={styles.devices_contaienr}>
      <ChildNavigation
        header={t('devices')}
        onClickBack={() => {
          console.log('clicked')
          setCurrentOption(null)
        }}
      />
      <div className={styles.devices_content_container}>
        {dummyDeviceRows.length > 0 ? (
          <>
            <div className={styles.devices_table_header_container}>
              <StyledText oddStyle="bodyTextSemiBold">{t('device')}</StyledText>
              <StyledText oddStyle="bodyTextSemiBold">
                {t('location')}
              </StyledText>
            </div>
            <div className={styles.devices_rows}>
              {dummyDeviceRows.map((row: DeviceInformation) => (
                <div key={row.device} className={styles.device_row}>
                  <StyledText oddStyle="bodyTextRegular">
                    {row.device}
                  </StyledText>
                  <div className={styles.location_cell}>
                    <div className={styles.location_pill}>
                      <StyledText oddStyle="bodyTextSemiBold">
                        {row.location}
                      </StyledText>
                    </div>
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
