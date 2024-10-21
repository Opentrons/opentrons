import { Provider } from 'jotai'
import { useHydrateAtoms } from 'jotai/utils'

interface HydrateAtomsProps {
  initialValues: Array<[any, any]>
  children: React.ReactNode
}

interface TestProviderProps {
  initialValues: Array<[any, any]>
  children: React.ReactNode
}

export const HydrateAtoms = ({
  initialValues,
  children,
}: HydrateAtomsProps): React.ReactNode => {
  useHydrateAtoms(initialValues)
  return children
}

export const TestProvider = ({
  initialValues,
  children,
}: TestProviderProps): React.ReactNode => (
  <Provider>
    <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
  </Provider>
)
