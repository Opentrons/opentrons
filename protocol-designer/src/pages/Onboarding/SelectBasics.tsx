import { useTranslation } from 'react-i18next'
import without from 'lodash/without'
import { uuid } from '@opentrons/step-generation'
import { useState } from 'react'
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
} from '@opentrons/shared-data'
import { PipetteInfoItem, SelectPipetteModal } from '../../components/organisms'
import { HandleEnter, LINK_BUTTON_STYLE } from '../../components/atoms'
import { WizardBody } from './WizardBody'
import { DEFAULT_SLOT_MAP_FLEX } from './constants'
import { BasicsButtons } from './BasicsButtons'
import type { PipetteMount, PipetteName } from '@opentrons/shared-data'
import type {
  AdditionalEquipment,
  Gen,
  PipetteType,
  WizardTileProps,
} from './types'

export function SelectBasics(props: WizardTileProps): JSX.Element {
  const { setValue, proceed, watch } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const [mount, setMount] = useState<PipetteMount>('left')
  const [pipetteModal, openPipetteModal] = useState<boolean>(false)
  const [pipetteGen, setPipetteGen] = useState<Gen | 'flex'>('flex')
  const [pipetteVolume, setPipetteVolume] = useState<string | null>(null)
  const [pipetteType, setPipetteType] = useState<PipetteType | null>(null)

  const fields = watch('fields')
  const pipettesByMount = watch('pipettesByMount')
  const additionalEquipment = watch('additionalEquipment')
  const modules = watch('modules')

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

  const isDisabled = robotType == null || noPipette

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
                  setValue('modules', null)
                  setValue('additionalEquipment', ['trashBin'])
                }}
                buttonLabel={t('shared:opentrons_flex')}
                buttonValue={FLEX_ROBOT_TYPE}
                isSelected={robotType === FLEX_ROBOT_TYPE}
              />
              <RadioButton
                onChange={() => {
                  setValue('fields.robotType', OT2_ROBOT_TYPE)
                  resetPipettes()
                  setValue('modules', null)
                  setValue('additionalEquipment', ['trashBin'])
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
                        const leftPipetteName = pipettesByMount.left.pipetteName
                        const rightPipetteName =
                          pipettesByMount.right.pipetteName
                        const leftTiprackDefURI =
                          pipettesByMount.left.tiprackDefURI
                        const rightTiprackDefURI =
                          pipettesByMount.right.tiprackDefURI

                        setValue(
                          'pipettesByMount.left.pipetteName',
                          rightPipetteName
                        )
                        setValue(
                          'pipettesByMount.right.pipetteName',
                          leftPipetteName
                        )
                        setValue(
                          'pipettesByMount.left.tiprackDefURI',
                          rightTiprackDefURI
                        )
                        setValue(
                          'pipettesByMount.right.tiprackDefURI',
                          leftTiprackDefURI
                        )
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
            <>
              <BasicsButtons
                type="gripper"
                subHeader={t('some_modules_require_gripper')}
                header={t('need_gripper')}
                onChange={value => {
                  setValue(
                    'additionalEquipment',
                    value
                      ? [...additionalEquipment, 'gripper']
                      : without(additionalEquipment, 'gripper')
                  )
                }}
                isSelected={additionalEquipment.includes('gripper')}
              />
              <BasicsButtons
                type="thermocycler"
                header={t('are_you_using_thermocycler')}
                onChange={value => {
                  if (value) {
                    setValue('modules', {
                      ...modules,
                      [uuid()]: {
                        model: THERMOCYCLER_MODULE_V2,
                        type: THERMOCYCLER_MODULE_TYPE,
                        slot: DEFAULT_SLOT_MAP_FLEX[THERMOCYCLER_MODULE_V2],
                      },
                    })
                  } else {
                    const updatedModules =
                      modules != null
                        ? Object.fromEntries(
                            Object.entries(modules).filter(
                              ([_, value]) =>
                                value.type !== THERMOCYCLER_MODULE_TYPE
                            )
                          )
                        : {}
                    setValue('modules', updatedModules)
                  }
                }}
                isSelected={
                  modules != null &&
                  Object.values(modules).some(
                    mod => mod.type === THERMOCYCLER_MODULE_TYPE
                  )
                }
              />
              <BasicsButtons
                type="wasteChute"
                header={t('are_you_using_gripper')}
                onChange={value => {
                  if (value) {
                    const updated: AdditionalEquipment[] = without(
                      [...additionalEquipment, 'wasteChute'],
                      'trashBin'
                    )
                    setValue('additionalEquipment', updated)
                  } else {
                    const updated: AdditionalEquipment[] = Array.from(
                      new Set([
                        ...without(additionalEquipment, 'wasteChute'),
                        'trashBin',
                      ])
                    )
                    setValue('additionalEquipment', updated)
                  }
                }}
                isSelected={additionalEquipment.includes('wasteChute')}
              />
            </>
          )}
        </WizardBody>
      </HandleEnter>
    </>
  )
}
