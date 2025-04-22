import { useTranslation } from 'react-i18next'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { HandleEnter } from '../../components/atoms'
import { HardwareConfigurator } from '../../components/organisms/HardwareConfigurator'
import { useKitchen } from '../../components/organisms/Kitchen/hooks'
import { WizardBody } from './WizardBody'

import type { WizardTileProps } from './types'

export function SelectHardware(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch } = props
  const { makeSnackbar } = useKitchen()
  const fixtures = watch('fixtures')
  const { t } = useTranslation(['onboarding', 'shared'])
  const hasTrash = Object.values(fixtures).some(
    fixture => fixture.name === 'trashBin' || fixture.name === 'wasteChute'
  )

  const handleProceed = (): void => {
    if (!hasTrash) {
      makeSnackbar(t('trash_required') as string)
    } else {
      proceed(1)
    }
  }

  return (
    <HandleEnter onEnter={handleProceed}>
      <WizardBody
        robotType={FLEX_ROBOT_TYPE}
        stepNumber={3}
        subStepNumber={5}
        header={t('configure_deck_hardware')}
        subHeader={t('place_hardware')}
        disabled={false}
        goBack={() => {
          goBack(1)
        }}
        proceed={handleProceed}
      >
        <HardwareConfigurator {...props} />
      </WizardBody>
    </HandleEnter>
  )
}
