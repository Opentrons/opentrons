import { vi } from 'vitest'

import { DocumentationRequiredModalContext } from '../DocumentationRequiredModalContext'

import type { FunctionComponent, ReactNode } from 'react'
import type { DocumentationReport } from '@opentrons/react-api-client'

export const mockShowDocumentationRequiredModal: (
  username: string
) => Promise<DocumentationReport> =
  vi.fn<(username: string) => Promise<DocumentationReport>>()

export const mockShowLoginModal: () => Promise<{ username: string } | null> =
  vi.fn<() => Promise<{ username: string } | null>>()

export const mockShowSignRunModal: () => Promise<boolean> =
  vi.fn<() => Promise<boolean>>()

export const DocumentationRequiredModalTestProvider: FunctionComponent<{
  children: ReactNode
}> = ({ children }) => (
  <DocumentationRequiredModalContext.Provider
    value={{
      showDocumentationRequiredModal: mockShowDocumentationRequiredModal,
      showLoginModal: mockShowLoginModal,
      showSignRunModal: mockShowSignRunModal,
    }}
  >
    {children}
  </DocumentationRequiredModalContext.Provider>
)

export const wrapWithDocumentationRequiredModal = (
  InnerWrapper?: FunctionComponent<{ children: ReactNode }>
): FunctionComponent<{ children: ReactNode }> => {
  if (InnerWrapper == null) {
    return DocumentationRequiredModalTestProvider
  }

  return ({ children }) => (
    <DocumentationRequiredModalTestProvider>
      <InnerWrapper>{children}</InnerWrapper>
    </DocumentationRequiredModalTestProvider>
  )
}
