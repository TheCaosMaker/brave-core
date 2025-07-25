// Copyright (c) 2024 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.
import * as React from 'react'
import { skipToken } from '@reduxjs/toolkit/query/react'

// Types
import {
  BraveWallet,
  SerializableTransactionInfo, //
} from '../../../../constants/types'

// Utils
import { getLocale, formatLocale } from '$web-common/locale'
import {
  findTransactionToken,
  getFormattedTransactionTransferredValue,
  getIsTxApprovalUnlimited,
  getTransactionApprovalTargetAddress,
  getTransactionToAddress,
  isBridgeTransaction,
  isSwapTransaction,
  getIsSolanaAssociatedTokenAccountCreation,
} from '../../../../utils/tx-utils'
import { getCoinFromTxDataUnion } from '../../../../utils/network-utils'
import { getAddressLabel } from '../../../../utils/account-utils'
import Amount from '../../../../utils/amount'

// Queries
import {
  useAccountQuery,
  useGetCombinedTokensListQuery,
} from '../../../../common/slices/api.slice.extra'
import {
  useGetAccountInfosRegistryQuery,
  useGetNetworkQuery,
  useGetZCashTransactionTypeQuery,
} from '../../../../common/slices/api.slice'
import {
  accountInfoEntityAdaptorInitialState, //
} from '../../../../common/slices/entities/account-info.entity'

// Hooks
import {
  useTransactionsNetwork, //
} from '../../../../common/hooks/use-transactions-network'
import {
  useSwapTransactionParser, //
} from '../../../../common/hooks/use-swap-tx-parser'
import { useExplorer } from '../../../../common/hooks/explorer'

// Styled Components
import { Button, ExplorerIcon } from './common.style'
import { Row, Text } from '../../../shared/style'

interface Props {
  transaction: SerializableTransactionInfo
}

