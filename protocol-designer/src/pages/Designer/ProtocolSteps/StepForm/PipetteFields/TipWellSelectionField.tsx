import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  getMainPagePortalEl,
  SelectWellsModal,
} from '/protocol-designer/components/organisms'
import { getPipetteEntities } from '/protocol-designer/step-forms/selectors'

import { getNozzleType } from '../utils'

import type { ReactNode } from 'react'
import type { FieldProps } from '../types'

type TipWellSelectionFieldProps = FieldProps & {
  pipetteId: unknown
  labwareId: unknown
  nozzles: string | null
}

export function TipWellSelectionField(
  props: TipWellSelectionFieldProps
): ReactNode {
  const {
    value: selectedWells,
    errorToShow,
    name,
    updateValue,
    disabled,
    pipetteId,
    labwareId,
    nozzles,
  } = props
  const { t } = useTranslation('protocol_steps')
  const pipetteEntities = useSelector(getPipetteEntities)
  const primaryWellCount =
    Array.isArray(selectedWells) && selectedWells.length > 0
      ? selectedWells.length.toString()
      : null
  const [openModal, setOpenModal] = useState<boolean>(false)
  const pipette = pipetteId != null ? pipetteEntities[String(pipetteId)] : null
  const nozzleType = getNozzleType(pipette, nozzles)

  return (
    <>
      {createPortal(
        <SelectWellsModal
          isOpen={openModal}
          key={`${labwareId}_${name}_TipField`}
          labwareId={typeof labwareId === 'string' ? labwareId : null}
          name={name}
          onCloseClick={() => {
            setOpenModal(false)
          }}
          pipetteId={String(pipetteId)}
          updateValue={updateValue}
          value={selectedWells}
          nozzleType={nozzleType}
        />,

        getMainPagePortalEl()
      )}

      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing16}
        gridGap={SPACING.spacing8}
      >
        <Flex gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
            {t('tip_selection')}
          </StyledText>
        </Flex>
        <InputField
          disabled={disabled}
          readOnly
          name={name}
          error={errorToShow}
          value={primaryWellCount}
          onClick={() => {
            setOpenModal(true)
          }}
        />
      </Flex>
    </>
  )
}
