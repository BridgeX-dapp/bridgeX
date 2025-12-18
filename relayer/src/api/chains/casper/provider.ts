// casper/provider.ts
import axios from 'axios';
import WebSocket from 'ws';
import { loadCasperConfig } from './config';

export function createCasperRestClient() {
  const cfg = loadCasperConfig();

  return axios.create({
    baseURL: cfg.CSPR_CLOUD_URL,
    headers: {
      authorization: cfg.CSPR_CLOUD_ACCESS_KEY,
    },
    timeout: 15_000,
  });
}

export function createCasperEventStream(): WebSocket {
  const cfg = loadCasperConfig();

  const params: string[] = [];

  if (cfg.CASPER_CONTRACT_HASH) {
    params.push(`contract_hash=${cfg.CASPER_CONTRACT_HASH}`);
  }

  if (cfg.CASPER_CONTRACT_PACKAGE_HASH) {
    params.push(`contract_package_hash=${cfg.CASPER_CONTRACT_PACKAGE_HASH}`);
  }

  params.push('includes=raw_data');

  const url = `${cfg.CSPR_CLOUD_STREAMING_URL.replace(
    /\/$/,
    '',
  )}/contract-events?${params.join('&')}`;

  return new WebSocket(url, {
    headers: {
      authorization: cfg.CSPR_CLOUD_ACCESS_KEY,
    },
  });
}
