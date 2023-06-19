import * as React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { MiniCard, MiniCardProps } from '../MiniCard'

describe('MiniCard Component', () => {
  const props: MiniCardProps = {
    children: 'Test MiniCard',
    onClick: jest.fn(),
    isSelected: false,
    isError: false,
    value: '',
  }

  describe('Positive Test Cases', () => {
    it('should render MiniCard component', () => {
      const { getByText } = render(<MiniCard {...props} />)
      expect(getByText('Test MiniCard')).toBeInTheDocument()
    })

    it('should call onClick function when MiniCard is clicked', () => {
      const { getByText } = render(<MiniCard {...props} />)
      fireEvent.click(getByText('Test MiniCard'))
      expect(props.onClick).toHaveBeenCalled()
    })

    it('should render MiniCard with selectedWrapperStyles when isSelected is true', () => {
      const { getByText } = render(<MiniCard {...props} isSelected={true} />)
      expect(getByText('Test MiniCard')).toHaveStyle(
        'background-color: #f1f8ff;'
      )
    })

    it('should render MiniCard with errorOptionStyles when isError is true', () => {
      const { getByText } = render(
        <MiniCard {...props} isSelected={true} isError={true} />
      )
      expect(getByText('Test MiniCard')).toHaveStyle(
        'background-color: #fff3f3;'
      )
    })

    it('should render MiniCard with selectedOptionStyles when isError is false', () => {
      const { getByText } = render(
        <MiniCard {...props} isSelected={true} isError={false} />
      )
      expect(getByText('Test MiniCard')).toHaveStyle(
        'background-color: #f1f8ff;'
      )
    })
  })

  describe('Negative Test Cases', () => {
    it('should not render MiniCard component when children prop is not passed', () => {
      const { queryByText } = render(
        <MiniCard {...props} children={undefined} />
      )
      expect(queryByText('Test MiniCard')).not.toBeInTheDocument()
    })
  })

  describe('Edge Test Cases', () => {
    it('should render MiniCard with selectedWrapperStyles when isSelected is true and isError is true', () => {
      const { getByText } = render(
        <MiniCard {...props} isSelected={true} isError={true} />
      )
      expect(getByText('Test MiniCard')).toHaveStyle(
        'background-color: #fff3f3;'
      )
    })
  })
})
