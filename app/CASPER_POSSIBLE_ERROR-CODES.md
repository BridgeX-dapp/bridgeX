# Bridge-specific errors. CASPER SIDE
#[odra::odra_error]
pub enum Error {
    TokenNotWhitelisted = 10_000,
    AmountTooSmall      = 10_001,
    AmountTooLarge      = 10_002,
    TokenNotCanonical   = 10_003,
    TokenNotWrapped     = 10_004,
    FeeTooHigh          = 10_005,
    FeeReceiverNotSet   = 10_006,
    EventAlreadyHandled = 10_007,
    NotAdmin   = 10_008,
    NotRelayer = 10_009,
    NotPauser  = 10_010
}


## CEP-18  errors

Error Codes
The table below summarizes the error codes you may see while working with CEP-18 fungible tokens.

Code	Error	Description
60000	InvalidContext	CEP-18 contract called from within an invalid context.
60001	InsufficientBalance	The spender does not have enough balance.
60002	InsufficientAllowance	The spender does not have enough allowance approved.
60003	Overflow	This operation would cause an integer overflow.
60004	PackageHashMissing	A required package hash was not specified.
60005	PackageHashNotPackage	The specified package hash does not represent a package.
60006	InvalidEventsMode	An invalid event mode was specified.
60007	MissingEventsMode	The required event mode was not specified.
60008	Phantom	An unknown error occurred.
60009	FailedToGetArgBytes	Failed to read the runtime arguments provided.
60010	InsufficientRights	The caller does not have sufficient security access.
60011	InvalidAdminList	The list of Admin accounts provided is invalid.
60012	InvalidMinterList	The list of accounts that can mint tokens is invalid.
60013	InvalidNoneList	The list of accounts with no access rights is invalid.
60014	InvalidEnableMBFlag	The flag to enable the mint and burn mode is invalid.
60015	AlreadyInitialized	This contract instance cannot be initialized again.
60016	MintBurnDisabled	The mint and burn mode is disabled.
60017	CannotTargetSelfUser	A user cannot target themselves in this operation.
60018	InvalidBurnTarget	The specified burn target is invalid.
60019	MissingPackageHashForUpgrade	A required package hash for upgrade was not specified.
60020	MissingContractHashForUpgrade	A required contract hash for upgrade was not specified.
60021	InvalidKeyType	The key type provided is invalid.
60022	FailedToConvertToJson	Failed to convert data to JSON format.
60023	FailedToReturnEntryPointResult	Failed to return the entry point result.
60024	FailedToCreateDictionary	Failed to create the dictionary in storage.
60025	FailedToConvertBytes	Failed to convert bytes to the required format.
60026	FailedToChangeTotalSupply	Unable to modify the total supply value.
60027	FailedToReadFromStorage	Unable to retrieve the requested storage data.
60028	FailedToGetKey	Unable to fetch the required key from storage.
60029	FailedToDisableContractVersion	Failed to disable the specified contract version.
60030	FailedToInsertToSecurityList	Failed to insert an entry into the security list.
60031	UrefNotFound	The required URef (User Reference) was not found.
60032	FailedToGetOldContractHashKey	Unable to retrieve the old contract hash key.
60033	FailedToGetOldPackageKey	Unable to retrieve the old package key.
60034	FailedToGetPackageKey	Unable to retrieve the specified package key.
60035	MissingStorageUref	A required storage URef was not found.
60036	InvalidStorageUref	The provided storage URef is invalid.
60037	MissingVersionContractKey	Unable to retrieve the version contract hash key.
60038	InvalidVersionContractKey	The provided version contract key is invalid.


## NOTE CASPER SIDE
when the transaction failed it will throw like this User error: ERROR_CODE  eg User error: 60003  so you should take the code and detrmine the reason it happens 



## EVM bridge core errors

   // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------
    error BridgeCore__NotRelayer();
    error BridgeCore__ZeroAddress();
    error BridgeCore__TokenNotWhitelisted();
    error BridgeCore__TokenNotCanonical();
    error BridgeCore__TokenNotWrapped();
    error BridgeCore__AmountTooSmall();
    error BridgeCore__AmountTooLarge();
    error BridgeCore__AlreadyProcessed();
    error BridgeCore__FeeTooHigh();
    error BridgeCore__InvalidAmount();
    error BridgeCore__NoFeesAvailable();
