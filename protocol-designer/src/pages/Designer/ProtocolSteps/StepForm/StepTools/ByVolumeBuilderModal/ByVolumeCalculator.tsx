import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import round from 'lodash/round'

import {
  FLEX_MIN_CONTENT,
  InputField,
  PrimaryButton,
} from '@opentrons/components'
import { linearInterpolate } from '@opentrons/shared-data'

import { maskToFloat } from '../../../../../../steplist/fieldLevel/processing'
import styles from './byvolumebuilder.module.css'

import type { ReactNode } from 'react'
import type { ByVolumeType } from './types'

export function ByVolumeCalculator(props: {
  type: ByVolumeType
  points: Array<[number, number]>
}): ReactNode {
  const { type, points } = props
  const [volumeToInterpolate, setVolumeToInterpolate] = useState<number | null>(
    null
  )
  const [interpolatedValue, setInterpolatedValue] = useState<number | null>(
    null
  )
  const [canInterpolate, setCanInterpolate] = useState<boolean>(
    volumeToInterpolate != null
  )
  const { t } = useTranslation(['by_volume_builder'])
  useEffect(() => {
    if (volumeToInterpolate != null) {
      setCanInterpolate(true)
    }
  }, [volumeToInterpolate, points])
  return (
    <div className={styles.calculator_container}>
      <div className={styles.calculator_input_container}>
        <InputField
          title={t(`by_volume_builder:calculator.volume_to_calculate`)}
          value={maskToFloat(volumeToInterpolate)}
          onChange={e => {
            setVolumeToInterpolate(Number(e.target.value))
          }}
          units={t(`by_volume_builder:${type}.axes.x.units`)}
          type="number"
        />
        <InputField
          title={t(`by_volume_builder:calculator.interpolated_value`, {
            type: t(`by_volume_builder:type.${type}`),
          })}
          value={interpolatedValue != null ? round(interpolatedValue, 1) : null}
          type="number"
          readOnly
          units={t(`by_volume_builder:${type}.axes.y.units`)}
        />
      </div>
      <PrimaryButton
        height={FLEX_MIN_CONTENT}
        onClick={() => {
          if (volumeToInterpolate != null) {
            setInterpolatedValue(linearInterpolate(volumeToInterpolate, points))
            setCanInterpolate(false)
          }
        }}
        disabled={!canInterpolate}
      >
        {t('by_volume_builder:calculator.calculate')}
      </PrimaryButton>
    </div>
  )
}
