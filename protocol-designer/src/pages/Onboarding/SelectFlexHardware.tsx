import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { HandleEnter } from '../../components/atoms'
import { HardwareConfigurator } from '../../components/organisms/HardwareConfigurator'
import { WizardBody } from './WizardBody'

import type { WizardTileProps } from './types'

export function SelectHardware(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch, setValue } = props
  const { search } = useLocation()

  useEffect(() => {
    if (new URLSearchParams(search).get('deckConfig') != null) {
      proceed(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
        robotType={FLEX_ROBOT_TYPE}
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
