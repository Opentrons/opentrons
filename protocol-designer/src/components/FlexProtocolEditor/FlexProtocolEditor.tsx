import React, { useState, useEffect } from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  Box,
  COLORS,
  BORDERS,
  SPACING,
  NewPrimaryBtn,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
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
  GRIPPER_V1,
  GRIPPER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { i18n } from '../../localization'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'
import { mountSide, navPillTabListLength, pipetteSlot } from './constant'
import { FlexRoundTab } from './FlexRoundTab'
import { DeckSlot } from '../../types'
import { FlexProtocolName, SelectPipetteOption } from './FlexPillForm'
import { FlexModules } from './FlexModules'

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
    gripperModuleType: FormModule
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
    [GRIPPER_MODULE_TYPE]: {
      onDeck: false,
      model: GRIPPER_V1,
      slot: '',
    },
  },
}

interface Props {
  selectedTab: number
}

const selectComponent = (selectedTab: number): JSX.Element | null => {
  const { left, right } = pipetteSlot
  switch (selectedTab) {
    case 0:
      return <FlexProtocolName />
    case 1:
      return (
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <SelectPipetteOption pipetteName={left} />
          <SelectPipetteOption pipetteName={right} />
        </Flex>
      )
    case 2:
      return <FlexModules />
    default:
      return null
  }
}

function FlexProtocolEditor(): JSX.Element {
  const [selectedTab, setTab] = useState<number>(0)
  const [disableNextButton, setDisableNextButton] = useState<boolean>(false)

  useEffect(() => {
    const initialValues = getInitialValues
    const errors = validateFields(initialValues)
    const isValid = Object.keys(errors).length === 0

    setDisableNextButton(!isValid)
  }, [selectedTab])

  const handleNext = ({ selectedTab }: Props): void => {
    const setTabNumber =
      selectedTab >= 0 && selectedTab < navPillTabListLength
        ? selectedTab + 1
        : selectedTab
    setTab(setTabNumber)
  }

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

  interface FormikErrors {
    leftPipette?: string
    rightPipette?: string
    leftTiprack?: string
    rightTiprack?: string
  }

  const validateFields = (values: InitialValues): FormikErrors => {
    const { pipettesByMount } = values
    const errors: FormikErrors = {}

    if (!pipettesByMount.left.pipetteName) {
      errors.leftPipette = `${i18n.t('flex.errors.first_pipette_not_selected')}`
    }

    if (!pipettesByMount.left.tipRackList.length) {
      errors.leftTiprack = `${i18n.t('flex.errors.tiprack_not_selected')}`
    }

    if (!pipettesByMount.right.pipetteName) {
      errors.rightPipette = `${i18n.t(
        'flex.errors.second_pipette_not_selected'
      )}`
    }

    if (
      pipettesByMount.right.pipetteName &&
      pipettesByMount.right.pipetteName !==
        `${i18n.t('flex.pipette_selection.LEAVE_SECOND_MOUNT_EMPTY_VALUE')}` &&
      !pipettesByMount.right.tipRackList.length
    ) {
      errors.rightTiprack = `${i18n.t('flex.errors.tiprack_not_selected')}`
    }

    return errors
  }

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
        <Formik
          enableReinitialize
          initialValues={getInitialValues}
          validateOnChange={true}
          validate={validateFields}
          onSubmit={(values, actions) => {
            console.log({ values })
          }}
        >
          {(props: { errors: any; isValid: any; handleSubmit: () => void }) => (
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
                  disabled={selectedTab === 1 && disableNextButton}
                >
                  <StyledText as="h3">{nextButton}</StyledText>
                </NewPrimaryBtn>
              </div>
            </form>
          )}
        </Formik>
      </Box>
    </Flex>
  )
}

export const FlexProtocolEditorComponent = FlexProtocolEditor
