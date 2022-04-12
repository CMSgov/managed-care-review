import { MockedProvider, MockedProviderProps } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import {
    fireEvent,
    render,
    Screen,
    queries,
    ByRoleMatcher,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider, AuthProviderProps } from '../contexts/AuthContext'

import { PageProvider } from '../contexts/PageContext'
import { S3Provider } from '../contexts/S3Context'
import { testS3Client } from './s3Helpers'

/* Render */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const renderWithProviders = (
    ui: React.ReactNode,
    options?: {
        routerProvider?: { route?: string }
        apolloProvider?: MockedProviderProps
        authProvider?: Partial<AuthProviderProps>
    }
) => {
    const {
        routerProvider = {},
        apolloProvider = {},
        authProvider = {},
    } = options || {}

    const { route } = routerProvider

    return render(
        <MockedProvider {...apolloProvider}>
            <MemoryRouter initialEntries={[route || '']}>
                <AuthProvider authMode={'AWS_COGNITO'} {...authProvider}>
                    <S3Provider client={testS3Client}>
                        <PageProvider>{ui}</PageProvider>
                    </S3Provider>
                </AuthProvider>
            </MemoryRouter>
        </MockedProvider>
    )
}

/* User Events */

const userClickByTestId = (
    screen: Screen<typeof queries>,
    testId: string
): void => {
    const element = screen.getByTestId(testId)
    userEvent.click(element)
}
const userClickByRole = (
    screen: Screen<typeof queries>,
    role: ByRoleMatcher,
    options?: queries.ByRoleOptions | undefined
): void => {
    const element = screen.getByRole(role, options)
    userEvent.click(element)
}

const userClickSignIn = (screen: Screen<typeof queries>): void => {
    const signInButton = screen.getByRole('link', { name: /Sign In/i })
    userEvent.click(signInButton)
}

function dragAndDrop(inputDropTarget: HTMLElement, files: File[]): void {
    fireEvent.dragEnter(inputDropTarget)
    fireEvent.dragOver(inputDropTarget)
    fireEvent.drop(inputDropTarget, {
        bubbles: true,
        cancelable: true,
        dataTransfer: {
            files: files,
        },
    })

    return
}

function fakeRequest<T>(
    success: boolean,
    returnData: T,
    timeout?: number
): Promise<T> {
    const t = timeout || Math.round(Math.random() * 1000)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (success) {
                resolve(returnData)
            } else {
                reject(new Error('Error'))
            }
        }, t)
    })
}

const TEST_TEXT_FILE = new File(['Test File Contents'], 'testFile.txt', {
    type: 'text/plain',
})

const TEST_PDF_FILE = new File(['Test PDF File'], 'testFile.pdf', {
    type: 'application/pdf',
})

const TEST_DOC_FILE = new File(['Test doc File'], 'testFile.doc', {
    type: 'application/msword',
})

const TEST_XLS_FILE = new File(['Test xls File'], 'testFile.xls', {
    type: 'application/vnd.ms-excel',
})

const TEST_VIDEO_FILE = new File(['Test video File'], 'testFile.mp4', {
    type: 'video/mp4',
})

const TEST_PNG_FILE = new File(['Test PNG Image'], 'testFile.png', {
    type: 'image/png',
})

export {
    fakeRequest,
    dragAndDrop,
    renderWithProviders,
    userClickByRole,
    userClickByTestId,
    userClickSignIn,
    TEST_DOC_FILE,
    TEST_PDF_FILE,
    TEST_PNG_FILE,
    TEST_TEXT_FILE,
    TEST_VIDEO_FILE,
    TEST_XLS_FILE,
}
