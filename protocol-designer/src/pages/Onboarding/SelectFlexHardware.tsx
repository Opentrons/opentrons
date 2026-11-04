import { useTranslation } from 'react-i18next'

import { HandleEnter } from '../../components/atoms'
import { HardwareConfigurator } from '../../components/organisms/HardwareConfigurator'
import { WizardBody } from './WizardBody'

import type { WizardTileProps } from './types'

export function SelectFlexHardware(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch, setValue } = props
  const fixtures = watch('fixtures')
  const modules = watch('modules')
  const hasGripper = watch('hasGripper')
  const { t } = useTranslation(['onboarding', 'shared'])

  const handleProceed = (): void => {
    proceed(1)
  }

  return (
    <HandleEnter onEnter={handleProceed}>
      <WizardBody
        stepNumber={2}
        subStepNumber={5}
        header={t('configure_deck_hardware')}
        subHeader={t('place_hardware')}
        disabled={false}
        goBack={() => {
          goBack(1)
        }}
        proceed={handleProceed}
      >
        <HardwareConfigurator
          setValue={setValue}
          fixtures={fixtures}
          modules={modules}
          hasGripper={hasGripper ?? false}
        />
      </WizardBody>
    </HandleEnter>
  )
}
