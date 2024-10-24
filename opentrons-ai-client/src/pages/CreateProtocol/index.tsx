import {
  Flex,
  JUSTIFY_SPACE_EVENLY,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { PromptPreview } from '../../molecules/PromptPreview'
import { useForm, FormProvider } from 'react-hook-form'
import { createProtocolAtom, headerWithMeterAtom } from '../../resources/atoms'
import { useAtom } from 'jotai'
import { ProtocolSectionsContainer } from '../../organisms/ProtocolSectionsContainer'
import { OTHER } from '../../organisms/ApplicationSection'

interface CreateProtocolFormData {
  application: {
    scientificApplication: string
    otherApplication?: string
    description: string
  }
}

const TOTAL_STEPS = 5

export function CreateProtocol(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const [, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [{ currentStep }] = useAtom(createProtocolAtom)

  const methods = useForm<CreateProtocolFormData>({
    defaultValues: {
      application: {
        scientificApplication: '',
        otherApplication: '',
        description: '',
      },
    },
  })

  function calculateProgress(): number {
    return currentStep > 0 ? currentStep / TOTAL_STEPS : 0
  }

  useEffect(() => {
    setHeaderWithMeterAtom({
      displayHeaderWithMeter: true,
      progress: calculateProgress(),
    })
  }, [currentStep])

  function generatePromptPreviewApplicationItems(): string[] {
    const {
      application: { scientificApplication, otherApplication, description },
    } = methods.watch()

    const scientificOrOtherApplication =
      scientificApplication === OTHER
        ? otherApplication
        : scientificApplication !== ''
        ? t(scientificApplication)
        : ''

    return [
      scientificOrOtherApplication !== '' && scientificOrOtherApplication,
      description !== '' && description,
    ].filter(Boolean)
  }

  function generatePromptPreviewData(): Array<{
    title: string
    items: string[]
  }> {
    return [
      {
        title: t('application_title'),
        items: generatePromptPreviewApplicationItems(),
      },
    ]
  }

  return (
    <FormProvider {...methods}>
      <Flex
        position={POSITION_RELATIVE}
        justifyContent={JUSTIFY_SPACE_EVENLY}
        gap={SPACING.spacing32}
        margin={`${SPACING.spacing16} ${SPACING.spacing16}`}
        height="100%"
      >
        <ProtocolSectionsContainer />
        <PromptPreview
          handleSubmit={function (): void {
            throw new Error('Function not implemented.')
          }}
          promptPreviewData={generatePromptPreviewData()}
        />
      </Flex>
    </FormProvider>
  )
}
