import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  FLEX_MIN_CONTENT,
  Modal,
  PrimaryButton,
  SecondaryButton,
} from '@opentrons/components'
import { linearInterpolate } from '@opentrons/shared-data'

import { getMainPagePortalEl } from '../../../../../../components/organisms'
import { ByVolumeBuilder } from './ByVolumeBuilder'
import styles from './byvolumebuilder.module.css'
import { ByVolumeCalculator } from './ByVolumeCalculator'
import { getByVolumeMappedToXY } from './utils'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { LiquidHandlingPropertyByVolume } from '@opentrons/shared-data'
import type { ByVolumeType } from './types'

export function ByVolumeBuilderModal(props: {
  byVolume: LiquidHandlingPropertyByVolume
  setByVolume: Dispatch<SetStateAction<LiquidHandlingPropertyByVolume>>
  type: ByVolumeType
  onClose: () => void
  defaultFlowRates: LiquidHandlingPropertyByVolume
  maxX: number
  maxY: number
}): ReactNode {
  const {
    byVolume = [],
    type,
    onClose,
    setByVolume,
    defaultFlowRates,
    maxX,
    maxY,
  } = props

  const { t } = useTranslation(['shared', 'by_volume_builder'])

  const defaultDataPoints = getByVolumeMappedToXY(byVolume)
  const [dataPoints, setDataPoints] = useState(defaultDataPoints)

  // adds a new point to the center x value at the interpolated y value
  const handleAddPoint = (): void => {
    const newXValue = maxX / 2
    const newYValue = linearInterpolate(
      newXValue,
      dataPoints.map(p => [p.x, p.y])
    )
    if (newYValue != null) {
      const newPoints = [...dataPoints, { x: newXValue, y: newYValue }]
      const newPointsSorted = newPoints.sort((a, b) => a.x - b.x)
      setDataPoints(newPointsSorted)
    }
  }

  return createPortal(
    <Modal
      title={t(`by_volume_builder:${type}.title`)}
      onClose={onClose}
      closeOnOutsideClick
      width={FLEX_MIN_CONTENT}
    >
      <div className={styles.modal_container}>
        <ByVolumeBuilder
          type={type}
          dataPoints={dataPoints}
          setDataPoints={setDataPoints}
          byVolume={byVolume}
          maxX={maxX}
          maxY={maxY}
        />
        <ByVolumeCalculator
          type={type}
          points={dataPoints.map(p => [p.x, p.y])}
        />
        <div className={styles.modal_footer}>
          <SecondaryButton
            onClick={() => {
              setDataPoints(getByVolumeMappedToXY(defaultFlowRates))
            }}
          >
            {t(`by_volume_builder:reset`)}
          </SecondaryButton>
          <PrimaryButton onClick={handleAddPoint}>
            {t('by_volume_builder:add_point')}
          </PrimaryButton>
          <PrimaryButton
            onClick={() => {
              setByVolume(dataPoints.map(p => [p.x, p.y]))
              onClose()
            }}
          >
            {t('shared:save')}
          </PrimaryButton>
        </div>
      </div>
    </Modal>,
    getMainPagePortalEl()
  )
}
