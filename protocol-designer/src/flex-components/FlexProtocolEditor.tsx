import React, { useState } from 'react'
import {
  RoundTab,
  Flex,
  DIRECTION_COLUMN,
  Box,
  COLORS,
  BORDERS,
  SPACING,
  NewPrimaryBtn,
  CheckboxField
} from '@opentrons/components'
import {
  getIncompatiblePipetteNames,
  getLabwareDefURI,
  getLabwareDisplayName,
} from '@opentrons/shared-data'
import { Formik } from 'formik'
import reduce from 'lodash/reduce'
import { i18n } from '../localization'
import { FlexProtocolName } from './FlexProtocolName'
import styles from './FlexComponents.css'
import { StyledText } from './StyledText'
import { RadioSelect } from './RadioSelect'
import { useSelector } from 'react-redux'
import { getLabwareDefsByURI } from '../labware-defs/selectors'
import { DropdownOption } from '../../../../../components/src/forms/DropdownField'


const RoundTabs = (props: any): JSX.Element => {
  const { setCurrentTab, currentTab } = props
  const tabs = [
    {
      name: i18n.t('flex.name_and_description.title'),
      id: 1,
    },
    {
      name: i18n.t('flex.pipettes_selection.title'),
      id: 2,
    },
    {
      name: i18n.t('flex.modules_selection.title'),
      id: 3,
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
            <StyledText>{name}</StyledText>
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
      return <PipettesComponent formProps={props} />
    case 3:
      return <ModulesComponent />
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

  const getInitialValues = {
    fields: {
      pndName: '',
      pndOrgAuthor: '',
      pndDescription: '',
    },
    pipetteSelectionData: {
      firstPipette: {
        mount: "",
        tipRackList: []
      },
      secondPipette: {
        mount: "",
        tipRackList: []
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
                      {i18n.t('flex.round_tabs.previous')}
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
                    {nextButton}
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

const PipettesComponent = ({ formProps }: any) => {
  const { values: { pipetteSelectionData } } = formProps


  const allLabware = useSelector(getLabwareDefsByURI)
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
        },
      ]
    },
    []
  )


  // console.log("tiprackOptions", tiprackOptions)
  // console.log("allLabware", allLabware);


  return (
    <>
      <StyledText as={"h1"}>Pipettes</StyledText>
      <RadioSelect propsData={formProps} pipetteName={"pipetteSelectionData.firstPipette.mount"} pipetteType={pipetteSelectionData.firstPipette.mount} />
      <br />
      {/* <RadioSelect propsData={formProps} pipetteName={"pipetteSelectionData.secondPipette"} pipetteType={pipetteSelectionData.secondPipette} /> */}

      <TipRackOptions propsData={formProps} tiprackOptionsProps={tiprackOptions} />
    </>
  )
}


const TipRackOptions = ({ propsData, tiprackOptionsProps }: any) => {
  const [selected, setSelected] = useState<Array<any>>([])

  // values.pipetteSelectionData.firstPipette.tipRackList


  const handleNameChange = (setFieldValue: (pipetteSelectionData: string, value: any) => void) => {
    console.log("setFieldValue",selected,)
    setFieldValue("pipetteSelectionData.firstPipette.tipRackList", selected)
  };
  console.log("propsData",propsData.values)
  return <>
    {
      tiprackOptionsProps.map(({ name, value }: any, index: number) => {
        const isChecked = selected.some(obj => obj.hasOwnProperty(name));;
        return <CheckboxField
          key={index}
          label={name}
          name={name}
          onChange={(e: any) => {
            const { name, checked } = e.currentTarget
            const pushData = { [name]: checked }
            setSelected([...selected, pushData])
            handleNameChange(propsData.setFieldValue)
          }}
          value={isChecked}
        ></CheckboxField>
      })
    }
  </>
}

const ModulesComponent = (): JSX.Element => {
  return <h1>Modules Component</h1>
}

export const FlexProtocolEditor = FlexProtocolEditorComponent
