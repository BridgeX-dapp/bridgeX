// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title WrappedToken
 * @notice ERC20 token representing a bridged asset from a remote chain.
 *
 * @dev
 *  - Minting and burning are restricted to the BridgeCore contract.
 *  - BridgeCore holds the cross-chain logic; this contract is a simple token.
 *  - Decimals are configurable at deployment.
 */
contract WrappedToken is ERC20 {
    /// @notice Address of the BridgeCore contract that controls mint/burn.
    address public immutable bridge;

    /// @notice Decimals for this token.
    uint8 private immutable _decimals;

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------
    error WrappedToken__NotBridge();
    error WrappedToken__ZeroAddress();

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyBridge() {
        if (msg.sender != bridge) revert WrappedToken__NotBridge();
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param name_     ERC20 name (e.g., "Wrapped CSPR").
     * @param symbol_   ERC20 symbol (e.g., "wCSPR").
     * @param bridge_   Address of the BridgeCore contract.
     * @param decimals_ Decimals for the token (usually 18, or match remote asset).
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address bridge_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        if (bridge_ == address(0)) revert WrappedToken__ZeroAddress();
        bridge = bridge_;
        _decimals = decimals_;
    }

    // -------------------------------------------------------------------------
    // Mint / Burn (Bridge-controlled)
    // -------------------------------------------------------------------------

    /**
     * @notice Mints tokens to `to`. Can only be called by BridgeCore.
     * @dev Used when remote canonical tokens are locked on the other chain.
     */
    function mint(address to, uint256 amount) external onlyBridge {
        _mint(to, amount);
    }

    /**
     * @notice Burns tokens from the BridgeCore's balance.
     * @dev
     *  - BridgeCore should transfer tokens to itself, then call burn(amount).
     *  - This keeps burn privileges strictly bound to the bridge contract.
     */
    function burn(uint256 amount) external onlyBridge {
        _burn(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
