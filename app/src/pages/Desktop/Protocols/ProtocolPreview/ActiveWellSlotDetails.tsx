import round from 'lodash/round'

import { COLORS, StyledText } from '@opentrons/components'
import { getMmFromBottom } from '@opentrons/shared-data'

import styles from './preview.module.css'
import { TipSvg } from './TipSvg'
import { getTipSvgInfo, getWellVolume } from './utils'
import { WellSvg } from './WellSvg'

import type {
  LabwareWellMap,
  Liquid,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { LocationLiquidState } from '@opentrons/step-generation'

const WELL_HEIGHT_PIXELS = 54
const WELL_WIDTH_PIXELS = 20
const PIXEL_DECIMALS = 2

interface ActiveWellSlotDetailsProps {
  params: RunTimeCommand['params']
  activeWellName: string
  wellColor: string
  wells: LabwareWellMap
  pipetteLocationLiquidState: LocationLiquidState | null
  labwareLocationLiquidState: LocationLiquidState | null
  liquids: Liquid[]
  tipMaxVolume: number
}
export function ActiveWellSlotDetails(
  props: ActiveWellSlotDetailsProps
): JSX.Element {
  const {
    params,
    activeWellName,
    wellColor,
    wells,
    liquids,
    pipetteLocationLiquidState,
    labwareLocationLiquidState,
    tipMaxVolume,
  } = props

  const labwareDepth = wells.A1.depth ?? 0
  const xLabwareWellWidth = wells.A1.x ?? 0
  const labwareWellMaxVolume = wells.A1.totalLiquidVolume
  const zValue = 'wellLocation' in params ? params.wellLocation.z ?? 1 : 1

  //  TODO: add support for rest of references
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

  const { tipColor, tipCurrentVolume } =
    pipetteLocationLiquidState != null
      ? getTipSvgInfo(pipetteLocationLiquidState, liquids)
      : { tipColor: COLORS.grey40, tipCurrentVolume: 0 }

  const totalVolumeInWell =
    labwareLocationLiquidState != null
      ? getWellVolume(labwareLocationLiquidState)
      : 0
  return (
    <>
      <div className={styles.slot_details_active_step}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {`Well ${activeWellName}`}
        </StyledText>
      </div>
      <div>
        <div className={styles.well_details_speed_container}>
          {'speed' in params ? (
            <div className={styles.well_details_speed}>
              <StyledText desktopStyle="bodyDefaultRegular">Speed</StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">{`${params.speed} mm/s`}</StyledText>
            </div>
          ) : null}
        </div>
        <div className={styles.well_detail_svg_positioning}>
          <div className={styles.well_detail_svg_container}>
            <TipSvg
              volume={tipCurrentVolume}
              maxVolume={tipMaxVolume}
              roundedXPositionPixels={roundedXPositionPixels}
              bottomPx={bottomPx}
              color={tipColor}
            />
            <WellSvg
              volume={totalVolumeInWell}
              maxVolume={labwareWellMaxVolume}
              color={wellColor}
            />
            {labwareDepth !== null && (
              <div className={styles.well_details_caption_side}>
                <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                  {round(labwareDepth, 0)}
                  mm
                </StyledText>
              </div>
            )}
            {xLabwareWellWidth !== null && (
              <div className={styles.well_details_caption_bottom}>
                <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                  {xLabwareWellWidth}
                  mm
                </StyledText>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
