import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_EVENLY,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { Accordion } from '../../molecules/Accordion'
import { useState } from 'react'
import styled from 'styled-components'
import { PromptPreview } from '../../molecules/PromptPreview'
import { ApplicationSection } from '../../organisms/ApplicationSection'
import { useForm, FormProvider } from 'react-hook-form'

interface CreateProtocolFormData {
  application: {
    scientificApplication: string
    otherApplication?: string
    description: string
  }
}

export function CreateProtocol(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const [applicationAccordionIsOpen, setApplicationAccordionIsOpen] = useState(
    true
  )
  const [activeSection, setActiveSection] = useState(0)

  const methods = useForm<CreateProtocolFormData>({
    defaultValues: {
      application: {
        scientificApplication: '',
        otherApplication: '',
        description: '',
      },
    },
  })

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
            isOpen={activeSection === 0}
            handleClick={function (): void {
              setActiveSection(0)
            }}
          >
            <ApplicationSection />
          </Accordion>

          <Accordion
            heading={t('instruments_title')}
            isOpen={activeSection === 1}
            handleClick={function (): void {
              setActiveSection(1)
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
