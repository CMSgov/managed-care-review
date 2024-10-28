# Contract and Rate Without Revisions Design

This is an ER diagram of the data that is planned to be sent to Salesforce on submission. It relies on Salesforce's native diff tracking so elides the concept of Revisions. 

```mermaid
erDiagram

Contract {
    String externalID
    String externalURL
    DateTime initiallySubmittedAt
    DateTime updatedAt
    StateCode stateCode
    String name
    String mccrsID
    String submissionReason
    Rate[] relatedRates

    String[] programNicknames
    Enum populationCovered "MEDICAID, CHIP, MEDICAID_AND_CHIP" 
    Enum submissionType "CONTRACT_ONLY, CONTRACT_AND_RATES"
    Boolean riskBasedContract
    String submissionDescription
    Document[] contractDocuments
    Document[] supportingDocuments
    Enum contractType "BASE, AMENDMENT"
    Enum contractExecutionStatus "EXECUTED, UNEXECUTED"
    CalendarDate contractDateStart
    CalendarDate contractDateEnd
    String[] managedCareEntities
    String[] federalAuthorities
    Boolean statutoryRegulatoryAttestation
    String statutoryRegulatoryAttestationDescription

    Boolean inLieuServicesAndSettings
    Boolean modifiedBenefitsProvided
    Boolean modifiedGeoAreaServed
    Boolean modifiedMedicaidBeneficiaries
    Boolean modifiedRiskSharingStrategy
    Boolean modifiedIncentiveArrangements
    Boolean modifiedWitholdAgreements
    Boolean modifiedStateDirectedPayments
    Boolean modifiedPassThroughPayments
    Boolean modifiedPaymentsForMentalDiseaseInstitutions
    Boolean modifiedMedicalLossRatioStandards
    Boolean modifiedOtherFinancialPaymentIncentive
    Boolean modifiedEnrollmentProcess
    Boolean modifiedGrevienceAndAppeal
    Boolean modifiedNetworkAdequacyStandards
    Boolean modifiedLengthOfContract
    Boolean modifiedNonRiskPaymentArrangements
    Boolean statutoryRegulatoryAttestation
    Boolean statutoryRegulatoryAttestationDescription
    
    Contact[] stateContacts
    
    Question[] questions
}

Rate {
    String externalID
    String externalURL
    DateTime initiallySubmittedAt
    DateTime updatedAt
    StateCode stateCode
    String name
    String submissionReason
    Contract[] relatedContracts
    
    Enum rateType "NEW, AMENDMENT"
    Enum rateCapitationType "RATE_CELL, RATE_RANGE"

    String[] programNicknames
    Document[] rateDocuments
    Document[] supportingDocuments

    CalendarDate rateDateStart
    CalendarDate rateDateEnd
    CalendarDate rateDateCertified
    CalendarDate amendmentEffectiveDateStart
    CalendarDate amendmentEffectiveDateEnd

    Enum actuaryCommunicationPreference "OACT_TO_ACTUARY, OACT_TO_STATE"

    Contact[] certifyingActuaries
    Contact[] additionalActuaries

    Question[] questions
}

Document {
    FileData fileData
    string fileName
}

Contact {
    string email
    string givenName
    string familyName
    string title
    string ActuarialFirm
}

Question {
    DateTime createdAt
    Contact addedBy
    Enum addedByDivision "DMCO, DMCP, OACT"
    Document[] questionDocs
}

QuestionResponse {
    DateTime createdAt
    Question question
    Contact addedBy
    Document[] responseDocs
}

Contract }|--|{ Rate : "many to many"
Contract ||--|{ Document : "one to many"
Rate ||--|{ Document : "one to many"
Rate }|--|{ Contact : "certifying actuaries"
Rate }|--|{ Contact : "additional actuaries"
Contract }|--|{ Contact : "state contacts"
Rate ||--|{ Question : "questions"
Contract ||--|{ Question : "questions"
Question ||--|{ QuestionResponse : "responses"
Question ||--|{ Contact : "addedBy"
Question ||--|{ Document : "questionDocs"
QuestionResponse ||--|{ Document : "questionDocs"
QuestionResponse ||--|{ Contact : "addedBy"
```
