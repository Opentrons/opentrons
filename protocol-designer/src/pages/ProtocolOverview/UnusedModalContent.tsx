import * as React from 'react'
import type { ModuleOnDeck, PipetteOnDeck } from '../../step-forms'
import type { Fixture } from './index'

interface MissingContent {
  noCommands: boolean
  pipettesWithoutStep: PipetteOnDeck[]
  modulesWithoutStep: ModuleOnDeck[]
  gripperWithoutStep: boolean
  fixtureWithoutStep: Fixture
  t: any
}

interface WarningContent {
  content: React.ReactNode
  heading: string
}

// TODO(ja): update this to use StyledText
export function getWarningContent({
  noCommands,
  pipettesWithoutStep,
  modulesWithoutStep,
  gripperWithoutStep,
  fixtureWithoutStep,
  t,
}: MissingContent): WarningContent | null {
  if (noCommands) {
    return {
      content: (
        <>
          <p>{t('alert:export_warnings.no_commands.body1')}</p>
          <p>{t('alert:export_warnings.no_commands.body2')}</p>
        </>
      ),
      heading: t('alert:export_warnings.no_commands.heading'),
    }
  }

  if (gripperWithoutStep) {
    return {
      content: (
        <>
          <p>{t('alert:export_warnings.unused_gripper.body1')}</p>
          <p>{t('alert:export_warnings.unused_gripper.body2')}</p>
        </>
      ),
      heading: t('alert:export_warnings.unused_gripper.heading'),
    }
  }

  const pipettesDetails = pipettesWithoutStep
    .map(pipette =>
      pipette.spec.channels === 96
        ? `${pipette.spec.displayName} pipette`
        : `${pipette.mount} ${pipette.spec.displayName} pipette`
    )
    .join(' and ')

  const unusedModuleCounts = modulesWithoutStep.reduce<{
    [key: string]: number
  }>((acc, mod) => {
    if (!(mod.type in acc)) {
      return { ...acc, [mod.type]: 1 }
    } else {
      return { ...acc, [mod.type]: acc[mod.type] + 1 }
    }
  }, {})

  const modulesDetails = Object.keys(unusedModuleCounts)
    // sorting by module count
    .sort((k1, k2) => {
      if (unusedModuleCounts[k1] < unusedModuleCounts[k2]) {
        return 1
      } else if (unusedModuleCounts[k1] > unusedModuleCounts[k2]) {
        return -1
      } else {
        return 0
      }
    })
    .map(modType =>
      unusedModuleCounts[modType] === 1
        ? t(`modules:module_long_names.${modType}`)
        : `${t(`modules:module_long_names.${modType}`)}s`
    )
    // transform list of modules with counts to string
    .reduce((acc, modName, index, arr) => {
      if (arr.length > 2) {
        if (index === arr.length - 1) {
          return `${acc} and ${modName}`
        } else {
          return `${acc}${modName}, `
        }
      } else if (arr.length === 2) {
        return index === 0 ? `${modName} and ` : `${acc}${modName}`
      } else {
        return modName
      }
    }, '')

  if (pipettesWithoutStep.length && modulesWithoutStep.length) {
    return {
      content: (
        <>
          <p>
            {t('alert:export_warnings.unused_pipette_and_module.body1', {
              modulesDetails,
              pipettesDetails,
            })}
          </p>
          <p>{t('alert:export_warnings.unused_pipette_and_module.body2')}</p>
        </>
      ),
      heading: t('alert:export_warnings.unused_pipette_and_module.heading'),
    }
  }

  if (pipettesWithoutStep.length) {
    return {
      content: (
        <>
          <p>
            {t('alert:export_warnings.unused_pipette.body1', {
              pipettesDetails,
            })}
          </p>
          <p>{t('alert:export_warnings.unused_pipette.body2')}</p>
        </>
      ),
      heading: t('alert:export_warnings.unused_pipette.heading'),
    }
  }

  if (modulesWithoutStep.length) {
    const moduleCase =
      modulesWithoutStep.length > 1 ? 'unused_modules' : 'unused_module'
    const slotName = modulesWithoutStep.map(module => module.slot)
    return {
      content: (
        <>
          <p>
            {t(`alert:export_warnings.${moduleCase}.body1`, {
              modulesDetails,
              slotName: slotName,
            })}
          </p>
          <p>{t(`alert:export_warnings.${moduleCase}.body2`)}</p>
        </>
      ),
      heading: t(`alert:export_warnings.${moduleCase}.heading`),
    }
  }

  if (fixtureWithoutStep.trashBin || fixtureWithoutStep.wasteChute) {
    return {
      content:
        (fixtureWithoutStep.trashBin && !fixtureWithoutStep.wasteChute) ||
        (!fixtureWithoutStep.trashBin && fixtureWithoutStep.wasteChute) ? (
          <p>
            {t('alert:export_warnings.unused_trash.body', {
              name: fixtureWithoutStep.trashBin ? 'trash bin' : 'waste chute',
            })}
          </p>
        ) : (
          <p>
            {t('alert:export_warnings.unused_trash.body_both', {
              trashName: 'trash bin',
              wasteName: 'waste chute',
            })}
          </p>
        ),
      heading: t('alert:export_warnings.unused_trash.heading'),
    }
  }

  if (fixtureWithoutStep.stagingAreaSlots.length) {
    return {
      content: (
        <>
          <p>
            {t('alert:export_warnings.unused_staging_area.body1', {
              count: fixtureWithoutStep.stagingAreaSlots.length,
              slot: fixtureWithoutStep.stagingAreaSlots,
            })}
          </p>
          <p>
            {t('alert:export_warnings.unused_staging_area.body2', {
              count: fixtureWithoutStep.stagingAreaSlots.length,
            })}
          </p>
        </>
      ),
      heading: t('alert:export_warnings.unused_staging_area.heading'),
    }
  }

  return null
}
