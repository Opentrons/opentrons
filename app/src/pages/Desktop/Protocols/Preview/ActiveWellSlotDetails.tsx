import round from 'lodash/round'

import {
  Box,
  COLORS,
  OVERFLOW_HIDDEN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  StyledText,
} from '@opentrons/components'
import { getMmFromBottom } from '@opentrons/shared-data'

import styles from './preview.module.css'
import { TipSvg } from './TipSvg'
import { WellSvg } from './WellSvg'

import type { RunTimeCommand } from '@opentrons/shared-data'

const WELL_HEIGHT_PIXELS = 71
const WELL_WIDTH_PIXELS = 70
const PIXEL_DECIMALS = 2

interface ActiveWellSlotDetailsProps {
  params: RunTimeCommand['params']
  activeWellName: string
  labwareDepth: number
  xLabwareWellWidth: number
  maxVolume: number
  color: string
  currentVolume: number
  labwareWellMaxVolume: number
  totalVolumeInWell: number
  tipColor: string
}
export function ActiveWellSlotDetails(
  props: ActiveWellSlotDetailsProps
): JSX.Element {
  const {
    params,
    activeWellName,
    labwareDepth,
    xLabwareWellWidth,
    maxVolume,
    color,
    currentVolume,
    totalVolumeInWell,
    labwareWellMaxVolume,
    tipColor,
  } = props
  const zValue = 'wellLocation' in params ? params.wellLocation.z ?? 1 : 1
  const reference =
    'wellLocation' in params
      ? params.wellLocation.origin === 'top'
        ? 'well-top'
        : 'well-bottom'
      : 'well-bottom'
  const mmFromBottom =
    getMmFromBottom(Number(zValue), reference, labwareDepth) ?? 1

  const fractionOfWellHeight = mmFromBottom / labwareDepth
  const pixelsFromBottom =
    fractionOfWellHeight * WELL_HEIGHT_PIXELS - WELL_HEIGHT_PIXELS
  const roundedPixelsFromBottom = round(pixelsFromBottom, PIXEL_DECIMALS)
  const bottomPx = labwareDepth
    ? roundedPixelsFromBottom * 2
    : mmFromBottom - WELL_HEIGHT_PIXELS

  const xPositionPixels =
    (WELL_WIDTH_PIXELS / xLabwareWellWidth) *
    ('wellLocation' in params ? params.wellLocation.x : 1)
  const roundedXPositionPixels = round(xPositionPixels, PIXEL_DECIMALS)
  return (
    <>
      <div className={styles.slot_details_active_step}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {`Well ${activeWellName}`}
        </StyledText>
      </div>
      {/* <div className={styles.labware_details_padding}>
        <div className={styles.labware_details_container}>
          <div> {currentCommand.commandType}</div>
          <div> {'speed' in params ? `speed: ${params.speed}` : null}</div>
          <div>
            {'flowRate' in params ? `flow rate: ${params.flowRate}` : null}
          </div>
        </div>
      </div> */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
          height: '6rem',
          padding: '7px',
        }}
      >
        <Box
          position={POSITION_RELATIVE}
          width="15.8125rem"
          height="18rem"
          overflow={OVERFLOW_HIDDEN}
        >
          <TipSvg
            volume={currentVolume}
            maxVolume={maxVolume}
            roundedXPositionPixels={roundedXPositionPixels}
            bottomPx={bottomPx}
            color={tipColor}
          />
          <WellSvg
            volume={totalVolumeInWell}
            maxVolume={labwareWellMaxVolume}
            color={color}
          />
          {labwareDepth !== null && (
            <Box position={POSITION_ABSOLUTE} bottom="7.3rem" right="2.2rem">
              <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                {round(labwareDepth, 0)}
                {'mL'}
              </StyledText>
            </Box>
          )}
          {xLabwareWellWidth !== null && (
            <Box position={POSITION_ABSOLUTE} bottom="2rem" right="6.5rem">
              <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                {xLabwareWellWidth}
                {'mL'}
              </StyledText>
            </Box>
          )}
        </Box>
      </div>
    </>
  )
}
