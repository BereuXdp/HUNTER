/* =========================================================
   Hunter · dados de demonstração
   Tudo aqui é gerado no navegador, de forma determinística,
   relativo à data de hoje. Quando o backend existir, troque
   este arquivo por chamadas à API com o mesmo formato.
   ========================================================= */
window.HunterData = (() => {
  // PRNG com semente fixa: os mesmos números a cada carregamento
  const mulberry32 = a => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const rand = mulberry32(20261111);
  const HOUR = 36e5, MIN = 6e4;
  const now = new Date();

  const COLETOR_ATUAL = '1.4.2';

  const stores = [
    { id: 'centro',    nome: 'Loja Centro',    cnpj: '11222333000181', cidade: 'São Paulo · SP', porte: 70, versao: '1.4.2', pasta: 'C:\\PDV\\XML',            atraso: 18 * MIN },
    { id: 'shopping',  nome: 'Loja Shopping',  cnpj: '11222333000262', cidade: 'São Paulo · SP', porte: 95, versao: '1.4.2', pasta: 'D:\\Linx\\NFCe\\Autorizadas', atraso: 47 * MIN },
    { id: 'paulista',  nome: 'Loja Paulista',  cnpj: '11222333000343', cidade: 'São Paulo · SP', porte: 60, versao: '1.4.2', pasta: 'C:\\PDV\\XML',            atraso: 65 * MIN },
    { id: 'moema',     nome: 'Loja Moema',     cnpj: '11222333000424', cidade: 'São Paulo · SP', porte: 45, versao: '1.4.1', pasta: 'C:\\Saurus\\XML',         atraso: 9 * HOUR + 12 * MIN },
    { id: 'pinheiros', nome: 'Loja Pinheiros', cnpj: '11222333000505', cidade: 'São Paulo · SP', porte: 55, versao: '1.4.2', pasta: 'C:\\PDV\\XML',            atraso: 25 * MIN },
    { id: 'campinas',  nome: 'Loja Campinas',  cnpj: '11222333000696', cidade: 'Campinas · SP',  porte: 40, versao: '1.3.9', pasta: 'C:\\Bematech\\XML',      atraso: 101 * MIN },
  ].map(s => ({ ...s, ultimaColeta: new Date(now - s.atraso) }));

  // horário de emissão: picos no almoço e no jantar
  const pickHour = () => {
    const r = rand();
    if (r < .45) return 11.5 + rand() * 3;
    if (r < .9) return 18.5 + rand() * 4;
    return 10 + rand() * 13;
  };
  const pad = (n, l) => String(n).padStart(l, '0');
  const chave = (s, tipo, serie, numero, d) =>
    '35' + pad(d.getFullYear() % 100, 2) + pad(d.getMonth() + 1, 2) + s.cnpj +
    (tipo === 'NF-e' ? '55' : '65') + pad(serie, 3) + pad(numero, 9) + '1' +
    pad(Math.floor(rand() * 1e8), 8) + Math.floor(rand() * 10);

  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const notes = [];
  let uid = 0;

  stores.forEach((s, i) => {
    const seq = { 'NFC-e': 1000 + i * 4317, 'NF-e': 200 + i * 57 };
    for (const d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      const mult = dow === 5 || dow === 6 ? 1.35 : dow === 0 ? 1.15 : .9;
      const count = Math.round(s.porte * mult * (.8 + rand() * .4));
      const hours = Array.from({ length: count }, pickHour).sort((a, b) => a - b);
      for (const h of hours) {
        const em = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, Math.round(h * HOUR));
        const coletado = new Date(+em + (5 + rand() * 110) * MIN);
        // só existe no Hunter o que o coletor já enviou
        if (coletado > s.ultimaColeta) continue;
        const tipo = rand() < .03 ? 'NF-e' : 'NFC-e';
        const valor = tipo === 'NF-e'
          ? Math.round((600 + rand() * 4600) * 100) / 100
          : Math.round((22 + Math.pow(rand(), 1.7) * 240) * 100) / 100;
        const numero = ++seq[tipo];
        notes.push({
          id: ++uid, tipo, serie: 1, numero, loja: s.id, emissao: em, coletado, valor,
          status: rand() < .015 ? 'cancelada' : 'autorizada',
          chave: chave(s, tipo, 1, numero, em),
        });
      }
    }
  });

  // notas em contingência (aguardando autorização da SEFAZ)
  const contingencia = (loja, horasAtras) => {
    const n = notes.filter(x => x.loja === loja && x.tipo === 'NFC-e' && x.status === 'autorizada')
      .reduce((best, x) => Math.abs(now - x.emissao - horasAtras * HOUR) < Math.abs(now - best.emissao - horasAtras * HOUR) ? x : best);
    n.status = 'contingencia';
  };
  contingencia('paulista', 31); contingencia('paulista', 27); contingencia('centro', 3);

  // inutilizações de numeração
  ['centro', 'shopping', 'pinheiros'].forEach((loja, i) => {
    const em = new Date(now - (6 + i * 9) * 24 * HOUR);
    const s = stores.find(x => x.id === loja);
    const numero = 900 + i * 13;
    notes.push({ id: ++uid, tipo: 'NFC-e', serie: 1, numero, loja, emissao: em, coletado: new Date(+em + HOUR), valor: 0, status: 'inutilizada', chave: chave(s, 'NFC-e', 1, numero, em) });
  });

  notes.sort((a, b) => b.emissao - a.emissao);

  const users = [
    { id: 1, nome: 'Ana Souza', email: 'ana@sabordecia.com.br', papel: 'Administrador', lojas: 'todas', ultimoAcesso: new Date(now - 2 * HOUR) },
    { id: 2, nome: 'Carlos Lima', email: 'carlos@sabordecia.com.br', papel: 'Gerente', lojas: ['centro', 'shopping'], ultimoAcesso: new Date(now - 26 * HOUR) },
    { id: 3, nome: 'Bruna Alves', email: 'bruna@sabordecia.com.br', papel: 'Gerente', lojas: ['paulista', 'moema', 'pinheiros'], ultimoAcesso: new Date(now - 4 * 24 * HOUR) },
    { id: 4, nome: 'Escritório Contábil Exato', email: 'fiscal@contabilexato.com.br', papel: 'Contador', lojas: 'todas', ultimoAcesso: new Date(now - 9 * 24 * HOUR) },
  ];

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const downloads = [
    { id: 1, mes: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 1), lojas: 'todas', arquivos: 13870, tamanho: 41.6, por: 'Escritório Contábil Exato', em: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 3, 9, 41) },
    { id: 2, mes: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 2, 1), lojas: 'todas', arquivos: 13112, tamanho: 39.3, por: 'Ana Souza', em: new Date(lastMonth.getFullYear(), lastMonth.getMonth() - 1, 2, 16, 5) },
  ];

  // histórico mensal: os 10 meses anteriores aos dias detalhados acima (só os totais, como o backend devolveria)
  const hrand = mulberry32(20260707);
  const history = {};
  stores.forEach(s => {
    history[s.id] = [];
    for (let back = 2; back <= 11; back++) {
      const dm = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const notas = Math.round(s.porte * 31 * (.78 + hrand() * .42));
      const ticket = 188 + hrand() * 30;
      const canc = hrand() < .22 ? 0 : Math.round(notas * (.002 + hrand() * .004));
      history[s.id].push({ k: dm.getFullYear() * 12 + dm.getMonth(), fat: Math.round((notas - canc) * ticket * 100) / 100, notas, canc });
    }
  });

  return { now, start, stores, notes, users, downloads, history, COLETOR_ATUAL };
})();
