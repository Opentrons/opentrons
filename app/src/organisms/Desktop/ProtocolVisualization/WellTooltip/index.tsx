import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import map from 'lodash/map'
import reduce from 'lodash/reduce'

import { LiquidIcon, StyledText } from '@opentrons/components'
import { swatchColors } from '@opentrons/step-generation'

import { getTopPortalEl } from '/app/App/portal'

import { formatPercentage } from '../utils/formatPercentage'
import { formatVolume } from '../utils/formatVolume'
import { useWellTooltipPopper } from './useWellTooltipPopper'
import styles from './welltooltip.module.css'

import type { MouseEvent, ReactNode } from 'react'
import type { LocationLiquidState } from '@opentrons/step-generation'
import type { WellReferenceRect } from './useWellTooltipPopper'

interface WellTooltipParams {
  liquidDisplayColors: Record<string, string>
  makeHandleMouseEnterWell: (
    wellName: string,
    wellIngreds: LocationLiquidState
  ) => (e: MouseEvent<any>) => void
  handleMouseLeaveWell: (val: unknown) => void
}

interface WellTooltipProps {
  children: (wellTooltipParams: WellTooltipParams) => ReactNode
  ingredNames: Record<string, string | null>
  liquidDisplayColors: Record<string, string>
}

interface TooltipState {
  referenceRect: WellReferenceRect | null
  tooltipWellName: string | null
  tooltipWellIngreds: LocationLiquidState | null
}

const initialTooltipState: TooltipState = {
  referenceRect: null,
  tooltipWellName: null,
  tooltipWellIngreds: null,
}

export function WellTooltip({
  children,
  ingredNames,
  liquidDisplayColors,
}: WellTooltipProps): ReactNode {
  const { t } = useTranslation('protocol_visualization')
  const [tooltipState, setTooltipState] =
    useState<TooltipState>(initialTooltipState)
  const [tooltipEl, setTooltipEl] = useState<HTMLElement | null>(null)

  const makeHandleMouseEnterWell =
    (wellName: string, wellIngreds: LocationLiquidState) =>
    (e: MouseEvent): void => {
      const target = e.currentTarget as HTMLElement
      const { left, top, height, width } = target.getBoundingClientRect()
      if (wellIngreds != null && Object.keys(wellIngreds).length > 0) {
        setTooltipState({
          referenceRect: { left, top, width, height },
          tooltipWellName: wellName,
          tooltipWellIngreds: wellIngreds,
        })
      }
    }

  const handleMouseLeaveWell = (): void => {
    setTooltipState(initialTooltipState)
  }

  const { referenceRect, tooltipWellIngreds, tooltipWellName } = tooltipState

  useWellTooltipPopper(tooltipEl, referenceRect)

  const totalLiquidVolume = reduce(
    tooltipWellIngreds,
    (acc, ingred) => acc + ingred.volume,
    0
  )
  const hasMultipleIngreds = Object.keys(tooltipWellIngreds ?? {}).length > 1

  return (
    <>
      {children({
        liquidDisplayColors,
        makeHandleMouseEnterWell,
        handleMouseLeaveWell,
      })}
      {tooltipWellName != null
        ? createPortal(
            <div ref={setTooltipEl} className={styles.popper_content}>
              <table className={styles.tooltip_table}>
                <tbody>
                  {map(tooltipWellIngreds || {}, (ingred, groupId) => (
                    <tr key={groupId} className={styles.tooltip_row}>
                      <td>
                        <LiquidIcon
                          size="xSmall"
                          color={
                            liquidDisplayColors[groupId] ??
                            swatchColors(groupId)
                          }
                        />
                      </td>
                      <td>
                        <StyledText desktopStyle="captionSemiBold">
                          {ingredNames[groupId]}
                        </StyledText>
                      </td>
                      {hasMultipleIngreds ? (
                        <td>
                          <StyledText desktopStyle="captionRegular">
                            {`(${formatPercentage(ingred.volume, totalLiquidVolume)})`}
                          </StyledText>
                        </td>
                      ) : null}
                      <td>
                        <StyledText desktopStyle="captionRegular">
                          {t('well_volume', {
                            volume: formatVolume(ingred.volume, 2),
                          })}
                        </StyledText>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {hasMultipleIngreds ? (
                <>
                  <div className={styles.divider} />
                  <div className={styles.footer}>
                    <StyledText desktopStyle="captionRegular">{`${tooltipWellName} Total Volume`}</StyledText>
                    <StyledText desktopStyle="captionRegular">
                      {t('well_volume', {
                        volume: formatVolume(totalLiquidVolume, 2),
                      })}
                    </StyledText>
                  </div>
                </>
              ) : null}
            </div>,
            getTopPortalEl()
          )
        : null}
    </>
  )
}
