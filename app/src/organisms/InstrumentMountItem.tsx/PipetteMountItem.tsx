import * as React from 'react'
import { useHistory } from 'react-router-dom'

import { LEFT, NINETY_SIX_CHANNEL, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import type { Mount } from '../../redux/pipettes/types'
import { StretchButton } from '../../atoms/buttons/OnDeviceDisplay'
import { StyledText } from '../../atoms/text'
import { useTranslation } from 'react-i18next'
import { ChoosePipette } from '../PipetteWizardFlows/ChoosePipette'
import { Portal } from '../../App/portal'
import { FLOWS } from '../PipetteWizardFlows/constants'
import { PipetteWizardFlows } from '../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import type { InstrumentData } from '@opentrons/api-client'
import type { SelectablePipettes } from '../../organisms/PipetteWizardFlows/types'

interface PipetteMountItemProps {
  mount: Mount
  attachedPipette: InstrumentData | null
  setWizardProps: (
    props: React.ComponentProps<typeof GripperWizardFlows> | React.ComponentProps<typeof PipetteWizardFlows> | null
  ) => void
}

export function PipetteMountItem(props: PipetteMountItemProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const history = useHistory()
  const { mount, attachedPipette, setWizardProps } = props

  const [showChoosePipetteModal, setShowChoosePipetteModal] = React.useState(false)
  const [selectedPipette, setSelectedPipette] = React.useState<SelectablePipettes>(SINGLE_MOUNT_PIPETTES)

  const handleClick: React.MouseEventHandler = () => {
    if (attachedPipette == null) {
      setShowChoosePipetteModal(true)
    } else {
      history.push(`/instruments/${mount}`)
    }
  }
  return (
    <StretchButton onClick={handleClick}>
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing5}>
          <StyledText as="h1" textTransform={TEXT_TRANSFORM_CAPITALIZE}>{t('mount', { side: mount })}</StyledText>
          <StyledText as="h3">
            {
              attachedPipette == null
                ? t('empty')
                : attachedPipette.instrumentModel
            }
          </StyledText>
        </Flex>
        <Icon name="chevron-right" size="1.5rem" />
      </Flex>
      {showChoosePipetteModal ? (
        <Portal>
          <ChoosePipette
            proceed={() => {
              setWizardProps({
                mount: selectedPipette === NINETY_SIX_CHANNEL ? LEFT : mount,
                flowType: FLOWS.ATTACH,
                selectedPipette,
                setSelectedPipette,
                closeFlow: () => { setWizardProps(null) }
              })
            }}
            setSelectedPipette={setSelectedPipette}
            selectedPipette={selectedPipette}
            exit={() => {
              setShowChoosePipetteModal(false)
            }}
            mount={mount}
          />
        </Portal>
      ) : null}
    </StretchButton>
  )
}