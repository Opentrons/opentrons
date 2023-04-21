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
  ModuleType,
  ModuleModel,
  getPipetteNameSpecs,
  PipetteName,
  SPAN7_8_10_11_SLOT,
} from '@opentrons/shared-data'
import { Formik } from 'formik'
import { i18n } from '../../localization'
import { FlexModules } from './FlexModules'
import { FlexProtocolName } from './FlexProtocolName'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { mountSide, navPillTabListLength, pipetteSlot } from '../constant'
import { RoundTabs } from './RoundTab'
import { SelectPipetteOption } from './SelectPipette'
import { DeckSlot } from '../../types'

export interface FormModule {
  onDeck: boolean
  model: ModuleModel | null
  slot: DeckSlot
}
interface InitialValues {
  fields: {
    pndName: string
    pndOrgAuthor: string
    pndDescription: string
  }
  mountSide: string
  pipetteSelectionData: {
    firstPipette: {
      pipetteName: string
      mount: string
      tipRackList: any[]
      isSelected: boolean
    }
    secondPipette: {
      pipetteName: string
      mount: string
      tipRackList: any[]
      isSelected: boolean
    }
  }
  modulesByType: {
    magneticModuleType: FormModule
    temperatureModuleType: FormModule
    thermocyclerModuleType: FormModule
    heaterShakerModuleType: FormModule
  }
}

const getInitialValues: InitialValues = {
  fields: {
    pndName: '',
    pndOrgAuthor: '',
    pndDescription: '',
  },
  mountSide,
  pipetteSelectionData: {
    firstPipette: {
      pipetteName: '',
      mount: 'left',
      tipRackList: [],
      isSelected: false,
    },
    secondPipette: {
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
      model: null,
      slot: '1',
    },
    [TEMPERATURE_MODULE_TYPE]: {
      onDeck: false,
      model: null,
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

const newDummyFormPropsForTesting = {
  moduleType: 'heaterShakerModuleType',
  moduleOnDeck: {
    id: 'eded7d07-e12f-4742-be64-16a0a4dbb878:heaterShakerModuleType',
    model: 'heaterShakerModuleV1',
    type: 'heaterShakerModuleType',
    slot: '1',
    moduleState: {
      type: 'heaterShakerModuleType',
      targetTemp: null,
      targetSpeed: null,
      latchOpen: null,
    },
  },
  supportedModuleSlot: '1',
}

const selectComponent = (selectedTab: number, props: any): any => {
  function comp(selectedTab: number) {
    const { firstPipette, secondPipette } = pipetteSlot
    return selectedTab == 1 ? (
      <SelectPipetteOption formProps={props} pipetteName={firstPipette} />
    ) : (
      <SelectPipetteOption formProps={props} pipetteName={secondPipette} />
    )
  }

  switch (selectedTab) {
    case 0:
      return <FlexProtocolName formProps={props} />
    case 1:
    case 2:
      return comp(selectedTab)
    case 3:
      return <FlexModules formProps={props} />
    default:
      return null
  }
}

function FlexProtocolEditor(): JSX.Element {
  const [selectedTab, setTab] = useState<number>(0)

  // Next button click
  const handleNext = ({ selectedTab }: Props) => {
    const setTabNumber =
      selectedTab >= 0 && selectedTab < navPillTabListLength
        ? selectedTab + 1
        : selectedTab
    setTab(setTabNumber)
  }

  // Previous button click
  const handlePrevious = ({ selectedTab }: Props) => {
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
