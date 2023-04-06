import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { StretchButton } from '../../atoms/buttons/OnDeviceDisplay'
import { StyledText } from '../../atoms/text'
import { GRIPPER_FLOW_TYPES } from '../GripperWizardFlows/constants'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'

import type { InstrumentData } from '@opentrons/api-client'

interface ExtensionMountItemProps {
  attachedInstrument: InstrumentData | null
  setWizardProps: (
    props: React.ComponentProps<typeof GripperWizardFlows> | null
  ) => void
}
export function ExtensionMountItem(
  props: ExtensionMountItemProps
): JSX.Element {
  const { t } = useTranslation('device_details')
  const history = useHistory()
  const { attachedInstrument, setWizardProps } = props
  const handleClick: React.MouseEventHandler = () => {
    if (attachedInstrument == null) {
      setWizardProps({
        flowType: GRIPPER_FLOW_TYPES.ATTACH,
        attachedGripper: attachedInstrument,
        closeFlow: () => setWizardProps(null),
      })
    } else {
      history.push('/instruments/extension')
    }
  }
  return (
    <StretchButton onClick={handleClick}>
      <Flex
        width="100%"
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing5}>
          <StyledText as="h1" textTransform={TEXT_TRANSFORM_CAPITALIZE}>
            {t('mount', { side: 'extension' })}
          </StyledText>
          <StyledText as="h3">
            {attachedInstrument == null
              ? t('empty')
              : attachedInstrument.instrumentModel}
          </StyledText>
        </Flex>
        <Icon name="chevron-right" size="1.5rem" />
      </Flex>
    </StretchButton>
  )
}
