import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_EVENLY,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { Accordion } from '../../molecules/Accordion'
import { useEffect } from 'react'
import styled from 'styled-components'
import { PromptPreview } from '../../molecules/PromptPreview'
import { ApplicationSection } from '../../organisms/ApplicationSection'
import { useForm, FormProvider } from 'react-hook-form'
import { createProtocolAtom, headerWithMeterAtom } from '../../resources/atoms'
import { useAtom } from 'jotai'

interface CreateProtocolFormData {
  application: {
    scientificApplication: string
    otherApplication?: string
    description: string
  }
}

export function CreateProtocol(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const [, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [{ currentStep }, setCreateProtocolAtom] = useAtom(createProtocolAtom)

  const methods = useForm<CreateProtocolFormData>({
    defaultValues: {
      application: {
        scientificApplication: '',
        otherApplication: '',
        description: '',
      },
    },
  })

  useEffect(() => {
    setHeaderWithMeterAtom({
      displayHeaderWithMeter: true,
      progress: 0,
    })
  }, [])

  return (
    <FormProvider {...methods}>
      <Flex
        position={POSITION_RELATIVE}
        justifyContent={JUSTIFY_SPACE_EVENLY}
        gap={SPACING.spacing32}
        margin={`${SPACING.spacing16} ${SPACING.spacing16}`}
        height="100%"
      >
        <ProtocolSections>
          <Accordion
            heading={t('application_title')}
            isOpen={currentStep === 0}
            handleClick={function (): void {
              setCreateProtocolAtom({ currentStep: 0 })
            }}
          >
            <ApplicationSection />
          </Accordion>

          <Accordion
            heading={t('instruments_title')}
            isOpen={currentStep === 1}
            handleClick={function (): void {
              setCreateProtocolAtom({ currentStep: 1 })
            }}
          >
            <Flex>Content</Flex>
          </Accordion>

          <Accordion
            heading={'Modules'}
            isOpen={currentStep === 2}
            handleClick={function (): void {
              setCreateProtocolAtom({ currentStep: 1 })
            }}
          >
            <Flex>Content</Flex>
          </Accordion>

          <Accordion
            heading={'Labware & Liquids'}
            isOpen={currentStep === 3}
            handleClick={function (): void {
              setCreateProtocolAtom({ currentStep: 1 })
            }}
          >
            <Flex>Content</Flex>
          </Accordion>

          <Accordion
            heading={'Steps'}
            isOpen={currentStep === 4}
            handleClick={function (): void {
              setCreateProtocolAtom({ currentStep: 1 })
            }}
          >
            <Flex>Content</Flex>
          </Accordion>
        </ProtocolSections>
        <PromptPreview
          handleSubmit={function (): void {
            throw new Error('Function not implemented.')
          }}
          promptPreviewData={[]}
        />
      </Flex>
    </FormProvider>
  )
}

const ProtocolSections = styled(Flex)`
  flex-direction: ${DIRECTION_COLUMN};
  width: 100%;
  gap: ${SPACING.spacing16};
`
