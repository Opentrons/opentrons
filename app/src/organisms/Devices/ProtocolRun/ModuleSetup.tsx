import * as React from 'react'
import { SPACING } from '@opentrons/components'
import { useModuleRenderInfoForProtocolById } from '../hooks'
import { StyledText } from '../../../atoms/text/StyledText'
import { HeaterShakerBanner } from '../../ProtocolSetup/RunSetupCard/ModuleSetup/HeaterShakerSetupWizard/HeaterShakerBanner'

interface ModuleSetupProps {
  robotName: string
  runId: string
}

export const ModuleSetup = (props: ModuleSetupProps): JSX.Element => {
  const { robotName, runId } = props
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )

  const heaterShakerModules = Object.values(
    moduleRenderInfoForProtocolById
  ).filter(module => module.moduleDef.model === 'heaterShakerModuleV1')

  return (
    <>
      {heaterShakerModules.length !== 0 && (
        <HeaterShakerBanner
          displayName={heaterShakerModules[0].moduleDef.displayName}
          modules={heaterShakerModules}
        />
      )}

      <StyledText as="p" marginTop={SPACING.spacing4}>
        TODO: module setup
      </StyledText>
    </>
  )
}
