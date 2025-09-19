import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  EmptySelectorButton,
  Flex,
  FLEX_MAX_CONTENT,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  RadioButton,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { uuid } from '@opentrons/step-generation'

import { HandleEnter, LINK_BUTTON_STYLE } from '../../components/atoms'
import { BasicsButtons } from '../../components/molecules'
import { PipetteInfoItem, SelectPipetteModal } from '../../components/organisms'
import { WizardBody } from './WizardBody'

import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type { Fixtures } from '../../components/organisms'
import type { Gen, PipetteType, WizardTileProps } from './types'

export function SelectBasics(props: WizardTileProps): JSX.Element {
  const { setValue, proceed, watch } = props
  const { t } = useTranslation(['onboarding', 'shared'])
  const [mount, setMount] = useState<PipetteMount>('left')
  const [pipetteModal, openPipetteModal] = useState<boolean>(false)
  const [pipetteGen, setPipetteGen] = useState<Gen | 'flex'>('flex')
  const [pipetteVolume, setPipetteVolume] = useState<string | null>(null)
  const [selectedPipetteName, setSelectedPipetteName] = useState<string | null>(
    null
  )
  const [pipetteType, setPipetteType] = useState<PipetteType | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  const fields = watch('fields')
  const pipettesByMount = watch('pipettesByMount')
  const fixtures = watch('fixtures')
  const modules = watch('modules')
  const hasGripper = watch('hasGripper')
  const hasThermocycer = watch('hasThermocycler')
  const hasWasteChute = watch('hasWasteChute')

  const robotType = fields?.robotType
  const has96Channel = pipettesByMount.left.pipetteName === 'p1000_96'

  const targetPipetteMount =
    pipettesByMount.left.pipetteName == null ||
    pipettesByMount.left.tiprackDefURI == null
      ? 'left'
      : 'right'
  const noPipette =
    (pipettesByMount.left.pipetteName == null ||
      pipettesByMount.left.tiprackDefURI == null) &&
    (pipettesByMount.right.pipetteName == null ||
      pipettesByMount.right.tiprackDefURI == null)

  const isDisabled =
    robotType == null ||
    noPipette ||
    (robotType === FLEX_ROBOT_TYPE &&
      (hasGripper == null || hasThermocycer == null || hasWasteChute == null))

  const resetPipetteFields = (): void => {
    setPipetteType(null)
    setPipetteGen('flex')
    setPipetteVolume(null)
  }

  const resetPipettes = (): void => {
    setValue(`pipettesByMount.right.pipetteName`, undefined)
    setValue(`pipettesByMount.right.tiprackDefURI`, undefined)
    setValue(`pipettesByMount.left.pipetteName`, undefined)
    setValue(`pipettesByMount.left.tiprackDefURI`, undefined)
    resetPipetteFields()
  }

  let subStepNumber = 1
  if (robotType != null && noPipette) {
    subStepNumber = 2
  } else if (!noPipette) {
    subStepNumber = 3
  }

  const handleScrollToBottom = (): void => {
    if (ref.current != null) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      })
    }
  }

  useEffect(() => {
    handleScrollToBottom()
  }, [
    hasGripper,
    hasThermocycer,
    hasWasteChute,
    selectedPipetteName,
    robotType,
  ])

  const handleSwapMounts = (): void => {
    const leftPipetteName = pipettesByMount.left.pipetteName
    const rightPipetteName = pipettesByMount.right.pipetteName
    const leftTiprackDefURI = pipettesByMount.left.tiprackDefURI
    const rightTiprackDefURI = pipettesByMount.right.tiprackDefURI

    setValue('pipettesByMount.left.pipetteName', rightPipetteName)
    setValue('pipettesByMount.right.pipetteName', leftPipetteName)
    setValue('pipettesByMount.left.tiprackDefURI', rightTiprackDefURI)
    setValue('pipettesByMount.right.tiprackDefURI', leftTiprackDefURI)
  }

  const flexTrashFixture: Fixtures = {
    [uuid()]: {
      cutoutId: 'cutoutA3',
      name: 'trashBin',
      cutoutFixtureId: 'trashBinAdapter',
    },
  }
  const ot2TrashFixture: Fixtures = {
    [uuid()]: {
      cutoutId: 'cutout12',
      name: 'trashBin',
      cutoutFixtureId: 'fixedTrashSlot',
    },
  }

  const handlSelectWasteChute = (value: boolean): void => {
    if (value) {
      // If adding wasteChute, remove trashBin
      const updatedFixtures = Object.fromEntries(
        Object.entries(fixtures).filter(([_, val]) => val.name !== 'trashBin')
      )
      updatedFixtures[uuid()] = {
        cutoutId: WASTE_CHUTE_CUTOUT,
        name: 'wasteChute',
        cutoutFixtureId: 'wasteChuteRightAdapterNoCover',
      }

      setValue('fixtures', updatedFixtures)
      //  remove any module that might already be in D3
      const updatedModules = Object.fromEntries(
        Object.entries(modules).filter(
          ([_, value]) => value.cutoutId !== WASTE_CHUTE_CUTOUT
        )
      )
      setValue('modules', updatedModules)
    } else {
      // If removing wasteChute, filter it out
      const filteredFixtures =
        fixtures != null
          ? Object.fromEntries(
              Object.entries(fixtures).filter(
                ([_, val]) => val.name !== 'wasteChute'
              )
            )
          : {}

      filteredFixtures[uuid()] = {
        cutoutId: 'cutoutA3',
        name: 'trashBin',
        cutoutFixtureId: 'trashBinAdapter',
      }

      setValue('fixtures', filteredFixtures)
    }
    setValue('hasWasteChute', value)
  }

  const handleSelectThermocycler = (value: boolean): void => {
    if (value) {
      //   first remove anything that might have been placed previous in slot A1/B1
      const updatedModules = Object.fromEntries(
        Object.entries(modules).filter(
          ([_, value]) => !['A1', 'B1'].includes(value.slot)
        )
      )
      //  then add the thermocycler
      updatedModules[uuid()] = {
        model: THERMOCYCLER_MODULE_V2,
        type: THERMOCYCLER_MODULE_TYPE,
        slot: 'B1',
        cutoutFixtureId: 'thermocyclerModuleV2Front',
        cutoutId: 'cutoutB1',
      }
      setValue('modules', updatedModules)
    } else {
      const updatedModules = Object.fromEntries(
        Object.entries(modules).filter(
          ([_, value]) => value.type !== THERMOCYCLER_MODULE_TYPE
        )
      )
      setValue('modules', updatedModules)
    }
    setValue('hasThermocycler', value)
  }

  useEffect(() => {
    if (selectedPipetteName != null) {
      setValue(`pipettesByMount.${mount}.pipetteName`, selectedPipetteName)
      openPipetteModal(false)
      setSelectedPipetteName(null)
    }
  }, [selectedPipetteName])

  return (
    <>
      {pipetteModal ? (
        <SelectPipetteModal
          {...props}
          mount={mount}
          setPipetteGen={setPipetteGen}
          setPipetteVolume={setPipetteVolume}
          setPipetteType={setPipetteType}
          pipetteGen={pipetteGen}
          pipetteVolume={pipetteVolume}
          pipetteType={pipetteType}
          handleBack={() => {
            openPipetteModal(false)
          }}
          setSelectedPipetteName={setSelectedPipetteName}
        />
      ) : null}
      <HandleEnter onEnter={proceed}>
        <WizardBody
          robotType={robotType}
          stepNumber={1}
          subStepNumber={subStepNumber}
          header={t('basics')}
          disabled={isDisabled}
          proceed={() => {
            proceed(1)
          }}
        >
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
            <StyledText desktopStyle="headingSmallBold">
              {t('robot_type')}
            </StyledText>
            <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
              <RadioButton
                onChange={() => {
                  setValue('fields.robotType', FLEX_ROBOT_TYPE)
                  resetPipettes()
                  setValue('modules', {})
                  setValue('fixtures', flexTrashFixture)
                }}
                buttonLabel={t('shared:opentrons_flex')}
                buttonValue={FLEX_ROBOT_TYPE}
                isSelected={robotType === FLEX_ROBOT_TYPE}
              />
              <RadioButton
                onChange={() => {
                  setValue('fields.robotType', OT2_ROBOT_TYPE)
                  resetPipettes()
                  setValue('modules', {})
                  setValue('fixtures', ot2TrashFixture)
                }}
                buttonLabel={t('shared:ot2')}
                buttonValue={OT2_ROBOT_TYPE}
                isSelected={robotType === OT2_ROBOT_TYPE}
              />
            </Flex>
          </Flex>
          {robotType != null ? (
            <>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing12}
              >
                <Flex
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  alignItems={ALIGN_CENTER}
                >
                  <StyledText desktopStyle="headingSmallBold">
                    {noPipette ? t('add_your_pipettes') : t('your_pipettes')}
                  </StyledText>
                  {has96Channel ||
                  (pipettesByMount.left.pipetteName == null &&
                    pipettesByMount.right.pipetteName == null) ||
                  (pipettesByMount.left.tiprackDefURI == null &&
                    pipettesByMount.right.tiprackDefURI == null) ? null : (
                    <Btn
                      css={LINK_BUTTON_STYLE}
                      onClick={() => {
                        handleSwapMounts()
                      }}
                    >
                      <Flex flexDirection={DIRECTION_ROW}>
                        <Icon
                          name="swap-horizontal"
                          size="1rem"
                          transform="rotate(90deg)"
                        />
                        <StyledText desktopStyle="captionSemiBold">
                          {t('swap_pipette_mounts')}
                        </StyledText>
                      </Flex>
                    </Btn>
                  )}
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing8}
                >
                  <Flex
                    flexDirection={DIRECTION_COLUMN}
                    gridGap={SPACING.spacing4}
                  >
                    {pipettesByMount.left.pipetteName != null &&
                    pipettesByMount.left.tiprackDefURI != null ? (
                      <PipetteInfoItem
                        mount="left"
                        pipetteName={
                          pipettesByMount.left.pipetteName as PipetteName
                        }
                        tiprackDefURIs={pipettesByMount.left.tiprackDefURI}
                        editClick={() => {
                          setMount('left')
                          openPipetteModal(true)
                        }}
                        cleanForm={() => {
                          setValue(
                            `pipettesByMount.left.pipetteName`,
                            undefined
                          )
                          setValue(
                            `pipettesByMount.left.tiprackDefURI`,
                            undefined
                          )
                          resetPipetteFields()
                        }}
                      />
                    ) : null}
                    {pipettesByMount.right.pipetteName != null &&
                    pipettesByMount.right.tiprackDefURI != null ? (
                      <PipetteInfoItem
                        mount="right"
                        pipetteName={
                          pipettesByMount.right.pipetteName as PipetteName
                        }
                        tiprackDefURIs={pipettesByMount.right.tiprackDefURI}
                        editClick={() => {
                          setMount('right')
                          openPipetteModal(true)
                        }}
                        cleanForm={() => {
                          setValue(
                            `pipettesByMount.right.pipetteName`,
                            undefined
                          )
                          setValue(
                            `pipettesByMount.right.tiprackDefURI`,
                            undefined
                          )
                          resetPipetteFields()
                        }}
                      />
                    ) : null}
                  </Flex>
                  <>
                    {has96Channel ||
                    (pipettesByMount.left.pipetteName != null &&
                      pipettesByMount.right.pipetteName != null &&
                      pipettesByMount.left.tiprackDefURI != null &&
                      pipettesByMount.right.tiprackDefURI != null) ? null : (
                      <Flex width={FLEX_MAX_CONTENT}>
                        <EmptySelectorButton
                          onClick={() => {
                            setMount(targetPipetteMount)
                            openPipetteModal(true)
                            resetPipetteFields()
                          }}
                          text={t('add_pipette')}
                          textAlignment="left"
                          iconName="plus"
                        />
                      </Flex>
                    )}
                  </>
                </Flex>
              </Flex>
            </>
          ) : null}
          {robotType === FLEX_ROBOT_TYPE && !noPipette && (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing60}>
              <BasicsButtons
                type="gripper"
                subHeader={t('some_modules_require_gripper')}
                header={t('need_gripper')}
                onChange={value => {
                  setValue('hasGripper', value)
                }}
                selected={hasGripper}
              />
              {hasGripper != null ? (
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing60}
                >
                  <BasicsButtons
                    type="thermocycler"
                    header={t('are_you_using_thermocycler')}
                    onChange={value => {
                      handleSelectThermocycler(value)
                    }}
                    selected={hasThermocycer}
                  />
                  {hasThermocycer != null ? (
                    <BasicsButtons
                      type="wasteChute"
                      header={t('are_you_using_waste_chute')}
                      onChange={value => {
                        handlSelectWasteChute(value)
                      }}
                      selected={hasWasteChute}
                    />
                  ) : null}
                </Flex>
              ) : null}
            </Flex>
          )}
          {/* empty div for scrolling to bottom on form changes */}
          <div ref={ref} />
        </WizardBody>
      </HandleEnter>
    </>
  )
}
