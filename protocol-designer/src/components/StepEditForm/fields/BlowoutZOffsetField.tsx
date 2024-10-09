import { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import { getWellDepth } from '@opentrons/shared-data'
import {
  COLORS,
  Flex,
  Icon,
  LegacyTooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { getLabwareEntities } from '../../../step-forms/selectors'
import { ZTipPositionModal } from './TipPositionField/ZTipPositionModal'
import type { FieldProps } from '../types'

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
    tooltipContent,
    name,
    updateValue,
  } = props
  const [isModalOpen, setModalOpen] = useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const labwareEntities = useSelector(getLabwareEntities)

  let labwareId = null
  if (blowoutLabwareId === SOURCE_WELL_BLOWOUT_DESTINATION) {
    labwareId = sourceLabwareId
  } else if (blowoutLabwareId === DEST_WELL_BLOWOUT_DESTINATION) {
    labwareId = destLabwareId
  }

  const labwareWellDepth =
    labwareId != null && labwareEntities[String(labwareId)]?.def != null
      ? getWellDepth(labwareEntities[String(labwareId)].def, 'A1')
      : 0

  return (
    <>
      <LegacyTooltip {...tooltipProps}>{tooltipContent}</LegacyTooltip>
      {isModalOpen ? (
        <ZTipPositionModal
          closeModal={() => {
            setModalOpen(false)
          }}
          name={name}
          zValue={Number(value)}
          updateValue={updateValue}
          wellDepthMm={labwareWellDepth}
        />
      ) : null}
      <Flex
        {...targetProps}
        onClick={
          disabled
            ? undefined
            : () => {
                setModalOpen(true)
              }
        }
        id={`BlowoutZOffsetField_${name}`}
        data-testid={`BlowoutZOffsetField_${name}`}
      >
        <Icon
          name="ot-calibrate"
          size="1.5rem"
          cursor="pointer"
          color={disabled ? COLORS.grey30 : COLORS.grey50}
        />
      </Flex>
    </>
  )
}
