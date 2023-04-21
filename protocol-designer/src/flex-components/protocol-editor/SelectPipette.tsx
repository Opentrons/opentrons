import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { getLabwareDefsByURI } from '../../labware-defs/selectors'
import {
  DropdownOption,
  Flex,
  RadioGroup,
  OutlineButton,
  CheckboxField,
} from '@opentrons/components'
import { reduce } from 'lodash'
import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'
import {
  blockMount,
  blockedTipRackListForFlex,
  customTiprackOption,
  fontSize14,
  pipetteSlot,
} from '../constant'
import { StyledText } from './StyledText'
import { RadioSelect } from './RadioSelect'
import { i18n } from '../../localization'
import { createCustomTiprackDef } from '../../labware-defs/actions'
import styles from './FlexComponents.css'

interface SelectPipetteOptionProps {
  formProps: any
  pipetteName: string
}

export const SelectPipetteOption: React.FC<SelectPipetteOptionProps> = ({
  formProps,
  pipetteName,
}) => {
  const {
    values: { pipetteSelectionData },
  } = formProps

  const is96ChannelSelected = checkSelectedPipette(
    pipetteSelectionData[pipetteName].pipetteName
  )
  const className = cx({ disable_mount_option: is96ChannelSelected })

  const pipetteHeaderText =
    pipetteSlot.firstPipette === pipetteName
      ? i18n.t('flex.pipette_selection.choose_first_pipette')
      : i18n.t('flex.pipette_selection.choose_second_pipette')
  return (
    <>
      <StyledText as={'h1'}>{pipetteHeaderText}</StyledText>
      {
        <>
          <StyledText as={'p'}>
            {i18n.t('flex.pipette_selection.pipette_96_selection_note')}
          </StyledText>
          <RadioSelect
            propsData={formProps}
            pipetteName={`pipetteSelectionData.${pipetteName}.pipetteName`}
            pipetteType={pipetteSelectionData[pipetteName].pipetteName}
          />
          <hr />
          <Flex className={styles[className]}>
            <SelectPipetteMount
              propsData={formProps}
              pipetteName={pipetteName}
            />
          </Flex>
          {channel96SelectionNote(is96ChannelSelected)}
          <hr />
          <TipRackOptions propsData={formProps} pipetteName={pipetteName} />
        </>
      }
    </>
  )
}

const checkSelectedPipette = (pipetteName: any): any => {
  return blockMount.includes(pipetteName)
}

const channel96SelectionNote = (is96ChannelSelected: boolean): any => {
  return (
    is96ChannelSelected && (
      <StyledText as={'p'}>
        {i18n.t('flex.pipette_selection.pippette_ocuupies_both_mount')}
      </StyledText>
    )
  )
}

const SelectPipetteMount = ({ propsData, pipetteName }: any): JSX.Element => {
  const {
    values: { pipetteSelectionData },
  } = propsData
  return (
    <>
      {
        <RadioGroup
          inline
          name={`pipetteSelectionData.${pipetteName}.mount`}
          value={pipetteSelectionData[pipetteName].mount}
          options={propsData.values.mountSide}
          onChange={propsData.handleChange}
        />
      }
    </>
  )
}

const getFlexTiprackOptions = (allLabware: any): any => {
  type Values<T> = T[keyof T]
  const tiprackOptions = reduce<typeof allLabware, DropdownOption[]>(
    allLabware,
    (acc, def: Values<typeof allLabware>) => {
      if (def.metadata.displayCategory !== 'tipRack') return acc
      return [
        ...acc,
        {
          name: getLabwareDisplayName(def),
          value: getLabwareDefURI(def),
          namespace: def.namespace,
        },
      ]
    },
    []
  )
  const filteredTiprackOptions = tiprackOptions.filter(
    ({ name }): any => !blockedTipRackListForFlex.includes(name)
  )
  return filteredTiprackOptions
}

const TipRackOptions = ({ propsData, pipetteName }: any): JSX.Element => {
  const allLabware = useSelector(getLabwareDefsByURI)
  const tiprackOptions = getFlexTiprackOptions(allLabware)
  tiprackOptions.push(customTiprackOption)
  const dispatch = useDispatch()
  const {
    values: { pipetteSelectionData },
  } = propsData
  const tipRackListDataFromProps = pipetteSelectionData[pipetteName].tipRackList
  const [selected, setSelected] = useState<any>([])
  const [customTipRack, setCustomTipRack] = useState(false)
  const customTiprackFilteredData = [...tiprackOptions].filter(
    (i: any) =>
      i.namespace !== 'opentrons' && i.namespace !== customTiprackOption.value
  )
  const opentronsFlexTiprackData = [...tiprackOptions].filter(
    (i: any) =>
      i.namespace === 'opentrons' || i.namespace === customTiprackOption.value
  )

  const handleNameChange = (selected: string[]): any => {
    propsData.setFieldValue(
      `pipetteSelectionData.${pipetteName}.tipRackList`,
      selected
    )
  }

  useEffect(() => {
    setSelected(tipRackListDataFromProps)
  }, [tipRackListDataFromProps])

  return (
    <>
      {opentronsFlexTiprackData.map(({ name }: any, index: number) => {
        const isChecked = selected.includes(name)
        return (
          <CheckboxField
            key={index}
            label={name}
            name={name}
            value={isChecked}
            onChange={(e: any) => {
              const { name, checked } = e.currentTarget
              if (checked) {
                const tiprackCheckedData = [...selected, ...[name]]
                setSelected(tiprackCheckedData)
                handleNameChange(tiprackCheckedData)
                setCustomTipRack(true)
              } else {
                const indexToRemove = selected.indexOf(name)
                if (indexToRemove !== -1) {
                  selected.splice(indexToRemove, 1)
                }
                setSelected(selected)
                handleNameChange(selected)
                if (name === customTiprackOption.name) {
                  setCustomTipRack(false)
                }
              }
            }}
          ></CheckboxField>
        )
      })}
      {customTiprackFilteredData.length > 0 && (
        <ShowCustomTiprackList customTipRackProps={customTiprackFilteredData} />
      )}
      {customTipRack &&
        customFileUpload(customTipRack, customTiprackFilteredData, dispatch)}
    </>
  )
}

function customFileUpload(
  customTipRack: boolean,
  customTiprackFilteredData: any[],
  dispatch: any
): JSX.Element {
  return (
    <OutlineButton
      Component="label"
      className={styles.custom_tiprack_upload_file}
    >
      {customTipRack && customTiprackFilteredData.length === 0
        ? i18n.t('button.upload_custom_tip_rack')
        : i18n.t('button.add_another_custom_tiprack')}
      <input
        type="file"
        onChange={e => {
          console.log('uploaded file name', e?.target?.files?.[0]?.name)
          dispatch(createCustomTiprackDef(e))
        }}
      />
    </OutlineButton>
  )
}

function ShowCustomTiprackList({ customTipRackProps }: any): any {
  const removeCustomTipRackFile = (fileName: string): void => {
    console.log('Removing filename from custom tiprack', fileName)
  }

  return (
    <Flex className={styles.filterData}>
      {customTipRackProps.map(({ name }: any, index: number) => {
        return (
          <Flex className={styles.custom_tiprack} key={index}>
            <StyledText as="p" className={fontSize14}>
              {name}
            </StyledText>
            {'   '}
            <StyledText
              as="p"
              className={cx(styles.remove_button, fontSize14)}
              onClick={() => removeCustomTipRackFile(name)}
            >
              {i18n.t('button.remove_custom_tiprack')}
            </StyledText>
          </Flex>
        )
      })}
    </Flex>
  )
}
