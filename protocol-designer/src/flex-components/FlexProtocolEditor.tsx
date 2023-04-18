import React, { useState } from 'react'
import {
  RoundTab,
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Box,
  COLORS,
  BORDERS,
  SPACING,
  NewPrimaryBtn,
  CheckboxField,
  RadioGroup,
  OutlineButton
} from '@opentrons/components'
import cx from 'classnames'
import {
  getIncompatiblePipetteNames,
  getLabwareDefURI,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import { Formik } from 'formik'
import reduce from 'lodash/reduce'
import { i18n } from '../localization'
import { FlexModules } from './FlexModules'
// import { FlexPipettes } from './FlexPipettes'
import { FlexProtocolName } from './FlexProtocolName'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { RadioSelect } from './RadioSelect'
import { useDispatch, useSelector } from 'react-redux'
import { getLabwareDefsByURI } from '../labware-defs/selectors'
import { DropdownOption } from '../../../../../components/src/forms/DropdownField'
import { createCustomTiprackDef } from '../labware-defs/actions'

const blockedTipRackListForFlex: string[] = [
  '(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 1000 µL',
  '(Retired) Eppendorf epT.I.P.S. 96 Tip Rack 10 µL',
  '(Retired) GEB 96 Tip Rack 1000 µL',
  '(Retired) GEB 96 Tip Rack 10 µL',
  'Opentrons 96 Filter Tip Rack 10 µL',
  'Opentrons 96 Filter Tip Rack 20 µL',
  'Opentrons 96 Tip Rack 1000 µL',
  'Opentrons 96 Tip Rack 10 µL',
  'Opentrons 96 Tip Rack 20 µL',
  'Opentrons 96 Tip Rack 300 µL',
  '(Retired) TipOne 96 Tip Rack 200 µL',
];



const customTiprackOption: { name: string, value: string } = { name: "Custom Tiprack", value: "custome_tiprack" };


const RoundTabs = (props: any): JSX.Element => {
  const { setCurrentTab, currentTab } = props
  const tabs = [
    {
      name: i18n.t('flex.name_and_description.name'),
      id: 1,
    },
    {
      name: `First ${i18n.t('flex.pipettes_selection.title')}`,
      id: 2,
    },
    {
      name: `Second ${i18n.t('flex.pipettes_selection.title')}`,
      id: 3,
    },
    {
      name: i18n.t('flex.modules_selection.title'),
      id: 4,
    },
  ]

  return (
    <>
      {tabs.map(({ name, id }, index) => {
        return (
          <RoundTab
            key={index}
            isCurrent={currentTab === id}
            onClick={() => setCurrentTab(id)}
          >
            <StyledText as="h4">{name}</StyledText>
          </RoundTab>
        )
      })}
    </>
  )
}

const selectComponent = (selectedTab: Number, props: any): any => {
  switch (selectedTab) {
    case 1:
      return <FlexProtocolName formProps={props} />
    case 2:
      return <FirstPipettesComponent formProps={props} />
    case 3:
      return <SecondPipettesComponent formProps={props} />
    case 4:
      return <FlexModules formProps={props} />
    default:
      return null
  }
}

function FlexProtocolEditorComponent(): JSX.Element {
  const [selectedTab, setTab] = useState<number>(1)

  const handleNext = (selectedTab: number): any => {
    const setTabNumber =
      selectedTab > 0 && selectedTab < 3 ? selectedTab + 1 : selectedTab
    setTab(setTabNumber)
  }
  const handlePrevious = (selectedTab: number): any => {
    const setTabNumber =
      selectedTab > 1 && selectedTab <= 3 ? selectedTab - 1 : selectedTab
    setTab(setTabNumber)
  }

  const nextButton =
    selectedTab === 3
      ? i18n.t('flex.round_tabs.go_to_liquids_page')
      : i18n.t('flex.round_tabs.next')

  const mountSide: any = [{
    name: "Left Mount",
    value: "left"
  },
  {
    name: "Right Mount",
    value: "right",
  }]

  const getInitialValues = {
    fields: {
      pndName: '',
      pndOrgAuthor: '',
      pndDescription: '',
    },
    mountSide,
    pipetteSelectionData: {
      firstPipette: {
        pipetteName: "",
        mount: "left",
        tipRackList: [],
        isSelected: false,
      },
      secondPipette: {
        pipetteName: "",
        mount: "",
        tipRackList: [],
        isSelected: false,
      }
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex>
        <RoundTabs setCurrentTab={setTab} currentTab={selectedTab} />
      </Flex>
      <Box
        backgroundColor={COLORS.white}
        border={BORDERS.lineBorder}
        // remove left upper corner border radius when first tab is active
        borderRadius={selectedTab === 1 ? '0' : BORDERS.radiusSoftCorners}
        padding={SPACING.spacing4}
      >
        {
          <Formik
            enableReinitialize
            initialValues={getInitialValues}
            validateOnChange={false}
            onSubmit={(values, actions) => {
              console.log({ values, actions })
            }}
          >
            {(props: any) => (
              <form onSubmit={props.handleSubmit}>
                <section className={styles.editor_form}>
                  {selectComponent(selectedTab, props)}
                </section>
                <div className={styles.flex_round_tabs_button_wrapper}>
                  {selectedTab !== 1 && (
                    <NewPrimaryBtn
                      tabIndex={5}
                      onClick={() => handlePrevious(selectedTab)}
                      className={styles.flex_round_tabs_button_50p}
                    >
                      <StyledText as="h3">
                        {i18n.t('flex.round_tabs.previous')}
                      </StyledText>
                    </NewPrimaryBtn>
                  )}
                  <NewPrimaryBtn
                    tabIndex={4}
                    type="submit"
                    onClick={() => handleNext(selectedTab)}
                    className={
                      selectedTab !== 1
                        ? styles.flex_round_tabs_button_50p
                        : styles.flex_round_tabs_button_100p
                    }
                  >
                    <StyledText as="h3">{nextButton}</StyledText>
                  </NewPrimaryBtn>
                </div>
              </form>
            )}
          </Formik>
        }
      </Box>
    </Flex>
  )
}

const FirstPipettesComponent = ({ formProps }: any) => {
  const { values: { pipetteSelectionData } } = formProps
  let tiprackOptions = getFlexTiprackOptions()
  tiprackOptions.push(customTiprackOption)
  const is96ChannelSelected = checkSelectedPipette(pipetteSelectionData.firstPipette.pipetteName)
  let className = cx({ disable_mount_option: is96ChannelSelected });
  return (
    <>
      <StyledText as={"h1"}>Pipettes</StyledText>
      {
        <>
          <StyledText as={"p"}>Note: 96-channel take up both mounts and requires a tiprack adapter</StyledText>
          <RadioSelect
            propsData={formProps}
            pipetteName={"pipetteSelectionData.firstPipette.pipetteName"}
            pipetteType={pipetteSelectionData.firstPipette.pipetteName} />
          <hr />
          <Flex className={styles[className]}>
            <SelectPipetteMount propsData={formProps} pipetteName={"firstPipette"} />
          </Flex>
          {
            channel96SelectionNote(is96ChannelSelected)
          }
          <hr />
          <TipRackOptions
            propsData={formProps}
            tiprackOptionsProps={tiprackOptions}
            pipetteName={"firstPipette"} />
        </>
      }
    </>
  )
}

// Second Pipette
const SecondPipettesComponent = ({ formProps }: any) => {
  const { values: { pipetteSelectionData } } = formProps
  let tiprackOptions = getFlexTiprackOptions()
  tiprackOptions.push(customTiprackOption)

  const is96ChannelSelected = checkSelectedPipette(pipetteSelectionData.secondPipette.pipetteName)
  let className = cx({ disable_mount_option: is96ChannelSelected });

  return (
    <>
      <StyledText as={"h1"}>Pipettes</StyledText>
      {
        <>
          <RadioSelect
            propsData={formProps}
            pipetteName={"pipetteSelectionData.secondPipette.pipetteName"}
            pipetteType={pipetteSelectionData.secondPipette.pipetteName} />
          <hr />
          <Flex className={styles[className]}>
            <SelectPipetteMount propsData={formProps} pipetteName={"secondPipette"} />
          </Flex>
          {
            channel96SelectionNote(is96ChannelSelected)
          }
          <hr />
          <TipRackOptions
            propsData={formProps}
            tiprackOptionsProps={tiprackOptions}
            pipetteName={"secondPipette"} />
        </>
      }
    </>
  )
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

const TipRackOptions = ({ propsData, tiprackOptionsProps, pipetteName }: any) => {
  const { values: { pipetteSelectionData } } = propsData
  const dispatch = useDispatch()
  const [selected, setSelected] = useState<Array<any>>([])
  const [customTipRack, setCustomTipRack] = useState()
  const handleNameChange = (selected: any) => {
    propsData.setFieldValue(`pipetteSelectionData.${pipetteName}.tipRackList`, selected);
  };

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

const ModulesComponent = (): JSX.Element => {
  return <h1>Modules Component</h1>
}

export const FlexProtocolEditor = FlexProtocolEditorComponent




function checkSelectedPipette(pipetteName: any) {
  return pipetteName === "p1000_96"
}

function channel96SelectionNote(is96ChannelSelected: boolean) {
  return is96ChannelSelected && <StyledText as={'p'}>Note: 96 Channel occupies both the mount.</StyledText>
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

