import { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAtom } from 'jotai'

import {
  Flex,
  JUSTIFY_SPACE_EVENLY,
  POSITION_RELATIVE,
  SPACING,
} from '@opentrons/components'

import { ResizeBar } from '/ai-client/atoms/ResizeBar'
import { PromptPreview } from '/ai-client/molecules/PromptPreview'
import {
  ProtocolSectionsContainer,
  TOTAL_STEPS,
} from '/ai-client/organisms/ProtocolSectionsContainer'
import {
  chatDataAtom,
  chatHistoryAtom,
  createProtocolAtom,
  createProtocolChatAtom,
  featureFlagsAtom,
  headerWithMeterAtom,
  updateProtocolChatAtom,
} from '/ai-client/resources/atoms'
import { useTrackEvent } from '/ai-client/resources/hooks/useTrackEvent'
import {
  generateChatPrompt,
  generatePromptPreviewData,
} from '/ai-client/resources/utils/createProtocolUtils'

import type { MouseEvent } from 'react'
import type { DisplayLabware } from '/ai-client/organisms/LabwareLiquidsSection'
import type {
  DisplayFixture,
  DisplayModule,
} from '/ai-client/organisms/ModulesAndFixturesSection'

export interface CreateProtocolFormData {
  protocol_format: 'Protocol Designer' | 'Python'
  application: {
    scientificApplication: string
    otherApplication: string
    description: string
  }
  instruments: {
    robot: string
    pipettes: string
    leftPipette: string
    rightPipette: string
    flexGripper: string
  }
  modules: DisplayModule[]
  fixtures: DisplayFixture[]
  labwares: DisplayLabware[]
  liquids: string[]
  runtime_parameters?: string
  steps: string[] | string
}

export function CreateProtocol(): JSX.Element | null {
  const { t } = useTranslation('create_protocol')
  const [, setHeaderWithMeterAtom] = useAtom(headerWithMeterAtom)
  const [{ currentSection }, setCreateProtocolAtom] = useAtom(
    createProtocolAtom
  )
  const [, setCreateProtocolChatAtom] = useAtom(createProtocolChatAtom)
  const [, setUpdateProtocolChatAtom] = useAtom(updateProtocolChatAtom)
  const [, setChatHistoryAtom] = useAtom(chatHistoryAtom)
  const [, setChatData] = useAtom(chatDataAtom)
  const navigate = useNavigate()
  const trackEvent = useTrackEvent()
  const [leftWidth, setLeftWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [initialMouseX, setInitialMouseX] = useState(0)
  const [initialLeftWidth, setInitialLeftWidth] = useState(50)
  const [featureFlags] = useAtom(featureFlagsAtom)
  const isPdProtocolGenerationEnabled = featureFlags.enablePDProtocolGeneration

  const parentRef = useRef<HTMLDivElement>(null)

  const methods = useForm<CreateProtocolFormData>({
    defaultValues: {
      application: {
        scientificApplication: '',
        otherApplication: '',
        description: '',
      },
      instruments: {},
      modules: [],
      fixtures: [],
      labwares: [],
      liquids: [''],
      steps: [''],
    },
  })

  // Reset the chat data atom and protocol atoms when navigating to the update protocol page
  useEffect(() => {
    setCreateProtocolChatAtom({
      prompt: '',
      regenerate: false,
      scientific_application_type: '',
      description: '',
      robots: 'opentrons_flex',
      mounts: [],
      flexGripper: false,
      modules: [],
      labware: [],
      liquids: [],
      steps: [],
      fake: false,
    })
    setUpdateProtocolChatAtom({
      prompt: '',
      protocol_text: '',
      regenerate: false,
      update_type: 'adapt_python_protocol',
      update_details: '',
      fake: false,
    })
    setChatHistoryAtom([])
    setChatData([])
  }, [])

  useEffect(() => {
    setHeaderWithMeterAtom({
      displayHeaderWithMeter: true,
      progress: calculateProgress(),
    })
  }, [currentSection])

  useEffect(() => {
    return () => {
      setHeaderWithMeterAtom({
        displayHeaderWithMeter: false,
        progress: 0,
      })

      methods.reset()
      setCreateProtocolAtom({
        currentSection: 0,
        focusSection: 0,
      })
    }
  }, [])

  useEffect(() => {
    if (parentRef.current != null) {
      const parentWidth = parentRef.current.offsetWidth
      const initialRightWidth = 516 // Initial width of the right column in pixels
      const initialLeftWidthPercentage =
        ((parentWidth - initialRightWidth) / parentWidth) * 100
      setLeftWidth(initialLeftWidthPercentage)
    }
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  function calculateProgress(): number {
    return currentSection > 0 ? currentSection / TOTAL_STEPS : 0
  }

  function handleMouseDown(e: MouseEvent<HTMLDivElement, MouseEvent>): void {
    setIsResizing(true)
    setInitialMouseX(e.clientX)
    setInitialLeftWidth(leftWidth)
  }

  function handleMouseMove(e: MouseEvent): void {
    if (parentRef.current != null) {
      const parentWidth = parentRef.current.offsetWidth
      const maxLeftWidth = 75
      const minLeftWidth = 25

      let newLeftWidth =
        initialLeftWidth + ((e.clientX - initialMouseX) / parentWidth) * 100

      if (newLeftWidth < minLeftWidth) {
        newLeftWidth = minLeftWidth
      }

      if (newLeftWidth > maxLeftWidth) {
        newLeftWidth = maxLeftWidth
      }

      setLeftWidth(newLeftWidth)
    }
  }

  function handleMouseUp(): void {
    setIsResizing(false)
  }

  function handleSubmit(): void {
    const chatPromptData = generateChatPrompt(
      methods.getValues(),
      t,
      setCreateProtocolChatAtom,
      isPdProtocolGenerationEnabled
    )

    trackEvent({
      name: 'submit-prompt',
      properties: {
        isCreateOrUpdate: 'create',
        prompt: chatPromptData,
      },
    })

    navigate('/chat')
  }

  return (
    <FormProvider {...methods}>
      <Flex
        ref={parentRef}
        position={POSITION_RELATIVE}
        justifyContent={JUSTIFY_SPACE_EVENLY}
        gap={SPACING.spacing32}
        margin={`${SPACING.spacing16} ${SPACING.spacing16}`}
        height="100%"
        width="100%"
      >
        <div style={{ width: `${leftWidth}%`, height: '100%' }}>
          <ProtocolSectionsContainer />
        </div>
        <ResizeBar handleMouseDown={handleMouseDown} />
        <div style={{ width: `${100 - leftWidth}%`, height: '100%' }}>
          <PromptPreview
            handleSubmit={handleSubmit}
            // todo: fix this disabled logic
            isSubmitButtonEnabled={currentSection === TOTAL_STEPS}
            promptPreviewData={generatePromptPreviewData(methods.watch, t)}
          />
        </div>
      </Flex>
    </FormProvider>
  )
}
