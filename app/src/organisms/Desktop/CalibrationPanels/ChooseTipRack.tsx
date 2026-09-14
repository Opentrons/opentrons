import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import head from 'lodash/head'
import isEqual from 'lodash/isEqual'

import {
  ALIGN_CENTER,
  Banner,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Link,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { getLabwareDefURI } from '@opentrons/shared-data'

import { Select } from '/app/atoms/SelectField/Select'
import { Divider } from '/app/atoms/structure'
import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'
import {
  getCalibrationForPipette,
  getTipLengthCalibrations,
  getTipLengthForPipetteAndTiprack,
} from '/app/redux/calibration/'
import { getCustomTipRackDefinitions } from '/app/redux/custom-labware'

import { ChosenTipRackRender } from './ChosenTipRackRender'

import type { ReactNode } from 'react'
import type { MultiValue, SingleValue } from 'react-select'
import type { Mount } from '@opentrons/api-client'
import type { SelectOption, SelectOptionOrGroup } from '@opentrons/components'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type { TipLengthCalibration } from '/app/redux/calibration/api-types'
import type { CalibrationLabware } from '/app/redux/sessions/types'
import type { State } from '/app/redux/types'

interface TipRackInfo {
  definition: LabwareDefinition
  calibration: TipLengthCalibration | null
}

export type TipRackMap = Partial<{
  [uri: string]: TipRackInfo
}>

const EQUIPMENT_POLL_MS = 5000

function formatOptionsFromLabwareDef(lw: LabwareDefinition): SelectOption {
  return {
    value: getLabwareDefURI(lw),
    label: lw.metadata.displayName,
  }
}
interface ChooseTipRackProps {
  tipRack: CalibrationLabware
  mount: Mount
  chosenTipRack: LabwareDefinition | null
  handleChosenTipRack: (arg: LabwareDefinition | null) => unknown
  closeModal: () => unknown
  robotName?: string | null
  defaultTipracks?: LabwareDefinition[] | null
}

export function ChooseTipRack(props: ChooseTipRackProps): ReactNode {
  const {
    tipRack,
    mount,
    chosenTipRack,
    handleChosenTipRack,
    closeModal,
    robotName,
    defaultTipracks,
  } = props
  const { t } = useTranslation(['robot_calibration', 'shared', 'branded'])
  const pipSerial = usePipettesQuery(
    {},
    {
      refetchInterval: EQUIPMENT_POLL_MS,
    }
  )?.data?.[mount].id

  const pipetteOffsetCal = useSelector((state: State) =>
    robotName != null && pipSerial != null
      ? getCalibrationForPipette(state, robotName, pipSerial, mount)
      : null
  )
  const tipLengthCal = useSelector((state: State) =>
    robotName != null && pipSerial != null && pipetteOffsetCal != null
      ? getTipLengthForPipetteAndTiprack(
          state,
          robotName,
          pipSerial,
          pipetteOffsetCal?.tiprack
        )
      : null
  )
  const allTipLengthCal = useSelector((state: State) =>
    robotName != null ? getTipLengthCalibrations(state, robotName) : []
  )
  const customTipRacks = useSelector(getCustomTipRackDefinitions)

  const allTipRackDefs =
    defaultTipracks != null
      ? defaultTipracks.concat(customTipRacks)
      : customTipRacks
  const tipRackByUriMap = allTipRackDefs.reduce<TipRackMap>((obj, lw) => {
    if (lw) {
      obj[getLabwareDefURI(lw)] = {
        definition: lw,
        calibration:
          head(
            allTipLengthCal.filter(
              cal =>
                cal.pipette === pipSerial && cal.uri === getLabwareDefURI(lw)
            )
          ) ||
          // Old tip length data don't have tiprack uri info, so we are using the
          // tiprack hash in pipette offset to check against tip length cal for
          // backward compatability purposes
          (pipetteOffsetCal != null &&
          tipLengthCal != null &&
          pipetteOffsetCal.tiprackUri === getLabwareDefURI(lw)
            ? tipLengthCal
            : null),
      }
    }
    return obj
  }, {})

  const opentronsTipRacksOptions: SelectOption[] =
    defaultTipracks != null
      ? defaultTipracks.map(lw => formatOptionsFromLabwareDef(lw))
      : []
  const customTipRacksOptions: SelectOption[] = customTipRacks.map(lw =>
    formatOptionsFromLabwareDef(lw)
  )

  const groupOptions: SelectOptionOrGroup[] =
    customTipRacks.length > 0
      ? [
          {
            label: t('branded:opentrons_tip_rack_name'),
            options: opentronsTipRacksOptions,
          },
          {
            label: t('custom'),
            options: customTipRacksOptions,
          },
        ]
      : [...opentronsTipRacksOptions]

  const [selectedValue, setSelectedValue] = useState<
    SingleValue<SelectOption> | MultiValue<SelectOption>
  >(
    chosenTipRack != null
      ? formatOptionsFromLabwareDef(chosenTipRack)
      : formatOptionsFromLabwareDef(tipRack.definition)
  )

  const handleValueChange = (
    selected: SingleValue<SelectOption> | MultiValue<SelectOption>,
    _: unknown
  ): void => {
    selected != null && setSelectedValue(selected)
  }
  const handleUseTipRack = (): void => {
    const value = (selectedValue as SelectOption).value
    const selectedTipRack = tipRackByUriMap[value]
    if (!isEqual(chosenTipRack, selectedTipRack?.definition)) {
      handleChosenTipRack(
        (selectedTipRack?.definition != null && selectedTipRack.definition) ||
          null
      )
    }
    closeModal()
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <Flex gridGap={SPACING.spacing40}>
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
        >
          <LegacyStyledText
            css={TYPOGRAPHY.h1Default}
            marginBottom={SPACING.spacing16}
          >
            {t('choose_a_tip_rack')}
          </LegacyStyledText>
          <LegacyStyledText
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            css={TYPOGRAPHY.labelSemiBold}
          >
            {t('select_tip_rack')}
          </LegacyStyledText>
          <Box marginBottom={SPACING.spacing12}>
            <Select
              isSearchable={false}
              options={groupOptions}
              onChange={handleValueChange}
              value={selectedValue}
              width="16rem"
              menuPortalTarget={document.body}
              styles={{ menuPortal: base => ({ ...base, zIndex: 10 }) }}
            />
          </Box>
          <Trans
            t={t}
            i18nKey="choose_tip_rack"
            components={{
              strong: (
                <strong
                  style={{
                    marginRight: SPACING.spacing4,
                    fontWeight: TYPOGRAPHY.fontWeightSemiBold,
                  }}
                />
              ),
              block: <LegacyStyledText forwardedAs="p" />,
            }}
          />
        </Flex>
        <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
          <Banner type="warning">
            <LegacyStyledText forwardedAs="p" marginRight={SPACING.spacing16}>
              {t('branded:opentrons_tip_racks_recommended')}
            </LegacyStyledText>
          </Banner>
          <Divider marginY={SPACING.spacing8} width="100%" />
          <ChosenTipRackRender selectedValue={selectedValue as SelectOption} />
          <Divider marginY={SPACING.spacing8} width="100%" />
          <LegacyStyledText forwardedAs="label" color={COLORS.grey50}>
            {t('branded:calibration_on_opentrons_tips_is_important')}
          </LegacyStyledText>
        </Flex>
      </Flex>
      <Flex
        width="100%"
        marginTop={SPACING.spacing32}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink />
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing8}>
          <Link
            role="button"
            css={TYPOGRAPHY.darkLinkH4SemiBold}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={() => closeModal()}
            marginRight={SPACING.spacing16}
          >
            {t('shared:cancel')}
          </Link>
          <PrimaryButton onClick={handleUseTipRack}>
            {t('confirm_tip_rack')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
