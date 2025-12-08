import type { ProtocolFile } from '@opentrons/shared-data'
import type { LabwareLocationUpdateInfo } from '@opentrons/step-generation'
import type { PDMetadata } from '/protocol-designer/file-types'

export const migrateFile = (
  appData: ProtocolFile<PDMetadata>
): ProtocolFile<PDMetadata> => {
  const { designerApplication } = appData

  if (designerApplication == null || designerApplication?.data == null) {
    throw Error('The designerApplication key in your file is corrupt.')
  }
  const { savedStepForms } = designerApplication.data

  const updatedInitialStep = Object.values(savedStepForms).reduce(
    (acc, form) => {
      const { id } = form

      const oldForm: Record<string, string> = form.labwareLocationUpdate
      if (id === '__INITIAL_DECK_SETUP_STEP__') {
        const newLabwareLocationUpdate: Record<
          string,
          LabwareLocationUpdateInfo
        > = Object.fromEntries(
          Object.entries(oldForm).map(([labwareId, oldValue]) => {
            // oldValue is like: "C2" or moduleId
            // newValue should be: { slot: oldValue }
            // this new shape is to make way for location attributes such as isOnHopper
            return [
              labwareId,
              {
                slot: oldValue,
              },
            ]
          })
        )
        return {
          ...acc,
          [id]: {
            ...form,
            labwareLocationUpdate: newLabwareLocationUpdate,
          },
        }
      }
      return { ...acc, [id]: form }
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
