import { IJsonRpcTransport } from '.';
import { makeHttpRequest } from './http-request';
import { SolanaJsonRpcError } from './json-rpc-errors';
import { createJsonRpcMessage } from './json-rpc-message';
import { patchParamsForSolanaLabsRpc } from './params-patcher';

type Config = Readonly<{
    onIntegerOverflow?: (method: string, keyPath: (number | string)[], value: bigint) => void;
    url: string;
}>;

type JsonRpcResponse<TResponse> = Readonly<
    { result: TResponse } | { error: { code: number; message: string; data?: unknown } }
>;

export function createJsonRpcTransport({ onIntegerOverflow, url }: Config): IJsonRpcTransport {
    return {
        async send<TParams, TResponse>(method: string, params: TParams): Promise<TResponse> {
            const patchedParams = patchParamsForSolanaLabsRpc(
                params,
                onIntegerOverflow
                    ? (keyPath, value) => {
                          onIntegerOverflow(method, keyPath, value);
                      }
                    : undefined
            );
            const jsonRpcMessage = createJsonRpcMessage(method, patchedParams);
            const response = await makeHttpRequest<JsonRpcResponse<TResponse>>({
                payload: jsonRpcMessage,
                url,
            });
            if ('error' in response) {
                throw new SolanaJsonRpcError(response.error);
            } else {
                return response.result as TResponse;
            }
        },
    };
}
