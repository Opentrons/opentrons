import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import round from 'lodash/round'

import { COLORS, RobotInfoLabel, StyledText, Tag } from '@opentrons/components'
import {
  getMmFromBottom,
  POSITION_REFERENCE_BOTTOM,
  POSITION_REFERENCE_TOP,
} from '@opentrons/shared-data'

import { TipSvg } from '../TipSvg'
import { getTipSvgInfo } from '../utils/getTipSvgInfo'
import { getWellVolume } from '../utils/getWellVolume'
import { WELL_GEOMETRY, WELL_VIEWBOX, WellSvg } from '../WellSvg'
import styles from './wellcontainer.module.css'

import type { ReactNode } from 'react'
import type {
  LabwareWellMap,
  Liquid,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { LocationLiquidState } from '@opentrons/step-generation'

const SVG_DECIMALS = 2

interface WellContainerProps {
  params: RunTimeCommand['params']
  selectedWellName: string
  wellColor: string
  wells: LabwareWellMap
  pipetteLocationLiquidState: LocationLiquidState | null
  labwareLocationLiquidState: LocationLiquidState | null
  liquids: Liquid[]
  tipMaxVolume: number
}
export function WellContainer(props: WellContainerProps): ReactNode {
  const {
    params,
    selectedWellName,
    wellColor,
    wells,
    liquids,
    pipetteLocationLiquidState,
    labwareLocationLiquidState,
    tipMaxVolume,
  } = props
  const { t } = useTranslation('protocol_visualization')
  const [isWellHovered, setIsWellHovered] = useState<boolean>(false)
  const [isTipHovered, setIsTipHovered] = useState<boolean>(false)
  const lastTipBottomYRef = useRef<number>(WELL_GEOMETRY.bottomY)
  const lastXPositionSvgRef = useRef<number>(0)

  const labwareDepth = wells.A1.depth ?? 0
  const xLabwareWellWidth = wells.A1.x ?? 0
  const labwareWellMaxVolume = wells.A1.totalLiquidVolume
  const wellLocation = 'wellLocation' in params ? params.wellLocation : null
  const hasWellLocation = wellLocation != null

  //  TODO: add support for rest of references
  const reference =
    wellLocation?.origin === 'top'
      ? POSITION_REFERENCE_TOP
      : POSITION_REFERENCE_BOTTOM
  const zOffset: number =
    typeof wellLocation?.offset?.z === 'number' ? wellLocation.offset.z : 1
  const xOffset: number =
    typeof wellLocation?.offset?.x === 'number' ? wellLocation.offset.x : 0

  const mmFromBottom = hasWellLocation
    ? getMmFromBottom(zOffset, reference, labwareDepth)
    : null

  const wellHeightSvg = WELL_GEOMETRY.bottomY - WELL_GEOMETRY.topY
  const wellWidthSvg = WELL_GEOMETRY.rightX - WELL_GEOMETRY.leftX

  if (labwareDepth != null && labwareDepth > 0 && mmFromBottom != null) {
    const fractionOfWellHeight = mmFromBottom / labwareDepth
    const tipBottomY =
      WELL_GEOMETRY.bottomY - fractionOfWellHeight * wellHeightSvg
    lastTipBottomYRef.current = round(tipBottomY, SVG_DECIMALS)
  }
  const roundedTipBottomY = lastTipBottomYRef.current

  if (hasWellLocation && xLabwareWellWidth != null && xLabwareWellWidth > 0) {
    const xPositionSvg = (wellWidthSvg / xLabwareWellWidth) * xOffset
    lastXPositionSvgRef.current = round(xPositionSvg, SVG_DECIMALS)
  }
  const roundedXPositionSvg = lastXPositionSvgRef.current

  const { tipColor, tipCurrentVolume, airGapVolume } =
    pipetteLocationLiquidState != null
      ? getTipSvgInfo(pipetteLocationLiquidState, liquids)
      : { tipColor: COLORS.grey40, tipCurrentVolume: 0, airGapVolume: 0 }

  const totalVolumeInWell =
    labwareLocationLiquidState != null
      ? getWellVolume(labwareLocationLiquidState)
      : 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Tag text={t('well_view')} type="default" shrinkToContent />
        <RobotInfoLabel
          deckLabel={t('well_name', { wellName: selectedWellName })}
        />
      </div>
      <div>
        <div className={styles.main_content}>
          <div className={styles.well_detail_svg_positioning}>
            <div className={styles.well_detail_svg_container}>
              <div className={styles.well_detail_svg_inner}>
                {isTipHovered ? (
                  <div className={styles.tip_details_volume}>
                    <Tag
                      text={t('well_volume', {
                        volume: tipCurrentVolume.toFixed(1),
                      })}
                      type="flex"
                    />
                  </div>
                ) : null}
                {isWellHovered ? (
                  <div className={styles.well_details_volume}>
                    <Tag
                      text={t('well_volume', {
                        volume: totalVolumeInWell.toFixed(1),
                      })}
                      type="flex"
                    />
                  </div>
                ) : null}
                <div className={styles.svg_container}>
                  <svg
                    viewBox={`0 0 ${WELL_VIEWBOX.width} ${WELL_VIEWBOX.height}`}
                    className={styles.well_and_tip_svg}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <WellSvg
                      volume={totalVolumeInWell}
                      maxVolume={labwareWellMaxVolume}
                      color={wellColor}
                      setIsHovered={setIsWellHovered}
                      isHovered={isWellHovered}
                    />
                    <TipSvg
                      volume={tipCurrentVolume}
                      maxVolume={tipMaxVolume}
                      xOffset={roundedXPositionSvg}
                      tipBottomY={roundedTipBottomY}
                      color={tipColor}
                      setIsHovered={setIsTipHovered}
                      isHovered={isTipHovered}
                      airGapVolume={airGapVolume}
                    />
                  </svg>
                </div>
              </div>
              {labwareDepth !== null && (
                <div className={styles.well_details_caption_side}>
                  <StyledText
                    desktopStyle="captionRegular"
                    color={COLORS.grey60}
                  >
                    {t('well_dimension', { number: round(labwareDepth, 0) })}
                  </StyledText>
                </div>
              )}
              {xLabwareWellWidth !== null && (
                <div className={styles.well_details_caption_bottom}>
                  <StyledText
                    desktopStyle="captionRegular"
                    color={COLORS.grey60}
                  >
                    {t('well_dimension', { number: xLabwareWellWidth })}
                  </StyledText>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
