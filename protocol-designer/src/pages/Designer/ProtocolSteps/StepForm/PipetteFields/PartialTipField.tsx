import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  DropdownMenu,
  Flex,
  ListButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { ALL, COLUMN, PARTIAL, ROW, SINGLE } from '@opentrons/shared-data'

import { getEnableAdditionalPartialTipSelection } from '/protocol-designer/feature-flags/selectors'
import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import { NozzleAndWellSelectionModal } from './TipSelectionWizard/NozzleAndWellSelectionModal'

import type { DropdownOption } from '@opentrons/components'
import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { FieldProps, FieldPropsByName } from '../types'

interface PartialTipFieldProps extends FieldProps {
  pipetteSpecs: PipetteV2Specs
  propsForFields: FieldPropsByName
  stepType: string
}
export function PartialTipField(props: PartialTipFieldProps): JSX.Element {
  const {
    value: dropdownItem,
    updateValue,
    errorToShow,
    padding = `0 ${SPACING.spacing16}`,
    tooltipContent,
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
  const enableAdditionalPartialTip = useSelector(
    getEnableAdditionalPartialTipSelection
  )
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
  if (enableAdditionalPartialTip) {
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

  const aspWells = propsForFields.aspirate_wells.value as string[]
  const dspWells = propsForFields.dispense_wells.value as string[]
  const numAspWells = aspWells.length
  const numDspWells = dspWells.length
  const [selectedValue, setSelectedValue] = useState(dropdownItem)
  const nozzle = 'A1'
  const getNozzleWellText = (): string => {
    switch (selectedValue) {
      case ROW:
      case COLUMN:
        const selectedValueText = selectedValue.toLowerCase() + 's'
        return t('nozzles_selected', {
          nozzleSelection: 'Left' + selectedValueText + ' nozzles',
          aspWells: numAspWells,
          dispWells: numDspWells,
          positionType: selectedValueText,
        })
      case ALL:
        return t('nozzles_selected', {
          nozzleSelection: 'All nozzles',
          aspWells: numAspWells,
          dispWells: numDspWells,
          positionType: 'wells',
        })
      case SINGLE:
        return t('nozzles_selected', {
          nozzleSelection: nozzle + ' nozzle',
          aspWells: numAspWells,
          dispWells: numDspWells,
          positionType: 'wells',
        })
      case PARTIAL:
        return t('nozzles_selected', {
          nozzleSelection: nozzle.length + ' nozzles',
          aspWells: numAspWells,
          dispWells: numDspWells,
          positionType: 'wells',
        })
      default:
        return t('no_nozzles_and_wells_selected')
    }
  }
  return (
    <>
      <Flex padding={padding}>
        {!enableAdditionalPartialTip ? (
          <DropdownMenu
            width="100%"
            error={errorToShow}
            dropdownType="neutral"
            filterOptions={options}
            title={getNozzleWellText()}
            currentOption={
              options.find(option => option.value === selectedValue) ??
              options[0]
            }
            onClick={value => {
              updateValue(value)
              setSelectedValue(value)
            }}
            tooltipText={tooltipContent}
          />
        ) : (
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
        )}
      </Flex>
      {isNozzleAndWellModalOpen ? (
        <>
          <NozzleAndWellSelectionModal
            showModal={setIsNozzleAndWellModalOpen}
            totalSteps={3}
            pipetteSpecs={pipetteSpecs}
            updateValue={updateValue}
            options={options}
            deckSetup={deckSetup}
            propsForFields={propsForFields}
            stepType={stepType}
          ></NozzleAndWellSelectionModal>
        </>
      ) : null}
    </>
  )
}
