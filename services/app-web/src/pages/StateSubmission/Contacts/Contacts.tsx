import React, { useEffect } from 'react'
import * as Yup from 'yup'
import {
    Form as UswdsForm,
    FormGroup,
    Fieldset,
    Button,
    Link,
    ButtonGroup,
} from '@trussworks/react-uswds'
import {
    Formik,
    FormikErrors,
    FormikHelpers,
    Field,
    FieldArray,
    ErrorMessage,
} from 'formik'
import { NavLink, useHistory } from 'react-router-dom'

import styles from '../StateSubmissionForm.module.scss'

import {
    ActuarialFirmType,
    ActuaryCommunicationType,
    DraftSubmission,
    UpdateDraftSubmissionInput,
} from '../../../gen/gqlClient'

import { ErrorSummary, FieldRadio } from '../../../components/Form'

import {
    updatesFromSubmission,
    stripTypename,
} from '../updateSubmissionTransform'

import { useFocus } from '../../../hooks/useFocus'

export interface ContactsFormValues {
    stateContacts: stateContactValue[]
    actuaryContacts: actuaryContactValue[]
    actuaryCommunicationPreference: ActuaryCommunicationType | undefined
}

export interface stateContactValue {
    name: string
    titleRole: string
    email: string
}

export interface actuaryContactValue {
    name: string
    titleRole: string
    email: string
    actuarialFirm?: ActuarialFirmType | null | undefined
    actuarialFirmOther?: string | null
}

const yupValidation = (submissionType: string) => {
    const contactShape = {
        stateContacts: Yup.array().of(
            Yup.object().shape({
                name: Yup.string().required('You must provide a name'),
                titleRole: Yup.string().required(
                    'You must provide a title/role'
                ),
                email: Yup.string()
                    .email('You must enter a valid email address')
                    .required('You must provide an email address'),
            })
        ),
        actuaryContacts: Yup.array(),
        actuaryCommunicationPreference: Yup.string().nullable(),
    }

    if (submissionType !== 'CONTRACT_ONLY') {
        contactShape.actuaryContacts = Yup.array().of(
            Yup.object().shape({
                name: Yup.string().required('You must provide a name'),
                titleRole: Yup.string().required(
                    'You must provide a title/role'
                ),
                email: Yup.string()
                    .email('You must enter a valid email address')
                    .required('You must provide an email address'),
                actuarialFirm: Yup.string()
                    .required('You must select an actuarial firm')
                    .nullable(),
                actuarialFirmOther: Yup.string()
                    .when('actuarialFirm', {
                        is: 'OTHER',
                        then: Yup.string()
                            .required('You must enter a description')
                            .nullable(),
                    })
                    .nullable(),
            })
        )
        contactShape.actuaryCommunicationPreference = Yup.string().required(
            'You must select a communication preference'
        )
    }

    return Yup.object().shape(contactShape)
}

type FormError =
    FormikErrors<ContactsFormValues>[keyof FormikErrors<ContactsFormValues>]

// We want to make sure we are returning the specific error
// for a given field when we pass it through showFieldErrors
// so this makes sure we return the actual error and if its
// anything else we return undefined to not show it
const stateContactErrorHandling = (
    error: string | FormikErrors<stateContactValue> | undefined
): FormikErrors<stateContactValue> | undefined => {
    if (typeof error === 'string') {
        return undefined
    }
    return error
}

const actuaryContactErrorHandling = (
    error: string | FormikErrors<actuaryContactValue> | undefined
): FormikErrors<actuaryContactValue> | undefined => {
    if (typeof error === 'string') {
        return undefined
    }
    return error
}

// Convert the formik errors into a shape that can be passed to ErrorSummary
const flattenErrors = (
    errors: FormikErrors<ContactsFormValues>
): { [field: string]: string } => {

    const flattened: {[field: string]: string} = {}

    if (errors.stateContacts && Array.isArray(errors.stateContacts)) {
        errors.stateContacts.forEach((contact, index) => {
            if (!contact) return

            Object.entries(contact).forEach(([field, value]) => {
                const errorKey = `${contact}.${field}`
                flattened[errorKey] = value
            })
        })
    }

    if (errors.actuaryContacts && Array.isArray(errors.actuaryContacts)) {
        errors.actuaryContacts.forEach((contact, index) => {
            if (!contact) return

            Object.entries(contact).forEach(([field, value]) => {
                const errorKey = `${contact}.${field}`
                flattened[errorKey] = value
            })
        })
    }

    return flattened
}

