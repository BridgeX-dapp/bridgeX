# Get account fungible token ownership

Get accounts fungible token ownership by identifier (public key or account hash)

```
GET /accounts/{account_identifier}/ft-token-ownership
```

## Query params

None

## Sorting

| Property  | Description                |
| --------- | -------------------------- |
| `balance` | Sort ownerships by balance |

## Optional properties

| Property                   | Type                                                                                  | Description                    |
| -------------------------- | ------------------------------------------------------------------------------------- | ------------------------------ |
| `contract_package`         | [`ContractPackage`](https://docs.cspr.cloud/rest-api/contract-package)                | Fungible contract package      |
| `account_info`             | [`AccountInfo`](https://docs.cspr.cloud/rest-api/account-info)                        | Owner account info             |
| `centralized_account_info` | [`CentralizedAccountInfo`](https://docs.cspr.cloud/rest-api/centralized-account-info) | Owner centralized account info |
| `owner_cspr_name`          | `string`                                                                              | Owner account CSPR.name        |

## Response

[`PaginatedResponse`](https://docs.cspr.cloud/documentation/overview/pagination)[`<FTOwnership>`](https://docs.cspr.cloud/rest-api/fungible-token-ownership)

## Example

```bash
curl -X 'GET' \
  'https://api.testnet.cspr.cloud/accounts/d0bc9ca1353597c4004b8f881b397a89c1779004f5e547e04b57c2e7967c6269/ft-token-ownership' \
  -H 'accept: application/json' \
  -H 'authorization: 55f79117-fc4d-4d60-9956-65423f39a06a'
```

```json
{
  "data": [
    {
      "balance": "999992019999999999690000000",
      "contract_package_hash": "000f00b1c6b691b47c1006730bd39812c598f4660e2420a5f5e2f9106865fed1",
      "owner_hash": "d0bc9ca1353597c4004b8f881b397a89c1779004f5e547e04b57c2e7967c6269",
      "owner_type": 0
    },
    {
      "balance": "99999999999999999000",
      "contract_package_hash": "018c20d50c52518b6d9c0390b1d2298e3638507d8fe9694d44b89b6af23c703d",
      "owner_hash": "d0bc9ca1353597c4004b8f881b397a89c1779004f5e547e04b57c2e7967c6269",
      "owner_type": 0
    },
    ...
    {
      "balance": "1000000000000000000000000000018415616000000000000000000",
      "contract_package_hash": "155e3d29b6eea4df9e2159c5e91cf325b94c3460224ea3c789dd70772a9048d6",
      "owner_hash": "d0bc9ca1353597c4004b8f881b397a89c1779004f5e547e04b57c2e7967c6269",
      "owner_type": 0
    }
  ],
  "item_count": 176,
  "page_count": 18
}
```







# Fungible token ownership

The `FTOwnership` entity represents a fungible token ownership relation between accounts and contract packages, as well as provides the corresponding token balances

### Properties

The `FTOwnership` entity has the following properties:

| Property                | Type         | Description                                                                                                   |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| `owner_hash`            | `string(64)` | Owner hash represented as a hexadecimal string. First part of token ownership identifier                      |
| `contract_package_hash` | `string(64)` | Fungible contract package hash represented as a hexadecimal string. Second part of token ownership identifier |
| `owner_type`            | `uint8`      | Owber hash type: `0` for account, `1` for contract                                                            |
| `balance`               | `string`     | Fungible tokens balance in the network                                                                        |

**Example**

```json
{
  "balance": "99999999999999999000",
  "contract_package_hash": "0e6a10012d734417ef6ff74e4a7881ad75bcbb3c455ccd63a677f7dd55f1f203",
  "owner_hash": "d0bc9ca1353597c4004b8f881b397a89c1779004f5e547e04b57c2e7967c6269",
  "owner_type": 0
}
```

## Optional properties

Depending on the endpoint some of the following optional properties may be included in the `FTOwnership` entity:

| Property                   | Type                                                                                  | Description                         |
| -------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------- |
| `contract_package`         | [`ContractPackage`](https://docs.cspr.cloud/rest-api/contract-package)                | Fungible contract package           |
| `owner_public_key`         | `string(68)`                                                                          | Owner public key if it's an account |
| `account_info`             | [`AccountInfo`](https://docs.cspr.cloud/rest-api/account-info)                        | Owner account info                  |
| `centralized_account_info` | [`CentralizedAccountInfo`](https://docs.cspr.cloud/rest-api/centralized-account-info) | Owner centralized account info      |
| `owner_cspr_name`          | `string`                                                                              | Owner account CSPR.name             |

### Relations

| Entity                                                                  | Mapping property        | Description                                                                                                                                      |
| ----------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`Contract package`](https://docs.cspr.cloud/rest-api/contract-package) | `contract_package_hash` | Fungible token ownership represents fungible contract package token owners                                                                       |
| [`Account`](https://docs.cspr.cloud/rest-api/account)                   | `owner_hash`            | Account can be a token owner                                                                                                                     |
| [`Deploy`](https://docs.cspr.cloud/rest-api/deploy)                     |                         | Deploy can update fungible token ownership by creating or transferring FT tokens. There is no direct mapping, but rather a semantic relationship |

### Endpoints

The `FTOwnership` entity has the following endpoints:

* [Get contract package fungible token ownerships](https://docs.cspr.cloud/rest-api/fungible-token-ownership/get-contract-package-fungible-token-ownership)
* [Get account fungible token ownerships](https://docs.cspr.cloud/rest-api/fungible-token-ownership/get-account-fungible-token-ownership)

### Relation endpoints

None

