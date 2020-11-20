// @flow
import * as React from 'react'
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

import type { PipetteCompatibility } from '../../pipettes/types'

const NOT_CALIBRATED = 'Not yet calibrated'
const NOT_ATTACHED = 'Not attached'
const CALIBRATION_DATA = 'Calibration data:'
const AXIS_NAMES = ['x', 'y', 'z']

export type InstrumentItemProps = {|
  compatibility?: PipetteCompatibility,
  mount?: string,
  children: React.Node,
  hidden?: boolean,
  needsOffsetCalibration: boolean,
  pipetteOffsetData?: [number, number, number] | null,
|}

export function InstrumentItem(props: InstrumentItemProps): React.Node {
  const {
    compatibility,
    mount,
    children,
    hidden,
    needsOffsetCalibration,
    pipetteOffsetData = null,
  } = props
  if (hidden) return null
  const match = ['match', 'inexact_match'].includes(compatibility)
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
              {NOT_ATTACHED}
            </Text>
          ) : !!pipetteOffsetData ? (
            <BuildOffsetText offsetData={pipetteOffsetData} />
          ) : (
            <Text
              fontSize={FONT_SIZE_BODY_1}
              fontStyle={FONT_STYLE_ITALIC}
              color={COLOR_ERROR}
            >
              {NOT_CALIBRATED}
            </Text>
          )}
        </Box>
      </Flex>
    </>
  )
}

function StatusIcon(props: {| match: boolean |}) {
  const { match } = props

  const iconName = match ? 'check-circle' : 'checkbox-blank-circle-outline'

  return <Icon name={iconName} className={styles.status_icon} />
}

function BuildOffsetText(props: {|
  offsetData: [number, number, number],
|}): React.Node {
  const { offsetData } = props
  return (
    <Flex css={FONT_BODY_1_DARK}>
      <Text marginRight={SPACING_2}>{CALIBRATION_DATA}</Text>
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
