import { RateInfoType, UnlockedHealthPlanFormDataType } from './UnlockedHealthPlanFormDataType';
import type { LockedHealthPlanFormDataType } from './LockedHealthPlanFormDataType';
import type { HealthPlanFormDataType } from './HealthPlanFormDataType';
import type { ProgramArgType } from '.';
declare const isContractOnly: (sub: HealthPlanFormDataType) => boolean;
declare const isBaseContract: (sub: HealthPlanFormDataType) => boolean;
declare const isContractAmendment: (sub: HealthPlanFormDataType) => boolean;
declare const isCHIPOnly: (sub: HealthPlanFormDataType) => boolean;
declare const isContractAndRates: (sub: HealthPlanFormDataType) => boolean;
declare const isContractWithProvisions: (sub: HealthPlanFormDataType) => boolean;
declare const isSubmitted: (sub: HealthPlanFormDataType) => boolean;
declare const hasValidModifiedProvisions: (sub: LockedHealthPlanFormDataType) => boolean;
declare const hasValidContract: (sub: LockedHealthPlanFormDataType) => boolean;
declare const hasValidPopulationCoverage: (sub: LockedHealthPlanFormDataType) => boolean;
declare const hasValidRates: (sub: LockedHealthPlanFormDataType) => boolean;
declare const hasAnyValidRateData: (sub: LockedHealthPlanFormDataType | UnlockedHealthPlanFormDataType) => boolean;
declare const hasValidDocuments: (sub: LockedHealthPlanFormDataType) => boolean;
declare const isLockedHealthPlanFormData: (sub: unknown) => sub is LockedHealthPlanFormDataType;
declare const isValidAndCurrentLockedHealthPlanFormData: (sub: unknown) => sub is LockedHealthPlanFormDataType;
declare const isUnlockedHealthPlanFormData: (sub: unknown) => sub is UnlockedHealthPlanFormDataType;
declare function programNames(programs: ProgramArgType[], programIDs: string[]): string[];
declare function packageName(stateCode: string, stateNumber: number, programIDs: string[], statePrograms: ProgramArgType[]): string;
declare const generateRateName: (pkg: HealthPlanFormDataType, rateInfo: RateInfoType, statePrograms: ProgramArgType[]) => string;
declare const removeRatesData: (pkg: HealthPlanFormDataType) => HealthPlanFormDataType;
declare const removeInvalidProvisionsAndAuthorities: (pkg: HealthPlanFormDataType) => HealthPlanFormDataType;
export { isContractWithProvisions, hasValidModifiedProvisions, hasValidContract, hasValidDocuments, hasValidRates, hasAnyValidRateData, isBaseContract, isContractAmendment, isCHIPOnly, isContractOnly, isContractAndRates, isLockedHealthPlanFormData, isUnlockedHealthPlanFormData, isSubmitted, isValidAndCurrentLockedHealthPlanFormData, programNames, packageName, generateRateName, removeRatesData, removeInvalidProvisionsAndAuthorities, hasValidPopulationCoverage, };
