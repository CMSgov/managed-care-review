// CognitoUserType is our type for representing the information we get
// from Cognito about a given user
export type CognitoUserType = {
	role: string
	email: string
	name: string
	state_code: string
}
