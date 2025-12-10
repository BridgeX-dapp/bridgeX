import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { keccak256, encodeAbiParameters, getAddress } from "viem";
describe("BridgeCore", async () => {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  let bridge: any;
  let wrapped: any;
  let canonical: any;

  let owner: any;
  let user: any;
  let relayer: any;
  let feeReceiver: any;

  const DEST_CHAIN_ID = 999n;
  const FEE_BPS = 100n; // 1%

  beforeEach(async () => {
    const wallets = await viem.getWalletClients();
    owner = wallets[0];
    user = wallets[1];
    relayer = wallets[2];
    feeReceiver = wallets[3];


    // Deploy a mock ERC20 as canonical token
    canonical = await viem.deployContract("MockERC20", [
      "Canonical Token",
      "CAN",
      18
    ]);

    // Mint some canonical tokens to user
    await canonical.write.mint([user.account.address, 1_000_000n]);
    // Deploy BridgeCore
    bridge = await viem.deployContract("BridgeCore", [
       owner.account.address, 
      feeReceiver.account.address,
      relayer.account.address
    ]);

  

    // Set fee
    await bridge.write.setFeeBps([FEE_BPS]);

    // Whitelist canonical token
    await bridge.write.setTokenConfig([
      canonical.address,
      true,   // whitelisted
      true,   // canonical
      0n,
      0n
    ]);

    // Deploy wrapped token
    wrapped = await viem.deployContract("WrappedToken", [
      "Wrapped CAN",
      "wCAN",
      bridge.address,
      18
    ]);

    // Whitelist wrapped token
    await bridge.write.setTokenConfig([
      wrapped.address,
      true,   // whitelisted
      false,  // wrapped
      0n,
      0n
    ]);
  });

  // ---------------------------------------------------------------------------
  // lockCanonical
  // ---------------------------------------------------------------------------

  it("locks canonical tokens and emits LockedCanonical with fee applied", async () => {
    // Approve bridge
    await canonical.write.approve(
      [bridge.address, 10_000n],
      { account: user.account }
    );

    const fee = 10_000n * FEE_BPS / 10_000n;
    const net = 10_000n - fee;

    await viem.assertions.emitWithArgs(
      bridge.write.lockCanonical(
        [canonical.address, 10_000n, DEST_CHAIN_ID, user.account.address],
        { account: user.account }
      ),
      bridge,
      "LockedCanonical",
      [
        getAddress(canonical.address),
        getAddress(user.account.address),
        10_000n,
        net,
        fee,
        1n,
        DEST_CHAIN_ID,
        getAddress(user.account.address)
      ]
    );

    const bridgeBalance =
      await canonical.read.balanceOf([bridge.address]);

    assert.equal(bridgeBalance, 10_000n);
  });

  // ---------------------------------------------------------------------------
  // mintFromLock
  // ---------------------------------------------------------------------------

  it("relayer can mint wrapped tokens once (replay protected)", async () => {
    const eventId =
      keccak256(
     encodeAbiParameters(
          [
            { type: "address" },
            { type: "address" },
            { type: "uint256" },
            { type: "uint256" }
          ],
          [canonical.address, user.account.address, 100n, 1n]
        )
      );

    await viem.assertions.emitWithArgs(
      bridge.write.mintFromLock(
        [wrapped.address, user.account.address, 100n, eventId],
        { account: relayer.account }
      ),
      bridge,
      "MintedWrapped",
      [getAddress(wrapped.address), getAddress(user.account.address), 100n, eventId]
    );

    const userBal =
      await wrapped.read.balanceOf([user.account.address]);

    assert.equal(userBal, 100n);

    // replay should fail
    await assert.rejects(async () => {
      await bridge.write.mintFromLock(
        [wrapped.address, user.account.address, 100n, eventId],
        { account: relayer.account }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // burnWrapped
  // ---------------------------------------------------------------------------

  it("burns wrapped tokens and emits BurnedWrapped", async () => {
    // Mint wrapped first (as relayer)
    await bridge.write.mintFromLock(
      [
        wrapped.address,
        user.account.address,
        500n,
        keccak256("0x01")
      ],
      { account: relayer.account }
    );

    // Approve bridge to burn
    await wrapped.write.approve(
      [bridge.address, 500n],
      { account: user.account }
    );

    await viem.assertions.emitWithArgs(
      bridge.write.burnWrapped(
        [wrapped.address, 500n, DEST_CHAIN_ID, user.account.address],
        { account: user.account }
      ),
      bridge,
      "BurnedWrapped",
      [
        getAddress(wrapped.address),
        getAddress(user.account.address),
        500n,
        1n,
        DEST_CHAIN_ID,
        getAddress(user.account.address)
      ]
    );

    const totalSupply = await wrapped.read.totalSupply();
    assert.equal(totalSupply, 0n);
  });

  // ---------------------------------------------------------------------------
  // unlockFromBurn
  // ---------------------------------------------------------------------------

  it("relayer can unlock canonical tokens with replay protection", async () => {
    // lock first so bridge has funds
    await canonical.write.approve(
      [bridge.address, 1000n],
      { account: user.account }
    );
    await bridge.write.lockCanonical(
      [canonical.address, 1000n, DEST_CHAIN_ID, user.account.address],
      { account: user.account }
    );

    const eventId = keccak256("0xdeadbeef");

    await viem.assertions.emitWithArgs(
      bridge.write.unlockFromBurn(
        [canonical.address, user.account.address, 500n, eventId],
        { account: relayer.account }
      ),
      bridge,
      "UnlockedCanonical",
      [getAddress(canonical.address), getAddress(user.account.address), 500n, eventId]
    );

    // replay should revert
    await assert.rejects(async () => {
      await bridge.write.unlockFromBurn(
        [canonical.address, user.account.address, 500n, eventId],
        { account: relayer.account }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Pause
  // ---------------------------------------------------------------------------

  it("blocks actions when paused", async () => {
    await bridge.write.pause();

    await assert.rejects(async () => {
      await bridge.write.lockCanonical(
        [canonical.address, 1n, DEST_CHAIN_ID, user.account.address],
        { account: user.account }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Fee withdrawal
  // ---------------------------------------------------------------------------

  it("allows owner to withdraw accumulated fees", async () => {
    await canonical.write.approve(
      [bridge.address, 1_000n],
      { account: user.account }
    );

    await bridge.write.lockCanonical(
      [canonical.address, 1_000n, DEST_CHAIN_ID, user.account.address],
      { account: user.account }
    );

    const fee = 1_000n * FEE_BPS / 10_000n;

    await bridge.write.withdrawFees(
      [canonical.address, fee],
      { account: owner.account }
    );

    const receiverBalance =
      await canonical.read.balanceOf([feeReceiver.account.address]);

    assert.equal(receiverBalance, fee);
  });
});
