import stubCameraImage from './stubCameraImage.webp'

export interface UseStubImagesInfoResult {
  imagePath: string
  stepCommandText: string
  previousStepCommandText: string
  timestamp: string
}

const STUBBED_RESULT = {
  stepCommandText: 'Step 1/999999',
  previousStepCommandText:
    'The dachshund also known as the wiener dog, or sausage dog, badger dog, doxen and doxie, is a short-legged, long-bodied, hound-type dog breed. The dog may be smooth-haired, wire-haired, or long-haired, with varied coloration.',
  imagePath: stubCameraImage,
}

// Stubbed image content generator.
export function useStubImagesInfo(): UseStubImagesInfoResult[] {
  // Some large enough number to test scrolling.
  return Array.from({ length: 25 }, () => ({
    ...STUBBED_RESULT,
    timestamp: (Math.random() * 100).toFixed(8).toString(),
  }))
}
