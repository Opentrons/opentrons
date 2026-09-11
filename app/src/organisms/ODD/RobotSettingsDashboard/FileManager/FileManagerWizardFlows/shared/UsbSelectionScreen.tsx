import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { INFO_TOAST, RadioButton, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { useToaster } from '/app/organisms/ToasterOven'
import { getShellUsbMassStorageMountPaths } from '/app/redux/shell'

import styles from './shared.module.css'

import type { State } from '/app/redux/types'

interface UsbSelectionScreenProps {
  question: string
  onContinue: (selectedPath: string) => void
}

// mirrors FLEX_USB_MOUNT_FILTER in app-shell-odd/src/usb/usb.ts: mount dirs are
// named `<VOLUME_LABEL>-sdX#`, or just `sdX#` when the drive has no label
const USB_VOLUME_LABEL_REGEX = /^(.+)-sd[a-z]+\d*$/

const getVolumeLabel = (path: string): string | null => {
  const dirName = path.split('/').filter(Boolean).pop() ?? ''
  const match = dirName.match(USB_VOLUME_LABEL_REGEX)
  return match != null ? match[1] : null
}

export function UsbSelectionScreen({
  question,
  onContinue,
}: UsbSelectionScreenProps): JSX.Element {
  const { t, i18n } = useTranslation(['device_details', 'shared'])
  // only single-function USB mass-storage devices
  const usbMountPaths = useSelector((state: State) =>
    getShellUsbMassStorageMountPaths(state)
  )
  const [selectedPath, setSelectedPath] = useState<string | null>(
    usbMountPaths[0] ?? null
  )
  const { makeToast } = useToaster()

  useEffect(() => {
    // if previously selected path is not in the updated mount paths,
    // ensure the selected path is reset
    if (
      selectedPath == null ||
      (selectedPath != null && !usbMountPaths.includes(selectedPath))
    ) {
      setSelectedPath(usbMountPaths.length > 0 ? usbMountPaths[0] : null)
    }
  }, [usbMountPaths, selectedPath])

  if (usbMountPaths.length === 0) {
    return (
      <div className={styles.no_usb_wrapper}>
        <OddInfoScreen
          type="neutral"
          iconName="ot-alert"
          header={t('device_details:no_usb_connected')}
          subText={t('device_details:connect_usb_to_download')}
          height="100%"
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
          {usbMountPaths.map((path, idx) => {
            const volumeLabel = getVolumeLabel(path)
            const usbLabel =
              volumeLabel ??
              t('device_details:usb_drive_number', { number: idx + 1 })
            return (
              <RadioButton
                key={path}
                buttonLabel={usbLabel}
                buttonValue={path}
                isSelected={selectedPath === path}
                onChange={e => {
                  setSelectedPath(e.target.value)
                }}
              />
            )
          })}
        </div>
      </div>
      <div className={styles.buttons}>
        <SmallButton
          buttonText={i18n.format(t('shared:continue'), 'capitalize')}
          onClick={() => {
            if (selectedPath != null) {
              onContinue(selectedPath)
            } else {
              makeToast(t('select_usb_to_continue') as string, INFO_TOAST)
            }
          }}
          disabled={selectedPath == null}
        />
      </div>
    </>
  )
}
