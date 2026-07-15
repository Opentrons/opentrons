import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { RadioButton, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { getShellUsbMountPaths } from '/app/redux/shell'

import styles from './filemanagerwizardshared.module.css'

import type { State } from '/app/redux/types'

interface UsbSelectionScreenProps {
  question: string
  onContinue: (selectedPath: string) => void
}

export function UsbSelectionScreen({
  question,
  onContinue,
}: UsbSelectionScreenProps): JSX.Element {
  const { t, i18n } = useTranslation(['device_details', 'shared'])
  const usbMountPaths = useSelector((state: State) =>
    getShellUsbMountPaths(state)
  )
  const [selectedPath, setSelectedPath] = useState<string | null>(
    usbMountPaths[0] ?? null
  )

  const getUsbLabel = (index: number): string =>
    usbMountPaths.length > 1
      ? t('device_details:usb_drive_number', { number: index + 1 })
      : t('device_details:usb_drive')

  if (usbMountPaths.length === 0) {
    return (
      <div className={styles.no_usb_wrapper}>
        <OddInfoScreen
          type="neutral"
          iconName="ot-alert"
          header={t('device_details:no_usb_connected')}
          subText={t('device_details:connect_usb_to_download')}
          height='100%'
        />
      </div>
    )
  }

  return (
    <>
      <div className={styles.scrollable_content}>
        <StyledText oddStyle="level4HeaderSemiBold" className={styles.question}>
          {question}
        </StyledText>
        <div className={styles.button_list}>
          {usbMountPaths.map((path, idx) => (
            <RadioButton
              key={path}
              buttonLabel={getUsbLabel(idx)}
              buttonValue={path}
              isSelected={selectedPath === path}
              onChange={e => {
                setSelectedPath(e.target.value)
              }}
            />
          ))}
        </div>
      </div>
      <div className={styles.buttons}>
        <SmallButton
          buttonText={i18n.format(t('shared:continue'), 'capitalize')}
          onClick={() => {
            if (selectedPath != null) {
              onContinue(selectedPath)
            }
          }}
          disabled={selectedPath == null}
        />
      </div>
    </>
  )
}
