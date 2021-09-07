import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Icon,
  Flex,
  Text,
  ALIGN_CENTER,
  COLOR_ERROR,
  FONT_BODY_1_DARK,
  FONT_SIZE_BODY_1,
  FONT_STYLE_ITALIC,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'
import styles from './styles.css'

import type { PipetteCompatibility } from '../../../redux/pipettes/types'

const AXIS_NAMES = ['x', 'y', 'z']

export interface InstrumentItemProps {
  compatibility?: PipetteCompatibility
  mount?: string
  children: React.ReactNode
  hidden?: boolean
  needsOffsetCalibration: boolean
  pipetteOffsetData?: [number, number, number] | null
}

export function InstrumentItem(props: InstrumentItemProps): JSX.Element | null {
  const {
    compatibility,
    mount,
    children,
    hidden,
    needsOffsetCalibration,
    pipetteOffsetData = null,
  } = props
  const { t } = useTranslation(['protocol_calibration', 'protocol_info'])
  if (hidden) return null
  // @ts-expect-error TODO: code change to commented code below
  const match = ['match', 'inexact_match'].includes(compatibility)
  // const match = compatibility
  //   ? (['match', 'inexact_match'] as PipetteCompatibility[]).includes(
  //       compatibility
  //     )
  //   : Boolean(compatibility)
  return (
    <>
      <Flex
        alignItems={ALIGN_CENTER}
        marginTop={SPACING_1}
        marginBottom={SPACING_3}
      >
        <StatusIcon match={match && !needsOffsetCalibration} />
        <Box>
          <Flex marginBottom={SPACING_1}>
            {mount && (
              <Text
                fontWeight={FONT_WEIGHT_SEMIBOLD}
                fontSize={FONT_SIZE_BODY_1}
                minWidth={'3rem'}
              >
                {mount.toUpperCase()}
              </Text>
            )}
            <Text css={FONT_BODY_1_DARK}>{children}</Text>
          </Flex>
          {!match ? (
            <Text fontSize={FONT_SIZE_BODY_1} fontStyle={FONT_STYLE_ITALIC}>
              {t('protocol_info:instrument_not_attached')}
            </Text>
          ) : !!pipetteOffsetData ? (
            <BuildOffsetText offsetData={pipetteOffsetData} />
          ) : (
            <Text
              fontSize={FONT_SIZE_BODY_1}
              fontStyle={FONT_STYLE_ITALIC}
              color={COLOR_ERROR}
            >
              {t('protocol_calibration:cal_data_not_calibrated')}
            </Text>
          )}
        </Box>
      </Flex>
    </>
  )
}

function StatusIcon(props: { match: boolean }): JSX.Element {
  const { match } = props

  const iconName = match ? 'check-circle' : 'checkbox-blank-circle-outline'

  return <Icon name={iconName} className={styles.status_icon} />
}

function BuildOffsetText(props: {
  offsetData: [number, number, number]
}): JSX.Element {
  const { offsetData } = props
  const { t } = useTranslation('protocol_info')
  return (
    <Flex css={FONT_BODY_1_DARK}>
      <Text marginRight={SPACING_2}>{t('instrument_cal_data_title')}:</Text>
      {AXIS_NAMES.map((key, index) => (
        <React.Fragment key={key}>
          <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>{key.toUpperCase()}</Text>
          <Text marginLeft={SPACING_1} marginRight={SPACING_3}>
            {offsetData[index] != null ? offsetData[index].toFixed(2) : null}
          </Text>
        </React.Fragment>
      ))}
    </Flex>
  )
}
