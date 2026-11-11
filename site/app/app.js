/* =========================================================
   Hunter · painel interno (protótipo navegável, modo demo)
   Vanilla JS, sem build. Rotas por hash: #/visao, #/notas,
   #/lojas, #/downloads, #/alertas, #/acessos
   ========================================================= */
(() => {
  const D = window.HunterData;
  const SESSION_KEY = 'hunter.demo.session';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const HOUR = 36e5, DAY = 864e5;

  /* ---------------- sessão ---------------- */
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)); } catch (_) {}
  if (!session) { location.replace('../login/'); return; }

  /* ---------------- configurações (modo demo: salvas neste navegador) ---------------- */
  const CFG_KEY = 'hunter.demo.config';
  const CFG_DEFAULT = () => ({
    perfil: { tel: '', motion: true },
    rede: { razao: '', cnpj: '', fuso: 'America/Sao_Paulo' },
    notif: { offline: true, cont: true, versao: false, diario: true, semanal: false, email: session.email || '', hora: '08:00' },
    coleta: { limite: 3, retencao: 5, zipCanc: true, zipInut: true, zipCont: true },
    seg: { dois: false },
  });
  let cfg = CFG_DEFAULT();
  try { const sv = JSON.parse(localStorage.getItem(CFG_KEY)); if (sv) for (const k in cfg) Object.assign(cfg[k], sv[k]); } catch (_) {}
  const saveCfg = () => { try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (_) {} };
  const saveSession = () => { for (const st of [sessionStorage, localStorage]) { try { if (st.getItem(SESSION_KEY)) st.setItem(SESSION_KEY, JSON.stringify(session)); } catch (_) {} } };

  /* ---------------- formatação ---------------- */
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const int = new Intl.NumberFormat('pt-BR');
  const money = v => brl.format(v);
  const moneyShort = v => v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
    : v >= 1e3 ? `R$ ${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: v >= 1e4 ? 0 : 1 })} mil` : `R$ ${Math.round(v)}`;
  const cnpj = c => c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  const two = n => String(n).padStart(2, '0');
  const dt = d => `${two(d.getDate())}/${two(d.getMonth() + 1)} ${two(d.getHours())}:${two(d.getMinutes())}`;
  const dtFull = d => `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} às ${two(d.getHours())}:${two(d.getMinutes())}`;
  const hm = d => `${two(d.getHours())}:${two(d.getMinutes())}`;
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const mesNome = d => `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  const ago = d => {
    if (!d) return '—';
    const m = Math.round((Date.now() - d) / 6e4);
    if (m < 1) return 'agora';
    if (m < 60) return `há ${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `há ${h} h`;
    const dd = Math.round(h / 24);
    return `há ${dd} ${dd === 1 ? 'dia' : 'dias'}`;
  };
  const initials = n => n.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, s, p) => `${int.format(n)} ${n === 1 ? s : p}`;

  /* ---------------- ícones ---------------- */
  const I = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const ic = {
    home: I('<path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/>'),
    doc: I('<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
    store: I('<path d="M4 9l1.5-5h13L20 9M4 9h16v11H4zM4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0M10 20v-5h4v5"/>'),
    zip: I('<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>'),
    bell: I('<path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0"/>'),
    users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M21.5 20a6.5 6.5 0 00-4-6"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    checkc: I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    xc: I('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
    warn: I('<path d="M12 9v4m0 3.5v.01M10.3 3.9L2.6 17.5A2 2 0 004.3 20.5h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    wifi: I('<path d="M2 2l20 20M8.5 16.5a5 5 0 017 0M5 12.9a10 10 0 015.2-2.8M19 12.9a10 10 0 00-2.4-1.7M2 8.8a15 15 0 014.2-2.7M22 8.8A15 15 0 0011 5.1M12 20h.01"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    minus: I('<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    key: I('<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M17 6l3 3M14 9l2 2"/>'),
    dl: I('<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>'),
    copy: I('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>'),
    csv: I('<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 15l2 2 4-4"/>'),
    arrowR: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    shield: I('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    edit: I('<path d="M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17z"/><path d="M14.5 7.5l3 3"/>'),
    cog: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
    trash: I('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>'),
  };

  const STATUS = {
    autorizada: { cls: 'good', label: 'Autorizada', icon: ic.checkc },
    cancelada: { cls: 'crit', label: 'Cancelada', icon: ic.xc },
    contingencia: { cls: 'warn', label: 'Em contingência', icon: ic.clock },
    inutilizada: { cls: 'neutral', label: 'Inutilizada', icon: ic.minus },
  };
  const pill = (cls, icon, label) => `<span class="pill ${cls}">${icon}${label}</span>`;
  const statusPill = s => pill(STATUS[s].cls, STATUS[s].icon, STATUS[s].label);

  /* ---------------- estado ---------------- */
  const state = {
    period: 'mes',
    loja: 'all',
    notas: { q: '', tipo: 'all', status: 'all', page: 1 },
    resolved: new Set(JSON.parse(sessionStorage.getItem('hunter.resolved') || '[]')),
  };
  const saveResolved = () => sessionStorage.setItem('hunter.resolved', JSON.stringify([...state.resolved]));
  const storeById = id => D.stores.find(s => s.id === id);

  const storeStatus = s => {
    if (s.pausada) return { key: 'pausada', html: pill('neutral', ic.minus, 'Coleta pausada') };
    if (!s.ultimaColeta) return { key: 'nova', html: pill('neutral', ic.clock, 'Aguardando instalação') };
    const late = Date.now() - s.ultimaColeta;
    if (late > (s.limiteSemSinal || cfg.coleta.limite) * HOUR) return { key: 'off', html: pill('crit', ic.wifi, 'Sem sinal') };
    return { key: 'on', html: pill('good', ic.checkc, 'Online') };
  };

  /* ---------------- períodos ---------------- */
  const PERIODS = [['hoje', 'Hoje'], ['7d', '7 dias'], ['mes', 'Mês atual'], ['mes-ant', 'Mês anterior']];
  function range(p) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (p === 'hoje') return { from: today, to: now, label: `Hoje, ${two(now.getDate())}/${two(now.getMonth() + 1)}`, prev: { from: new Date(+today - DAY), to: new Date(+now - DAY) }, prevLabel: 'ontem até esta hora', unit: 'hour' };
    if (p === '7d') { const f = new Date(+today - 6 * DAY); return { from: f, to: now, label: 'Últimos 7 dias', prev: { from: new Date(+f - 7 * DAY), to: f }, prevLabel: '7 dias anteriores', unit: 'day' }; }
    if (p === 'mes') {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      const pf = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: f, to: now, label: mesNome(now)[0].toUpperCase() + mesNome(now).slice(1) + ' (parcial)', prev: { from: pf, to: new Date(+pf + (now - f)) }, prevLabel: 'mesmo período do mês anterior', unit: 'day' };
    }
    const f = new Date(now.getFullYear(), now.getMonth() - 1, 1), t = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: f, to: t, label: mesNome(f)[0].toUpperCase() + mesNome(f).slice(1), prev: null, unit: 'day' };
  }
  const inRange = (r, loja = state.loja) => D.notes.filter(n => n.emissao >= r.from && n.emissao < r.to && (loja === 'all' || n.loja === loja));
  function metrics(list) {
    let fat = 0, notas = 0, canc = 0, cancV = 0, cont = 0;
    for (const n of list) {
      if (n.status === 'inutilizada') continue;
      notas++;
      if (n.status === 'cancelada') { canc++; cancV += n.valor; } else fat += n.valor;
      if (n.status === 'contingencia') cont++;
    }
    return { fat, notas, canc, cancV, cont, ticket: notas - canc ? fat / (notas - canc) : 0 };
  }
  const delta = (cur, prev) => {
    if (prev == null || !prev) return '';
    const d = (cur - prev) / prev * 100;
    const up = d >= 0;
    return `<span class="delta ${up ? 'up' : 'down'}">${up ? '↑' : '↓'} ${Math.abs(d).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>`;
  };

  /* ---------------- alertas ---------------- */
  function computeAlerts() {
    const out = [];
    D.stores.forEach(s => {
      if (storeStatus(s).key === 'off') {
        out.push({ id: `off-${s.id}`, sev: 'crit', icon: ic.wifi, loja: s.id,
          title: `${s.nome} sem enviar ${ago(s.ultimaColeta)}`,
          text: `O último envio do coletor foi às ${hm(s.ultimaColeta)}. Verifique se o computador do caixa está ligado e com internet. Nada se perde: as notas sobem quando ele voltar.`,
          acts: [['Ver loja', `#/lojas`]] });
      }
      if (s.versao && s.versao !== D.COLETOR_ATUAL) {
        out.push({ id: `ver-${s.id}-${s.versao}`, sev: 'info', icon: ic.info, loja: s.id,
          title: `Coletor desatualizado na ${s.nome}`,
          text: `Versão ${s.versao} instalada; a atual é ${D.COLETOR_ATUAL}. Baixe o instalador e rode no caixa para atualizar.`,
          acts: [['Baixar instalador', `install:${s.id}`]] });
      }
    });
    const cont = D.notes.filter(n => n.status === 'contingencia');
    const groups = {};
    cont.forEach(n => { const old = Date.now() - n.emissao > 24 * HOUR; const k = `${n.loja}|${old}`; (groups[k] = groups[k] || []).push(n); });
    Object.entries(groups).forEach(([k, list]) => {
      const [loja, old] = k.split('|'); const s = storeById(loja);
      out.push({ id: `cont-${k}-${list.length}`, sev: old === 'true' ? 'warn' : 'info', icon: ic.clock, loja,
        title: old === 'true' ? `${plural(list.length, 'nota', 'notas')} em contingência há mais de 24 h · ${s.nome}` : `${plural(list.length, 'nota', 'notas')} em contingência · ${s.nome}`,
        text: old === 'true' ? 'Emitidas offline e ainda sem autorização da SEFAZ. Confira o sistema do PDV para transmitir.' : `Aguardando autorização da SEFAZ (emitida ${ago(list[0].emissao)}). O Hunter atualiza sozinho quando a versão autorizada chegar.`,
        acts: [['Ver notas', `notas:contingencia:${loja}`]] });
    });
    const order = { crit: 0, warn: 1, info: 2 };
    return out.filter(a => !state.resolved.has(a.id)).sort((a, b) => order[a.sev] - order[b.sev]);
  }
  const alertHTML = a => `
    <div class="alert ${a.sev}">
      <span class="ico">${a.icon}</span>
      <div class="alert-body">
        <b>${esc(a.title)}</b><p>${esc(a.text)}</p>
        <div class="acts">
          ${a.acts.map(([l, h]) => `<button class="btn btn-line btn-sm" data-act="${h}">${l}</button>`).join('')}
          <button class="btn btn-ghost btn-sm" data-resolve="${a.id}">${ic.check}Resolvido</button>
        </div>
      </div>
    </div>`;

  /* ---------------- shell ---------------- */
  const ROUTES = {
    visao: { title: 'Visão geral', icon: ic.home, render: viewVisao },
    notas: { title: 'Notas fiscais', icon: ic.doc, render: viewNotas },
    lojas: { title: 'Lojas e coletores', icon: ic.store, render: viewLojas },
    downloads: { title: 'Downloads', icon: ic.zip, render: viewDownloads },
    alertas: { title: 'Alertas', icon: ic.bell, render: viewAlertas },
    acessos: { title: 'Equipe e contador', icon: ic.users, render: viewAcessos },
    loja: { title: 'Unidade', icon: ic.store, render: viewLoja }, // #/loja/<id>, fora do menu
    config: { title: 'Configurações', icon: ic.cog, render: viewConfig }, // #/config/<aba>
  };
  let current = null, routeParam = null;

  /* [nome completo (menu lateral), nome curto (barra do celular)] */
  const NAV_LABEL = {
    visao: ['Visão geral', 'Início'], notas: ['Notas fiscais', 'Notas'], lojas: ['Lojas', 'Lojas'],
    downloads: ['Downloads', 'ZIPs'], alertas: ['Alertas', 'Alertas'], acessos: ['Equipe e contador', 'Equipe'], config: ['Configurações', 'Ajustes'],
  };
  function renderMenu() {
    const n = computeAlerts().filter(a => a.sev !== 'info').length;
    const act = current === 'loja' ? 'lojas' : current;
    const link = id => `<a href="#/${id}" class="rail-btn ${act === id ? 'on' : ''}" aria-label="${ROUTES[id].title}"${act === id ? ' aria-current="page"' : ''}>${ROUTES[id].icon}<span class="lbl"><b>${NAV_LABEL[id][0]}</b><b class="s">${NAV_LABEL[id][1]}</b></span>${id === 'alertas' && n ? '<i class="badge"></i>' : ''}</a>`;
    $('#menu').innerHTML = ['visao', 'notas', 'lojas', 'downloads', 'alertas'].map(link).join('') + '<span class="sep"></span>' + link('acessos') + link('config');
    $('#bellDot').hidden = !n;
  }
  function renderUser() {
    const on = D.stores.filter(s => storeStatus(s).key === 'on').length;
    $('#meNome').textContent = session.nome;
    $('#meRede').textContent = `${session.rede || 'Minha rede'} · ${on}/${D.stores.length} online`;
    $('#meAvatar').textContent = initials(session.nome);
  }

  const periodSeg = () => `<div class="seg" role="group" aria-label="Período">${PERIODS.map(([k, l]) => `<button type="button" data-period="${k}" class="${state.period === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const storeSelect = () => `<select class="select" data-loja aria-label="Loja"><option value="all">Todas as lojas</option>${D.stores.map(s => `<option value="${s.id}" ${state.loja === s.id ? 'selected' : ''}>${esc(s.nome)}</option>`).join('')}</select>`;

  const unitSelect = cur => `<select class="select" data-unit aria-label="Ver unidade">${D.stores.map(s => `<option value="${s.id}" ${cur === s.id ? 'selected' : ''}>${esc(s.nome)}</option>`).join('')}</select>`;

  function route() {
    const m = location.hash.match(/^#\/(\w+)(?:\/([\w-]+))?/) || [];
    const id = m[1];
    routeParam = m[2] || null;
    current = ROUTES[id] ? id : 'visao';
    if (!ROUTES[id]) history.replaceState(null, '', '#/visao');
    if (current === 'loja' && !storeById(routeParam)) { history.replaceState(null, '', '#/lojas'); current = 'lojas'; }
    closeDrawer();
    stopFeed();
    tip.classList.remove('on');
    $('#pageTitle').textContent = ROUTES[current].title;
    document.title = `${ROUTES[current].title} · Hunter`;
    document.body.classList.remove('unit-mode');
    renderMenu();
    const v = $('#view');
    v.style.animation = 'none'; void v.offsetWidth; v.style.animation = '';
    ROUTES[current].render();
    window.scrollTo(0, 0);
    entrance();
  }

  /* ---------------- animação de entrada (anime.js) ----------------
     Só roda ao trocar de tela, nunca ao filtrar (rerender). Cada bloco
     aparece quando entra na área visível; os que chegam juntos entram
     em sequência. Sem a biblioteca ou com "reduzir movimento" ligado,
     nada fica escondido: vale o fade simples do CSS. */
  const A = window.anime;
  const motionSupported = !!(A && A.animate) && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motionOK = false;
  const applyMotion = () => { motionOK = motionSupported && cfg.perfil.motion; document.documentElement.classList.toggle('anim', motionOK); };
  const EASE = A && A.cubicBezier ? A.cubicBezier(.2, .7, .2, 1) : 'outQuart';
  applyMotion();
  const BLOCKS = '.kpis > .kpi, .dash-main > section:not(.kpis), #view > .unit-hero, .dash-side > section, .stores > *, .dl-grid > .card, #view > .filters, #view > .chips, #view > .note-box, #view > .card, .cfg-nav, .cfg-body > .card';
  const WIPE = ['inset(-20% 100% -10% -5%)', 'inset(-20% -5% -10% -5%)'];
  let io = null;

  function rise(el, delay, dist = 14) {
    el.style.opacity = '0';
    el.style.transition = 'none'; // o hover não pode brigar com a entrada
    A.animate(el, {
      opacity: [0, 1], translateY: [dist, 0], duration: 520, delay, ease: EASE,
      onComplete: () => { el.style.opacity = el.style.transform = el.style.transition = ''; },
    });
  }
  function reveal(el, i) {
    const delay = i * 55;
    rise(el, delay);
    // gráficos se desenham da esquerda para a direita
    $$('.lc, .spark, .area, .spk', el).forEach(c => {
      c.style.clipPath = WIPE[0];
      A.animate(c, { clipPath: WIPE, duration: 900, delay: delay + 150, ease: EASE, onComplete: () => { c.style.clipPath = ''; } });
    });
    // barras crescem
    $$('.hbar span i', el).forEach((c, k) => {
      c.style.transformOrigin = '0 50%';
      A.animate(c, { scaleX: [0, 1], duration: 700, delay: delay + 200 + k * 40, ease: EASE, onComplete: () => { c.style.transform = c.style.transformOrigin = ''; } });
    });
    // anéis preenchem
    $$('.ring .pr', el).forEach(c => {
      const [len, total] = (c.getAttribute('stroke-dasharray') || '').split(' ');
      if (!total) return;
      c.style.strokeDasharray = `0 ${total}`;
      A.animate(c, { strokeDasharray: [`0 ${total}`, `${len} ${total}`], duration: 800, delay: delay + 200, ease: EASE, onComplete: () => { c.style.strokeDasharray = ''; } });
    });
    // blocos de destaque sobem um a um
    $$('.tile', el).forEach((c, k) => rise(c, delay + 140 + k * 70, 18));
  }
  function entrance() {
    if (!motionOK) return;
    if (io) io.disconnect();
    const els = $$(BLOCKS, $('#view'));
    els.forEach(el => { el.style.opacity = '0'; });
    io = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting)
        .sort((a, z) => a.boundingClientRect.top - z.boundingClientRect.top || a.boundingClientRect.left - z.boundingClientRect.left)
        .forEach((e, i) => { io.unobserve(e.target); reveal(e.target, i); });
    });
    els.forEach(el => io.observe(el));
  }
  const rerender = () => { renderMenu(); ROUTES[current].render(); };

  /* ---------------- séries por período ---------------- */
  function buckets(r, loja = state.loja) {
    const list = inRange(r, loja);
    const out = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (r.unit === 'hour') {
      const nowH = new Date().getHours();
      for (let h = 10; h <= Math.max(10, Math.min(23, nowH)); h++) out.push({ key: h, label: `${h}h`, title: `${h}:00 – ${h}:59`, fat: 0, notas: 0, canc: 0, part: h === nowH });
      list.forEach(n => { const b = out[n.emissao.getHours() - 10]; if (b) add(b, n); });
    } else {
      const end = r.prev === null ? r.to : new Date(+today + DAY);
      const short = (end - r.from) / DAY <= 8;
      for (let d = new Date(r.from); d < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        const isToday = +d === +today;
        out.push({ key: d.toDateString(), label: short ? `${DIAS[d.getDay()]} ${d.getDate()}` : `${two(d.getDate())}/${two(d.getMonth() + 1)}`, title: `${DIAS[d.getDay()]}, ${two(d.getDate())}/${two(d.getMonth() + 1)}${isToday ? ' · parcial' : ''}`, fat: 0, notas: 0, canc: 0, part: isToday });
      }
      const idx = Object.fromEntries(out.map((b, i) => [b.key, i]));
      list.forEach(n => { const i = idx[n.emissao.toDateString()]; if (i != null) add(out[i], n); });
    }
    out.forEach(b => { b.ticket = b.notas - b.canc ? b.fat / (b.notas - b.canc) : 0; });
    return out;
    function add(b, n) {
      if (n.status === 'inutilizada') return;
      b.notas++;
      if (n.status === 'cancelada') b.canc++; else b.fat += n.valor;
    }
  }

  /* curva suave (Catmull-Rom → Bézier) */
  function smooth(pts) {
    if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  }

  /* mini-gráfico (sparkline): 1 série, sem eixos */
  function spark(vals, { w = 120, h = 38, color = 'var(--petrol)', area = false, id = 's' + Math.random().toString(36).slice(2, 7) } = {}) {
    if (vals.length < 2) vals = [0, ...vals, 0];
    const max = Math.max(...vals), min = Math.min(...vals), rng = max - min || 1;
    const pad = area ? 0 : 3;
    const pts = vals.map((v, i) => [i / (vals.length - 1) * w, pad + (h - pad * 2) * (1 - (v - min) / rng) * (area ? .78 : 1) + (area ? h * .14 : 0)]);
    const line = smooth(pts);
    const last = pts[pts.length - 1];
    return {
      svg: `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
        ${area ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FB8C2" stop-opacity=".5"/><stop offset="1" stop-color="#7FB8C2" stop-opacity="0"/></linearGradient></defs><path d="${line}L${w},${h}L0,${h}Z" fill="url(#${id})"/>` : ''}
        <path class="spark-line" d="${line}" stroke="${color}"/></svg>`,
      lastPct: [last[0] / w * 100, last[1] / h * 100],
    };
  }

  /* gráfico de linha principal com hover */
  let chartData = [];
  function niceMax(v) {
    if (v <= 0) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }
  let focusIdx = null;
  function drawChart() {
    const el = $('#chart');
    if (!el || !chartData.length) return;
    const W = el.clientWidth, H = el.clientHeight, L = 56, R = 12, T = 34, B = 26;
    const n = chartData.length, max = niceMax(Math.max(...chartData.map(d => d.fat)) * 1.08);
    const iw = W - L - R, ih = H - T - B, step = n > 1 ? iw / (n - 1) : 0;
    const X = i => L + (n > 1 ? i * step : iw / 2), Y = v => T + ih - ih * v / max;
    const pts = chartData.map((d, i) => [X(i), Y(d.fat)]);
    const lastPart = chartData[n - 1].part && n > 2;
    const solid = lastPart ? pts.slice(0, -1) : pts;
    const every = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 58))));
    let s = `<defs>
      <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#224347" stop-opacity=".16"/><stop offset="1" stop-color="#224347" stop-opacity="0"/></linearGradient>
      <linearGradient id="bandG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#224347" stop-opacity=".55"/><stop offset="1" stop-color="#224347" stop-opacity=".06"/></linearGradient></defs>`;
    for (let i = 0; i <= 4; i++) {
      const y = T + ih - ih * i / 4;
      s += `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="axis-t" x="${L - 10}" y="${y + 3.5}" text-anchor="end">${i ? moneyShort(max * i / 4) : 'R$ 0'}</text>`;
    }
    chartData.forEach((d, i) => { if (i % every === 0 || i === n - 1 && n - 1 - Math.floor((n - 1) / every) * every > every / 2) s += `<text class="axis-t" x="${X(i)}" y="${H - 6}" text-anchor="middle">${d.label}</text>`; });
    const line = smooth(solid);
    s += `<path d="${smooth(pts)}L${X(n - 1)},${T + ih}L${X(0)},${T + ih}Z" fill="url(#areaG)"/>`;
    s += `<path class="line" d="${line}"/>`;
    if (lastPart) s += `<path class="line part" d="M${pts[n - 2][0]},${pts[n - 2][1]}L${pts[n - 1][0]},${pts[n - 1][1]}"/>`;
    s += `<g id="focus"></g><rect id="hitArea" x="${L}" y="${T - 20}" width="${iw}" height="${ih + 20}" fill="transparent"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Faturamento ao longo do período">${s}</svg>`;

    // destaque: padrão no melhor ponto; segue o mouse
    const best = chartData.reduce((b, d, i) => d.fat > chartData[b].fat ? i : b, 0);
    const setFocus = (i, showTip) => {
      const d = chartData[i], x = X(i), y = Y(d.fat), bw = Math.max(8, Math.min(22, step * .6));
      const prev = i > 0 ? chartData[i - 1].fat : null;
      const label = i === best && !showTip ? 'Melhor ' + (chartData.length && chartData[0].key.length > 3 ? 'dia' : 'hora') : prev ? `${d.fat >= prev ? '↑' : '↓'} ${Math.abs((d.fat - prev) / (prev || 1) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%` : moneyShort(d.fat);
      const cw = label.length * 6.6 + 18, cx = Math.min(Math.max(x, L + cw / 2), W - R - cw / 2), cy = Math.max(2, y - 34);
      $('#focus', el).innerHTML = `<rect class="band" x="${x - bw / 2}" y="${y}" width="${bw}" height="${T + ih - y}" rx="3"/>
        <g class="chipbox"><rect x="${cx - cw / 2}" y="${cy}" width="${cw}" height="22" rx="6"/><path d="M${x - 5},${cy + 22}L${x},${cy + 27}L${x + 5},${cy + 22}Z" fill="var(--ink)"/><text x="${cx}" y="${cy + 15}" text-anchor="middle">${label}</text></g>
        <circle class="pt" cx="${x}" cy="${y}" r="5"/>`;
      if (showTip) {
        const r = el.getBoundingClientRect();
        tip.innerHTML = `<small>${d.title}</small><b>${money(d.fat)}</b><small>${plural(d.notas, 'nota', 'notas')} · ticket ${money(d.ticket)}</small>`;
        tip.style.left = `${r.left + x}px`; tip.style.top = `${r.top + cy - 4}px`; tip.classList.add('on');
      }
    };
    setFocus(focusIdx ?? best, false);
    const hit = $('#hitArea', el);
    hit.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - r.left - L) / (step || 1))));
      setFocus(i, true);
    });
    hit.addEventListener('mouseleave', () => { tip.classList.remove('on'); setFocus(best, false); });
  }
  const tip = $('#tip');

  /* ---------------- feed ao vivo ---------------- */
  let feedTimer = null, feedLoja = 'all';
  const feedItem = (n, isNew) => {
    const s = storeById(n.loja);
    return `<div class="feed-item${isNew ? ' new' : ''}"><img src="../assets/hunter.svg" alt=""><div class="t"><b>${n.tipo} ${int.format(n.numero)}</b><small>${esc(s.nome)} · ${n.status === 'cancelada' ? 'cancelamento' : 'XML caçado'} · ${ago(n.coletado)}</small></div><span class="v num">${n.valor ? money(n.valor) : '—'}</span></div>`;
  };
  function startFeed() {
    stopFeed();
    feedTimer = setInterval(() => {
      const feed = $('#feed'); if (!feed) return stopFeed();
      const online = D.stores.filter(s => storeStatus(s).key === 'on' && (feedLoja === 'all' || s.id === feedLoja));
      if (!online.length) return;
      const s = online[Math.floor(Math.random() * online.length)];
      const last = D.notes.find(n => n.loja === s.id && n.tipo === 'NFC-e');
      const fake = { tipo: 'NFC-e', numero: (last ? last.numero : 1000) + 1 + Math.floor(Math.random() * 3), loja: s.id, valor: Math.round((25 + Math.random() * 180) * 100) / 100, status: 'autorizada', coletado: new Date() };
      feed.insertAdjacentHTML('afterbegin', feedItem(fake, true));
      feed.lastElementChild.remove();
    }, 8000);
  }
  function stopFeed() { clearInterval(feedTimer); feedTimer = null; }

  /* ================= VIEWS ================= */

  function ring(pct, cls = '') {
    const r = 21, c = 2 * Math.PI * r;
    return `<div class="ring"><svg viewBox="0 0 52 52"><circle class="tr" cx="26" cy="26" r="${r}"/><circle class="pr ${cls}" cx="26" cy="26" r="${r}" stroke-dasharray="${(c * pct / 100).toFixed(1)} ${c.toFixed(1)}"/></svg><span>${Math.round(pct)}%</span></div>`;
  }
  const dTxt = (cur, prev, invert = false) => {
    if (prev == null || !prev) return '<span class="d flat">—</span>';
    const d = (cur - prev) / prev * 100, up = d >= 0, good = invert ? !up : up;
    return `<span class="d ${good ? 'up' : 'down'}">${up ? '↑' : '↓'} ${Math.abs(d).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>`;
  };

  /* faturamento mês a mês de uma unidade: meses com notas viram totais reais, os anteriores vêm do histórico */
  function monthlyRows(id) {
    const nowD = new Date(), nowKey = nowD.getFullYear() * 12 + nowD.getMonth(), by = {};
    D.notes.filter(n => n.loja === id).forEach(n => { const k = n.emissao.getFullYear() * 12 + n.emissao.getMonth(); (by[k] = by[k] || []).push(n); });
    const rows = Object.keys(by).map(Number).map(k => { const m = metrics(by[k]); return { k, fat: m.fat, notas: m.notas, canc: m.canc }; });
    (D.history[id] || []).forEach(h => { if (!by[h.k]) rows.push({ ...h }); });
    return rows.sort((a, z) => z.k - a.k).map(x => ({ ...x, d: new Date(Math.floor(x.k / 12), x.k % 12, 1), part: x.k === nowKey }));
  }
  function viewVisao() { renderDash(null); }
  function viewLoja() {
    const S = storeById(routeParam);
    if (!S) { location.hash = '#/lojas'; return; }
    renderDash(S);
  }
  /* S = unidade (tela #/loja/<id>) ou null (visão geral, com o filtro de loja opcional) */
  function renderDash(S) {
    const r = range(state.period);
    const L = S ? S.id : state.loja;
    document.body.classList.toggle('unit-mode', !!S);
    if (S) {
      $('#pageTitle').textContent = S.nome; document.title = `${S.nome} · Hunter`;
      $('#pageSub').textContent = `${r.label} · CNPJ ${cnpj(S.cnpj)}${S.cidade ? ' · ' + S.cidade : ''}`;
      $('#tools').innerHTML = periodSeg() + unitSelect(S.id) + `<a class="btn btn-line" href="#/lojas">← Lojas</a><button class="btn btn-ink" data-act="editstore:${S.id}">${ic.edit}Editar</button>`;
    } else {
      $('#pageTitle').textContent = ROUTES.visao.title; document.title = `${ROUTES.visao.title} · Hunter`;
      $('#pageSub').textContent = `${r.label} · ${state.loja !== 'all' && storeById(state.loja) ? storeById(state.loja).nome : 'todas as lojas'}`;
      $('#tools').innerHTML = periodSeg() + storeSelect();
    }
    const list = inRange(r, L);
    const cur = metrics(list), prev = r.prev ? metrics(inRange(r.prev, L)) : null;
    const b = buckets(r, L);
    const on = D.stores.filter(s => storeStatus(s).key === 'on').length;
    const alerts = computeAlerts().filter(a => !S || a.loja === S.id);

    const hero = spark(b.map(x => x.fat), { w: 300, h: 96, color: '#CFE6EA', area: true });
    const heroDelta = prev ? (cur.fat - prev.fat) / prev.fat * 100 : null;

    // ranking por loja
    const per = D.stores.map(s => ({ s, m: metrics(inRange(r, s.id)) })).sort((a, z) => z.m.fat - a.m.fat);
    const total = per.reduce((a, p) => a + p.m.fat, 0) || 1, top = per[0].m.fat || 1;

    // destaques
    const byHour = {};
    list.forEach(n => { if (n.status === 'autorizada' || n.status === 'contingencia') byHour[n.emissao.getHours()] = (byHour[n.emissao.getHours()] || 0) + 1; });
    const peakH = Object.entries(byHour).sort((a, z) => z[1] - a[1])[0];
    const maior = list.filter(n => n.status !== 'cancelada').reduce((m, n) => !m || n.valor > m.valor ? n : m, null);
    const topS = per[0];

    // status
    const valid = list.filter(n => n.status !== 'inutilizada');
    const autor = valid.length ? valid.filter(n => n.status === 'autorizada').length / valid.length * 100 : 100;
    const lastCol = (S ? [S] : D.stores).filter(s => s.ultimaColeta).reduce((m, s) => s.ultimaColeta > m ? s.ultimaColeta : m, new Date(0));
    const recent = D.notes.filter(n => n.status !== 'inutilizada' && (!S || n.loja === S.id)).sort((a, z) => z.coletado - a.coletado).slice(0, 6);
    const coletas = buckets(range('hoje'), L).map(x => x.notas);
    const stSt = S && storeStatus(S);
    const uhero = S ? `<section class="unit-hero">
        <span class="uh-mono" aria-hidden="true">${esc(initials(S.nome.replace(/^Loja\s+/i, '')))}</span>
        <div class="uh-main"><span class="mono">Unidade</span><h2>${esc(S.nome)}</h2>
          <div class="uh-meta">
            <span><small>CNPJ</small>${cnpj(S.cnpj)}</span>
            ${S.cidade ? `<span><small>Cidade</small>${esc(S.cidade)}</span>` : ''}
            <span><small>${pastasOf(S).length > 1 ? 'Pastas dos XMLs' : 'Pasta dos XMLs'}</small><code>${pastasOf(S).map(esc).join('<br>')}</code></span>
            <span><small>Coletor</small>${S.versao ? 'v' + S.versao : '—'}</span>
          </div></div>
        <div class="uh-side">${stSt.html}<small>${S.ultimaColeta ? 'Última coleta ' + ago(S.ultimaColeta) : 'Ainda sem coletas'}</small></div>
      </section>` : '';
    const ufat = S ? `<div class="card kpi"><span class="mono">Faturamento</span><b class="num">${moneyShort(cur.fat)}</b>
              <div class="row"><div class="spark">${spark(b.map(x => x.fat), { color: '#2F7D5F' }).svg}</div>${dTxt(cur.fat, prev && prev.fat)}</div></div>` : '';
    // movimento por mês (só na tela da unidade)
    let mensal = '';
    if (S) {
      const rows = monthlyRows(S.id), topM = Math.max(1, ...rows.map(x => x.fat));
      mensal = `<section class="card mensal">
            <div class="card-h"><div><h2>Movimento por mês</h2><p>Faturamento sem notas canceladas</p></div>
              <div class="tools"><button class="btn btn-ink btn-sm" data-act="csvmeses:${S.id}">${ic.dl}Baixar CSV</button></div></div>
            <div class="tbl-wrap"><table class="mtbl">
              <thead><tr><th>Mês</th><th class="r">Notas</th><th class="r">Cancel.</th><th>Faturamento</th></tr></thead>
              <tbody>${rows.map(x => '<tr><td><b>' + MESES[x.d.getMonth()][0].toUpperCase() + MESES[x.d.getMonth()].slice(1) + '</b> <span class="muted">' + x.d.getFullYear() + '</span>' + (x.part ? ' <span class="tag">parcial</span>' : '') + '</td>'
                + '<td class="r num">' + int.format(x.notas) + '</td>'
                + '<td class="r">' + (x.canc ? '<span class="cbadge">' + x.canc + '</span>' : '<span class="num">0</span>') + '</td>'
                + '<td><div class="hbar mfat"><span><i style="width:' + (x.fat / topM * 100).toFixed(1) + '%"></i></span><b class="num">' + money(x.fat) + '</b></div></td></tr>').join('')}</tbody>
            </table></div>
          </section>`;
    }
    const ultimas = S ? D.notes.filter(n => n.loja === S.id).sort((a, z) => z.emissao - a.emissao).slice(0, 7) : [];

    $('#view').innerHTML = `
      ${uhero}
      <div class="dash">
        <div class="dash-main">
          <section class="kpis${S ? ' ukpis' : ''}">
            ${S ? ufat : `<div class="card kpi hero">
              <span class="mono">Faturamento</span>
              <b class="num">${moneyShort(cur.fat).replace('R$ ', 'R$ ')}</b>
              <span class="sub num">${money(cur.fat)}</span>
              <div class="area">${hero.svg}${heroDelta != null ? `<span class="chip-d" style="left:${Math.min(88, hero.lastPct[0])}%;top:${hero.lastPct[1]}%">${heroDelta >= 0 ? '↑' : '↓'} ${Math.abs(heroDelta).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>` : ''}</div>
            </div>`}
            <div class="card kpi"><span class="mono">Notas emitidas</span><b class="num">${int.format(cur.notas)}</b>
              <div class="row"><div class="spark">${spark(b.map(x => x.notas), { color: '#3F6B85' }).svg}</div>${dTxt(cur.notas, prev && prev.notas)}</div></div>
            <div class="card kpi"><span class="mono">Ticket médio</span><b class="num">${money(cur.ticket)}</b>
              <div class="row"><div class="spark">${spark(b.map(x => x.ticket), { color: '#224347' }).svg}</div>${dTxt(cur.ticket, prev && prev.ticket)}</div></div>
            <div class="card kpi"><span class="mono">Cancelamentos</span><b class="num">${int.format(cur.canc)}</b>
              <div class="row"><div class="spark">${spark(b.map(x => x.canc), { color: '#B5432F' }).svg}</div>${dTxt(cur.canc, prev && prev.canc, true)}</div></div>
          </section>

          <section class="card">
            <div class="card-h"><div><h2>Faturamento ${r.unit === 'hour' ? 'por hora' : 'por dia'}</h2><p>Notas autorizadas e em contingência · cancelamentos ficam de fora${b.some(x => x.part) ? ' · tracejado = parcial' : ''}</p></div>
              <div class="tools"><button class="btn btn-ink btn-sm" data-act="csvdias">${ic.dl}Baixar CSV</button></div></div>
            <div class="lc" id="chart"></div>
          </section>
          ${mensal}

          <section class="card hl">
            <div class="hl-intro"><h2>Destaques</h2><p>O que mais chamou atenção em <b>${r.label.toLowerCase()}</b>.</p></div>
            ${S ? `<div class="tile"><span class="ti">${ic.shield}</span><h3>${S.ultimaColeta ? ago(S.ultimaColeta) : 'nunca'}</h3><small>Última coleta</small><div class="tv num">${S.versao ? 'v' + S.versao : '—'} <em>/ coletor</em></div></div>`
            : `<div class="tile"><span class="ti">${ic.store}</span><h3>${esc(topS.s.nome.replace('Loja ', ''))}</h3><small>Loja que mais faturou</small><div class="tv num">${moneyShort(topS.m.fat)} <em>/ ${Math.round(topS.m.fat / total * 100)}%</em></div></div>`}
            <div class="tile"><span class="ti">${ic.clock}</span><h3>${peakH ? `${peakH[0]}h – ${+peakH[0] + 1}h` : '—'}</h3><small>Horário de pico</small><div class="tv num">${peakH ? int.format(peakH[1]) : 0} <em>/ notas</em></div></div>
            <div class="tile"><span class="ti">${ic.doc}</span><h3>${maior ? `${maior.tipo} ${int.format(maior.numero)}` : '—'}</h3><small>${maior ? esc(storeById(maior.loja).nome) : 'Maior venda'}</small><div class="tv num">${maior ? moneyShort(maior.valor) : '—'} <em>/ maior venda</em></div></div>
          </section>

          ${S ? `<section class="card">
            <div class="card-h"><div><h2>Últimas notas</h2><p>As mais recentes desta loja · clique para ver o detalhe</p></div><button class="btn btn-ghost btn-sm" data-act="notas:all:${S.id}">Ver todas</button></div>
            ${ultimas.length ? `<div class="tbl-wrap"><table>
              <thead><tr><th>Emissão</th><th>Tipo</th><th class="r">Número</th><th class="r">Valor</th><th>Status</th></tr></thead>
              <tbody>${ultimas.map(n => '<tr class="click" data-nota="' + n.id + '"><td class="num">' + dt(n.emissao) + '</td><td><span class="tag">' + n.tipo + '</span></td><td class="r num">' + int.format(n.numero) + '</td><td class="r num">' + (n.valor ? money(n.valor) : '—') + '</td><td>' + statusPill(n.status) + '</td></tr>').join('')}</tbody>
            </table></div>` : `<div class="empty">${ic.search}<b>Nenhuma nota ainda</b>Assim que o coletor enviar, elas aparecem aqui.</div>`}
          </section>` : `<section class="card">
            <div class="card-h"><div><h2>Lojas</h2><p>Faturamento e situação do coletor · clique para ver as notas</p></div><a class="btn btn-ghost btn-sm" href="#/lojas">Gerenciar</a></div>
            <div class="tbl-wrap"><table>
              <thead><tr><th>Loja</th><th>Faturamento</th><th class="r">Part.</th><th class="r">Notas</th><th class="r">Canc.</th><th>Status</th><th>Última coleta</th></tr></thead>
              <tbody>${per.map(({ s, m }) => `
                <tr class="click" data-goloja="${s.id}">
                  <td class="store-cell"><b>${esc(s.nome)}</b><small>${cnpj(s.cnpj)}</small></td>
                  <td><div class="hbar"><span><i style="width:${(m.fat / top * 100).toFixed(1)}%"></i></span><b class="num">${moneyShort(m.fat)}</b></div></td>
                  <td class="r num muted">${Math.round(m.fat / total * 100)}%</td>
                  <td class="r num">${int.format(m.notas)}</td>
                  <td class="r num">${m.canc}</td>
                  <td>${storeStatus(s).html}</td>
                  <td class="muted">${ago(s.ultimaColeta)}</td>
                </tr>`).join('')}</tbody>
            </table></div>
          </section>`}
        </div>

        <aside class="dash-side">
          <section class="card">
            <div class="card-h"><h2>Status ${S ? 'da loja' : 'da rede'}</h2></div>
            ${S ? `<div class="stat"><div class="st"><b>Coletor</b><small>${stSt.key === 'on' ? 'Enviando normalmente' : stSt.key === 'nova' ? 'Aguardando instalação' : 'Sem enviar ' + ago(S.ultimaColeta)}</small></div>${stSt.html}</div>`
            : `<div class="stat">${ring(on / D.stores.length * 100, on < D.stores.length ? 'warn' : '')}<div class="st"><b>Lojas online</b><small>Coleta a cada 2 horas</small></div><span class="big num">${on}/${D.stores.length}</span></div>`}
            <div class="stat">${ring(autor)}<div class="st"><b>Notas autorizadas</b><small>${int.format(valid.length)} no período</small></div><span class="big num">${Math.round(autor)}%</span></div>
            <div class="stat"><div class="spk">${spark(coletas, { w: 70, h: 34, color: '#2F7D5F' }).svg}</div><div class="st"><b>Última coleta</b><small>${int.format(coletas.reduce((a, x) => a + x, 0))} XMLs hoje</small></div><span class="big num" style="font-size:16px">${lastCol.getTime() ? ago(lastCol) : '—'}</span></div>
          </section>

          <section class="card">
            <div class="card-h"><div><h2>Alertas</h2><p>${alerts.length ? plural(alerts.length, 'item pede', 'itens pedem') + ' atenção' : 'Tudo em ordem'}</p></div><a class="btn btn-ghost btn-sm" href="#/alertas">Ver todos</a></div>
            <div class="alerts">${alerts.length ? alerts.slice(0, 2).map(alertHTML).join('') : `<div class="empty">${ic.checkc}<b>Nenhum alerta</b>${S ? 'Esta loja está enviando normalmente.' : 'Todas as lojas enviando normalmente.'}</div>`}</div>
          </section>

          <section class="card">
            <div class="card-h"><div><h2>XMLs caçados</h2><p>Últimos recebidos</p></div><span class="pill good">${ic.checkc}Ao vivo</span></div>
            <div class="feed" id="feed">${recent.map(n => feedItem(n)).join('')}</div>
          </section>
        </aside>
      </div>`;

    chartData = b; focusIdx = null;
    drawChart();
    feedLoja = L;
    startFeed();
  }

  function filteredNotas() {
    const r = range(state.period), f = state.notas, q = f.q.trim().toLowerCase().replace(/\D/g, '') || f.q.trim().toLowerCase();
    const base = inRange(r);
    const byQ = !f.q.trim() ? base : base.filter(n => String(n.numero).includes(q) || n.chave.includes(q) || storeById(n.loja).nome.toLowerCase().includes(f.q.trim().toLowerCase()));
    const byTipo = f.tipo === 'all' ? byQ : byQ.filter(n => n.tipo === f.tipo);
    const counts = { all: byTipo.length };
    Object.keys(STATUS).forEach(k => { counts[k] = byTipo.filter(n => n.status === k).length; });
    const list = f.status === 'all' ? byTipo : byTipo.filter(n => n.status === f.status);
    return { r, list, counts };
  }

  function viewNotas() {
    const { r, list, counts } = filteredNotas(), f = state.notas;
    $('#pageSub').textContent = `${r.label}${state.loja !== 'all' ? ' · ' + storeById(state.loja).nome : ' · todas as lojas'}`;
    $('#tools').innerHTML = periodSeg() + storeSelect();
    const per = 25, pages = Math.max(1, Math.ceil(list.length / per));
    f.page = Math.min(f.page, pages);
    const slice = list.slice((f.page - 1) * per, f.page * per);
    const m = metrics(list);
    const chips = [['all', 'Todas'], ['autorizada', 'Autorizadas'], ['cancelada', 'Canceladas'], ['contingencia', 'Contingência'], ['inutilizada', 'Inutilizadas']];

    $('#view').innerHTML = `
      <div class="filters">
        <label class="search-wrap">${ic.search}<input class="search" id="q" type="search" placeholder="Buscar por número, chave ou loja" value="${esc(f.q)}" autocomplete="off"></label>
        <select class="select" id="tipo" aria-label="Tipo"><option value="all">NFC-e e NF-e</option><option value="NFC-e" ${f.tipo === 'NFC-e' ? 'selected' : ''}>Só NFC-e</option><option value="NF-e" ${f.tipo === 'NF-e' ? 'selected' : ''}>Só NF-e</option></select>
        <button class="btn btn-line" id="csv" style="margin-left:auto">${ic.csv}Exportar CSV</button>
      </div>
      <div class="chips" style="margin-bottom:16px">${chips.map(([k, l]) => `<button class="chip ${f.status === k ? 'on' : ''}" data-status="${k}">${l} <em>${int.format(counts[k])}</em></button>`).join('')}</div>
      <div class="card">
        <div class="summary">
          <div><span class="mono">Notas</span><b class="num">${int.format(list.length)}</b></div>
          <div><span class="mono">Valor</span><b class="num">${money(m.fat)}</b></div>
          <div><span class="mono">Canceladas</span><b class="num">${int.format(m.canc)}</b></div>
        </div>
        ${slice.length ? `<div class="tbl-wrap"><table>
          <thead><tr><th>Emissão</th><th>Tipo</th><th class="r">Número</th><th>Loja</th><th class="r">Valor</th><th>Status</th><th>Chave de acesso</th></tr></thead>
          <tbody>${slice.map(n => `
            <tr class="click" data-nota="${n.id}">
              <td class="num">${dt(n.emissao)}</td>
              <td><span class="tag">${n.tipo}</span></td>
              <td class="r num">${int.format(n.numero)}</td>
              <td>${esc(storeById(n.loja).nome)}</td>
              <td class="r num">${n.valor ? money(n.valor) : '—'}</td>
              <td>${statusPill(n.status)}</td>
              <td class="chave">${n.chave.slice(0, 8)}…${n.chave.slice(-6)}</td>
            </tr>`).join('')}</tbody>
        </table></div>
        <div class="pager"><span>Mostrando ${int.format((f.page - 1) * per + 1)}–${int.format((f.page - 1) * per + slice.length)} de ${int.format(list.length)}</span>
          <div><button class="btn btn-line btn-sm" data-page="${f.page - 1}" ${f.page <= 1 ? 'disabled' : ''}>Anterior</button><button class="btn btn-line btn-sm" data-page="${f.page + 1}" ${f.page >= pages ? 'disabled' : ''}>Próxima</button></div></div>`
        : `<div class="empty">${ic.search}<b>Nenhuma nota encontrada</b>Ajuste a busca ou os filtros.</div>`}
      </div>`;

    const qi = $('#q');
    let t; qi.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { f.q = qi.value; f.page = 1; const pos = qi.selectionStart; viewNotas(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); }, 220); });
    $('#tipo').addEventListener('change', e => { f.tipo = e.target.value; f.page = 1; viewNotas(); });
    $('#csv').addEventListener('click', () => {
      const rows = [['emissao', 'tipo', 'serie', 'numero', 'loja', 'cnpj', 'valor', 'status', 'chave']].concat(list.map(n => {
        const s = storeById(n.loja);
        return [n.emissao.toISOString(), n.tipo, n.serie, n.numero, s.nome, cnpj(s.cnpj), n.valor.toFixed(2).replace('.', ','), STATUS[n.status].label, n.chave];
      }));
      download(`hunter-notas-${state.period}.csv`, '\ufeff' + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv');
      toast(`${plural(list.length, 'nota exportada', 'notas exportadas')} para CSV`);
    });
  }

  function viewLojas() {
    $('#pageSub').textContent = `${D.stores.length} lojas · coletor atual ${D.COLETOR_ATUAL}`;
    $('#tools').innerHTML = `<button class="btn btn-ink" data-act="addstore">${ic.plus}Adicionar loja</button>`;
    const r = range('hoje');
    $('#view').innerHTML = `<section class="grid stores">
      ${D.stores.map(s => {
        const m = metrics(inRange(r, s.id)), st = storeStatus(s);
        return `<article class="card store clickable" data-openstore="${s.id}" title="Clique para ver o painel desta loja" tabindex="0" role="link">
          <div class="store-h"><div><h3>${esc(s.nome)}</h3><small>${cnpj(s.cnpj)}${s.cidade ? ' · ' + esc(s.cidade) : ''}</small></div>${st.html}</div>
          <div class="kv">
            <div><span>Hoje</span><b class="num">${money(m.fat)}</b></div>
            <div><span>Notas hoje</span><b class="num">${int.format(m.notas)}</b></div>
            <div><span>Última coleta</span><b>${s.ultimaColeta ? ago(s.ultimaColeta) : 'nunca'}</b></div>
            <div><span>Coletor</span><b>${s.versao ? `v${s.versao}${s.versao !== D.COLETOR_ATUAL ? ' · desatualizado' : ''}` : '—'}</b></div>
            <div style="grid-column:span 2"><span>${pastasOf(s).length > 1 ? 'Pastas dos XMLs' : 'Pasta dos XMLs'}</span><b class="chave paths">${pastasOf(s).map(esc).join('<br>')}</b></div>
          </div>
          <div class="store-acts">
            <button class="btn btn-ink btn-sm" data-act="editstore:${s.id}">${ic.edit}Editar</button>
            <button class="btn btn-line btn-sm" data-act="notas:all:${s.id}">${ic.doc}Notas</button>
            <button class="btn btn-line btn-sm" data-act="install:${s.id}" title="Baixar instalador do coletor">${ic.dl}Instalador</button>
            <button class="btn btn-ghost btn-sm" data-act="rekey:${s.id}" title="Trocar chave de acesso" aria-label="Trocar chave de acesso">${ic.key}</button>
          </div>
        </article>`;
      }).join('')}
      <button class="card store add" data-act="addstore"><span class="plus">${ic.plus}</span><b>Adicionar loja</b><span class="muted">Gere o instalador e coloque o coletor no caixa</span></button>
    </section>`;
  }

  const dl = { mes: 1, lojas: null, canc: cfg.coleta.zipCanc, inut: cfg.coleta.zipInut, cont: cfg.coleta.zipCont };
  function viewDownloads() {
    const now = new Date();
    const months = [0, 1].map(k => new Date(now.getFullYear(), now.getMonth() - k, 1));
    if (!dl.lojas) dl.lojas = new Set(D.stores.map(s => s.id));
    const m = months[dl.mes], to = dl.mes === 0 ? now : new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const list = D.notes.filter(n => n.emissao >= m && n.emissao < to && dl.lojas.has(n.loja) &&
      (n.status !== 'cancelada' || dl.canc) && (n.status !== 'inutilizada' || dl.inut) && (n.status !== 'contingencia' || dl.cont));
    const per = D.stores.filter(s => dl.lojas.has(s.id)).map(s => ({ s, n: list.filter(x => x.loja === s.id).length }));
    const size = list.length * 3.1 / 1024;
    const ym = `${m.getFullYear()}-${two(m.getMonth() + 1)}`;

    $('#pageSub').textContent = 'ZIP do mês separado por loja e CNPJ';
    $('#tools').innerHTML = '';
    $('#view').innerHTML = `
      <section class="grid dl-grid">
        <div class="card">
          <div class="card-h"><div><h2>Gerar ZIP</h2><p>Escolha o mês e as lojas</p></div></div>
          <div class="field"><span>Mês</span>
            <div class="seg">${months.map((d, i) => `<button type="button" data-dlmes="${i}" class="${dl.mes === i ? 'on' : ''}">${i === 1 ? 'Mês anterior' : 'Mês atual (parcial)'}</button>`).join('')}</div>
            <small class="muted">${mesNome(m)[0].toUpperCase() + mesNome(m).slice(1)}</small>
          </div>
          <div class="field"><span>Lojas</span>
            <div class="checks">${D.stores.map(s => `<label class="cb"><input type="checkbox" data-dlloja="${s.id}" ${dl.lojas.has(s.id) ? 'checked' : ''}>${esc(s.nome)}</label>`).join('')}</div>
          </div>
          <div class="field"><span>Incluir</span>
            <div class="checks">
              <label class="cb"><input type="checkbox" data-dlopt="canc" ${dl.canc ? 'checked' : ''}>Cancelamentos</label>
              <label class="cb"><input type="checkbox" data-dlopt="inut" ${dl.inut ? 'checked' : ''}>Inutilizações</label>
              <label class="cb"><input type="checkbox" data-dlopt="cont" ${dl.cont ? 'checked' : ''}>Notas em contingência</label>
            </div>
          </div>
          <div class="zip-prev">
            <b>hunter-xmls-${ym}.zip</b> <span class="c">· ${int.format(list.length)} arquivos · ~${size.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB</span><br>
            ${per.length ? per.map(({ s, n }) => `▸ ${esc(s.nome.replace('Loja ', ''))}_${s.cnpj}/ <span class="c">${int.format(n)} XMLs</span>`).join('<br>') : '<span class="c">Nenhuma loja selecionada</span>'}
          </div>
          <button class="btn btn-ink" id="gen" style="width:100%;height:46px" ${list.length ? '' : 'disabled'}>${ic.zip}Gerar e baixar ZIP</button>
          <div class="progress" id="prog"><i></i></div>
        </div>
        <div class="card">
          <div class="card-h"><div><h2>Histórico</h2><p>ZIPs gerados por você e pelo contador</p></div></div>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Mês</th><th class="r">Arquivos</th><th class="r">Tamanho</th><th>Gerado por</th><th>Quando</th><th></th></tr></thead>
            <tbody>${D.downloads.map(h => `<tr>
              <td>${mesNome(h.mes)}</td><td class="r num">${int.format(h.arquivos)}</td><td class="r num">${h.tamanho.toLocaleString('pt-BR')} MB</td>
              <td>${esc(h.por)}</td><td class="muted">${dt(h.em)}</td>
              <td class="r"><button class="btn btn-ghost btn-sm" data-act="dlzip:${h.id}">${ic.dl}Baixar</button></td></tr>`).join('')}</tbody>
          </table></div>
        </div>
      </section>`;

    $('#gen').addEventListener('click', () => {
      const btn = $('#gen'), prog = $('#prog'), bar = prog.firstElementChild;
      btn.disabled = true; btn.lastChild.textContent = 'Gerando ZIP…'; prog.classList.add('on');
      let p = 0;
      const t = setInterval(() => {
        p = Math.min(100, p + 7 + Math.random() * 14); bar.style.width = p + '%';
        if (p >= 100) {
          clearInterval(t);
          D.downloads.unshift({ id: Date.now(), mes: m, lojas: [...dl.lojas], arquivos: list.length, tamanho: Math.round(size * 10) / 10, por: session.nome, em: new Date() });
          toast(`ZIP de ${mesNome(m)} pronto · ${int.format(list.length)} arquivos (demo: o arquivo real virá do servidor)`);
          viewDownloads();
        }
      }, 120);
    });
  }

  function viewAlertas() {
    const alerts = computeAlerts();
    $('#pageSub').textContent = alerts.length ? `${plural(alerts.length, 'alerta aberto', 'alertas abertos')}` : 'Nenhum alerta aberto';
    $('#tools').innerHTML = state.resolved.size ? `<button class="btn btn-ghost" data-act="reopen">Reabrir resolvidos (${state.resolved.size})</button>` : '';
    $('#view').innerHTML = `<div class="card" style="max-width:860px">
      <div class="alerts">${alerts.length ? alerts.map(alertHTML).join('') : `<div class="empty">${ic.checkc}<b>Nenhum alerta</b>Todas as lojas enviando e nenhuma nota pendente.</div>`}</div>
    </div>`;
  }

  const PAPEIS = {
    Administrador: { cls: 'info', icon: ic.shield, desc: 'Vê e gerencia tudo' },
    Gerente: { cls: 'neutral', icon: ic.store, desc: 'Vê só as lojas permitidas' },
    Contador: { cls: 'good', icon: ic.doc, desc: 'Somente leitura e download' },
  };
  function viewAcessos() {
    $('#pageSub').textContent = `${plural(D.users.length, 'pessoa', 'pessoas')} com acesso`;
    $('#tools').innerHTML = `<button class="btn btn-ink" data-act="invite">${ic.plus}Convidar</button>`;
    const lojasTxt = u => u.lojas === 'todas' ? 'Todas as lojas' : u.lojas.map(id => storeById(id)?.nome.replace('Loja ', '')).join(', ');
    $('#view').innerHTML = `
      <div class="note-box">${ic.shield}<div><b style="color:var(--ink)">Seu contador entra com login próprio.</b> Ele só consegue ver e baixar os XMLs das lojas que você liberar, sem alterar nada.</div></div>
      <div class="card">
        <div class="tbl-wrap"><table>
          <thead><tr><th>Pessoa</th><th>Papel</th><th>Lojas</th><th>Último acesso</th><th></th></tr></thead>
          <tbody>${D.users.map(u => `<tr>
            <td><div class="user-cell"><span class="avatar">${initials(u.nome)}</span><div><b>${esc(u.nome)}${u.email === session.email ? ' <span class="muted">(você)</span>' : ''}</b><small>${esc(u.email)}</small></div></div></td>
            <td>${pill(PAPEIS[u.papel].cls, PAPEIS[u.papel].icon, u.papel === 'Contador' ? 'Contador · leitura' : u.papel)}</td>
            <td>${lojasTxt(u)}</td>
            <td class="muted">${u.ultimoAcesso ? ago(u.ultimoAcesso) : 'Convite enviado'}</td>
            <td class="r">${u.papel !== 'Administrador' ? `<button class="btn btn-danger btn-sm" data-act="rmuser:${u.id}">${ic.trash}Remover</button>` : ''}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  }

  /* ================= CONFIGURAÇÕES ================= */
  const CFG_TABS = [
    ['perfil', 'Perfil', ic.users, 'Seus dados e preferências'],
    ['rede', 'Rede e empresa', ic.store, 'Dados da sua rede'],
    ['notificacoes', 'Notificações', ic.bell, 'Avisos por e-mail'],
    ['coleta', 'Coleta e arquivos', ic.zip, 'Coletor, guarda e ZIP'],
    ['seguranca', 'Segurança', ic.shield, 'Senha e acessos'],
  ];
  let sessoes = [
    { id: 1, nome: 'Este navegador', det: 'Chrome · Windows', local: 'São Paulo, SP', quando: 'agora', atual: true },
    { id: 2, nome: 'iPhone', det: 'Safari · iOS', local: 'São Paulo, SP', quando: 'há 2 dias' },
    { id: 3, nome: 'Computador do escritório', det: 'Edge · Windows', local: 'Campinas, SP', quando: 'há 9 dias' },
  ];
  const sw = (name, on, title, sub) => `<label class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i><span><b>${title}</b><small>${sub}</small></span></label>`;
  const opts = (list, cur) => list.map(([v, l]) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${l}</option>`).join('');
  const cfgCard = (sec, title, sub, body, btn = 'Salvar alterações') => `<form class="card cfg-card" data-cfgform="${sec}">
      <div class="card-h"><div><h2>${title}</h2><p>${sub}</p></div></div>${body}
      <div class="cfg-acts"><button class="btn btn-ink" type="submit">${ic.check}${btn}</button></div></form>`;

  function viewConfig() {
    const tab = CFG_TABS.some(t => t[0] === routeParam) ? routeParam : 'perfil';
    $('#pageSub').textContent = 'Preferências da conta e da rede';
    $('#tools').innerHTML = '';
    const desat = D.stores.filter(x => x.versao && x.versao !== D.COLETOR_ATUAL).length;
    const T = {
      perfil: () => cfgCard('perfil', 'Seus dados', 'Como você aparece para a equipe e nos avisos.', `
          <div class="cfg-me"><span class="avatar cfg-av">${esc(initials(session.nome))}</span><div><b>${esc(session.nome)}</b><small>${esc(session.email || '')}</small></div></div>
          <div class="cfg-row">
            <label class="field"><span>Nome</span><input type="text" name="nome" required maxlength="60" value="${esc(session.nome)}"></label>
            <label class="field"><span>Telefone <em class="muted">(opcional)</em></span><input type="tel" name="tel" maxlength="20" value="${esc(cfg.perfil.tel)}" placeholder="(11) 90000-0000" autocomplete="off"></label>
          </div>
          <label class="field"><span>E-mail de acesso</span><input type="email" value="${esc(session.email || '')}" disabled><small class="hint-t">O e-mail é o seu login. Para trocar, fale com o suporte.</small></label>`)
        + cfgCard('pref', 'Preferências', 'Ajustes só deste navegador.', sw('motion', cfg.perfil.motion, 'Animações da interface', 'Entrada dos blocos, gráficos que se desenham e efeitos ao passar o mouse. Quem usa “reduzir movimento” no sistema já não vê as animações.'))
        + `<div class="card cfg-card cfg-danger"><div class="card-h"><div><h2>Restaurar padrões</h2><p>Volta todas as configurações desta tela ao valor original. Lojas, notas e acessos não mudam.</p></div><button class="btn btn-line" data-act="cfgreset">Restaurar</button></div></div>`,

      rede: () => cfgCard('rede', 'Dados da rede', 'Aparecem no topo do painel e nos relatórios enviados ao contador.', `
          <label class="field"><span>Nome da rede</span><input type="text" name="rede" required maxlength="60" value="${esc(session.rede || '')}" placeholder="Sabor & Cia"></label>
          <div class="cfg-row">
            <label class="field"><span>Razão social da matriz</span><input type="text" name="razao" maxlength="80" value="${esc(cfg.rede.razao)}" placeholder="Sabor & Cia Alimentos LTDA"></label>
            <label class="field"><span>CNPJ da matriz</span><input type="text" name="cnpj" inputmode="numeric" maxlength="18" value="${cfg.rede.cnpj ? cnpj(cfg.rede.cnpj) : ''}" placeholder="00.000.000/0000-00"></label>
          </div>
          <small class="err" data-err></small>
          <label class="field"><span>Fuso horário</span><select name="fuso">${opts([['America/Sao_Paulo', 'Brasília (GMT−3)'], ['America/Manaus', 'Manaus (GMT−4)'], ['America/Rio_Branco', 'Rio Branco (GMT−5)'], ['America/Noronha', 'Fernando de Noronha (GMT−2)']], cfg.rede.fuso)}</select><small class="hint-t">Define a virada do dia e o horário dos resumos.</small></label>
          <div class="cfg-stats"><a href="#/lojas"><b class="num">${D.stores.length}</b><span>lojas cadastradas</span></a><a href="#/acessos"><b class="num">${D.users.length}</b><span>pessoas com acesso</span></a></div>`),

      notificacoes: () => cfgCard('notif', 'Avisos por e-mail', 'Escolha o que merece interromper o seu dia.', `
          <label class="field"><span>Enviar para</span><input type="email" name="email" required value="${esc(cfg.notif.email)}" placeholder="voce@empresa.com.br"></label>
          <h3 class="cfg-sep">Alertas na hora</h3>
          ${sw('offline', cfg.notif.offline, 'Loja sem enviar', 'Quando o coletor passa do limite de “sem sinal”.')}
          ${sw('cont', cfg.notif.cont, 'Notas em contingência há mais de 24 h', 'Emitidas offline e ainda sem autorização da SEFAZ.')}
          ${sw('versao', cfg.notif.versao, 'Coletor desatualizado', 'Quando sai uma versão nova e uma loja continua na antiga.')}
          <h3 class="cfg-sep">Resumos</h3>
          ${sw('diario', cfg.notif.diario, 'Resumo diário', 'Faturamento, notas e pendências do dia anterior.')}
          ${sw('semanal', cfg.notif.semanal, 'Resumo semanal', 'Toda segunda-feira, com a comparação da semana.')}
          <label class="field" style="margin-top:12px"><span>Horário dos resumos</span><select name="hora">${opts([['07:00', '07:00'], ['08:00', '08:00'], ['09:00', '09:00'], ['12:00', '12:00'], ['18:00', '18:00']], cfg.notif.hora)}</select></label>`),

      coleta: () => cfgCard('coleta', 'Coleta e arquivos', 'Padrões para todas as unidades.', `
          <label class="field"><span>Avisar “sem sinal” depois de</span><select name="limite">${opts([[1, '1 hora'], [3, '3 horas (padrão)'], [6, '6 horas'], [12, '12 horas'], [24, '24 horas']], cfg.coleta.limite)}</select><small class="hint-t">Cada unidade pode ter o seu próprio valor em Lojas › Editar.</small></label>
          <label class="field"><span>Guarda dos XMLs</span><select name="retencao">${opts([[1, '1 ano'], [2, '2 anos'], [5, '5 anos (recomendado)']], cfg.coleta.retencao)}</select><small class="hint-t">A legislação fiscal pede 5 anos. Prazos menores apagam arquivos antigos de forma definitiva.</small></label>
          <h3 class="cfg-sep">O que entra no ZIP por padrão</h3>
          ${sw('zipCanc', cfg.coleta.zipCanc, 'Cancelamentos', 'XMLs de notas canceladas.')}
          ${sw('zipInut', cfg.coleta.zipInut, 'Inutilizações', 'Numerações inutilizadas.')}
          ${sw('zipCont', cfg.coleta.zipCont, 'Notas em contingência', 'Emitidas offline, aguardando autorização.')}`)
        + `<div class="card cfg-card"><div class="card-h"><div><h2>Coletor</h2><p>Programa que roda no caixa e envia os XMLs ao Hunter.</p></div><span class="pill ${desat ? 'warn' : 'good'}">${desat ? ic.info : ic.checkc}${desat ? plural(desat, 'loja desatualizada', 'lojas desatualizadas') : 'Todas atualizadas'}</span></div>
          <div class="cfg-stats"><a href="#/lojas"><b class="num">v${D.COLETOR_ATUAL}</b><span>versão atual</span></a><a href="#/lojas"><b class="num">${D.stores.length}</b><span>coletores instalados</span></a></div></div>`,

      seguranca: () => cfgCard('seg', 'Verificação em duas etapas', 'Pede um código do celular além da senha.', sw('dois', cfg.seg.dois, 'Exigir código ao entrar', 'Recomendado para quem gerencia lojas e baixa XMLs.'))
        + cfgCard('senha', 'Trocar senha', 'Use pelo menos 8 caracteres, com letras e números.', `
          <label class="field"><span>Senha atual</span><input type="password" name="atual" required autocomplete="current-password"></label>
          <div class="cfg-row">
            <label class="field"><span>Nova senha</span><input type="password" name="nova" required minlength="8" autocomplete="new-password"></label>
            <label class="field"><span>Repita a nova senha</span><input type="password" name="rep" required autocomplete="new-password"></label>
          </div>
          <small class="err" data-err></small>`, 'Trocar senha')
        + `<div class="card cfg-card"><div class="card-h"><div><h2>Sessões ativas</h2><p>Onde a sua conta está aberta agora.</p></div>${sessoes.length > 1 ? '<button class="btn btn-line btn-sm" data-act="endsessall">Encerrar as outras</button>' : ''}</div>
          <div class="sess-list">${sessoes.map(x => `<div class="sess"><span class="sess-ic">${ic.shield}</span><div class="sess-t"><b>${esc(x.nome)}${x.atual ? ' <span class="tag">este aparelho</span>' : ''}</b><small>${x.det} · ${x.local} · ${x.quando}</small></div>${x.atual ? '' : `<button class="btn btn-danger btn-sm" data-act="endsess:${x.id}">Encerrar</button>`}</div>`).join('')}</div></div>`,
    };
    $('#view').innerHTML = `<div class="cfg">
      <nav class="cfg-nav" aria-label="Seções das configurações">${CFG_TABS.map(([id, l, icon, sub]) => `<a href="#/config/${id}" class="cfg-tab ${tab === id ? 'on' : ''}"${tab === id ? ' aria-current="page"' : ''}>${icon}<span><b>${l}</b><small>${sub}</small></span></a>`).join('')}</nav>
      <div class="cfg-body">${T[tab]()}</div></div>`;
  }

  document.addEventListener('input', e => {
    if (e.target.matches?.('.cfg input[name="cnpj"]')) e.target.value = maskCnpj(e.target.value);
  });
  document.addEventListener('submit', e => {
    const form = e.target.closest?.('[data-cfgform]'); if (!form) return;
    e.preventDefault();
    const f = new FormData(form), sec = form.dataset.cfgform, on = k => f.get(k) === 'on', err = $('[data-err]', form);
    if (err) err.textContent = '';
    if (sec === 'perfil') {
      const nome = f.get('nome').trim(); if (!nome) return;
      session.nome = nome; cfg.perfil.tel = f.get('tel').trim(); saveSession(); renderUser(); toast('Perfil atualizado');
    } else if (sec === 'pref') {
      cfg.perfil.motion = on('motion'); applyMotion(); toast(cfg.perfil.motion ? 'Animações ligadas' : 'Animações desligadas');
    } else if (sec === 'rede') {
      const c = f.get('cnpj').replace(/\D/g, '');
      if (c && c.length !== 14) { err.textContent = 'O CNPJ da matriz precisa ter 14 dígitos.'; form.cnpj.focus(); return; }
      session.rede = f.get('rede').trim() || 'Minha rede';
      Object.assign(cfg.rede, { razao: f.get('razao').trim(), cnpj: c, fuso: f.get('fuso') });
      saveSession(); renderUser(); toast('Dados da rede salvos');
    } else if (sec === 'notif') {
      Object.assign(cfg.notif, { email: f.get('email').trim(), offline: on('offline'), cont: on('cont'), versao: on('versao'), diario: on('diario'), semanal: on('semanal'), hora: f.get('hora') });
      toast(`Avisos serão enviados para ${cfg.notif.email}`);
    } else if (sec === 'coleta') {
      Object.assign(cfg.coleta, { limite: +f.get('limite'), retencao: +f.get('retencao'), zipCanc: on('zipCanc'), zipInut: on('zipInut'), zipCont: on('zipCont') });
      Object.assign(dl, { canc: cfg.coleta.zipCanc, inut: cfg.coleta.zipInut, cont: cfg.coleta.zipCont });
      renderMenu(); renderUser(); toast('Padrões de coleta salvos');
    } else if (sec === 'seg') {
      cfg.seg.dois = on('dois'); toast(cfg.seg.dois ? 'Verificação em duas etapas ativada (demo)' : 'Verificação em duas etapas desativada');
    } else if (sec === 'senha') {
      const nova = f.get('nova');
      if (nova.length < 8 || !/[a-zA-Z]/.test(nova) || !/\d/.test(nova)) { err.textContent = 'A nova senha precisa de 8 caracteres ou mais, com letras e números.'; form.nova.focus(); return; }
      if (nova !== f.get('rep')) { err.textContent = 'As duas senhas novas não são iguais.'; form.rep.focus(); return; }
      if (nova === f.get('atual')) { err.textContent = 'A nova senha precisa ser diferente da atual.'; form.nova.focus(); return; }
      form.reset(); toast('Senha alterada (demo: nada foi enviado ao servidor)'); return;
    }
    saveCfg(); viewConfig();
  });

  /* ---------------- drawer (detalhe da nota) ---------------- */
  const overlay = document.createElement('div'); overlay.className = 'overlay'; document.body.appendChild(overlay);
  function openNota(id) {
    const n = D.notes.find(x => x.id === id); if (!n) return;
    const s = storeById(n.loja);
    const steps = [[`Emitida no caixa`, dtFull(n.emissao)], [`Caçada pelo coletor`, dtFull(n.coletado)]];
    if (n.status === 'cancelada') steps.push(['Cancelamento registrado', 'Fora do faturamento']);
    if (n.status === 'contingencia') steps.push(['Aguardando autorização', 'O Hunter atualiza quando a SEFAZ autorizar']);
    if (n.status === 'autorizada') steps.push(['Autorizada pela SEFAZ', 'Arquivo guardado como emitido']);
    const dr = $('#drawer');
    dr.innerHTML = `
      <div class="drawer-h"><h2>${n.tipo} ${int.format(n.numero)}</h2><button class="x" data-close aria-label="Fechar">${ic.x}</button></div>
      <div class="drawer-b">
        ${statusPill(n.status)}
        <div class="big-val num">${n.valor ? money(n.valor) : '—'}</div>
        <dl class="dl">
          <dt>Loja</dt><dd>${esc(s.nome)}</dd>
          <dt>CNPJ</dt><dd>${cnpj(s.cnpj)}</dd>
          <dt>Série / nº</dt><dd>${n.serie} / ${int.format(n.numero)}</dd>
          <dt>Emissão</dt><dd>${dtFull(n.emissao)}</dd>
          <dt>Chave</dt><dd class="chave">${n.chave.replace(/(\d{4})(?=\d)/g, '$1 ')}</dd>
        </dl>
        <div class="timeline">${steps.map(([a, b]) => `<div>${a}<small>${b}</small></div>`).join('')}</div>
      </div>
      <div class="drawer-f">
        <button class="btn btn-line" data-copy="${n.chave}">${ic.copy}Copiar chave</button>
        <button class="btn btn-ink" data-xml="${n.id}">${ic.dl}Baixar XML</button>
      </div>`;
    dr.classList.add('on'); dr.setAttribute('aria-hidden', 'false'); overlay.classList.add('on');
    setTimeout(() => $('[data-close]', dr).focus(), 50);
  }
  /* ---------------- drawer (editar unidade) ---------------- */
  const maskCnpj = v => {
    const d = v.replace(/\D/g, '').slice(0, 14);
    return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  };
  /* pastas dos XMLs: uma unidade pode ter mais de uma (ex.: NFC-e e NF-e em lugares diferentes) */
  const pastasOf = s => (s.pastas && s.pastas.length ? s.pastas : [s.pasta]).filter(Boolean);
  const folderRow = (v = '', first = false) => `<div class="frow"><input type="text" name="pasta" ${first ? 'required' : ''} value="${esc(v)}" placeholder="C:\\PDV\\XML" aria-label="Pasta dos XMLs" autocomplete="off"><button type="button" class="x fx" data-rmfolder aria-label="Remover pasta">${ic.x}</button></div>`;
  const foldersField = (list, hint = true) => `<div class="field folders" data-n="${list.length}"><span>Pastas onde o PDV salva os XMLs</span>
    <div class="flist">${list.map((v, i) => folderRow(v, i === 0)).join('')}</div>
    <button type="button" class="btn btn-ghost btn-sm addf" data-addfolder>${ic.plus}Adicionar outra pasta</button>
    ${hint ? '<small class="hint-t">Se o PDV salva em mais de um lugar, adicione todas. O coletor lê de cada uma.</small>' : ''}</div>`;
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-addfolder]'), rm = e.target.closest('[data-rmfolder]');
    if (!add && !rm) return;
    const box = (add || rm).closest('.folders'), list = $('.flist', box);
    if (add) {
      list.insertAdjacentHTML('beforeend', folderRow());
      list.lastElementChild.querySelector('input').focus();
    } else if (list.children.length > 1) {
      rm.closest('.frow').remove();
      const first = list.firstElementChild.querySelector('input'); first.required = true;
    }
    box.dataset.n = list.children.length;
  });

  function openStore(id) {
    const s = storeById(id); if (!s) return;
    const m = metrics(inRange(range('mes'), s.id));
    const dr = $('#drawer');
    dr.innerHTML = `
      <div class="drawer-h"><div><h2>Editar unidade</h2><small class="muted">${esc(s.nome)}</small></div><button class="x" data-close aria-label="Fechar">${ic.x}</button></div>
      <div class="drawer-b">
        <div class="store-glance">${storeStatus(s).html}<span class="muted">${s.ultimaColeta ? 'Última coleta ' + ago(s.ultimaColeta) : 'Ainda sem coletas'}${s.versao ? ' · coletor v' + s.versao : ''}</span></div>
        <form id="storeForm" class="eform" novalidate>
          <label class="field"><span>Nome da unidade</span><input type="text" name="nome" required maxlength="60" value="${esc(s.nome)}"></label>
          <label class="field"><span>CNPJ</span><input type="text" name="cnpj" required inputmode="numeric" maxlength="18" value="${cnpj(s.cnpj)}" placeholder="00.000.000/0000-00"><small class="err" data-err="cnpj"></small></label>
          <label class="field"><span>Cidade · UF</span><input type="text" name="cidade" maxlength="60" value="${esc(s.cidade || '')}" placeholder="São Paulo · SP"></label>
          ${foldersField(pastasOf(s))}
          <label class="field"><span>Avisar “sem sinal” depois de</span>
            <select name="limite">${[[1, '1 hora'], [3, '3 horas (padrão)'], [6, '6 horas'], [12, '12 horas'], [24, '24 horas']].map(([h, l]) => `<option value="${h}" ${(s.limiteSemSinal || 3) === h ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="switch"><input type="checkbox" name="ativa" ${s.pausada ? '' : 'checked'}><i></i><span><b>Coleta ativa</b><small>Desligue para pausar esta unidade sem apagar o histórico.</small></span></label>
        </form>
        <dl class="dl"><dt>Notas no mês</dt><dd>${int.format(m.notas)}</dd><dt>Faturamento no mês</dt><dd>${money(m.fat)}</dd></dl>
        <div class="danger"><div><b>Remover unidade</b><small>Apaga a loja e os XMLs dela do Hunter. Não dá para desfazer.</small></div><button class="btn btn-danger btn-sm" data-act="rmstore:${s.id}">${ic.trash}Remover</button></div>
      </div>
      <div class="drawer-f"><button class="btn btn-line" data-close>Cancelar</button><button class="btn btn-ink" type="submit" form="storeForm">${ic.check}Salvar alterações</button></div>`;
    const form = $('#storeForm', dr);
    form.cnpj.addEventListener('input', () => { form.cnpj.value = maskCnpj(form.cnpj.value); $('[data-err]', form).textContent = ''; });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form), nome = f.get('nome').trim(), c = f.get('cnpj').replace(/\D/g, ''), pastas = [...new Set(f.getAll('pasta').map(p => p.trim()).filter(Boolean))];
      const err = $('[data-err]', form);
      if (!nome || !pastas.length) { form.reportValidity(); return; }
      if (c.length !== 14) { err.textContent = 'O CNPJ precisa ter 14 dígitos.'; form.cnpj.focus(); return; }
      if (D.stores.some(x => x !== s && x.cnpj === c)) { err.textContent = 'Já existe uma unidade com este CNPJ.'; form.cnpj.focus(); return; }
      const mudouCnpj = c !== s.cnpj;
      Object.assign(s, { nome, cnpj: c, cidade: f.get('cidade').trim(), pasta: pastas[0], pastas, limiteSemSinal: +f.get('limite'), pausada: !f.get('ativa') });
      closeDrawer(); rerender(); renderUser();
      toast(mudouCnpj ? `${nome} atualizada. CNPJ novo: gere um novo instalador para o caixa.` : `${nome} atualizada`);
    });
    dr.classList.add('on'); dr.setAttribute('aria-hidden', 'false'); overlay.classList.add('on');
    setTimeout(() => form.nome.focus(), 60);
  }
  function closeDrawer() { $('#drawer').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true'); overlay.classList.remove('on'); }
  overlay.addEventListener('click', closeDrawer);

  /* ---------------- modal ---------------- */
  const modal = $('#modal');
  function openModal(html, onSubmit) {
    modal.innerHTML = `<form method="dialog">${html}</form>`;
    const form = $('form', modal);
    form.addEventListener('submit', e => {
      if (e.submitter && e.submitter.value === 'cancel') return;
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      onSubmit(new FormData(form), form); modal.close();
    });
    modal.showModal();
  }

  /* ---------------- utilidades ---------------- */
  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = `<img src="../assets/hunter.svg" alt=""><span>${esc(msg)}</span>`;
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3800);
  }
  const openStoreDash = id => { location.hash = '#/loja/' + id; };
  const goNotas = (status, loja) => {
    state.notas = { q: '', tipo: 'all', status: status || 'all', page: 1 };
    if (loja) state.loja = loja;
    if (status === 'contingencia') state.period = 'mes';
    location.hash = '#/notas';
  };

  /* ---------------- ações (delegação) ---------------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button, tr, [data-act], a, label, input, select');
    if (!t) {
      const card = e.target.closest('[data-openstore]');
      if (card) openStoreDash(card.dataset.openstore);
      return;
    }
    const d = t.dataset;

    if (d.period) { state.period = d.period; state.notas.page = 1; rerender(); return; }
    if (d.status) { state.notas.status = d.status; state.notas.page = 1; viewNotas(); return; }
    if (d.page) { state.notas.page = +d.page; viewNotas(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (d.nota) { openNota(+d.nota); return; }
    if (d.goloja) { goNotas('all', d.goloja); return; }
    if (d.close !== undefined) { closeDrawer(); return; }
    if (d.copy) { navigator.clipboard?.writeText(d.copy).then(() => toast('Chave de acesso copiada')).catch(() => toast('Não foi possível copiar')); return; }
    if (d.xml) {
      const n = D.notes.find(x => x.id === +d.xml), s = storeById(n.loja);
      download(`${n.chave}.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Arquivo de demonstração gerado pelo protótipo do Hunter -->\n<nfeProc versao="4.00"><NFe><infNFe Id="NFe${n.chave}"><ide><mod>${n.tipo === 'NF-e' ? 55 : 65}</mod><serie>${n.serie}</serie><nNF>${n.numero}</nNF><dhEmi>${n.emissao.toISOString()}</dhEmi></ide><emit><CNPJ>${s.cnpj}</CNPJ><xNome>${esc(s.nome)}</xNome></emit><total><ICMSTot><vNF>${n.valor.toFixed(2)}</vNF></ICMSTot></total></infNFe></NFe></nfeProc>\n`, 'application/xml');
      toast('XML baixado (arquivo de demonstração)');
      return;
    }
    if (d.resolve) { state.resolved.add(d.resolve); saveResolved(); toast('Alerta marcado como resolvido'); rerender(); return; }
    if (d.dlmes) { dl.mes = +d.dlmes; viewDownloads(); return; }

    const act = d.act; if (!act) return;
    const [cmd, a, b] = act.split(':');
    if (act.startsWith('#')) { location.hash = act; return; }
    if (cmd === 'notas') { goNotas(a, b); return; }
    if (cmd === 'install') { toast(`Instalador da ${storeById(a).nome} gerado (demo). Em produção, o download começa aqui.`); return; }
    if (cmd === 'csvdias') {
      const rows = [['periodo', 'faturamento', 'notas', 'cancelamentos', 'ticket_medio']].concat(chartData.map(b => [b.title, b.fat.toFixed(2).replace('.', ','), b.notas, b.canc, b.ticket.toFixed(2).replace('.', ',')]));
      download(`hunter-faturamento-${state.period}.csv`, '﻿' + rows.map(r => r.join(';')).join('\n'), 'text/csv');
      toast('CSV do faturamento baixado'); return;
    }
    if (cmd === 'endsess') { sessoes = sessoes.filter(x => x.id !== +a); toast('Sessão encerrada'); viewConfig(); return; }
    if (cmd === 'endsessall') { sessoes = sessoes.filter(x => x.atual); toast('As outras sessões foram encerradas'); viewConfig(); return; }
    if (cmd === 'cfgreset') {
      openModal(`<h2>Restaurar configurações?</h2><p class="lead">Perfil, avisos, coleta e preferências voltam ao padrão. Lojas, notas e acessos não mudam.</p>
        <div class="acts"><button class="btn btn-ghost" value="cancel">Cancelar</button><button class="btn btn-ink" type="submit">Restaurar</button></div>`,
        () => { cfg = CFG_DEFAULT(); saveCfg(); Object.assign(dl, { canc: true, inut: true, cont: true }); applyMotion(); renderMenu(); renderUser(); toast('Configurações restauradas'); viewConfig(); });
      return;
    }
    if (cmd === 'csvmeses') {
      const st = storeById(a);
      const rows = [['mes', 'faturamento', 'notas', 'cancelamentos']].concat(monthlyRows(a).map(x => [`${MESES[x.d.getMonth()]} ${x.d.getFullYear()}`, x.fat.toFixed(2).replace('.', ','), x.notas, x.canc]));
      download(`hunter-${st.nome.toLowerCase().replace(/\s+/g, '-')}-meses.csv`, '\ufeff' + rows.map(r => r.join(';')).join('\n'), 'text/csv');
      toast('CSV mensal baixado'); return;
    }
    if (cmd === 'dlzip') { toast('Download do ZIP (demo: o arquivo real virá do servidor)'); return; }
    if (cmd === 'reopen') { state.resolved.clear(); saveResolved(); rerender(); return; }
    if (cmd === 'editstore') { openStore(a); return; }
    if (cmd === 'rmstore') {
      const s = storeById(a);
      openModal(`<h2>Remover ${esc(s.nome)}?</h2><p class="lead">A unidade e todos os XMLs dela saem do Hunter, e o coletor deixa de ser aceito. Isso não pode ser desfeito.</p>
        <div class="acts"><button class="btn btn-ghost" value="cancel">Cancelar</button><button class="btn btn-ink" type="submit" style="background:var(--crit)">${ic.trash}Remover unidade</button></div>`,
        () => {
          D.stores.splice(D.stores.indexOf(s), 1);
          for (let i = D.notes.length - 1; i >= 0; i--) if (D.notes[i].loja === s.id) D.notes.splice(i, 1);
          D.users.forEach(u => { if (Array.isArray(u.lojas)) u.lojas = u.lojas.filter(x => x !== s.id); });
          if (state.loja === s.id) state.loja = 'all';
          if (dl.lojas) dl.lojas.delete(s.id);
          closeDrawer(); rerender(); renderUser();
          toast(`${s.nome} removida`);
        });
      return;
    }
    if (cmd === 'rekey') {
      const s = storeById(a);
      openModal(`<h2>Trocar a chave da ${esc(s.nome)}?</h2><p class="lead">O coletor atual para de enviar até você instalar o novo instalador, que já vem com a chave nova. Use quando suspeitar que a chave vazou.</p>
        <div class="acts"><button class="btn btn-ghost" value="cancel">Cancelar</button><button class="btn btn-ink" type="submit">${ic.key}Trocar chave</button></div>`,
        () => toast(`Chave da ${s.nome} trocada. Baixe o novo instalador.`));
      return;
    }
    if (cmd === 'addstore') {
      openModal(`<h2>Adicionar loja</h2><p class="lead">Depois de salvar, baixe o instalador e rode no computador do caixa.</p>
        <label class="field"><span>Nome da loja</span><input type="text" name="nome" required placeholder="Loja Vila Madalena"></label>
        <label class="field"><span>CNPJ</span><input type="text" name="cnpj" required inputmode="numeric" placeholder="00.000.000/0000-00" pattern="[\\d./-]{14,18}"></label>
        ${foldersField(['C:\\PDV\\XML'], false)}
        <div class="acts"><button class="btn btn-ghost" value="cancel">Cancelar</button><button class="btn btn-ink" type="submit">Salvar loja</button></div>`,
        fd => {
          const nome = fd.get('nome').trim(), c = fd.get('cnpj').replace(/\D/g, '').padEnd(14, '0').slice(0, 14);
          const pastas = [...new Set(fd.getAll('pasta').map(p => p.trim()).filter(Boolean))];
          D.stores.push({ id: 'n' + Date.now(), nome, cnpj: c, cidade: '', porte: 0, versao: null, pasta: pastas[0], pastas, ultimaColeta: null });
          toast(`${nome} adicionada. Baixe o instalador para começar a coletar.`);
          rerender();
        });
      return;
    }
    if (cmd === 'invite') {
      openModal(`<h2>Convidar pessoa</h2><p class="lead">Ela recebe um e-mail para criar a senha.</p>
        <label class="field"><span>Nome</span><input type="text" name="nome" required placeholder="Nome ou escritório"></label>
        <label class="field"><span>E-mail</span><input type="email" name="email" required placeholder="pessoa@empresa.com.br"></label>
        <label class="field"><span>Papel</span><select name="papel"><option value="Contador">Contador · somente leitura</option><option value="Gerente">Gerente · lojas escolhidas</option><option value="Administrador">Administrador · tudo</option></select></label>
        <div class="field"><span>Lojas</span><div class="checks">${D.stores.map(s => `<label class="cb"><input type="checkbox" name="lojas" value="${s.id}" checked>${esc(s.nome)}</label>`).join('')}</div></div>
        <div class="acts"><button class="btn btn-ghost" value="cancel">Cancelar</button><button class="btn btn-ink" type="submit">Enviar convite</button></div>`,
        fd => {
          const lojas = fd.getAll('lojas');
          D.users.push({ id: Date.now(), nome: fd.get('nome').trim(), email: fd.get('email').trim(), papel: fd.get('papel'), lojas: lojas.length === D.stores.length ? 'todas' : lojas, ultimoAcesso: null });
          toast(`Convite enviado para ${fd.get('email')} (demo)`);
          viewAcessos();
        });
      return;
    }
    if (cmd === 'rmuser') {
      const u = D.users.find(x => x.id === +a);
      openModal(`<h2>Remover acesso de ${esc(u.nome)}?</h2><p class="lead">A pessoa deixa de entrar no Hunter na hora. Você pode convidar de novo depois.</p>
        <div class="acts"><button class="btn btn-ghost" value="cancel">Cancelar</button><button class="btn btn-ink" type="submit" style="background:var(--crit)">Remover</button></div>`,
        () => { D.users.splice(D.users.indexOf(u), 1); toast(`Acesso de ${u.nome} removido`); viewAcessos(); });
    }
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-unit]')) { location.hash = '#/loja/' + t.value; return; }
    if (t.matches('[data-loja]')) { state.loja = t.value; state.notas.page = 1; rerender(); }
    if (t.matches('[data-dlloja]')) { t.checked ? dl.lojas.add(t.dataset.dlloja) : dl.lojas.delete(t.dataset.dlloja); viewDownloads(); }
    if (t.matches('[data-dlopt]')) { dl[t.dataset.dlopt] = t.checked; viewDownloads(); }
  });

  /* ---------------- busca global & sair ---------------- */
  $('#gsearch').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim();
    state.notas = { q, tipo: 'all', status: 'all', page: 1 };
    if (q) state.period = 'mes-ant' === state.period ? state.period : 'mes';
    e.target.value = '';
    if (current === 'notas') rerender(); else location.hash = '#/notas';
  });
  $('#logout').addEventListener('click', () => {
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (_) {}
    location.replace('../login/');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'Enter' && e.target.matches?.('[data-openstore]')) openStoreDash(e.target.dataset.openstore);
  });

  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawChart, 120); });
  addEventListener('hashchange', route);

  renderUser();
  route();
})();
