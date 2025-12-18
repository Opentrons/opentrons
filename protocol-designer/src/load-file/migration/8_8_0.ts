import type { ProtocolFile } from '@opentrons/shared-data'
import type { PDMetadata } from '../../file-types'

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const savedStepForms = designerApplication.data.savedStepForms

  const updatedInitialStep = Object.values(savedStepForms).reduce(
    (acc, form) => {
      const { id } = form
      if (id === '__INITIAL_DECK_SETUP_STEP__') {
        return {
          ...acc,
          [id]: {
            ...form,
            moduleStateUpdate: {},
          },
        }
      }
      return acc
    },
    {}
  )
  return {
    ...appData,
    designerApplication: {
      ...designerApplication,
      data: {
        ...designerApplication.data,
        savedStepForms: {
          ...designerApplication.data.savedStepForms,
          ...updatedInitialStep,
        },
      },
    },
  }
}
