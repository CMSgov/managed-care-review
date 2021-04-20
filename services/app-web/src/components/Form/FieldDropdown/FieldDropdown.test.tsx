import React from 'react'
import { screen, render } from '@testing-library/react'
import { FieldDropdown } from './FieldDropdown'

const mockOnChange = jest.fn()
const mockSetValue = jest.fn()

// mock out formik hook as we are not testing formik
// needs to be before first describe
jest.mock('formik', () => {
    return {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line
        ...jest.requireActual('formik'),
        useField: () => [
            {
                onChange: mockOnChange,
            },
            { touched: true, error: 'Must select at least one program' },
            { setValue: mockSetValue },
        ],
    }
})

describe('FieldDropdown component', () => {
    afterAll(() => {
        jest.clearAllMocks()
    })

    it('renders without errors', () => {
        render(
            <FieldDropdown
                label="Program"
                id="input1"
                showError={false}
                name="input1"
                options={[
                    { id: 'id1', label: 'value1' },
                    { id: 'id2', label: 'value2' },
                    { id: 'id3', label: 'value3' },
                ]}
            />
        )
        expect(
            screen.getByRole('combobox', { name: 'Program' })
        ).toBeInTheDocument()
        const programOptions = screen.getAllByRole('option')
        expect(programOptions.length).toBe(3)
    })

    it('handles custom aria attributes', () => {
        render(
            <FieldDropdown
                label="Program"
                id="input1"
                showError={false}
                name="input1"
                aria-required
                options={[
                    { id: 'id1', label: 'value1' },
                    { id: 'id2', label: 'value2' },
                    { id: 'id3', label: 'value3' },
                ]}
            />
        )
        expect(
            screen.getByRole('combobox', { name: 'Program' })
        ).toHaveAttribute('aria-required', 'true')
    })

    it('displays hint', () => {
        render(
            <FieldDropdown
                label="Program"
                id="input1"
                showError={false}
                name="input1"
                options={[{ id: 'id', label: 'value' }]}
                hint={<span>You can change your program at any time.</span>}
            />
        )
        expect(
            screen.getByText('You can change your program at any time.')
        ).toBeInTheDocument()
    })

    it('displays errors', () => {
        render(
            <FieldDropdown
                label="Program"
                id="input1"
                showError={true}
                name="input1"
                options={[{ id: 'id', label: 'value' }]}
            />
        )
        expect(
            screen.getByText('Must select at least one program')
        ).toBeInTheDocument()
        expect(screen.getByTestId('errorMessage')).toBeInTheDocument()
    })
})
