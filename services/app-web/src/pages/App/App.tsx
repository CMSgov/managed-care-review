import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import {
    ApolloProvider,
    ApolloClient,
    NormalizedCacheObject,
} from '@apollo/client'

import { AppBody } from './AppBody'
import { AuthProvider } from '../../contexts/AuthContext'
import {ErrorBoundaryRoot} from '../Errors/ErrorBoundaryRoot'
import { PageProvider } from '../../contexts/PageContext'
import { logEvent } from '../../log_event'
import TraceProvider from '../../contexts/TraceContext'

import { AuthModeType } from '../../common-code/config'
import { S3Provider } from '../../contexts/S3Context'
import type { S3ClientT } from '../../s3'


export type AppProps = {
    authMode: AuthModeType
    apolloClient: ApolloClient<NormalizedCacheObject>
    s3Client: S3ClientT
}

function App({
    authMode,
    apolloClient,
    s3Client,
}: AppProps): React.ReactElement {
    useEffect(() => {
        logEvent('on_load', { success: true })
    }, [])

    return (
        <ErrorBoundary FallbackComponent={ErrorBoundaryRoot}>
            <BrowserRouter>
                <TraceProvider>
                    <ApolloProvider client={apolloClient}>
                        <S3Provider client={s3Client}>
                            <AuthProvider authMode={authMode}>
                                <PageProvider>
                                    <>
                                        <AppBody authMode={authMode} />
                                    </>
                                </PageProvider>
                            </AuthProvider>
                        </S3Provider>
                    </ApolloProvider>
                </TraceProvider>
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App
