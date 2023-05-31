import { MockedProvider, MockedProviderProps } from '@apollo/client/testing'
import { Location, MemoryRouter, useLocation } from 'react-router-dom'
import {
    fireEvent,
    render,
    Screen,
    queries,
    ByRoleMatcher,
    prettyDOM,
    within,
    Matcher,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AuthProvider, AuthProviderProps } from '../contexts/AuthContext'

import { PageProvider } from '../contexts/PageContext'
import { S3Provider } from '../contexts/S3Context'
import { testS3Client } from './s3Helpers'
import { S3ClientT } from '../s3'
import * as LaunchDarkly from 'launchdarkly-react-client-sdk'
import {
    FeatureFlagLDConstant,
    FlagValue,
    FeatureFlagSettings,
} from '@managed-care-review/common-code/featureFlags'

/* Render */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const renderWithProviders = (
    ui: React.ReactNode, // actual test UI - the JSX to render
    options?: {
        routerProvider?: { route?: string } // used to pass react router related data
        apolloProvider?: MockedProviderProps // used to pass GraphQL related data via apollo client
        authProvider?: Partial<AuthProviderProps> // used to pass user authentication state via AuthContext
        s3Provider?: S3ClientT // used to pass AWS S3 related state via  S3Context
        location?: (location: Location) => Location // used to pass a location url for react-router
    }
) => {
    const {
        routerProvider = {},
        apolloProvider = {},
        authProvider = {},
        s3Provider = undefined,
        location = undefined,
    } = options || {}

    const { route } = routerProvider
    const s3Client: S3ClientT = s3Provider ?? testS3Client()

    return render(
        <MockedProvider {...apolloProvider}>
            <MemoryRouter initialEntries={[route || '']}>
                <AuthProvider authMode={'AWS_COGNITO'} {...authProvider}>
                    <S3Provider client={s3Client}>
                        {location && <WithLocation setLocation={location} />}
                        <PageProvider>{ui}</PageProvider>
                    </S3Provider>
                </AuthProvider>
            </MemoryRouter>
        </MockedProvider>
    )
}

const WithLocation = ({
    setLocation,
}: {
    setLocation: (location: Location) => Location
}): null => {
    const location = useLocation()
    setLocation(location)
    return null
}

//WARNING: This required tests using this function to clear mocks afterwards.
const ldUseClientSpy = (featureFlags: FeatureFlagSettings) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(LaunchDarkly, 'useLDClient').mockImplementation((): any => {
        return {
            // Checks to see if flag passed into useLDClient exists in the featureFlag passed in ldUseClientSpy
            // If flag passed in useLDClient does not exist, then use defaultValue that was also passed into useLDClient.
            // If flag does exist the featureFlag value passed into ldUseClientSpy then use the value in featureFlag.
            //
            // This is done because testing components may contain more than one instance of useLDClient for a different
            // flag. We do not want to apply the value passed in featureFlags to each useLDClient especially if the flag
            // passed in useLDClient does not exist in featureFlags passed into ldUseClientSpy.
            getUser: jest.fn(),
            identify: jest.fn(),
            alias: jest.fn(),
            variation: (
                flag: FeatureFlagLDConstant,
                defaultValue: FlagValue | undefined
            ) => {
                if (
                    featureFlags[flag] === undefined &&
                    defaultValue === undefined
                ) {
                    //ldClient.variation doesn't require a default value, throwing error here if a defaultValue was not provided.
                    throw new Error(
                        'ldUseClientSpy returned an invalid value of undefined'
                    )
                }
                return featureFlags[flag] === undefined
                    ? defaultValue
                    : featureFlags[flag]
            },
        }
    })
}

const prettyDebug = (label?: string, element?: HTMLElement): void => {
    console.info(
        `${label ?? 'body'}:
    `,
        prettyDOM(element ?? document.body, 50000)
    )
}

/* User Events */
const selectYesNoRadio = async (
    screen: Screen<typeof queries>,
    legend: Matcher,
    value: 'Yes' | 'No'
) => {
    const radioFieldset = screen.getByText(legend).parentElement
    if (!radioFieldset)
        throw new Error(`${legend} yes no radio field legend does not exist`)
    const radioOption = within(radioFieldset).getByLabelText(value)
    await userEvent.click(radioOption)
}

const userClickByTestId = async (
    screen: Screen<typeof queries>,
    testId: string
): Promise<void> => {
    const element = screen.getByTestId(testId)
    await userEvent.click(element)
}
const userClickByRole = async (
    screen: Screen<typeof queries>,
    role: ByRoleMatcher,
    options?: queries.ByRoleOptions | undefined
): Promise<void> => {
    const element = screen.getByRole(role, options)
    await userEvent.click(element)
}

const userClickSignIn = async (
    screen: Screen<typeof queries>
): Promise<void> => {
    const signInButton = await screen.findByRole('link', { name: /Sign In/i })
    await userEvent.click(signInButton)
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
    prettyDebug,
    userClickByRole,
    userClickByTestId,
    userClickSignIn,
    ldUseClientSpy,
    selectYesNoRadio,
    TEST_DOC_FILE,
    TEST_PDF_FILE,
    TEST_PNG_FILE,
    TEST_TEXT_FILE,
    TEST_VIDEO_FILE,
    TEST_XLS_FILE,
}
