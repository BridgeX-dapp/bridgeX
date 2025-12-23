"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { AccountType, GetActiveAccountOptions } from "@make-software/csprclick-core-types"
import { useClickRef } from "@make-software/csprclick-ui"
import { publicKeyToAccountHash, publicKeyToRecipientBytes32, shortenHash } from "@/lib/casper/format"

type CasperWalletStatus = "disconnected" | "connecting" | "connected"

type CasperWalletContextValue = {
  status: CasperWalletStatus
  account: AccountType | null
  accountHash: string | null
  recipientBytes32: string | null
  displayName: string | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refreshAccount: (options?: GetActiveAccountOptions) => Promise<void>
  isReady: boolean
}

type CsprClickEvent = {
  account?: AccountType
}

const CasperWalletContext = createContext<CasperWalletContextValue | undefined>(undefined)

export function CasperWalletProvider({ children }: { children: React.ReactNode }) {
  const clickRef = useClickRef()
  const [status, setStatus] = useState<CasperWalletStatus>("disconnected")
  const [account, setAccount] = useState<AccountType | null>(null)

  const updateAccount = useCallback((nextAccount: AccountType | null) => {
    setAccount(nextAccount)
    setStatus(nextAccount ? "connected" : "disconnected")
  }, [])

  const refreshAccount = useCallback(
    async (options?: GetActiveAccountOptions) => {
      if (!clickRef?.getActiveAccountAsync) return
      setStatus((prev) => (prev === "connected" ? prev : "connecting"))
      const nextAccount = await clickRef.getActiveAccountAsync(options)
      updateAccount(nextAccount ?? null)
    },
    [clickRef, updateAccount],
  )

  const connect = useCallback(async () => {
    if (!clickRef?.signIn) return
    setStatus("connecting")
    clickRef.signIn()
  }, [clickRef])

  const disconnect = useCallback(async () => {
    if (!clickRef?.signOut) return
    await clickRef.signOut()
    updateAccount(null)
  }, [clickRef, updateAccount])

  useEffect(() => {
    if (!clickRef) return

    const handleSignedIn = (evt: CsprClickEvent) => updateAccount(evt.account ?? null)
    const handleSwitch = (evt: CsprClickEvent) => updateAccount(evt.account ?? null)
    const handleSignedOut = () => updateAccount(null)
    const handleDisconnected = () => updateAccount(null)

    clickRef.on("csprclick:signed_in", handleSignedIn)
    clickRef.on("csprclick:switched_account", handleSwitch)
    clickRef.on("csprclick:signed_out", handleSignedOut)
    clickRef.on("csprclick:disconnected", handleDisconnected)

    return () => {
      clickRef.off("csprclick:signed_in", handleSignedIn)
      clickRef.off("csprclick:switched_account", handleSwitch)
      clickRef.off("csprclick:signed_out", handleSignedOut)
      clickRef.off("csprclick:disconnected", handleDisconnected)
    }
  }, [clickRef, updateAccount])

  useEffect(() => {
    refreshAccount().catch(() => undefined)
  }, [refreshAccount])

  const accountHash = useMemo(() => {
    if (!account?.public_key) return null
    return publicKeyToAccountHash(account.public_key)
  }, [account?.public_key])

  const recipientBytes32 = useMemo(() => {
    if (!account?.public_key) return null
    return publicKeyToRecipientBytes32(account.public_key)
  }, [account?.public_key])

  const displayName = useMemo(() => {
    if (account?.name) return account.name
    if (accountHash) return shortenHash(accountHash)
    return null
  }, [account?.name, accountHash])

  const value = useMemo(
    () => ({
      status,
      account,
      accountHash,
      recipientBytes32,
      displayName,
      connect,
      disconnect,
      refreshAccount,
      isReady: Boolean(clickRef),
    }),
    [status, account, accountHash, recipientBytes32, displayName, clickRef, connect, disconnect, refreshAccount],
  )

  return <CasperWalletContext.Provider value={value}>{children}</CasperWalletContext.Provider>
}

export function useCasperWallet() {
  const context = useContext(CasperWalletContext)
  if (!context) {
    throw new Error("useCasperWallet must be used within CasperWalletProvider")
  }
  return context
}
