// Copyright (c) 2023 The Brave Authors. All rights reserved.
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this file,
// You can obtain one at https://mozilla.org/MPL/2.0/.

// types
import { BraveWallet } from '../../../constants/types'

// utils
import {
  getHasPendingRequests,
  handleEndpointError,
} from '../../../utils/api-utils'
import { WalletApiEndpointBuilderParams } from '../api-base.slice'

export const tokenSuggestionsEndpoints = ({
  mutation,
  query,
}: WalletApiEndpointBuilderParams) => {
  return {
    getPendingTokenSuggestionRequests: query<
      BraveWallet.AddSuggestTokenRequest[],
      void
    >({
      queryFn: async (_arg, { endpoint }, _extraOptions, baseQuery) => {
        try {
          const { data: api } = baseQuery(undefined)
          const { requests } =
            await api.braveWalletService.getPendingAddSuggestTokenRequests()
          return {
            data: requests,
          }
        } catch (error) {
          return handleEndpointError(
            endpoint,
            'failed to fetch pending token suggestion requests',
            error,
          )
        }
      },
      providesTags: ['TokenSuggestionRequests'],
    }),

    approveOrDeclineTokenSuggestion: mutation<
      boolean,
      {
        approved: boolean
        contractAddress: string
        closePanel?: boolean
      }
    >({
      queryFn: async (arg, { endpoint }, _extraOptions, baseQuery) => {
        const { data: apiProxy } = baseQuery(undefined)
        try {
          apiProxy.braveWalletService.notifyAddSuggestTokenRequestsProcessed(
            arg.approved,
            [arg.contractAddress],
          )

          if (arg.closePanel) {
            const hasPendingRequests = await getHasPendingRequests()

            if (!hasPendingRequests) {
              apiProxy.panelHandler?.closeUI()
            }
          }

          return {
            data: true,
          }
        } catch (error) {
          return handleEndpointError(
            endpoint,
            `failed to ${
              arg.approved ? 'approve' : 'decline'
            } token suggestion (${arg.contractAddress})`,
            error,
          )
        }
      },
      invalidatesTags: (res, err, arg) =>
        res && arg.approved
          ? [
              'TokenSuggestionRequests',
              'KnownBlockchainTokens',
              'UserBlockchainTokens',
              'TokenBalances',
              'TokenBalancesForChainId',
              'AccountTokenCurrentBalance',
            ]
          : ['TokenSuggestionRequests'],
    }),
  }
}
