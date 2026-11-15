import { ApiError } from '../api';
import type { DataAdapter } from './types';

/**
 * Adaptador da API real: ESQUELETO.
 *
 * Os endpoints e os formatos JSON ainda não foram definidos pela equipa de backend
 * (ver docs/INTEGRACAO.md), por isso nenhum pedido é feito. Quando o contrato existir:
 *  1. acrescentar os tipos das respostas em src/types/api.ts;
 *  2. implementar cada método com apiGet() (src/services/api.ts) e as rotas de config/endpoints.ts;
 *  3. converter as respostas para LocationData, CapitalRow e ProvinceValues.
 * Os componentes não mudam.
 */
const notAvailable = (what: string) =>
  Promise.reject(
    new ApiError('not-available', `API ainda não disponível (${what}). O contrato com o backend está por confirmar.`)
  );

export const apiAdapter: DataAdapter = {
  kind: 'api',
  getLocation: () => notAvailable('localização'),
  getCapitalsTable: () => notAvailable('capitais'),
  getProvinceValues: () => notAvailable('províncias'),
};
