import opentelemetry, { Span } from '@opentelemetry/api'
import { User as UserType } from '../gen/gqlClient'

const serviceNameOTEL = 'app-web-' + process.env.REACT_APP_STAGE_NAME

function getTracer() {
    const tracer = opentelemetry.trace.getTracer(serviceNameOTEL)
    return tracer
}

// Add a span to existing trace or if none, start and end and new span
// if a callback is passed in, end span after that async action, this could allow the trace to also collect how long the action took
// based on https://blog.devgenius.io/measuring-react-performance-with-opentelemetry-and-honeycomb-2b20a7920335
async function recordSpan(
    name: string,
    cb?: () => Promise<void>,
    parentSpan?: Span
): Promise<void> {
    const tracer = getTracer()
    let span: Span
    if (parentSpan) {
        const otelContext = opentelemetry.trace.setSpan(
            opentelemetry.context.active(),
            parentSpan
        )
        span = tracer.startSpan(name, undefined, otelContext)
    } else {
        span = tracer.startSpan(name)
    }

    if (cb) {
        try {
            await cb()
        } catch (err) {
            span.recordException(err)
        }
    }

    span.end()

    return
}

function recordJSException(error: string | Error): void {
    const tracer = getTracer()
    const span = tracer.startSpan('JSException')
    span.recordException(error)
    span.end()
}

function addUserToActiveSpan(user: UserType) {
    const activeSpan = opentelemetry.trace.getSpan(
        opentelemetry.context.active()
    )
    if (!activeSpan) return

    activeSpan.setAttribute('user_id', user.email)
    activeSpan.setAttribute('user_role', user.role)
}

export { getTracer, recordSpan, recordJSException, addUserToActiveSpan }
