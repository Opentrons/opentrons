import React, { useState } from 'react'
import assert from 'assert'
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
import { FlexModules } from './FlexModules'
import { FlexProtocolName } from './FlexProtocolName'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { mountSide, navPillTabListLength, pipetteSlot } from '../constant'
import { RoundTabs } from './RoundTab'
import { SelectPipetteOption } from './SelectPipette'
import { DeckSlot } from '../../types'
import { useDispatch } from 'react-redux'
import { PipetteFieldsData } from '../../components/modals/FilePipettesModal'
import { reduce } from 'lodash'

import { actions as loadFileActions } from '../../load-file'

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

const selectComponent = (selectedTab: number, props: any): any => {
  const twoPipetteOption = (selectedTab: number): any => {
    const { left, right } = pipetteSlot
    return selectedTab === 1 ? (
      <SelectPipetteOption pipetteName={left} />
    ) : (
      <SelectPipetteOption pipetteName={right} />
    )
  }

  switch (selectedTab) {
    case 0:
      return <FlexProtocolName formProps={props} />
    case 1:
    case 2:
      return twoPipetteOption(selectedTab)
    case 3:
      return <FlexModules formProps={props} />
    default:
      return null
  }
}

function FlexProtocolEditor(props: any): JSX.Element {
  const { onSave } = props
  const [selectedTab, setTab] = useState<number>(0)
  const dispatch = useDispatch()
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
              console.log({ values })
              // const newProtocolFields = values.fields
              // const pipettes = reduce<FormPipettesByMount, PipetteFieldsData[]>(
              //   values.pipettesByMount,
              //   (acc, formPipette: FormPipette, mount): PipetteFieldsData[] => {
              //     assert(
              //       mount === 'left' || mount === 'right',
              //       `invalid mount: ${mount}`
              //     ) // this is mostly for flow
              //     // @ts-expect-error(sa, 2021-6-21): TODO validate that pipette names coming from the modal are actually valid pipette names on PipetteName type
              //     return formPipette &&
              //       formPipette.pipetteName &&
              //       formPipette.tipRackList &&
              //       (mount === 'left' || mount === 'right')
              //       ? [
              //           ...acc,
              //           {
              //             mount,
              //             name: formPipette.pipetteName,
              //             tiprackDefURI: formPipette.tipRackList,
              //           },
              //         ]
              //       : acc
              //   },
              //   []
              // )

              // //  To check code output
              // const modules: any = []
              // selectedTab === 2 &&
              //   onSave({ modules, newProtocolFields, pipettes })
              // selectedTab === 4 && dispatch(loadFileActions.saveProtocolFile())
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