export const TransactionIntent = (props: Props) => {
  const { transaction } = props

  // Computed & Queries
  const isBridge = isBridgeTransaction(transaction)
  const isSwap = isSwapTransaction(transaction)
  const isSwapOrBridge = isBridge || isSwap
  const isERC20Approval =
    transaction.txType === BraveWallet.TransactionType.ERC20Approve
  const isTxApprovalUnlimited = getIsTxApprovalUnlimited(transaction)
  const txApprovalTarget = getTransactionApprovalTargetAddress(transaction)
  const txCoinType = getCoinFromTxDataUnion(transaction.txDataUnion)
  const txToAddress = getTransactionToAddress(transaction)
  const isSOLSwapOrBridge =
    txCoinType === BraveWallet.CoinType.SOL && isSwapOrBridge
  const isSolanaATACreation =
    getIsSolanaAssociatedTokenAccountCreation(transaction)

  const { account: txAccount } = useAccountQuery(transaction.fromAccountId)
  const { data: combinedTokensList } = useGetCombinedTokensListQuery()

  const transactionsToken = findTransactionToken(
    transaction,
    combinedTokensList,
  )

  const transactionNetwork = useTransactionsNetwork(transaction)

  const {
    data: getZCashTransactionTypeResult = { txType: null, error: null },
  } = useGetZCashTransactionTypeQuery(
    txCoinType === BraveWallet.CoinType.ZEC
      && transactionNetwork
      && transactionsToken
      && txAccount
      && txToAddress
      ? {
          chainId: transactionNetwork.chainId,
          accountId: txAccount.accountId,
          useShieldedPool: transactionsToken.isShielded,
          address: txToAddress,
        }
      : skipToken,
  )

  const isShieldingFunds =
    getZCashTransactionTypeResult.txType === BraveWallet.ZCashTxType.kShielding

  // Custom Hooks
  const onClickViewOnBlockExplorer = useExplorer(transactionNetwork)

  const { normalizedTransferredValue } =
    getFormattedTransactionTransferredValue({
      tx: transaction,
      token: transactionsToken,
      txAccount,
      txNetwork: transactionNetwork,
    })

  const { data: txNetwork } = useGetNetworkQuery({
    chainId: transaction.chainId,
    coin: txCoinType,
  })

  const { data: bridgeToNetwork } = useGetNetworkQuery(
    isBridge
      && transaction.swapInfo?.toChainId
      && transaction.swapInfo.toCoin !== undefined
      ? {
          chainId: transaction.swapInfo.toChainId,
          coin: transaction.swapInfo.toCoin,
        }
      : skipToken,
  )

  const { data: accountInfosRegistry = accountInfoEntityAdaptorInitialState } =
    useGetAccountInfosRegistryQuery(undefined)

  const { buyToken, sellToken, buyAmountWei, sellAmountWei } =
    useSwapTransactionParser(transaction)

  const formattedSellAmount = sellToken
    ? sellAmountWei
        .divideByDecimals(sellToken.decimals)
        .formatAsAsset(6, sellToken.symbol)
    : ''
  const formattedBuyAmount = buyToken
    ? buyAmountWei
        .divideByDecimals(buyToken.decimals)
        .formatAsAsset(6, buyToken.symbol)
    : ''

  const transactionFailed =
    transaction.txStatus === BraveWallet.TransactionStatus.Dropped
    || transaction.txStatus === BraveWallet.TransactionStatus.Error

  const transactionConfirmed =
    transaction.txStatus === BraveWallet.TransactionStatus.Confirmed

  // Currently we only get transaction.swapInfo.receiver info
  // for lifi swaps. Core should also return this value
  // for all other providers.
  const swapOrBridgeRecipient =
    transaction.swapInfo?.provider === 'lifi'
      ? (transaction.swapInfo?.receiver ?? '')
      : (txAccount?.address ?? '')

  const recipientLabel = getAddressLabel(
    isERC20Approval
      ? txApprovalTarget
      : isSwapOrBridge
        ? swapOrBridgeRecipient
        : txToAddress,
    accountInfosRegistry,
  )

  const formattedSendAmount = React.useMemo(() => {
    if (!transactionsToken) {
      return ''
    }
    if (
      transactionsToken.isErc721
      || transactionsToken.isErc1155
      || transactionsToken.isNft
    ) {
      return `${transactionsToken.name} ${transactionsToken.symbol}`
    }
    return new Amount(normalizedTransferredValue).formatAsAsset(
      6,
      transactionsToken.symbol,
    )
  }, [transactionsToken, normalizedTransferredValue])

  const formattedApprovalAmount = isTxApprovalUnlimited
    ? `${getLocale('braveWalletTransactionApproveUnlimited')} ${
        transactionsToken?.symbol ?? ''
      }`
    : formattedSendAmount

  const sendSwapOrBridgeLocale = React.useMemo(() => {
    if (isBridge) {
      return getLocale('braveWalletBridge').toLocaleLowerCase()
    }
    if (isSwap) {
      return getLocale('braveWalletSwap').toLocaleLowerCase()
    }
    return getLocale('braveWalletSend').toLocaleLowerCase()
  }, [isBridge, isSwap])

  const swappingOrBridgingLocale = React.useMemo(() => {
    if (isBridge) {
      return getLocale('braveWalletBridging')
    }
    return getLocale('braveWalletSwapping')
  }, [isBridge])

  const firstDuringValue = React.useMemo(() => {
    if (isERC20Approval) {
      return formattedApprovalAmount
    }
    if (isSOLSwapOrBridge && transactionFailed) {
      return sendSwapOrBridgeLocale
    }
    if (isSOLSwapOrBridge) {
      return swappingOrBridgingLocale
    }
    if (isSwapOrBridge && transactionConfirmed) {
      return formattedBuyAmount
    }
    if (isSwapOrBridge) {
      return formattedSellAmount
    }
    return formattedSendAmount
  }, [
    isERC20Approval,
    formattedApprovalAmount,
    isSwapOrBridge,
    transactionConfirmed,
    formattedBuyAmount,
    formattedSellAmount,
    formattedSendAmount,
    isSOLSwapOrBridge,
    sendSwapOrBridgeLocale,
    transactionFailed,
    swappingOrBridgingLocale,
  ])

  const secondDuringValue = React.useMemo(() => {
    if (isSOLSwapOrBridge) {
      return txNetwork?.chainName ?? ''
    }
    if (isSwapOrBridge && transactionConfirmed) {
      return recipientLabel
    }
    if (isBridge) {
      return bridgeToNetwork?.chainName ?? ''
    }
    if (isSwap) {
      return formattedBuyAmount
    }
    return recipientLabel
  }, [
    isSwapOrBridge,
    transactionConfirmed,
    recipientLabel,
    isBridge,
    bridgeToNetwork,
    isSwap,
    formattedBuyAmount,
    isSOLSwapOrBridge,
    txNetwork,
  ])

  const descriptionLocale = React.useMemo(() => {
    if (isSolanaATACreation && transactionFailed) {
      return 'braveWalletFailedToCreateAssociatedTokenAccount'
    }
    if (isSolanaATACreation && transactionConfirmed) {
      return 'braveWalletAssociatedTokenAccountCreated'
    }
    if (isSolanaATACreation) {
      return 'braveWalletCreatingAssociatedTokenAccount'
    }
    if (transactionFailed && isSOLSwapOrBridge) {
      return 'braveWalletErrorAttemptingToTransactOnNetwork'
    }
    if (transactionFailed) {
      return 'braveWalletErrorAttemptingToTransact'
    }
    if (isSOLSwapOrBridge) {
      return 'braveWalletSwappingOrBridgingOnNetwork'
    }
    if (isSwapOrBridge && transactionConfirmed) {
      return 'braveWalletAmountAddedToAccount'
    }
    if (isBridge) {
      return 'braveWalletBridgingAmountToNetwork'
    }
    if (isSwap) {
      return 'braveWalletSwappingAmountToAmountOnNetwork'
    }
    if (isERC20Approval) {
      return 'braveWalletApprovingAmountOnExchange'
    }
    if (transactionConfirmed && isShieldingFunds) {
      return 'braveWalletAmountHasBeenShielded'
    }
    if (isShieldingFunds) {
      return 'braveWalletShieldingAmount'
    }
    if (transactionConfirmed) {
      return 'braveWalletAmountSentToAccount'
    }
    return 'braveWalletSendingAmountToAccount'
  }, [
    transactionFailed,
    isSwapOrBridge,
    transactionConfirmed,
    isBridge,
    isSwap,
    isERC20Approval,
    isSOLSwapOrBridge,
    isShieldingFunds,
    isSolanaATACreation,
  ])

  const description = formatLocale(
    descriptionLocale,
    {
      $1: (
        <Text
          textColor='primary'
          textSize='14px'
          isBold
        >
          {firstDuringValue}
        </Text>
      ),
      $2: (
        <Row
          width='unset'
          gap='4px'
        >
          <Text
            textColor='primary'
            textSize='14px'
            isBold
          >
            {secondDuringValue}
          </Text>
          <Button
            onClick={onClickViewOnBlockExplorer(
              isSwapOrBridge && transaction.swapInfo?.provider === 'lifi'
                ? 'lifi'
                : 'tx',
              transaction.txHash,
            )}
          >
            <ExplorerIcon />
          </Button>
        </Row>
      ),
      $3: transactionFailed
        ? sendSwapOrBridgeLocale
        : (txNetwork?.chainName ?? ''),
    },
    {
      noErrorOnMissingReplacement: true,
    },
  )

  return (
    <Row
      gap='4px'
      flexWrap='wrap'
      padding='16px'
    >
      <Text
        textColor='secondary'
        textSize='14px'
      >
        {description}
      </Text>
    </Row>
  )
}
