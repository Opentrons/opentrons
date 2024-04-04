import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  DEST_WELL_BLOWOUT_DESTINATION,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'
import {
  COLORS,
  Flex,
  Icon,
  Tooltip,
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
  const [isModalOpen, setModalOpen] = React.useState<boolean>(false)
  const [targetProps, tooltipProps] = useHoverTooltip()
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
      <Flex
        {...targetProps}
        onClick={disabled ? undefined : () => setModalOpen(true)}
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
