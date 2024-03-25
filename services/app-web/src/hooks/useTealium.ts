import { useCallback, useEffect } from 'react'
import { usePage } from '../contexts/PageContext'
import { useCurrentRoute } from './useCurrentRoute'
import { createScript } from './useScript'
import { PageTitlesRecord } from '../constants/routes'
import { useAuth } from '../contexts/AuthContext'
import {
    CONTENT_TYPE_BY_ROUTE,
    getTealiumEnv,
    getTealiumPageName,
} from '../constants/tealium'
import type {
    TealiumLinkDataObject,
    TealiumViewDataObject,
    TealiumEvent,
} from '../constants/tealium'
import { recordJSException } from '../otelHelpers'

/*
Tealium is the data layer for Google Analytics and other data tracking at CMS
    The hooks in this file have two purposes:
    1. Loads JavaScript code called utag.js into the application. This contains all of the generated code necessary to use Tealium and third-party tags.
    2. Tracks new page views using the Tealium Universal Data Format, defined in this doc: https://docs.tealium.com/platforms/javascript/universal-data-object/

    In addition, useTealium returns a function for tracking user events. See Tealium docs on tracking: https://docs.tealium.com/platforms/javascript/track/
*/
const useTealium = (): {
    logTealiumEvent: (linkData: TealiumLinkDataObject) => void
} => {
    const { currentRoute, pathname } = useCurrentRoute()
    const { heading } = usePage()
    const { loggedInUser } = useAuth()

    const waitForUtag = async () => {
        return new Promise(resolve => setTimeout(resolve, 1000));
     }

     const callUTagView = useCallback(() => {
        const tealiumPageName = getTealiumPageName({
            heading,
            route: currentRoute,
            user: loggedInUser,
        })
         // eslint-disable-next-line @typescript-eslint/no-empty-function
        const utag = window.utag || { link: () => {}, view: () => {} }
        const tagData: TealiumViewDataObject = {
            content_language: 'en',
            content_type: `${CONTENT_TYPE_BY_ROUTE[currentRoute]}`,
            page_name: tealiumPageName,
            page_path: pathname,
            site_domain: 'cms.gov',
            site_environment: `${process.env.REACT_APP_STAGE_NAME}`,
            site_section: `${currentRoute}`,
            logged_in: `${Boolean(loggedInUser) ?? false}`,
        }
        utag.view(tagData)
        console.log('utag view', tagData)
     },[currentRoute, heading, pathname, loggedInUser])

    // Add Tealium setup
    // this effect should only fire on initial app load
    useEffect(() => {
        // if (process.env.REACT_APP_STAGE_NAME === 'local') {
        //     return
        // }

        const tealiumEnv = getTealiumEnv(
            process.env.REACT_APP_STAGE_NAME || 'main'
        )
        const tealiumProfile = 'cms-mcreview'
        if (!tealiumEnv || !tealiumProfile) {
            console.error(
                `Missing key configuration for Tealium. tealiumEnv: ${tealiumEnv} tealiumProfile: ${tealiumProfile}`
            )
        }

        // Suppress automatic page views for SPA
        window.utag_cfg_ovrd = window.utag_cfg_ovrd || {}
        window.utag_cfg_ovrd.noview = true

        // Load utag.sync.js - add to head element - SYNC load from src
        const initializeTagManagerSnippet = createScript({
            src: `https://tags.tiqcdn.com/utag/cmsgov/${tealiumProfile}/${tealiumEnv}/utag.sync.js`,
            id: 'tealium-load-tags-sync',
        })
        document.head.appendChild(initializeTagManagerSnippet)

        // Load utag.js - Add to body element- ASYNC load inline script
        const inlineScript =
            document.createTextNode(`(function (t, e, a, l, i, u, m) {
            t = 'cmsgov/${tealiumProfile}'
            e = '${tealiumEnv}'
            a = '/' + t + '/' + e + '/utag.js'
            l = '//tags.tiqcdn.com/utag' + a
            i = document
            u = 'script'
            m = i.createElement(u)
            m.src = l
            m.type = 'text/java' + u
            m.async = true
            l = i.getElementsByTagName(u)[0]
            l.parentNode.insertBefore(m, l)
        })()`)

        const loadTagsSnippet = createScript({
            src: '',
            useInlineScriptNotSrc: true,
            id: 'tealium-load-tags-async',
        })
        loadTagsSnippet.appendChild(inlineScript)

        document.body.appendChild(loadTagsSnippet)


        if (!window.utag) {
            console.log('initial load')
            // All of this is a guardrail - protect against trying to call utag before its loaded on initial load
            waitForUtag().finally( () =>{
            if (!window.utag) {
                recordJSException('Analytics did not load in time')
                return
            } else {
                callUTagView()
             }
            })
        } else {
            console.log('initial load')
            callUTagView()
        }

        return () => {
            // document.body.removeChild(loadTagsSnippet)
            document.head.removeChild(initializeTagManagerSnippet)
        }
    }, [])

    // Add page view
    // this effect should fire on each page view or if something changes about logged in user
    useEffect(() => {
        // if (process.env.REACT_APP_STAGE_NAME === 'local') {
        //     return
        // }

        // We are in a SPA page route change after initial load
        console.log(currentRoute, loggedInUser)
        if (window.utag && loggedInUser !== undefined) {
            console.log('page view')
            // callUTagView()
        }


    }, [currentRoute, loggedInUser])

    // Add user event
    const logTealiumEvent = (linkData: {
        tealium_event: TealiumEvent
        content_type?: string
    }) => {
        if (process.env.REACT_APP_STAGE_NAME === 'local') {
            return
        }

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const utag = window.utag || { link: () => {}, view: () => {} }

        const tagData: TealiumLinkDataObject = {
            content_language: 'en',
            page_name: `${heading}: ${PageTitlesRecord[currentRoute]}`,
            page_path: pathname,
            site_domain: 'cms.gov',
            site_environment: `${process.env.REACT_APP_STAGE_NAME}`,
            site_section: `${currentRoute}`,
            logged_in: `${Boolean(loggedInUser) ?? false}`,
            userId: loggedInUser?.email,
            ...linkData,
        }
        utag.link(tagData)
    }

    return { logTealiumEvent }
}

export { useTealium }
