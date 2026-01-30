import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { Flex, ListButton, SPACING, StyledText } from '@opentrons/components'
import { ALL, COLUMN, PARTIAL, ROW, SINGLE } from '@opentrons/shared-data'

import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { NozzleAndWellSelectionModal } from './NozzleAndWellSelectionModal'

import type { DropdownOption } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'
import type { FieldProps, FieldPropsByName } from '../../types'

interface ExtendedPartialTipFieldProps extends FieldProps {
  pipetteSpecs: PipetteV2Specs
  propsForFields: FieldPropsByName
  stepType: string
}
export function ExtendedPartialTipField(
  props: ExtendedPartialTipFieldProps
): JSX.Element {
  const {
    updateValue,
    padding = `0 ${SPACING.spacing16}`,
    pipetteSpecs,
    propsForFields,
    stepType,
  } = props
  const { t } = useTranslation('protocol_steps')
  const deckSetup = useSelector(getInitialDeckSetup)

  const [isNozzleAndWellModalOpen, setIsNozzleAndWellModalOpen] =
    useState<boolean>(false)
  const handleOpen = (): void => {
    setIsNozzleAndWellModalOpen(true)
  }

  const { channels } = pipetteSpecs
  const tipracks = Object.values(deckSetup.labware).filter(
    labware => labware.def.parameters.isTiprack
  )
  const tipracksNotOnAdapter = tipracks.filter(
    tiprack => tiprack.stack.length === 2
  )
  const areAllTipracksOnAdapter = tipracksNotOnAdapter.length === 0

  const options: DropdownOption[] = [
    {
      name: t('all_nozzles'),
      value: ALL,
    },
  ]
  if (channels === 96) {
    options.push(
      ...[
        {
          name: t('single_nozzle'),
          value: SINGLE,
          disabled: areAllTipracksOnAdapter,
          tooltipText: areAllTipracksOnAdapter
            ? t('form:step_edit_form.field.nozzles.option_tooltip.partial')
            : null,
        },
        {
          name: t('single_column_of_nozzles'),
          value: COLUMN,
          disabled: areAllTipracksOnAdapter,
          tooltipText: areAllTipracksOnAdapter
            ? t('form:step_edit_form.field.nozzles.option_tooltip.partial')
            : null,
        },
      ]
    )
  }
  if (channels !== 8) {
    options.push({
      name: t('single_row_of_nozzles'),
      value: ROW,
      disabled: areAllTipracksOnAdapter,
      tooltipText: areAllTipracksOnAdapter
        ? t('form:step_edit_form.field.alozzles.option_tooltip.partial')
        : null,
    })
  }
  if (channels === 8) {
    // 8-channel
    options.push({
      name: t('single_nozzle'),
      value: SINGLE,
    })
    options.push({
      name: t('partial_nozzles'),
      value: PARTIAL,
    })
  }
  let aspWellsLength: number
  let dspWellsLength: number
  switch (stepType) {
    case 'mix':
      aspWellsLength =
        deckSetup.labware[
          propsForFields.labware.value as string
        ].def.ordering.flat().length
      dspWellsLength = 0
      break
    case 'transfer':
      aspWellsLength =
        deckSetup.labware[
          propsForFields.aspirate_labware.value as string
        ]?.def.ordering.flat().length ?? 0
      dspWellsLength =
        deckSetup.labware[
          propsForFields.dispense_labware.value as string
        ]?.def.ordering.flat().length ?? 0
      break
    default:
      aspWellsLength = 0
      dspWellsLength = 0
  }

  const [selectedValue, setSelectedValue] =
    useState<NozzleConfigurationStyle>(ALL)
  const nozzle = 'A1'
  const getNozzleWellText = (): string => {
    switch (selectedValue) {
      case ROW:
      case COLUMN:
        const selectedValueText = selectedValue.toLowerCase() + 's'
        return t('nozzles_selected', {
          nozzleSelection: 'Left' + selectedValueText + ' nozzles',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: selectedValueText,
        })
      case ALL:
        return t('nozzles_selected', {
          nozzleSelection: 'All nozzles',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: 'wells',
        })
      case SINGLE:
        return t('nozzles_selected', {
          nozzleSelection: nozzle + ' nozzle',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: 'wells',
        })
      case PARTIAL:
        return t('nozzles_selected', {
          nozzleSelection: nozzle.length + ' nozzles',
          aspWells: aspWellsLength,
          dispWells: dspWellsLength,
          positionType: 'wells',
        })
      default:
        return t('no_nozzles_and_wells_selected')
    }
  }
  return (
    <>
      <Flex padding={padding}>
        <ListButton
          type="noActive"
          width="100%"
          padding={SPACING.spacing12}
          onClick={() => {
            handleOpen()
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {getNozzleWellText()}
          </StyledText>
        </ListButton>
      </Flex>
      {isNozzleAndWellModalOpen ? (
        <>
          <NozzleAndWellSelectionModal
            showModal={setIsNozzleAndWellModalOpen}
            totalSteps={3}
            pipetteSpecs={pipetteSpecs}
            updateValue={updateValue}
            setSelectedValue={setSelectedValue}
            options={options}
            deckSetup={deckSetup}
            propsForFields={propsForFields}
            stepType={stepType}
            value={selectedValue as NozzleConfigurationStyle}
          ></NozzleAndWellSelectionModal>
        </>
      ) : null}
    </>
  )
}
