declare const ROUTES: readonly ["ROOT", "AUTH", "DASHBOARD", "DASHBOARD_SUBMISSIONS", "DASHBOARD_RATES", "GRAPHQL_EXPLORER", "API_ACCESS", "HELP", "SETTINGS", "RATES_SUMMARY", "RATE_EDIT", "REPLACE_RATE", "SUBMISSIONS", "SUBMISSIONS_NEW", "SUBMISSIONS_TYPE", "SUBMISSIONS_EDIT_TOP_LEVEL", "SUBMISSIONS_CONTRACT_DETAILS", "SUBMISSIONS_RATE_DETAILS", "SUBMISSIONS_CONTACTS", "SUBMISSIONS_DOCUMENTS", "SUBMISSIONS_REVIEW_SUBMIT", "SUBMISSIONS_REVISION", "SUBMISSIONS_SUMMARY", "SUBMISSIONS_MCCRSID", "SUBMISSIONS_QUESTIONS_AND_ANSWERS", "SUBMISSIONS_UPLOAD_QUESTION", "SUBMISSIONS_UPLOAD_RESPONSE"];
type RouteT = (typeof ROUTES)[number];
type RouteTWithUnknown = RouteT | 'UNKNOWN_ROUTE';
declare const RoutesRecord: Record<RouteT, string>;
declare const DASHBOARD_ROUTES: RouteTWithUnknown[];
declare const STATE_SUBMISSION_FORM_ROUTES: RouteTWithUnknown[];
declare const STATE_SUBMISSION_SUMMARY_ROUTES: RouteTWithUnknown[];
declare const QUESTION_RESPONSE_SHOW_SIDEBAR_ROUTES: RouteTWithUnknown[];
declare const PageHeadingsRecord: Partial<Record<RouteTWithUnknown, string>>;
declare const PageTitlesRecord: Record<RouteT | 'UNKNOWN_ROUTE', string>;
export { PageHeadingsRecord, PageTitlesRecord, RoutesRecord, ROUTES, STATE_SUBMISSION_FORM_ROUTES, STATE_SUBMISSION_SUMMARY_ROUTES, QUESTION_RESPONSE_SHOW_SIDEBAR_ROUTES, DASHBOARD_ROUTES, };
export type { RouteT, RouteTWithUnknown };
