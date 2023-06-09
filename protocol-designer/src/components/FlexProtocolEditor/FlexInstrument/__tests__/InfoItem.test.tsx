import * as React from 'react'
import { InfoItem, InfoItemProps } from '../InfoItem'
import { render } from '@testing-library/react'

describe('InfoItem', () => {
  describe('Positive Test Cases', () => {
    it('renders InfoItem component with title and value', () => {
      const props: InfoItemProps = {
        title: 'Test Title',
        value: 'Test Value',
        className: 'test-class',
      }
      const { getByText } = render(<InfoItem {...props} />)
      expect(getByText('Test Title')).toBeInTheDocument()
      expect(getByText('Test Value')).toBeInTheDocument()
    })

    it('renders InfoItem component without title and value', () => {
      const props: InfoItemProps = {
        title: '',
        value: '',
        className: 'test-class',
      }
      const { queryAllByText } = render(<InfoItem {...props} />)
      const elementsWithEmptyText = queryAllByText('')

      elementsWithEmptyText.forEach(element => {
        expect(element).toBeVisible()
      })
    })
  })

  describe('Edge Test Cases', () => {
    it('renders InfoItem component with long title and value', () => {
      const props: InfoItemProps = {
        title: 'This is a very long title that should be truncated',
        value: 'This is a very long value that should be truncated',
        className: 'test-class',
      }
      const { getByText } = render(<InfoItem {...props} />)
      expect(
        getByText('This is a very long title that should be truncated')
      ).toBeInTheDocument()
      expect(
        getByText('This is a very long value that should be truncated')
      ).toBeInTheDocument()
    })
  })
})
