import * as React from 'react'

import {
  AlertModal,
  Box,
  Flex,
  JUSTIFY_FLEX_END,
  Link,
  SecondaryBtn,
  SPACING_3,
  Text,
} from '@opentrons/components'

import { Portal } from '../../App/portal'

import styles from './styles.module.css'

const TITLE = 'Are you sure you want to continue?'

const TIP_LENGTH_DATA_EXISTS = 'Tip length data already exists for'

const RECOMMEND_RECALIBRATING_IF =
  'We recommend recalibrating only if you believe the tip length calibration for'
const INACCURATE = 'is inaccurate.'
const VIEW = 'View'
const TO_LEARN_MORE = 'to learn more.'
const THIS_LINK = 'this link'

const CONTINUE = 'continue to calibrate tip length'
const CANCEL = 'cancel'

const CALIBRATION_URL =
  'https://support.opentrons.com/s/article/Recalibrating-tip-length-before-running-a-protocol'

interface Props {
  confirm: () => unknown
  cancel: () => unknown
  tiprackDisplayName: string
}

export function ConfirmRecalibrationModal(props: Props): JSX.Element {
  const { confirm, cancel, tiprackDisplayName } = props

  return (
    <Portal>
      <AlertModal
        className={styles.alert_modal_padding}
        iconName={null}
        heading={TITLE}
        alertOverlay
      >
        <Box>
          <Text>
            {TIP_LENGTH_DATA_EXISTS}
            &nbsp;
            {`"${tiprackDisplayName}".`}
            <br />
            <br />
            {RECOMMEND_RECALIBRATING_IF}
            &nbsp;
            {`"${tiprackDisplayName}"`}
            &nbsp;
            {INACCURATE}
            &nbsp;
            {VIEW}
            &nbsp;
            <Link href={CALIBRATION_URL} external>
              {THIS_LINK}
            </Link>
            &nbsp;
            {TO_LEARN_MORE}
          </Text>
        </Box>

        <Flex marginY={SPACING_3} justifyContent={JUSTIFY_FLEX_END}>
          <SecondaryBtn onClick={confirm} marginRight={SPACING_3}>
            {CONTINUE}
          </SecondaryBtn>
          <SecondaryBtn onClick={cancel}>{CANCEL}</SecondaryBtn>
        </Flex>
      </AlertModal>
    </Portal>
  )
}
