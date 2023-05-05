import React, { useState } from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  Box,
  COLORS,
  BORDERS,
  SPACING,
  NewPrimaryBtn,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
  HEATERSHAKER_MODULE_TYPE,
  ModuleModel,
  SPAN7_8_10_11_SLOT,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_V2,
} from '@opentrons/shared-data'
import { Formik } from 'formik'
import { i18n } from '../../localization'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { mountSide, navPillTabListLength, pipetteSlot } from './constant'
import { FlexRoundTab } from './FlexRoundTab'
import { DeckSlot } from '../../types'
import { FlexProtocolName, SelectPipetteOption } from './FlexPillForm'
import { FlexModules } from './FlexModules'
import * as Yup from 'yup'

export interface FormModule {
  onDeck: boolean
  model: ModuleModel | null
  slot: DeckSlot
}

export interface FormPipette {
  pipetteName: string | null | undefined
  mount: string | null | undefined
  tipRackList: any[]
  isSelected: boolean
}
export interface FormPipettesByMount {
  left: FormPipette
  right: FormPipette
}
export interface InitialValues {
  fields: { name: string; author: string; description: string }
  mountSide: string
  pipettesByMount: FormPipettesByMount
  modulesByType: {
    magneticModuleType: FormModule
    temperatureModuleType: FormModule
    thermocyclerModuleType: FormModule
    heaterShakerModuleType: FormModule
  }
}

const validationSchema = Yup.object().shape({
  fields: Yup.object().shape({
    name: Yup.string().required('Name is required'),
  }),
  mountSide: Yup.string().required('Mount side is required'),
  pipettesByMount: Yup.object().shape({
    left: Yup.object().shape({
      pipetteName: Yup.string().required('First pipette is required'),
      tipRackList: Yup.array().min(
        1,
        'Select at least one tip rack for first pipette'
      ),
    }),
    right: Yup.object().shape({
      pipetteName: Yup.string().required('Second pipette is required'),
      tipRackList: Yup.array().min(
        1,
        'Select at least one tip rack for second pipette'
      ),
    }),
  }),
})

const getInitialValues: InitialValues = {
  fields: {
    name: '',
    author: '',
    description: '',
  },
  mountSide,
  pipettesByMount: {
    left: {
      pipetteName: '',
      mount: 'left',
      tipRackList: [],
      isSelected: false,
    },
    right: {
      pipetteName: '',
      mount: 'right',
      tipRackList: [],
      isSelected: false,
    },
  },
  modulesByType: {
    [HEATERSHAKER_MODULE_TYPE]: {
      onDeck: false,
      model: HEATERSHAKER_MODULE_V1,
      slot: '1',
    },
    [MAGNETIC_MODULE_TYPE]: {
      onDeck: false,
      model: MAGNETIC_MODULE_V1,
      slot: '4',
    },
    [TEMPERATURE_MODULE_TYPE]: {
      onDeck: false,
      model: TEMPERATURE_MODULE_V2,
      slot: '3',
    },
    [THERMOCYCLER_MODULE_TYPE]: {
      onDeck: false,
      model: THERMOCYCLER_MODULE_V1, // Default to GEN1 for TC only
      slot: SPAN7_8_10_11_SLOT,
    },
  },
}

interface Props {
  selectedTab: number
}

const selectComponent = (selectedTab: number): JSX.Element | null => {
  const twoPipetteOption = (selectedTab: number): JSX.Element => {
    const { left, right } = pipetteSlot
    return selectedTab === 1 ? (
      <SelectPipetteOption pipetteName={left} />
    ) : (
      <SelectPipetteOption pipetteName={right} />
    )
  }

  switch (selectedTab) {
    case 0:
      return <FlexProtocolName />
    case 1:
    case 2:
      return twoPipetteOption(selectedTab)
    case 3:
      return <FlexModules />
    default:
      return null
  }
}

function FlexProtocolEditor(): JSX.Element {
  const [selectedTab, setTab] = useState<number>(0)
  // Next button click
  const handleNext = ({ selectedTab }: Props): void => {
    const setTabNumber =
      selectedTab >= 0 && selectedTab < navPillTabListLength
        ? selectedTab + 1
        : selectedTab
    setTab(setTabNumber)
  }

  // Previous button click
  const handlePrevious = ({ selectedTab }: Props): void => {
    const setTabNumber =
      selectedTab > 0 && selectedTab <= navPillTabListLength
        ? selectedTab - 1
        : selectedTab
    setTab(setTabNumber)
  }

  const nextButton =
    selectedTab === navPillTabListLength
      ? i18n.t('flex.round_tabs.go_to_liquids_page')
      : i18n.t('flex.round_tabs.next')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex>
        <FlexRoundTab setCurrentTab={setTab} currentTab={selectedTab} />
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
            validateOnChange={true}
            validationSchema={validationSchema}
            onSubmit={(values, actions) => {
              console.log({ values })
            }}
          >
            {(props: {
              handleSubmit: () => void
              errors: any
              isValid: any
            }) => (
              <form onSubmit={props.handleSubmit}>
                <section className={styles.editor_form}>
                  {selectComponent(selectedTab)}
                </section>
                <div className={styles.flex_round_tabs_button_wrapper}>
                  {selectedTab !== 0 && (
                    <NewPrimaryBtn
                      tabIndex={5}
                      onClick={() => handlePrevious({ selectedTab })}
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
                    onClick={() => handleNext({ selectedTab })}
                    className={
                      selectedTab !== 0
                        ? styles.flex_round_tabs_button_50p
                        : styles.flex_round_tabs_button_100p
                    }
                    // disabled={
                    //   !Boolean(props.isValid) ||
                    //   !(Object.values(props.errors).length === 0)
                    // }
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

export const FlexProtocolEditorComponent = FlexProtocolEditor
