import {
  ALIGN_CENTER,
  Box,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  useRobotSettingsQuery,
  useUpdateRobotSettingMutation,
} from '@opentrons/react-api-client'

import { ToggleButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'

import type { MouseEventHandler, ReactNode } from 'react'
import type { RobotSettingsField } from '@opentrons/api-client'

const NON_FEATURE_FLAG_SETTINGS = [
  'enableDoorSafetySwitch',
  'enableOEMMode',
  'disableHomeOnBoot',
  'deckCalibrationDots',
  'shortFixedTrash',
  'useOldAspirationFunctions',
  'disableFastProtocolUpload',
  'disableStatusBar',
]

export function RobotSettingsFeatureFlags(): ReactNode {
  const robotSettingsQuery = useRobotSettingsQuery()
  const settings = robotSettingsQuery.data?.settings ?? []
  const featureFlags = settings.filter(
    ({ id }) => !NON_FEATURE_FLAG_SETTINGS.includes(id)
  )

  return (
    <>
      {featureFlags.map(field => (
        <FeatureFlagToggle key={field.id} settingField={field} />
      ))}
    </>
  )
}

interface FeatureFlagToggleProps {
  settingField: RobotSettingsField
}

export function FeatureFlagToggle({
  settingField,
}: FeatureFlagToggleProps): JSX.Element | null {
  const documentationState = useDocumentationState()
  const { updateRobotSetting } =
    useUpdateRobotSettingMutation(documentationState)
  const { value, id, title, description } = settingField

  if (id == null) return null

  const handleClick: MouseEventHandler<Element> = () => {
    updateRobotSetting({ id, value: !value })
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      marginBottom={SPACING.spacing16}
    >
      <Box width="70%">
        <LegacyStyledText
          css={TYPOGRAPHY.pSemiBold}
          paddingBottom={SPACING.spacing4}
        >
          {title}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">{description}</LegacyStyledText>
      </Box>
      <ToggleButton
        label={title}
        toggledOn={value === true}
        onClick={handleClick}
      />
    </Flex>
  )
}
