import { IRpcApi, RpcRequest } from '@solana/rpc-transport/dist/types/json-rpc-types';
import { patchParamsForSolanaLabsRpc } from '../params-patcher';
import { patchResponseForSolanaLabsRpc } from '../response-patcher';
import { GetAccountInfoApi } from './getAccountInfo';
import { GetBalanceApi } from './getBalance';
import { GetBlockHeightApi } from './getBlockHeight';
import { GetBlockProductionApi } from './getBlockProduction';
import { GetBlocksApi } from './getBlocks';
import { GetFirstAvailableBlockApi } from './getFirstAvailableBlock';
import { GetInflationRewardApi } from './getInflationReward';
import { GetLatestBlockhashApi } from './getLatestBlockhash';
import { GetMaxRetransmitSlotApi } from './getMaxRetransmitSlot';
import { GetMaxShredInsertSlotApi } from './getMaxShredInsertSlot';
import { GetSlotApi } from './getSlot';
import { GetStakeMinimumDelegationApi } from './getStakeMinimumDelegation';
import { GetTransactionCountApi } from './getTransactionCount';
import { MinimumLedgerSlotApi } from './minimumLedgerSlot';
import { GetEpochInfoApi } from './getEpochInfo';
import { GetRecentPerformanceSamplesApi } from './getRecentPerformanceSamples';
import { GetSupplyApi } from './getSupply';

type Config = Readonly<{
    onIntegerOverflow?: (methodName: string, keyPath: (number | string)[], value: bigint) => void;
}>;

export type SolanaRpcMethods = GetAccountInfoApi &
    GetBalanceApi &
    GetBlockHeightApi &
    GetBlockProductionApi &
    GetBlocksApi &
    GetEpochInfoApi &
    GetFirstAvailableBlockApi &
    GetInflationRewardApi &
    GetLatestBlockhashApi &
    GetMaxRetransmitSlotApi &
    GetMaxShredInsertSlotApi &
    GetRecentPerformanceSamplesApi &
    GetSlotApi &
    GetStakeMinimumDelegationApi &
    GetSupplyApi &
    GetTransactionCountApi &
    MinimumLedgerSlotApi;

export function createSolanaRpcApi(config?: Config): IRpcApi<SolanaRpcMethods> {
    return new Proxy({} as IRpcApi<SolanaRpcMethods>, {
        defineProperty() {
            return false;
        },
        deleteProperty() {
            return false;
        },
        get<TMethodName extends keyof IRpcApi<SolanaRpcMethods>>(
            ...args: Parameters<NonNullable<ProxyHandler<IRpcApi<SolanaRpcMethods>>['get']>>
        ) {
            const [_, p] = args;
            const methodName = p.toString() as keyof SolanaRpcMethods;
            return function (
                ...rawParams: Parameters<
                    SolanaRpcMethods[TMethodName] extends CallableFunction ? SolanaRpcMethods[TMethodName] : never
                >
            ): RpcRequest<ReturnType<SolanaRpcMethods[TMethodName]>> {
                const handleIntegerOverflow = config?.onIntegerOverflow;
                const params = patchParamsForSolanaLabsRpc(
                    rawParams,
                    handleIntegerOverflow
                        ? (keyPath, value) => handleIntegerOverflow(methodName, keyPath, value)
                        : undefined
                );
                return {
                    methodName,
                    params,
                    responseProcessor: rawResponse => patchResponseForSolanaLabsRpc(rawResponse, methodName),
                };
            };
        },
    });
}