export const Contacts = ({
    draftSubmission,
    showValidations = false,
    updateDraft,
    formAlert = undefined,
}: {
    draftSubmission: DraftSubmission
    showValidations?: boolean
    formAlert?: React.ReactElement
    updateDraft: (
        input: UpdateDraftSubmissionInput
    ) => Promise<DraftSubmission | undefined>
}): React.ReactElement => {
    const [shouldValidate, setShouldValidate] = React.useState(showValidations)
    const [focusNewContact, setFocusNewContact] = React.useState(false)
    const [focusNewActuaryContact, setFocusNewActuaryContact] =
        React.useState(false)

    const redirectToDashboard = React.useRef(false)
    const newStateContactNameRef = React.useRef<HTMLElement | null>(null) // This ref.current is reset to the newest contact name field each time new contact is added
    const [newStateContactButtonRef, setNewStateContactButtonFocus] = useFocus() // This ref.current is always the same element

    const newActuaryContactNameRef = React.useRef<HTMLElement | null>(null)
    const [newActuaryContactButtonRef, setNewActuaryContactButtonFocus] =
        useFocus()

    const history = useHistory()

    const errorSummaryHeadingRef = React.useRef<HTMLHeadingElement>(null)
    const [focusErrorSummaryHeading, setFocusErrorSummaryHeading] = React.useState(false)
const includeActuaryContacts =
    draftSubmission.submissionType !== 'CONTRACT_ONLY'
/*
     Set focus to contact name field when adding new contacts.
     Clears ref and focusNewContact component state immediately after. The reset allows additional contacts to be added and preserves expected focus behavior.
    */
React.useEffect(() => {
    if (focusNewContact) {
        newStateContactNameRef.current && newStateContactNameRef.current.focus()
        setFocusNewContact(false)
        newStateContactNameRef.current = null
    }
    if (focusNewActuaryContact) {
        newActuaryContactNameRef.current &&
            newActuaryContactNameRef.current.focus()
        setFocusNewActuaryContact(false)
        newActuaryContactNameRef.current = null
    }
}, [focusNewContact, focusNewActuaryContact])

useEffect(() => {
    // Focus the error summary heading only if we are displaying
    // validation errors and the heading element exists
    if (focusErrorSummaryHeading && errorSummaryHeadingRef.current) {
        errorSummaryHeadingRef.current.focus()
    }
    setFocusErrorSummaryHeading(false)
}, [focusErrorSummaryHeading])

// TODO: refactor this into reusable component that is more understandable
const showFieldErrors = (error?: FormError): boolean | undefined =>
    shouldValidate && Boolean(error)

const stateContacts = stripTypename(draftSubmission.stateContacts)
const actuaryContacts = stripTypename(draftSubmission.actuaryContacts)

const emptyStateContact = {
    name: '',
    titleRole: '',
    email: '',
}

const emptyActuaryContact = {
    name: '',
    titleRole: '',
    email: '',
    actuarialFirm: null,
    actuarialFirmOther: '',
}

if (stateContacts.length === 0) {
    stateContacts.push(emptyStateContact)
}

if (actuaryContacts.length === 0 && includeActuaryContacts) {
    actuaryContacts.push(emptyActuaryContact)
}

const contactsInitialValues: ContactsFormValues = {
    stateContacts: stateContacts,
    actuaryContacts: actuaryContacts,
    actuaryCommunicationPreference:
        draftSubmission?.actuaryCommunicationPreference ?? undefined,
}

// Handler for Contacts legends so that contacts show up as
// State contacts 1 instead of State contacts 0 for first contact
// and show (required) for only the first contact
// Also handles the difference between State Contacts and Actuary Contacts
const handleContactLegend = (index: number, contactText: string) => {
    const count = index + 1
    const required = index ? '' : ' (required)'

    if (contactText === 'State') {
        return `State contacts ${count} ${required}`
    } else if (contactText === 'Actuary') {
        if (!index) return `Certifying actuary ${required}`
        else return `Additional actuary contact ${index}`
    }
}

const handleFormSubmit = async (
    values: ContactsFormValues,
    formikHelpers: FormikHelpers<ContactsFormValues>
) => {
    const updatedDraft = updatesFromSubmission(draftSubmission)
    updatedDraft.stateContacts = values.stateContacts
    updatedDraft.actuaryContacts = values.actuaryContacts
    updatedDraft.actuaryCommunicationPreference =
        values.actuaryCommunicationPreference

    try {
        const updatedSubmission = await updateDraft({
            submissionID: draftSubmission.id,
            draftSubmissionUpdates: updatedDraft,
        })
        if (updatedSubmission) {
            if (redirectToDashboard.current) {
                history.push(`/dashboard`)
            } else {
                history.push(`/submissions/${draftSubmission.id}/documents`)
            }
        }
    } catch (serverError) {
        formikHelpers.setSubmitting(false)
        redirectToDashboard.current = false
    }
}

const contactSchema = yupValidation(draftSubmission.submissionType)

return (
    <>
        <Formik
            initialValues={contactsInitialValues}
            onSubmit={handleFormSubmit}
            validationSchema={contactSchema}
        >
            {({ values, errors, dirty, handleSubmit, isSubmitting }) => (
                <>
                    <UswdsForm
                        className={styles.formContainer}
                        id="ContactsForm"
                        aria-label="Contacts Form"
                        aria-describedby="form-guidance"
                        onSubmit={handleSubmit}
                    >
                        <fieldset className="usa-fieldset">
                            <h3>State contacts</h3>
                            {formAlert && formAlert}
                            <p>
                                Enter contact information for the state
                                personnel you'd like to receive all CMS
                                communication about this submission.
                            </p>
                            <legend className="srOnly">State contacts</legend>
                            <span id="form-guidance">
                                {includeActuaryContacts
                                    ? 'A state and an actuary contact are required'
                                    : 'A state contact is required'}
                            </span>

                            {shouldValidate && (
                                <ErrorSummary
                                    errors={flattenErrors(errors)}
                                    headingRef={errorSummaryHeadingRef}
                                />
                            )}

                            <FieldArray name="stateContacts">
                                {({ remove, push }) => (
                                    <div
                                        className={styles.stateContacts}
                                        data-testid="state-contacts"
                                    >
                                        {values.stateContacts.length > 0 &&
                                            values.stateContacts.map(
                                                (stateContact, index) => (
                                                    <div
                                                        className={
                                                            styles.stateContact
                                                        }
                                                        key={index}
                                                    >
                                                        <Fieldset
                                                            legend={handleContactLegend(
                                                                index,
                                                                'State'
                                                            )}
                                                        >
                                                            <FormGroup
                                                                error={showFieldErrors(
                                                                    stateContactErrorHandling(
                                                                        errors
                                                                            ?.stateContacts?.[
                                                                            index
                                                                        ]
                                                                    )?.name
                                                                )}
                                                            >
                                                                <label
                                                                    htmlFor={`{${stateContact}}.name`}
                                                                >
                                                                    Name
                                                                </label>
                                                                {showFieldErrors(
                                                                    `True`
                                                                ) && (
                                                                    <ErrorMessage
                                                                        name={`{${stateContact}}.name`}
                                                                        component="div"
                                                                        className="usa-error-message"
                                                                    />
                                                                )}
                                                                <Field
                                                                    name={`{${stateContact}}.name`}
                                                                    id={`{${stateContact}}.name`}
                                                                    aria-required={
                                                                        index ===
                                                                        0
                                                                    }
                                                                    type="text"
                                                                    className="usa-input"
                                                                    innerRef={(
                                                                        el: HTMLElement
                                                                    ) =>
                                                                        (newStateContactNameRef.current =
                                                                            el)
                                                                    }
                                                                />
                                                            </FormGroup>

                                                            <FormGroup
                                                                error={showFieldErrors(
                                                                    stateContactErrorHandling(
                                                                        errors
                                                                            ?.stateContacts?.[
                                                                            index
                                                                        ]
                                                                    )?.titleRole
                                                                )}
                                                            >
                                                                <label
                                                                    htmlFor={`{${stateContact}}.titleRole`}
                                                                >
                                                                    Title/Role
                                                                </label>
                                                                {showFieldErrors(
                                                                    `True`
                                                                ) && (
                                                                    <ErrorMessage
                                                                        name={`{${stateContact}}.titleRole`}
                                                                        component="div"
                                                                        className="usa-error-message"
                                                                    />
                                                                )}
                                                                <Field
                                                                    name={`{${stateContact}}.titleRole`}
                                                                    id={`{${stateContact}}.titleRole`}
                                                                    aria-required={
                                                                        index ===
                                                                        0
                                                                    }
                                                                    type="text"
                                                                    className="usa-input"
                                                                />
                                                            </FormGroup>

                                                            <FormGroup
                                                                error={showFieldErrors(
                                                                    stateContactErrorHandling(
                                                                        errors
                                                                            ?.stateContacts?.[
                                                                            index
                                                                        ]
                                                                    )?.email
                                                                )}
                                                            >
                                                                <label
                                                                    htmlFor={`{${stateContact}}.email`}
                                                                >
                                                                    Email
                                                                </label>
                                                                {showFieldErrors(
                                                                    `True`
                                                                ) && (
                                                                    <ErrorMessage
                                                                        name={`{${stateContact}}.email`}
                                                                        component="div"
                                                                        className="usa-error-message"
                                                                    />
                                                                )}
                                                                <Field
                                                                    name={`{${stateContact}}.email`}
                                                                    id={`{${stateContact}}.email`}
                                                                    aria-required={
                                                                        index ===
                                                                        0
                                                                    }
                                                                    type="text"
                                                                    className="usa-input"
                                                                />
                                                            </FormGroup>

                                                            {index > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    unstyled
                                                                    className={
                                                                        styles.removeContactBtn
                                                                    }
                                                                    onClick={() => {
                                                                        remove(
                                                                            index
                                                                        )
                                                                        setNewStateContactButtonFocus()
                                                                    }}
                                                                >
                                                                    Remove
                                                                    contact
                                                                </Button>
                                                            )}
                                                        </Fieldset>
                                                    </div>
                                                )
                                            )}

                                        <button
                                            type="button"
                                            className={`usa-button usa-button--outline ${styles.addContactBtn}`}
                                            onClick={() => {
                                                push(emptyStateContact)
                                                setFocusNewContact(true)
                                            }}
                                            ref={newStateContactButtonRef}
                                        >
                                            Add state contact
                                        </button>
                                    </div>
                                )}
                            </FieldArray>
                        </fieldset>

                        {includeActuaryContacts && (
                            <fieldset className="usa-fieldset">
                                <h3>Actuary contacts</h3>
                                {formAlert && formAlert}
                                <p>
                                    Provide contact information for the
                                    actuaries who worked directly on this
                                    submission.
                                </p>
                                <legend className="srOnly">
                                    Actuary contacts
                                </legend>
                                {formAlert && formAlert}

                                <FieldArray name="actuaryContacts">
                                    {({ remove, push }) => (
                                        <div
                                            className={styles.actuaryContacts}
                                            data-testid="state-contacts"
                                        >
                                            {values.actuaryContacts.length >
                                                0 &&
                                                values.actuaryContacts.map(
                                                    (actuaryContact, index) => (
                                                        <div
                                                            className={
                                                                styles.actuaryContact
                                                            }
                                                            key={index}
                                                        >
                                                            <Fieldset
                                                                legend={handleContactLegend(
                                                                    index,
                                                                    'Actuary'
                                                                )}
                                                            >
                                                                <FormGroup
                                                                    error={showFieldErrors(
                                                                        actuaryContactErrorHandling(
                                                                            errors
                                                                                ?.actuaryContacts?.[
                                                                                index
                                                                            ]
                                                                        )?.name
                                                                    )}
                                                                >
                                                                    <label
                                                                        htmlFor={`${actuaryContact}.name`}
                                                                    >
                                                                        Name
                                                                    </label>
                                                                    {showFieldErrors(
                                                                        `True`
                                                                    ) && (
                                                                        <ErrorMessage
                                                                            name={`${actuaryContact}.name`}
                                                                            component="div"
                                                                            className="usa-error-message"
                                                                        />
                                                                    )}
                                                                    <Field
                                                                        name={`${actuaryContact}.name`}
                                                                        id={`${actuaryContact}.name`}
                                                                        aria-required={
                                                                            index ===
                                                                            0
                                                                        }
                                                                        type="text"
                                                                        className="usa-input"
                                                                        innerRef={(
                                                                            el: HTMLElement
                                                                        ) =>
                                                                            (newActuaryContactNameRef.current =
                                                                                el)
                                                                        }
                                                                    />
                                                                </FormGroup>

                                                                <FormGroup
                                                                    error={showFieldErrors(
                                                                        actuaryContactErrorHandling(
                                                                            errors
                                                                                ?.actuaryContacts?.[
                                                                                index
                                                                            ]
                                                                        )
                                                                            ?.titleRole
                                                                    )}
                                                                >
                                                                    <label
                                                                        htmlFor={`${actuaryContact}.titleRole`}
                                                                    >
                                                                        Title/Role
                                                                    </label>
                                                                    {showFieldErrors(
                                                                        `True`
                                                                    ) && (
                                                                        <ErrorMessage
                                                                            name={`${actuaryContact}.titleRole`}
                                                                            component="div"
                                                                            className="usa-error-message"
                                                                        />
                                                                    )}
                                                                    <Field
                                                                        name={`${actuaryContact}.titleRole`}
                                                                        id={`${actuaryContact}.titleRole`}
                                                                        aria-required={
                                                                            index ===
                                                                            0
                                                                        }
                                                                        type="text"
                                                                        className="usa-input"
                                                                    />
                                                                </FormGroup>

                                                                <FormGroup
                                                                    error={showFieldErrors(
                                                                        actuaryContactErrorHandling(
                                                                            errors
                                                                                ?.actuaryContacts?.[
                                                                                index
                                                                            ]
                                                                        )?.email
                                                                    )}
                                                                >
                                                                    <label
                                                                        htmlFor={`${actuaryContact}.email`}
                                                                    >
                                                                        Email
                                                                    </label>
                                                                    {showFieldErrors(
                                                                        `True`
                                                                    ) && (
                                                                        <ErrorMessage
                                                                            name={`${actuaryContact}.email`}
                                                                            component="div"
                                                                            className="usa-error-message"
                                                                        />
                                                                    )}
                                                                    <Field
                                                                        name={`${actuaryContact}.email`}
                                                                        id={`${actuaryContact}.email`}
                                                                        aria-required={
                                                                            index ===
                                                                            0
                                                                        }
                                                                        type="text"
                                                                        className="usa-input"
                                                                    />
                                                                </FormGroup>

                                                                <FormGroup
                                                                    error={showFieldErrors(
                                                                        actuaryContactErrorHandling(
                                                                            errors
                                                                                ?.actuaryContacts?.[
                                                                                index
                                                                            ]
                                                                        )
                                                                            ?.actuarialFirm
                                                                    )}
                                                                >
                                                                    <label
                                                                        htmlFor={`${actuaryContact}.actuarialFirm`}
                                                                    >
                                                                        Actuarial
                                                                        firm
                                                                    </label>
                                                                    {showFieldErrors(
                                                                        `True`
                                                                    ) && (
                                                                        <ErrorMessage
                                                                            name={`${actuaryContact}.actuarialFirm`}
                                                                            component="div"
                                                                            className="usa-error-message"
                                                                        />
                                                                    )}
                                                                    <FieldRadio
                                                                        id={`mercer-${index}`}
                                                                        name={`${actuaryContact}.actuarialFirm`}
                                                                        label="Mercer"
                                                                        value={
                                                                            'MERCER'
                                                                        }
                                                                        checked={
                                                                            values
                                                                                .actuaryContacts[
                                                                                index
                                                                            ]
                                                                                .actuarialFirm ===
                                                                            'MERCER'
                                                                        }
                                                                        aria-required
                                                                    />
                                                                    <FieldRadio
                                                                        id={`milliman-${index}`}
                                                                        name={`${actuaryContact}.actuarialFirm`}
                                                                        label="Milliman"
                                                                        value={
                                                                            'MILLIMAN'
                                                                        }
                                                                        checked={
                                                                            values
                                                                                .actuaryContacts[
                                                                                index
                                                                            ]
                                                                                .actuarialFirm ===
                                                                            'MILLIMAN'
                                                                        }
                                                                        aria-required
                                                                    />
                                                                    <FieldRadio
                                                                        id={`optumas-${index}`}
                                                                        name={`${actuaryContact}.actuarialFirm`}
                                                                        label="Optumas"
                                                                        value={
                                                                            'OPTUMAS'
                                                                        }
                                                                        checked={
                                                                            values
                                                                                .actuaryContacts[
                                                                                index
                                                                            ]
                                                                                .actuarialFirm ===
                                                                            'OPTUMAS'
                                                                        }
                                                                        aria-required
                                                                    />
                                                                    <FieldRadio
                                                                        id={`guidehouse-${index}`}
                                                                        name={`${actuaryContact}.actuarialFirm`}
                                                                        label="Guidehouse"
                                                                        value={
                                                                            'GUIDEHOUSE'
                                                                        }
                                                                        aria-required
                                                                    />
                                                                    <FieldRadio
                                                                        id={`deloitte-${index}`}
                                                                        name={`${actuaryContact}.actuarialFirm`}
                                                                        label="Deloitte"
                                                                        value={
                                                                            'DELOITTE'
                                                                        }
                                                                        checked={
                                                                            values
                                                                                .actuaryContacts[
                                                                                index
                                                                            ]
                                                                                .actuarialFirm ===
                                                                            'DELOITTE'
                                                                        }
                                                                        aria-required
                                                                    />
                                                                    <FieldRadio
                                                                        id={`stateInHouse-${index}`}
                                                                        name={`${actuaryContact}.actuarialFirm`}
                                                                        label="State in-house"
                                                                        value={
                                                                            'STATE_IN_HOUSE'
                                                                        }
                                                                        checked={
                                                                            values
                                                                                .actuaryContacts[
                                                                                index
                                                                            ]
                                                                                .actuarialFirm ===
                                                                            'STATE_IN_HOUSE'
                                                                        }
                                                                        aria-required
                                                                    />
                                                                    <FieldRadio
                                                                        id={`other-${index}`}
                                                                        name={`${actuaryContact}.actuarialFirm`}
                                                                        label="Other"
                                                                        value={
                                                                            'OTHER'
                                                                        }
                                                                        checked={
                                                                            values
                                                                                .actuaryContacts[
                                                                                index
                                                                            ]
                                                                                .actuarialFirm ===
                                                                            'OTHER'
                                                                        }
                                                                        aria-required
                                                                    />

                                                                    {values
                                                                        .actuaryContacts[
                                                                        index
                                                                    ]
                                                                        .actuarialFirm ===
                                                                        'OTHER' && (
                                                                        <FormGroup
                                                                            error={showFieldErrors(
                                                                                actuaryContactErrorHandling(
                                                                                    errors
                                                                                        ?.actuaryContacts?.[
                                                                                        index
                                                                                    ]
                                                                                )
                                                                                    ?.actuarialFirmOther
                                                                            )}
                                                                        >
                                                                            <label
                                                                                htmlFor={`${actuaryContact}.actuarialFirmOther`}
                                                                            >
                                                                                Other
                                                                                actuarial
                                                                                firm
                                                                            </label>
                                                                            {showFieldErrors(
                                                                                `True`
                                                                            ) && (
                                                                                <ErrorMessage
                                                                                    name={`${actuaryContact}.actuarialFirmOther`}
                                                                                    component="div"
                                                                                    className="usa-error-message"
                                                                                />
                                                                            )}
                                                                            <Field
                                                                                name={`${actuaryContact}.actuarialFirmOther`}
                                                                                id={`${actuaryContact}.actuarialFirmOther`}
                                                                                type="text"
                                                                                className="usa-input"
                                                                            />
                                                                        </FormGroup>
                                                                    )}
                                                                </FormGroup>

                                                                {index > 0 && (
                                                                    <Button
                                                                        type="button"
                                                                        unstyled
                                                                        className={
                                                                            styles.removeContactBtn
                                                                        }
                                                                        onClick={() => {
                                                                            remove(
                                                                                index
                                                                            )
                                                                            setNewActuaryContactButtonFocus()
                                                                        }}
                                                                    >
                                                                        Remove
                                                                        contact
                                                                    </Button>
                                                                )}
                                                            </Fieldset>
                                                        </div>
                                                    )
                                                )}

                                            <button
                                                type="button"
                                                className={`usa-button usa-button--outline ${styles.addContactBtn}`}
                                                onClick={() => {
                                                    push(emptyActuaryContact)
                                                    setFocusNewActuaryContact(
                                                        true
                                                    )
                                                }}
                                                ref={newActuaryContactButtonRef}
                                            >
                                                Add actuary contact
                                            </button>
                                        </div>
                                    )}
                                </FieldArray>

                                <legend className="srOnly">
                                    Actuarial communication preference
                                </legend>
                                <FormGroup
                                    error={showFieldErrors(
                                        errors.actuaryCommunicationPreference
                                    )}
                                >
                                    <Fieldset
                                        className={styles.radioGroup}
                                        legend="Communication preference between CMS Office of the Actuary (OACT) and the state’s actuary"
                                    >
                                        {showFieldErrors(`True`) && (
                                            <ErrorMessage
                                                name={`actuaryCommunicationPreference`}
                                                component="div"
                                                className="usa-error-message"
                                            />
                                        )}
                                        <FieldRadio
                                            id="OACTtoActuary"
                                            name="actuaryCommunicationPreference"
                                            label={`OACT can communicate directly with the state’s actuary but should copy the state on all written communication and all appointments for verbal discussions.`}
                                            value={'OACT_TO_ACTUARY'}
                                            checked={
                                                values.actuaryCommunicationPreference ===
                                                'OACT_TO_ACTUARY'
                                            }
                                            aria-required
                                        />
                                        <FieldRadio
                                            id="OACTtoState"
                                            name="actuaryCommunicationPreference"
                                            label={`OACT can communicate directly with the state, and the state will relay all written communication to their actuary and set up time for any potential verbal discussions.`}
                                            value={'OACT_TO_STATE'}
                                            checked={
                                                values.actuaryCommunicationPreference ===
                                                'OACT_TO_STATE'
                                            }
                                            aria-required
                                        />
                                    </Fieldset>
                                </FormGroup>
                            </fieldset>
                        )}
                        <div className={styles.pageActions}>
                            <Button
                                type="button"
                                unstyled
                                onClick={() => {
                                    if (!dirty) {
                                        history.push(`/dashboard`)
                                    } else {
                                        setShouldValidate(true)
                                        setFocusErrorSummaryHeading(true)

                                        redirectToDashboard.current = true
                                        handleSubmit()
                                    }
                                }}
                            >
                                Save as draft
                            </Button>
                            <ButtonGroup
                                type="default"
                                className={styles.buttonGroup}
                            >
                                <Link
                                    asCustom={NavLink}
                                    className="usa-button usa-button--outline"
                                    variant="unstyled"
                                    to={
                                        draftSubmission.submissionType ===
                                        'CONTRACT_ONLY'
                                            ? 'contract-details'
                                            : 'rate-details'
                                    }
                                >
                                    Back
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    onClick={() => {
                                        redirectToDashboard.current = false
                                        setShouldValidate(true)
                                        setFocusErrorSummaryHeading(true)
                                    }}
                                >
                                    Continue
                                </Button>
                            </ButtonGroup>
                        </div>
                    </UswdsForm>
                </>
            )}
        </Formik>
    </>
)
}
