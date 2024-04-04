import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import { InputField, Tooltip, useHoverTooltip } from '@opentrons/components'
import { getLabwareEntities } from '../../../step-forms/selectors'
import { ZTipPositionModal } from './TipPositionField/ZTipPositionModal'
import type { FieldProps } from '../types'

import styles from '../StepEditForm.module.css'

interface BlowoutZOffsetFieldProps extends FieldProps {
  destLabwareId: unknown
  sourceLabwareId?: unknown
  blowoutLabwareId?: unknown
}

export function BlowoutZOffsetField(
  props: BlowoutZOffsetFieldProps
): JSX.Element {
  const {
    disabled,
    value,
    destLabwareId,
    sourceLabwareId,
    blowoutLabwareId,
    isIndeterminate,
    tooltipContent,
    name,
    updateValue,
  } = props
  const [isModalOpen, setModalOpen] = React.useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t } = useTranslation('application')
  const labwareEntities = useSelector(getLabwareEntities)

  let labwareId = null
  if (blowoutLabwareId === SOURCE_WELL_BLOWOUT_DESTINATION) {
    labwareId = sourceLabwareId
  } else if (blowoutLabwareId === DEST_WELL_BLOWOUT_DESTINATION) {
    labwareId = destLabwareId
  }

  const labwareZDimension =
    labwareId != null
      ? labwareEntities[String(labwareId)]?.def.dimensions.zDimension
      : 0

  return (
    <>
      <Tooltip {...tooltipProps}>{tooltipContent}</Tooltip>
      {isModalOpen ? (
        <ZTipPositionModal
          closeModal={() => setModalOpen(false)}
          name={name}
          zValue={Number(value)}
          updateValue={updateValue}
          wellDepthMm={labwareZDimension}
        />
      ) : null}
      <div {...targetProps}>
        <InputField
          data-testid="BlowoutZOffsetField_inputField"
          disabled={disabled}
          className={styles.small_field}
          readOnly
          onClick={disabled ? undefined : () => setModalOpen(true)}
          value={String(value)}
          isIndeterminate={isIndeterminate}
          units={t('units.millimeter')}
          id={`BlowoutZOffsetField_${name}`}
        />
      </div>
    </>
  )
}
