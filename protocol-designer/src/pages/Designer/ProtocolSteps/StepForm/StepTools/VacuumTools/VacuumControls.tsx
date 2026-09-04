import { Fragment, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  ListButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP_OFF,
  VACUUM_STATE_PUMP_ON,
  VACUUM_VENT_OPEN,
  VACUUM_VENT_SET_CLOSED,
  VACUUM_VENT_SET_OPEN,
  vacuumModuleStateGetter,
} from '@opentrons/step-generation'

import { getMainPagePortalEl } from '/protocol-designer/components/organisms'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { EndingHoldField } from './EndingHoldField'
import { VacuumControlsGroup } from './VacuumControlsGroup'
import { VacuumProfileModal } from './VacuumProfile/VacuumProfileModal'
import { VacuumPumpControls } from './VacuumPumpControls'
import styles from './vacuumtools.module.css'

import type { ReactNode } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface VacuumControlsProps {
  formData: FormData
  propsForFields: FieldPropsByName
  showFormErrors: boolean
}
export function VacuumControls(props: VacuumControlsProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const { formData, propsForFields, showFormErrors } = props
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false)
  const { moduleId } = formData
  const robotState = useSelector(getRobotStateAtActiveItem)
  const vacuumModuleState =
    robotState != null
      ? vacuumModuleStateGetter(robotState, moduleId as string)
      : null
  const handleProgramTypeChange = (
    programType: typeof VACUUM_PROGRAM_STATE | typeof VACUUM_PROGRAM_PROFILE
  ): void => {
    propsForFields.programType.updateValue(programType)
  }

  const handleStateTypeChange = (
    stateType:
      | typeof VACUUM_STATE_PUMP_ON
      | typeof VACUUM_STATE_PUMP_OFF
      | typeof VACUUM_VENT_SET_OPEN
      | typeof VACUUM_VENT_SET_CLOSED
  ): void => {
    propsForFields.stateType.updateValue(stateType)
  }

  const handleModeTypeChange = (
    modeType: typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER
  ): void => {
    propsForFields.modeType.updateValue(modeType)
  }

  const ventState = vacuumModuleState?.ventStatus ?? VACUUM_VENT_OPEN
  const ventToSwitch =
    ventState === VACUUM_VENT_OPEN
      ? VACUUM_VENT_SET_CLOSED
      : VACUUM_VENT_SET_OPEN

  const sections: ReactNode[] = []

  // State / Profile
  sections.push(
    <VacuumControlsGroup
      key="program-type"
      title={t('vacuum.controls.label')}
      options={[
        {
          label: t('vacuum.controls.options.state'),
          value: VACUUM_PROGRAM_STATE,
        },
        {
          label: t('vacuum.controls.options.profile'),
          value: VACUUM_PROGRAM_PROFILE,
        },
      ]}
      selectedValue={formData.programType}
      onChange={handleProgramTypeChange}
    />
  )

  const isPumpOn =
    vacuumModuleState?.currentPumpActivity.type === 'indefiniteHold'

  // Pump / Vent
  if (formData.programType === VACUUM_PROGRAM_STATE) {
    sections.push(
      <VacuumControlsGroup
        key="state-type"
        title={t('vacuum.controls.state.label')}
        options={[
          ...(isPumpOn
            ? [
                {
                  label: t('vacuum.controls.state.options.pump.off'),
                  value: VACUUM_STATE_PUMP_OFF,
                },
              ]
            : []),
          {
            label: t(
              `vacuum.controls.state.options.pump.${isPumpOn ? 'change' : 'on'}`
            ),
            value: VACUUM_STATE_PUMP_ON,
          },
          {
            label: t(`vacuum.controls.state.options.vent.${ventToSwitch}`),
            value: ventToSwitch,
          },
        ]}
        selectedValue={formData.stateType}
        onChange={handleStateTypeChange}
      />
    )
  }

  // Pressure / Power
  if (
    formData.stateType === VACUUM_STATE_PUMP_ON ||
    formData.programType === VACUUM_PROGRAM_PROFILE
  ) {
    sections.push(
      <VacuumControlsGroup
        key="mode-type"
        title={t('vacuum.controls.mode.label')}
        options={[
          {
            label: t('vacuum.controls.mode.options.pressure.label'),
            value: VACUUM_MODE_PRESSURE,
            description: t('vacuum.controls.mode.options.pressure.description'),
          },
          {
            label: t('vacuum.controls.mode.options.power.label'),
            value: VACUUM_MODE_POWER,
            description: t('vacuum.controls.mode.options.power.description'),
          },
        ]}
        selectedValue={formData.modeType}
        onChange={handleModeTypeChange}
        titleTooltip={t('vacuum.controls.mode.tooltip')}
      />
    )
  }

  // Pump controls
  if (
    formData.programType === VACUUM_PROGRAM_STATE &&
    formData.stateType === VACUUM_STATE_PUMP_ON
  ) {
    sections.push(
      <VacuumPumpControls
        key="pump-controls"
        formData={formData}
        propsForFields={propsForFields}
      />
    )
  }

  // Profile steps
  if (
    formData.programType === VACUUM_PROGRAM_PROFILE &&
    formData.modeType != null
  ) {
    const numSavedStepsInProfile = formData.vacuumOrderedProfileIds.length
    sections.push(
      <Flex
        key="profile-steps"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing12}
        paddingX={SPACING.spacing16}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('vacuum.controls.profile.profile_steps')}
        </StyledText>
        <ListButton
          type={
            showFormErrors &&
            propsForFields.vacuumOrderedProfileIds.errorToShow != null
              ? 'error'
              : 'noActive'
          }
          onClick={() => {
            setShowProfileModal(true)
          }}
          padding={SPACING.spacing12}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {numSavedStepsInProfile > 0
              ? t(
                  `vacuum.controls.profile.profile_defined_${numSavedStepsInProfile > 1 ? 'multiple' : 'single'}`,
                  {
                    numSteps: numSavedStepsInProfile,
                  }
                )
              : t('vacuum.controls.profile.no_profile_defined')}
          </StyledText>
        </ListButton>
      </Flex>
    )
    sections.push(
      <Flex key="ending-hold" paddingX={SPACING.spacing16}>
        <EndingHoldField formData={formData} propsForFields={propsForFields} />
      </Flex>
    )
  }

  return (
    <div className={styles.vacuum_controls_root}>
      {sections.map((section, index) => (
        <Fragment key={index}>
          {index > 0 && <Divider marginY="0" />}
          {section}
        </Fragment>
      ))}
      {showProfileModal &&
        formData.modeType != null &&
        // Safety check. in practice, modeType can not be null here
        createPortal(
          <VacuumProfileModal
            formData={formData}
            propsForFields={propsForFields}
            mode={formData.modeType}
            onClose={() => {
              setShowProfileModal(false)
            }}
          />,
          getMainPagePortalEl()
        )}
    </div>
  )
}
