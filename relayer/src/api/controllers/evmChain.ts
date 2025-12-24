import { resolveEvmChainConfig } from '../chains/evm/config';

export function resolveEvmChainFromRequest(chain?: unknown) {
  if (chain === undefined || chain === null || chain === '') {
    return resolveEvmChainConfig();
  }

  if (typeof chain !== 'string') {
    throw new Error('chain must be a string');
  }

  return resolveEvmChainConfig(chain);
}
