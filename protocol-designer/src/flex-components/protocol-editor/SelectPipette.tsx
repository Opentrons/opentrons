import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { getLabwareDefsByURI } from '../../labware-defs/selectors'
import { DropdownOption, Flex, RadioGroup, OutlineButton, CheckboxField } from '@opentrons/components'
import { reduce } from 'lodash'
import { getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'
import { blockedTipRackListForFlex, customTiprackOption } from '../constant'
import { StyledText } from './StyledText'
import { RadioSelect } from './RadioSelect'
import { i18n } from '../../localization'
import { createCustomTiprackDef } from '../../labware-defs/actions'
import styles from './FlexComponents.css'

interface SelectPipetteOptionProps {
    formProps: any;
    pipetteName: string;
}

export const SelectPipetteOption: React.FC<SelectPipetteOptionProps> = ({ formProps, pipetteName }) => {
    const { values: { pipetteSelectionData } } = formProps

    let tiprackOptions = getFlexTiprackOptions()
    tiprackOptions.push(customTiprackOption)

    const is96ChannelSelected = checkSelectedPipette(pipetteSelectionData[pipetteName].pipetteName)
    let className = cx({ disable_mount_option: is96ChannelSelected });

    return (
        <>
            <StyledText as={"h1"}>Pipettes</StyledText>
            {
                <>
                    <StyledText as={"p"}>Note: 96-channel take up both mounts and requires a tiprack adapter</StyledText>
                    <RadioSelect
                        propsData={formProps}
                        pipetteName={`pipetteSelectionData.${pipetteName}.pipetteName`}
                        pipetteType={pipetteSelectionData[pipetteName].pipetteName} />
                    <hr />
                    <Flex className={styles[className]}>
                        <SelectPipetteMount propsData={formProps} pipetteName={pipetteName} />
                    </Flex>
                    {
                        channel96SelectionNote(is96ChannelSelected)
                    }
                    <hr />
                    <TipRackOptions
                        propsData={formProps}
                        tiprackOptionsProps={tiprackOptions}
                        tiprackData={pipetteSelectionData[pipetteName].tipRackList}
                        pipetteName={pipetteName} />
                </>
            }
        </>
    )
}

function checkSelectedPipette(pipetteName: any) {
    return pipetteName === "p1000_96"
}

function channel96SelectionNote(is96ChannelSelected: boolean) {
    return is96ChannelSelected && <StyledText as={'p'}>Note: 96 Channel occupies both the mount.</StyledText>
}

const SelectPipetteMount = ({ propsData, pipetteName }: any) => {
    const { values: { pipetteSelectionData } } = propsData
    return <>
        {
            <RadioGroup
                inline={styles.pipette_slection_mount}
                name={`pipetteSelectionData.${pipetteName}.mount`}
                value={pipetteSelectionData[pipetteName].mount}
                options={propsData.values.mountSide}
                onChange={propsData.handleChange} />
        }
    </>
}

function getFlexTiprackOptions() {
    const allLabware = useSelector(getLabwareDefsByURI)
    type Values<T> = T[keyof T]

    let tiprackOptions = reduce<typeof allLabware, DropdownOption[]>(
        allLabware,
        (acc, def: Values<typeof allLabware>) => {
            if (def.metadata.displayCategory !== 'tipRack')
                return acc
            return [
                ...acc,
                {
                    name: getLabwareDisplayName(def),
                    value: getLabwareDefURI(def),
                },
            ]
        },
        []
    )
    tiprackOptions = tiprackOptions.filter(({ name }): any => !blockedTipRackListForFlex.includes(name))
    return tiprackOptions
}


const TipRackOptions = ({ propsData, tiprackOptionsProps, tiprackData, pipetteName }: any) => {
    const { values: { pipetteSelectionData } } = propsData
    const tipRackListDataFromProps = pipetteSelectionData[pipetteName].tipRackList
    const dispatch = useDispatch()
    const [selected, setSelected] = useState<Array<any>>([])
    const [customTipRack, setCustomTipRack] = useState()
    const handleNameChange = (selected: any) => {
        propsData.setFieldValue(`pipetteSelectionData.${pipetteName}.tipRackList`, selected);
    };

    useEffect(() => {
        setSelected(tipRackListDataFromProps)
    }, [tipRackListDataFromProps])

    return <>
        {
            tiprackOptionsProps.map(({ name, value }: any, index: number) => {
                const isChecked = selected.includes(name);
                return <CheckboxField
                    key={index}
                    label={name}
                    name={name}
                    value={isChecked}
                    onChange={(e: any) => {
                        const { name, checked } = e.currentTarget
                        if (checked) {
                            if (name !== "Custom Tiprack") {
                                let tiprackCheckedData = [...selected, ...[name]]
                                setSelected(tiprackCheckedData)
                                handleNameChange(tiprackCheckedData)
                            } else {
                                setCustomTipRack(true)
                            }
                        } else {
                            const indexToRemove = selected.indexOf(name);
                            if (indexToRemove !== -1) {
                                selected.splice(indexToRemove, 1);
                            }
                            setSelected(selected)
                            handleNameChange(selected)
                            if (name === "Custom Tiprack") {
                                setCustomTipRack(false)
                            }
                        }
                    }}
                ></CheckboxField>
            })
        }
        {customTipRack && <OutlineButton Component="label" className={styles.custom_tiprack_upload_file}>
            {i18n.t('button.upload_custom_tip_rack')}
            <input type="file" onChange={e => {
                console.log("uploaded file name", e?.target?.files?.[0]?.name)
                dispatch(createCustomTiprackDef(e))
            }} />
        </OutlineButton>}
    </>
}