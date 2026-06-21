/**
 * Testes de regressão para getHistoricoLeituras (dataService.js).
 * Cobre o risco #10 (test-strategy.md §1.9): paginação podia retornar
 * página vazia sem disparar estado empty, e podia ser corrompida por
 * mudanças futuras em pageSize, sort ou cálculo de start.
 */
import {
  getHistoricoLeituras,
  setCachedPayload,
} from '../services/dataService.js';

function gerarHistoricoSintetico(n, { baseTime = new Date('2026-06-01T00:00:00Z').getTime(), passoMs = 60_000 } = {}) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    lista.push({
      id: i + 1,
      dataHora: new Date(baseTime + i * passoMs).toISOString(),
      statusIrrigacao: 'DESLIGADO',
      vazaoGotejamentoLh: 2.0,
    });
  }
  return lista;
}

async function coletarTodasAsPaginas(params) {
  const primeira = await getHistoricoLeituras({ ...params, page: 1 });
  const paginas = [primeira];
  for (let p = 2; p <= primeira.totalPages; p++) {
    paginas.push(await getHistoricoLeituras({ ...params, page: p }));
  }
  return paginas;
}

describe('dataService — getHistoricoLeituras (regressão de paginação, risco #10)', () => {
  test('união disjunta: cada leitura aparece em exatamente uma página, sem perda nem duplicação', async () => {
    const total = 45;
    setCachedPayload({ telemetria: null, historico: gerarHistoricoSintetico(total), cenario: 'ok' });

    const paginas = await coletarTodasAsPaginas({ pageSize: 20 });
    const idsColetados = paginas.flatMap(p => p.items.map(i => i.id));

    expect(idsColetados).toHaveLength(total);
    expect(new Set(idsColetados).size).toBe(total);
  });

  test('última página não vem vazia quando total não é múltiplo de pageSize', async () => {
    setCachedPayload({ telemetria: null, historico: gerarHistoricoSintetico(45), cenario: 'ok' });

    const resultado = await getHistoricoLeituras({ pageSize: 20, page: 3 });
    expect(resultado.totalPages).toBe(3);
    expect(resultado.items).toHaveLength(5);
  });

  test('última página não vem vazia quando total é múltiplo exato de pageSize', async () => {
    setCachedPayload({ telemetria: null, historico: gerarHistoricoSintetico(40), cenario: 'ok' });

    const resultado = await getHistoricoLeituras({ pageSize: 20, page: 2 });
    expect(resultado.totalPages).toBe(2);
    expect(resultado.items).toHaveLength(20);
  });

  test('pedir página além do total devolve items: [] coerente, sem corromper total/totalPages', async () => {
    setCachedPayload({ telemetria: null, historico: gerarHistoricoSintetico(45), cenario: 'ok' });

    const resultado = await getHistoricoLeituras({ pageSize: 20, page: 99 });
    expect(resultado.items).toEqual([]);
    expect(resultado.total).toBe(45);
    expect(resultado.totalPages).toBe(3);
  });

  test('guarda: pageSize inválido (0 ou negativo) não gera Infinity/NaN em totalPages', async () => {
    setCachedPayload({ telemetria: null, historico: gerarHistoricoSintetico(45), cenario: 'ok' });

    const comZero = await getHistoricoLeituras({ pageSize: 0, page: 1 });
    expect(Number.isFinite(comZero.totalPages)).toBe(true);
    expect(comZero.items.length).toBeGreaterThan(0);

    const comNegativo = await getHistoricoLeituras({ pageSize: -5, page: 1 });
    expect(Number.isFinite(comNegativo.totalPages)).toBe(true);
  });

  test('guarda: page inválido (0 ou negativo) cai na página 1 em vez de corromper o slice', async () => {
    setCachedPayload({ telemetria: null, historico: gerarHistoricoSintetico(45), cenario: 'ok' });

    const comPageZero = await getHistoricoLeituras({ pageSize: 20, page: 0 });
    const comPageUm = await getHistoricoLeituras({ pageSize: 20, page: 1 });
    expect(comPageZero.items.map(i => i.id)).toEqual(comPageUm.items.map(i => i.id));
  });
});
