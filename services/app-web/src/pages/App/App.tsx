import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { CompatRouter } from 'react-router-dom-v5-compat'
import { ErrorBoundary } from 'react-error-boundary'
import {
    ApolloProvider,
    ApolloClient,
    NormalizedCacheObject,
} from '@apollo/client'

import { AppBody } from './AppBody'
import { AuthProvider } from '../../contexts/AuthContext'
import { PageProvider } from '../../contexts/PageContext'
import { logEvent } from '../../log_event'
import TraceProvider from '../../contexts/TraceContext'
import { GenericErrorPage } from '../Errors/GenericErrorPage'
import { AuthModeType } from '../../common-code/domain-models'
import { S3Provider } from '../../contexts/S3Context'
import { useScript } from '../../hooks/useScript'
import type { S3ClientT } from '../../s3'

function ErrorFallback({
    error,
}: {
    error: Error
    resetErrorBoundary?: () => void
}): React.ReactElement {
    console.error(error)
    return <GenericErrorPage />
}

function App({
    authMode,
    apolloClient,
    s3Client,
}: {
    authMode: AuthModeType
    apolloClient: ApolloClient<NormalizedCacheObject>
    s3Client: S3ClientT
}): React.ReactElement {
    useEffect(() => {
        logEvent('on_load', { success: true })
    }, [])

    // This is a hacky way to fake feature flags before we have feature flags.
    // please avoid reading env vars outside of index.tsx in general.
    const environmentName = process.env.REACT_APP_STAGE_NAME || ''
    const isProdEnvironment = ['prod', 'val'].includes(environmentName)
    const jiraTicketCollectorURL = `https://meghantest.atlassian.net/s/d41d8cd98f00b204e9800998ecf8427e-T/-9zew5j/b/7/c95134bc67d3a521bb3f4331beb9b804/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?locale=en-US&collectorId=e59b8faf`

    useScript(jiraTicketCollectorURL, !isProdEnvironment)

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <BrowserRouter>
                <CompatRouter>
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
                </CompatRouter>
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App
