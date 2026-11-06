import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  Link,
  PrimaryButton,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/components/ODD/buttons'

import { CALIBRATION_DECK_SLOTS } from './constants'
import styles from './selectcalibrationslot.module.css'

import type { ReactNode } from 'react'
import type { CalibrationDeckSlot } from './types'

const SUPPORT_PAGE_URL = 'https://support.opentrons.com/s/ot2-calibration'

interface SelectCalibrationSlotProps {
  header: string
  selectedSlot: CalibrationDeckSlot
  setSelectedSlot: (slot: CalibrationDeckSlot) => void
  proceed: () => void
  isOnDevice: boolean | null
}

export function SelectCalibrationSlot({
  header,
  selectedSlot,
  setSelectedSlot,
  proceed,
  isOnDevice,
}: SelectCalibrationSlotProps): JSX.Element {
  const { t } = useTranslation('pipette_wizard_flows')

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <StyledText
          desktopStyle="headingSmallBold"
          oddStyle="level4HeaderSemiBold"
        >
          {header}
        </StyledText>
        <div className={styles.radio_set}>
          {CALIBRATION_DECK_SLOTS.map(slot => (
            <RadioButton
              key={slot}
              buttonLabel={slot}
              buttonValue={slot}
              isSelected={selectedSlot === slot}
              largeDesktopBorderRadius={true}
              onChange={() => {
                setSelectedSlot(slot)
              }}
            />
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        {!isOnDevice ? (
          <div className={styles.need_help}>
            <NeedHelpLink />
          </div>
        ) : null}
        {isOnDevice ? (
          <SmallButton buttonText={t('begin_calibration')} onClick={proceed} />
        ) : (
          <PrimaryButton onClick={proceed}>
            {t('begin_calibration')}
          </PrimaryButton>
        )}
      </div>
    </div>
  )
}

function NeedHelpLink(): ReactNode {
  const { t } = useTranslation('robot_calibration')

  return (
    <Flex alignItems={ALIGN_CENTER}>
      <Icon
        color={COLORS.grey50}
        size="1rem"
        marginRight={SPACING.spacing4}
        name="help"
      />
      <Link external href={SUPPORT_PAGE_URL}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('need_help')}
        </StyledText>
      </Link>
    </Flex>
  )
}
