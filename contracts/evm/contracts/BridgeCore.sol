// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @dev Minimal interface for wrapped ERC20 tokens controlled by the bridge.
interface IWrappedToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}

/**
 * @title BridgeCore
 * @notice Core EVM-side bridge contract for BridgeX.
 *         - Supports multiple tokens.
 *         - Distinguishes canonical vs wrapped tokens.
 *         - Non-custodial: funds live in contracts, not relayer.
 *         - Uses replay protection via eventId.
 *         - Charges configurable percentage fees on canonical lock.
 */
contract BridgeCore is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

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

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event FeeReceiverUpdated(address indexed oldReceiver, address indexed newReceiver);
    event FeeBpsUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    event TokenConfigUpdated(
        address indexed token,
        bool isWhitelisted,
        bool isCanonical,
        uint256 minAmount,
        uint256 maxAmount
    );

    /// @notice Emitted when canonical tokens are locked on this chain.
    event LockedCanonical(
        address indexed token,
        address indexed sender,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 feeAmount,
        uint256 nonce,
        uint256 destChainId,
        bytes32 indexed destRecipient
    );

    /// @notice Emitted when canonical tokens are unlocked on this chain.
    event UnlockedCanonical(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        bytes32 indexed eventId
    );

    /// @notice Emitted when wrapped tokens are minted on this chain.
    event MintedWrapped(
        address indexed wrappedToken,
        address indexed recipient,
        uint256 amount,
        bytes32 indexed eventId
    );

    /// @notice Emitted when wrapped tokens are burned on this chain.
    event BurnedWrapped(
        address indexed wrappedToken,
        address indexed sender,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 feeAmount,
        uint256 nonce,
        uint256 destChainId,
        bytes32 indexed destRecipient
    );

    event FeesWithdrawn(
        address indexed token,
        address indexed to,
        uint256 amount
    );

    // -------------------------------------------------------------------------
    // Types & Storage
    // -------------------------------------------------------------------------

    struct TokenConfig {
        bool isWhitelisted;   // Whether this token is allowed for bridging.
        bool isCanonical;     // True if this token is native/canonical on this chain.
        uint256 minAmount;    // Optional per-token minimum bridge amount.
        uint256 maxAmount;    // Optional per-token maximum bridge amount.
    }

    /// @notice Per-token configuration.
    mapping(address => TokenConfig) public tokenConfigs;

    /// @notice Global nonce for user-initiated flows (lock/burn).
    uint256 public nonce;

    /// @notice EventId replay protection: true if a cross-chain event has been processed.
    mapping(bytes32 => bool) public processedEvents;

    /// @notice Accumulated fees per canonical token.
    mapping(address => uint256) public collectedFees;

    /// @notice Relayer address allowed to execute cross-chain actions.
    address public relayer;

    /// @notice Address that receives fee withdrawals.
    address public feeReceiver;

    /// @notice Global fee in basis points (out of 10_000). Applied on canonical lock only.
    uint256 public feeBps;

    uint256 private constant BPS_DENOMINATOR = 10_000;

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert BridgeCore__NotRelayer();
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(address _initialOwner, address _initialFeeReceiver, address _initialRelayer) Ownable(_initialOwner) {
        if ( _initialOwner == address(0) || _initialFeeReceiver == address(0) || _initialRelayer == address(0)) {
            revert BridgeCore__ZeroAddress();
        }
        feeReceiver = _initialFeeReceiver;
        relayer = _initialRelayer;
    }

    // -------------------------------------------------------------------------
    // Admin Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Updates the relayer address.
     */
    function setRelayer(address _relayer) external onlyOwner {
        if (_relayer == address(0)) revert BridgeCore__ZeroAddress();
        address oldRelayer = relayer;
        relayer = _relayer;
        emit RelayerUpdated(oldRelayer, _relayer);
    }

    /**
     * @notice Updates the fee receiver address.
     */
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        if (_feeReceiver == address(0)) revert BridgeCore__ZeroAddress();
        address oldReceiver = feeReceiver;
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(oldReceiver, _feeReceiver);
    }

    /**
     * @notice Sets the fee in basis points (0 - 10_000).
     * @dev For safety, you may choose to restrict maxFeeBps (e.g. <= 1000 = 10%).
     */
    function setFeeBps(uint256 _feeBps) external onlyOwner {
        if (_feeBps > BPS_DENOMINATOR) revert BridgeCore__FeeTooHigh();
        uint256 oldFeeBps = feeBps;
        feeBps = _feeBps;
        emit FeeBpsUpdated(oldFeeBps, _feeBps);
    }

    /**
     * @notice Configures a token for bridging.
     * @param token Token address (canonical or wrapped).
     * @param isWhitelisted Whether the token is allowed for bridging.
     * @param isCanonical Whether this token is native to this chain.
     * @param minAmount Optional minimum bridge amount (0 = disabled).
     * @param maxAmount Optional maximum bridge amount (0 = disabled).
     */
    function setTokenConfig(
        address token,
        bool isWhitelisted,
        bool isCanonical,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyOwner {
        if (token == address(0)) revert BridgeCore__ZeroAddress();
        tokenConfigs[token] = TokenConfig({
            isWhitelisted: isWhitelisted,
            isCanonical: isCanonical,
            minAmount: minAmount,
            maxAmount: maxAmount
        });

        emit TokenConfigUpdated(token, isWhitelisted, isCanonical, minAmount, maxAmount);
    }

    /**
     * @notice Pause all user/relayer actions (emergency).
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause all user/relayer actions.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraw accumulated fees for a canonical token to feeReceiver.
     */
    function withdrawFees(address token, uint256 amount) external onlyOwner nonReentrant {
        if (feeReceiver == address(0)) revert BridgeCore__ZeroAddress();

        uint256 available = collectedFees[token];
        if (available == 0 || amount == 0 || amount > available) {
            revert BridgeCore__NoFeesAvailable();
        }

        collectedFees[token] = available - amount;
        IERC20(token).safeTransfer(feeReceiver, amount);

        emit FeesWithdrawn(token, feeReceiver, amount);
    }

    // -------------------------------------------------------------------------
    // User Functions (EVM as Source)
    // -------------------------------------------------------------------------

    /**
     * @notice Locks canonical tokens on this chain to bridge out.
     *
     * @dev
     *  - User must approve this contract to spend `_amount` beforehand.
     *  - Fee (if any) is deducted from `_amount`.
     *  - Net amount is the bridged amount emitted in the event.
     */
    function lockCanonical(
        address token,
        uint256 amount,
        uint256 destChainId,
        bytes32 destRecipient
    ) external whenNotPaused nonReentrant {
        TokenConfig memory cfg = tokenConfigs[token];

        if (!cfg.isWhitelisted) revert BridgeCore__TokenNotWhitelisted();
        if (!cfg.isCanonical) revert BridgeCore__TokenNotCanonical();
        if (amount == 0) revert BridgeCore__InvalidAmount();

        if (cfg.minAmount > 0 && amount < cfg.minAmount) revert BridgeCore__AmountTooSmall();
        if (cfg.maxAmount > 0 && amount > cfg.maxAmount) revert BridgeCore__AmountTooLarge();

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 feeAmount = _calculateFee(amount);
        uint256 netAmount = amount - feeAmount;

        if (feeAmount > 0) {
            collectedFees[token] += feeAmount;
        }

        uint256 newNonce = ++nonce;

        emit LockedCanonical(
            token,
            msg.sender,
            amount,
            netAmount,
            feeAmount,
            newNonce,
            destChainId,
            destRecipient
        );
        // Relayer will observe this event, compute eventId, and instruct the
        // destination chain to mint/unlock `netAmount`.
    }

    /**
     * @notice Burns wrapped tokens on this chain to bridge back to the canonical chain.
     *
     * @dev
     *  - User must approve this contract to spend `amount`.
     *  - No on-chain fee is applied here in this V1 (fee can be taken on canonical side).
     */
    function burnWrapped(
        address wrappedToken,
        uint256 amount,
        uint256 destChainId,
        bytes32 destRecipient
    ) external whenNotPaused nonReentrant {
        TokenConfig memory cfg = tokenConfigs[wrappedToken];

        if (!cfg.isWhitelisted) revert BridgeCore__TokenNotWhitelisted();
        if (cfg.isCanonical) revert BridgeCore__TokenNotWrapped();
        if (amount == 0) revert BridgeCore__InvalidAmount();

        if (cfg.minAmount > 0 && amount < cfg.minAmount) revert BridgeCore__AmountTooSmall();
        if (cfg.maxAmount > 0 && amount > cfg.maxAmount) revert BridgeCore__AmountTooLarge();

        // Pull wrapped tokens from user then burn them from this contract.
        IERC20(wrappedToken).safeTransferFrom(msg.sender, address(this), amount);
        IWrappedToken(wrappedToken).burn(amount);

        uint256 newNonce = ++nonce;
        uint256 feeAmount = 0;
        uint256 netAmount = amount;

        emit BurnedWrapped(
            wrappedToken,
            msg.sender,
            amount,
            netAmount,
            feeAmount,
            newNonce,
            destChainId,
            destRecipient
        );
        // Relayer observes this event and instructs the canonical chain
        // to unlock exactly `amount` native tokens to `destAddress`.
    }

    // -------------------------------------------------------------------------
    // Relayer Functions (Cross-Chain Execution)
    // -------------------------------------------------------------------------

    /**
     * @notice Mints wrapped tokens on this chain after canonical tokens
     *         have been locked on the remote chain.
     *
     * @param wrappedToken Address of the wrapped token on this chain.
     * @param to Recipient of the wrapped tokens.
     * @param amount Amount of tokens to mint (net amount from remote lock).
     * @param eventId Unique identifier for the remote lock event (keccak256).
     */
    function mintFromLock(
        address wrappedToken,
        address to,
        uint256 amount,
        bytes32 eventId
    ) external whenNotPaused onlyRelayer nonReentrant {
        TokenConfig memory cfg = tokenConfigs[wrappedToken];

        if (!cfg.isWhitelisted) revert BridgeCore__TokenNotWhitelisted();
        if (cfg.isCanonical) revert BridgeCore__TokenNotWrapped();
        if (amount == 0) revert BridgeCore__InvalidAmount();
        if (processedEvents[eventId]) revert BridgeCore__AlreadyProcessed();

        processedEvents[eventId] = true;

        IWrappedToken(wrappedToken).mint(to, amount);

        emit MintedWrapped(wrappedToken, to, amount, eventId);
    }

    /**
     * @notice Unlocks canonical tokens on this chain after wrapped tokens
     *         were burned on the remote chain.
     *
     * @param token Address of the canonical token on this chain.
     * @param to Recipient of unlocked tokens.
     * @param amount Amount of tokens to unlock.
     * @param eventId Unique identifier for the remote burn event (keccak256).
     */
    function unlockFromBurn(
        address token,
        address to,
        uint256 amount,
        bytes32 eventId
    ) external whenNotPaused onlyRelayer nonReentrant {
        TokenConfig memory cfg = tokenConfigs[token];

        if (!cfg.isWhitelisted) revert BridgeCore__TokenNotWhitelisted();
        if (!cfg.isCanonical) revert BridgeCore__TokenNotCanonical();
        if (amount == 0) revert BridgeCore__InvalidAmount();
        if (processedEvents[eventId]) revert BridgeCore__AlreadyProcessed();

        processedEvents[eventId] = true;

        IERC20(token).safeTransfer(to, amount);

        emit UnlockedCanonical(token, to, amount, eventId);
    }

    // -------------------------------------------------------------------------
    // Internal Helpers
    // -------------------------------------------------------------------------

    function _calculateFee(uint256 amount) internal view returns (uint256) {
        if (feeBps == 0) return 0;
        return (amount * feeBps) / BPS_DENOMINATOR;
    }
}
