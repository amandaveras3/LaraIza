/* Lara Iza — frontend production */
(() => {
  "use strict";

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const config = window.LARA_IZA_CONFIG || {};
  const SUPABASE_URL = config.SUPABASE_URL || "";
  const SUPABASE_KEY = config.SUPABASE_ANON_KEY || config.SUPABASE_PUBLISHABLE_KEY || "";
  const supabase = window.supabase && SUPABASE_URL && SUPABASE_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
      })
    : null;

  const emptyState = () => ({
    schemaVersion: 2,
    categories: [],
    products: [],
    suppliers: [],
    customers: [],
    movements: [],
    supportTickets: [],
    supportReplies: [],
    alerts: [],
    settings: { lowStockThreshold: 5 }
  });

  const state = emptyState();
  let organizationId = null;
  let currentUser = null;
  let currentPage = "Dashboard";
  let searchTerm = "";
  let saveTimer = null;
  let saving = false;
  let profile = { full_name: "", phone: "", photo_url: "", role: "employee" };

  const ROLE_BY_EMAIL = {
    "saulo@laraiza.com": "admin",
    "amanda@laraiza.com": "admin",
    "eduardo@laraiza.com": "manager",
    "vitoria@laraiza.com": "manager",
    "maria@laraiza.com": "employee"
  };
  const DISPLAY_NAMES = {
    saulo: "Saulo",
    amanda: "Amanda",
    eduardo: "Eduardo",
    vitoria: "Vitoria",
    maria: "Maria"
  };
  const ROLE_LABELS = { admin: "Administrador", manager: "Gerente", employee: "Funcionário", viewer: "Visualizador", owner: "Administrador" };
  const isAdmin = () => ["admin", "owner"].includes(profile.role);
  const userRoleLabel = () => ROLE_LABELS[profile.role] || "Funcionário";
  function emailKey() { return String(currentUser?.email || "").trim().toLowerCase(); }
  function roleFromEmail(email) { return ROLE_BY_EMAIL[String(email || "").trim().toLowerCase()] || "employee"; }
  function firstName() {
    const email = emailKey();
    const local = email.split("@")[0].toLowerCase();
    if (DISPLAY_NAMES[local]) return DISPLAY_NAMES[local];
    const full = profile.full_name || currentUser?.user_metadata?.full_name || "";
    return String(full).trim().split(/\s+/)[0] || "Usuário";
  }
  function greeting() { return `Bem vindo de volta, ${firstName()}!`; }
  function parseNumber(value) {
    let s = String(value ?? "").trim().replace(/\s/g, "");
    if (!s) return 0;
    if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(",")) s = s.replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }
  function roleForUser(user=emailKey()) { return roleFromEmail(user); }

  const icons = {
    dashboard:"dashboard", produtos:"produtos", categorias:"categorias", estoque:"estoque",
    entradas:"entradas", saidas:"saidas", fornecedores:"fornecedores", clientes:"clientes",
    relatorios:"relatorios", alertas:"alertas", usuarios:"usuarios", configuracoes:"configuracoes"
  };

  const navMain = [
    ["Dashboard","dashboard"],["Produtos","produtos"],["Categorias","categorias"],
    ["Estoque","estoque"],["Entradas","entradas"],["Saídas","saidas"],
    ["Fornecedores","fornecedores"],["Clientes","clientes"],["Relatórios","relatorios"],["Alertas","alertas"]
  ];
  const navAdmin = [["Usuários","usuarios"],["Configurações","configuracoes"]];

  function initInlineIcons() {
    const paths = {
      search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4.5 4.5"></path></svg>',
      sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>',
      moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"></path></svg>',
      bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>',
      headphones: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"></path><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Zm16 0h-3v5h2a1 1 0 0 0 1-1v-4Z"></path></svg>',
      chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>'
    };
    $$('[data-icon]').forEach(el => {
      const name = el.dataset.icon;
      if (paths[name] && !el.querySelector('svg')) el.innerHTML = paths[name];
    });
  }

  function esc(v="") {
    return String(v).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function uid(prefix="id") { return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now()+Math.random()}`; }
  function money(v) {
    return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2}).format(parseNumber(v));
  }
  function date(v=Date.now()) { return new Date(v).toLocaleDateString("pt-BR"); }
  function toast(message, type="info") {
    const root=$("#toastContainer"); if(!root) return;
    const el=document.createElement("div"); el.className=`toast toast-${type}`; el.textContent=message;
    root.appendChild(el); setTimeout(()=>el.remove(),3500);
  }
  function normalize() {
    const fresh=emptyState();
    Object.keys(fresh).forEach(k => {
      if (Array.isArray(fresh[k])) state[k]=Array.isArray(state[k])?state[k]:[];
      else if (typeof fresh[k]==="object") state[k]={...fresh[k],...(state[k]||{})};
      else if (state[k]===undefined) state[k]=fresh[k];
    });
  }

  async function loadProfile() {
    if (!supabase || !currentUser) return;
    const fallbackRole = roleFromEmail(currentUser.email);
    const fallbackName = DISPLAY_NAMES[String(currentUser.email || "").split("@")[0].toLowerCase()] || currentUser.user_metadata?.full_name || "";
    const { data, error } = await supabase.from("profiles").select("full_name,phone,photo_url,role").eq("id", currentUser.id).maybeSingle();
    if (error) throw error;
    profile = {
      full_name: data?.full_name || fallbackName,
      phone: data?.phone || "",
      photo_url: data?.photo_url || currentUser.user_metadata?.avatar_url || "",
      role: data?.role || fallbackRole
    };
    if (profile.role !== fallbackRole && ROLE_BY_EMAIL[emailKey()]) profile.role = fallbackRole;
    if (!data) {
      await supabase.from("profiles").upsert({
        id: currentUser.id, full_name: profile.full_name, phone: profile.phone, photo_url: profile.photo_url, role: profile.role
      });
    } else if (data.role !== profile.role || data.full_name !== profile.full_name) {
      await supabase.from("profiles").update({full_name: profile.full_name, role: profile.role}).eq("id", currentUser.id);
    }
    updateTopProfile();
  }
  function updateTopProfile() {
    const name = firstName();
    $("#pageTitle") && ($("#pageTitle").textContent = greeting());
    $("#profileNameTop") && ($("#profileNameTop").textContent = name);
    const avatar = $("#avatarTop");
    if (avatar) {
      avatar.innerHTML = profile.photo_url
        ? `<img src="${esc(profile.photo_url)}" alt="Foto de ${esc(name)}">`
        : esc(name.charAt(0).toUpperCase());
    }
  }

  async function loadBackend() {
    if (!supabase) return false;
    const {data:{session}} = await supabase.auth.getSession();
    if (!session) return false;
    currentUser=session.user;
    await loadProfile();
    const {data:org,error:orgError}=await supabase.rpc("ensure_my_organization");
    if(orgError) throw orgError;
    organizationId=org;
    const {data,rowError}=await supabase.from("app_state").select("state,version").eq("organization_id",organizationId).maybeSingle();
    if(rowError) throw rowError;
    if(data?.state) Object.assign(state,data.state);
    normalize();
    await loadSupportTickets();
    await loadAlerts();
    updateNotificationCount();
    setupSupportRealtime();
    return true;
  }

  async function loadAlerts() {
    if (!supabase || !organizationId) { state.alerts = []; return; }
    const { data, error } = await supabase.from("alerts")
      .select("id,title,message,status,created_at,updated_at,created_by")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    state.alerts = data || [];
  }
  async function loadSupportTickets() {
    if (!supabase || !organizationId) { state.supportTickets = []; return; }
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id,subject,message,priority,status,created_at,updated_at,user_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    state.supportTickets = data || [];
    await loadSupportReplies();
  }
  async function loadSupportReplies() {
    if (!supabase || !organizationId) { state.supportReplies = []; return; }
    const ticketIds = state.supportTickets.map(t=>t.id);
    if (!ticketIds.length) { state.supportReplies = []; return; }
    const { data, error } = await supabase.from("support_ticket_replies")
      .select("id,ticket_id,user_id,message,created_at")
      .in("ticket_id",ticketIds).order("created_at",{ascending:true});
    if (error) throw error;
    state.supportReplies = data || [];
  }
  function updateNotificationCount() {
    const lowCount = state.products.filter(p => (Number(p.stock) || 0) <= Number(state.settings.lowStockThreshold || 5)).length;
    const ticketCount = state.supportTickets.filter(t => ["open", "in_progress"].includes(t.status)).length;
    const alertCount = (state.alerts || []).filter(a => a.status !== "resolved").length;
    const total = lowCount + ticketCount + alertCount;
    const badge = $("#notificationCount");
    if (badge) {
      badge.textContent = total > 99 ? "99+" : String(total);
      badge.hidden = total === 0;
    }
  }
  function setupSupportRealtime() {
    if (!supabase || !organizationId) return;
    supabase.channel(`support-${organizationId}`)
      .on("postgres_changes", {event:"*", schema:"public", table:"support_tickets", filter:`organization_id=eq.${organizationId}`}, async () => {
        try {
          await loadSupportTickets();
          updateNotificationCount();
          if (currentPage === "Alertas") renderPage();
          toast("Novo chamado recebido. Confira em Alertas.", "info");
        } catch (e) { console.error("Falha ao atualizar chamados:", e); }
      })
      .subscribe();
  }
  function priorityLabel(priority) {
    return ({urgent:"Urgente", high:"Alta", normal:"Normal", low:"Baixa"})[priority] || priority || "Normal";
  }

  async function saveBackend(reason="state_updated") {
    if(!supabase || !organizationId) return;
    saving=true; updateSaveIndicator();
    const {data:row,error:readError}=await supabase.from("app_state").select("version").eq("organization_id",organizationId).single();
    if(readError) { saving=false; updateSaveIndicator(); throw readError; }
    const next=(Number(row?.version)||0)+1;
    const {error}=await supabase.from("app_state").update({
      state: JSON.parse(JSON.stringify(state)), version: next, updated_by: currentUser?.id || null
    }).eq("organization_id",organizationId);
    saving=false; updateSaveIndicator();
    if(error) throw error;
    if(reason) console.debug("Persistido:",reason);
  }
  function queueSave(reason) {
    clearTimeout(saveTimer);
    saveTimer=setTimeout(async()=>{try{await saveBackend(reason)}catch(e){console.error(e);toast("Não foi possível salvar no Supabase.","error")}},500);
  }
  function updateSaveIndicator() {
    const el=$("#saveStatus"); if(el) el.textContent=saving ? "Salvando…" : (supabase&&organizationId ? "Sincronizado" : "Modo local");
  }

  function renderNav() {
    const make=items=>items.map(([label,key])=>`<button class="nav-item ${currentPage===label?"active":""}" data-page="${label}">
      <span class="nav-icon">${icons[key] ? `<img src="assets/icons/${icons[key]}.svg" alt="">`:""}</span><span class="nav-label">${label}</span>
    </button>`).join("");
    $("#mainNav").innerHTML=make(navMain);
    $("#adminNav").innerHTML=isAdmin() ? make(navAdmin) : "";
    $$(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  }

  function navigate(page) {
    currentPage=page; renderNav(); renderPage();
    $("#sidebar")?.classList.remove("mobile-open"); $("#sidebarBackdrop")?.classList.remove("show");
    document.title=`${page} | Lara Iza`;
  }

  function stat(title,value,sub) {
    return `<article class="dashboard-card"><small>${esc(title)}</small><strong>${esc(value)}</strong><span>${esc(sub||"")}</span></article>`;
  }

  function dashboard() {
    const low=state.products.filter(p=>parseNumber(p.stock)<=Number(state.settings.lowStockThreshold||5));
    const totalValue=state.products.reduce((s,p)=>s+parseNumber(p.stock)*parseNumber(p.cost),0);
    const recent=[...state.movements].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,6);
    return `<section class="content-section">
      <div class="welcome-banner"><div><span class="eyebrow">PAINEL PRINCIPAL</span><h2>${esc(greeting())}</h2><p>${esc(userRoleLabel())} · Resumo operacional da Lara Iza.</p></div><div class="welcome-avatar">${profile.photo_url ? `<img src="${esc(profile.photo_url)}" alt="">` : esc(firstName().charAt(0).toUpperCase())}</div></div>
      <div class="page-actions"><div><h2>Visão geral</h2><p>Resumo operacional do seu estoque.</p></div><button class="primary-btn" data-action="new-product">+ Novo produto</button></div>
      <div class="dashboard-grid">
        ${stat("Produtos",state.products.length,"itens cadastrados")}
        ${stat("Estoque",""+state.products.reduce((s,p)=>s+parseNumber(p.stock),0),"unidades")}
        ${stat("Valor em estoque",money(totalValue),"custo estimado")}
        ${stat("Estoque baixo",low.length,low.length?"requer atenção":"nenhum alerta")}
      </div>
      <div class="dashboard-charts">
        <div class="panel chart-panel"><div class="panel-head"><div><h3>Movimentações</h3><p>Entradas e saídas por dia.</p></div></div><div class="chart-wrap"><canvas id="dashboardMovementChart"></canvas></div></div>
        <div class="panel chart-panel"><div class="panel-head"><div><h3>Estoque por categoria</h3><p>Distribuição das unidades.</p></div></div><div class="chart-wrap chart-wrap-small"><canvas id="categoryChart"></canvas></div></div>
        <div class="panel chart-panel"><div class="panel-head"><div><h3>Status do estoque</h3><p>Produtos dentro do limite.</p></div></div><div class="chart-wrap chart-wrap-small"><canvas id="stockStatusChart"></canvas></div></div>
      </div>
      <div class="panel"><div class="panel-head"><h3>Movimentações recentes</h3><button class="link-btn" data-page="Estoque">Ver estoque</button></div>
      ${recent.length?`<div class="table-wrap"><table><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Quantidade</th></tr></thead><tbody>${recent.map(m=>`<tr><td>${date(m.created_at)}</td><td>${esc(productName(m.product_id))}</td><td>${esc(m.type==="in"?"Entrada":"Saída")}</td><td>${esc(m.quantity)}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Nenhuma movimentação registrada.</div>`}</div>
    </section>`;
  }
  function productName(id){return state.products.find(p=>p.id===id)?.name||"Produto removido";}

  function crudPage(kind,title,desc,fields) {
    const items=state[kind]||[];
    const filtered=items.filter(x=>Object.values(x).join(" ").toLowerCase().includes(searchTerm.toLowerCase()));
    return `<section class="content-section">
      <div class="page-actions"><div><h2>${title}</h2><p>${desc}</p></div><button class="primary-btn" data-action="new-${kind}">+ Adicionar</button></div>
      <div class="panel"><div class="local-search"><input id="pageSearch" value="${esc(searchTerm)}" placeholder="Pesquisar ${title.toLowerCase()}…"></div>
      ${filtered.length?`<div class="table-wrap"><table><thead><tr>${fields.map(f=>`<th>${f.label}</th>`).join("")}<th>Ações</th></tr></thead><tbody>
      ${filtered.map(x=>`<tr>${fields.map(f=>`<td>${esc(f.format?f.format(x):x[f.key]??"—")}</td>`).join("")}<td class="row-actions"><button data-action="edit" data-kind="${kind}" data-id="${esc(x.id)}">Editar</button><button data-action="delete" data-kind="${kind}" data-id="${esc(x.id)}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Nenhum registro encontrado.</div>`}</div>
    </section>`;
  }

  function renderPage() {
    const subtitle=currentPage==="Dashboard"?"Aqui está o resumo do seu estoque hoje.":`Gerencie ${currentPage.toLowerCase()} do sistema.`;
    $("#pageTitle").textContent=greeting();
    $("#pageSubtitle").textContent=subtitle;
    let html="";
    if(currentPage==="Dashboard") html=dashboard();
    else if(currentPage==="Produtos") html=crudPage("products","Produtos","Cadastre e acompanhe seus produtos.",[
      {label:"Produto",key:"name"},{label:"Categoria",key:"category",format:x=>categoryName(x.category)},
      {label:"Estoque",key:"stock"},{label:"Preço",key:"price",format:x=>money(x.price)}
    ]);
    else if(currentPage==="Categorias") html=crudPage("categories","Categorias","Organize os produtos por categoria.",[{label:"Nome",key:"name"},{label:"Descrição",key:"description"}]);
    else if(currentPage==="Fornecedores") html=crudPage("suppliers","Fornecedores","Mantenha os dados dos fornecedores atualizados.",[{label:"Nome",key:"name"},{label:"CPF/CNPJ",key:"document"},{label:"Contato",key:"contact"},{label:"E-mail",key:"email"}]);
    else if(currentPage==="Clientes") html=crudPage("customers","Clientes","Cadastre clientes e contatos.",[{label:"Nome",key:"name"},{label:"CPF/CNPJ",key:"document"},{label:"Telefone",key:"phone"},{label:"E-mail",key:"email"}]);
    else if(currentPage==="Estoque") html=stockPage();
    else if(currentPage==="Entradas"||currentPage==="Saídas") html=movementPage(currentPage==="Entradas"?"in":"out");
    else if(currentPage==="Alertas") html=alertsPage();
    else if(currentPage==="Relatórios") html=reportsPage();
    else if(currentPage==="Configurações") html=settingsPage();
    else if(currentPage==="Usuários") html=usersPage();
    else if(currentPage==="Perfil") html=profilePage();
    else if(currentPage==="Suporte") html=supportPage();
    else if(currentPage==="Termos de Uso") html=legalPage("Termos de Uso","Use este espaço para publicar os termos oficiais da operação.");
    else if(currentPage==="Privacidade") html=legalPage("Privacidade","Use este espaço para publicar a política de privacidade oficial.");
    $("#page").innerHTML=html;
    bindPage();
  }
  function categoryName(id){return state.categories.find(c=>c.id===id)?.name || id || "Sem categoria";}
  function stockPage(){
    const low=state.products.filter(p=>parseNumber(p.stock)<=Number(state.settings.lowStockThreshold||5));
    return `<section class="content-section"><div class="page-actions"><div><h2>Estoque</h2><p>Acompanhe quantidades e níveis de reposição.</p></div></div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Quantidade</th><th>Custo</th><th>Valor</th><th>Status</th></tr></thead><tbody>
      ${state.products.length?state.products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(categoryName(p.category))}</td><td>${parseNumber(p.stock)}</td><td>${money(p.cost)}</td><td>${money((parseNumber(p.stock))*(p.cost||0))}</td><td><span class="status ${low.includes(p)?"warning":"ok"}">${low.includes(p)?"Estoque baixo":"Normal"}</span></td></tr>`).join(""):`<tr><td colspan="6" class="empty">Cadastre seu primeiro produto.</td></tr>`}
      </tbody></table></div></div></section>`;
  }
  function movementPage(type){
    const list=state.movements.filter(m=>m.type===type);
    return `<section class="content-section"><div class="page-actions"><div><h2>${type==="in"?"Entradas":"Saídas"}</h2><p>Registre movimentações para manter o saldo atualizado.</p></div><button class="primary-btn" data-action="new-movement" data-type="${type}">+ Registrar ${type==="in"?"entrada":"saída"}</button></div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th>Data</th><th>Produto</th><th>Quantidade</th><th>Observação</th></tr></thead><tbody>
      ${list.length?list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map(m=>`<tr><td>${date(m.created_at)}</td><td>${esc(productName(m.product_id))}</td><td>${m.quantity}</td><td>${esc(m.note||"—")}</td></tr>`).join(""):`<tr><td colspan="4" class="empty">Nenhuma movimentação.</td></tr>`}
      </tbody></table></div></div></section>`;
  }
  function alertsPage(){
    const low=state.products.filter(p=>(parseNumber(p.stock))<=parseNumber(state.settings.lowStockThreshold||5));
    const tickets=state.supportTickets.filter(t=>["open","in_progress"].includes(t.status));
    const manual=state.alerts || [];
    const lowHtml=low.map(p=>`<div class="alert-row"><div><strong>Estoque baixo: ${esc(p.name)}</strong><span>${parseNumber(p.stock)} unidade(s) — mínimo ${state.settings.lowStockThreshold}</span></div><span class="status warning">Estoque</span></div>`).join("");
    const manualHtml=manual.map(a=>`<div class="alert-row"><div><strong>${esc(a.title)}</strong><span>${esc(a.message)} · ${date(a.created_at)}</span></div><div class="alert-actions"><span class="status ${a.status==="resolved"?"ok":"warning"}">${a.status==="resolved"?"Resolvido":"Novo"}</span>${a.status!=="resolved"?`<button class="secondary-btn" data-action="ack-alert" data-id="${esc(a.id)}">Responder</button>`:""}</div></div>`).join("");
    const ticketHtml=tickets.map(t=>`<div class="alert-row alert-ticket"><div><strong>Chamado: ${esc(t.subject)}</strong><span>${esc(t.message)} · ${priorityLabel(t.priority)} · ${date(t.created_at)}</span></div><button class="secondary-btn" data-action="respond-ticket" data-id="${esc(t.id)}">Responder</button></div>`).join("");
    const adminAction=isAdmin()?`<div class="action-group"><button class="primary-btn" data-action="new-alert">+ Novo alerta</button><button class="secondary-btn" data-action="new-ticket">+ Novo chamado</button></div>`:"";
    const empty=!lowHtml && !ticketHtml && !manualHtml;
    return `<section class="content-section"><div class="page-actions"><div><h2>Alertas</h2><p>Itens, alertas internos e chamados que precisam de atenção.</p></div>${adminAction}</div><div class="panel">${ticketHtml}${manualHtml}${lowHtml}${empty?`<div class="empty">Tudo certo! Não há alertas ou chamados pendentes.</div>`:""}</div></section>`;
  }
  function reportsPage(){
    const total=state.products.reduce((s,p)=>s+(parseNumber(p.stock)*parseNumber(p.price)),0);
    const movementIn=state.movements.filter(m=>m.type==="in").reduce((s,m)=>s+parseNumber(m.quantity),0);
    const movementOut=state.movements.filter(m=>m.type==="out").reduce((s,m)=>s+parseNumber(m.quantity),0);
    return `<section class="content-section">
      <div class="page-actions"><div><h2>Relatórios</h2><p>Indicadores atuais do cadastro, estoque e movimentações.</p></div>
        <div class="action-group"><button class="secondary-btn" data-action="export-excel">Excel</button><button class="secondary-btn" data-action="export-pdf">Relatório PDF</button><button class="secondary-btn" data-action="export-chart">Gráfico PNG</button></div>
      </div>
      <div class="dashboard-grid">${stat("Produtos",state.products.length,"cadastros")}${stat("Categorias",state.categories.length,"cadastros")}${stat("Fornecedores",state.suppliers.length,"cadastros")}${stat("Valor de venda",money(total),"estoque atual")}</div>
      <div class="two-col">
        <div class="panel chart-panel"><div class="panel-head"><div><h3>Movimentações</h3><p>Entradas e saídas registradas.</p></div></div><canvas id="movementChart" height="260"></canvas></div>
        <div class="panel"><h3>Resumo operacional</h3><div class="report-list"><div><span>Entradas</span><strong>${movementIn}</strong></div><div><span>Saídas</span><strong>${movementOut}</strong></div><div><span>Estoque atual</span><strong>${state.products.reduce((s,p)=>s+parseNumber(p.stock),0)}</strong></div><div><span>Chamados abertos</span><strong>${state.supportTickets.filter(t=>["open","in_progress"].includes(t.status)).length}</strong></div></div></div>
      </div>
      <div class="panel"><div class="panel-head"><h3>Produtos</h3><button class="link-btn" data-action="export-excel">Exportar tabela</button></div>
        <div class="table-wrap"><table id="reportProductsTable"><thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Custo</th><th>Preço</th><th>Valor</th></tr></thead><tbody>
        ${state.products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(categoryName(p.category))}</td><td>${parseNumber(p.stock)}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td>${money(parseNumber(p.stock)*parseNumber(p.price))}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">Nenhum produto.</td></tr>`}
        </tbody></table></div>
      </div>
    </section>`;
  }
  function settingsPage(){
    return `<section class="content-section"><div class="page-actions"><div><h2>Configurações</h2><p>Preferências da operação.</p></div></div><div class="panel form-grid">
      <label>Limite para alerta de estoque<input id="lowStock" type="number" min="0" value="${state.settings.lowStockThreshold}"></label>
      <button class="primary-btn" data-action="save-settings">Salvar configurações</button>
    </div></section>`;
  }
  function usersPage(){
    const people=[
      ["Saulo","saulo@laraiza.com","admin"],["Amanda","amanda@laraiza.com","admin"],
      ["Eduardo","eduardo@laraiza.com","manager"],["Vitoria","vitoria@laraiza.com","manager"],["Maria","maria@laraiza.com","employee"]
    ];
    return `<section class="content-section"><div class="page-actions"><div><h2>Equipe</h2><p>Perfis e níveis de acesso da Lara Iza.</p></div></div>
      <div class="user-grid">${people.map(([name,email,role])=>`<article class="user-card"><div class="avatar user-avatar">${name[0]}</div><div><strong>${name}</strong><span>${email}</span><small class="role-pill role-${role}">${ROLE_LABELS[role]}</small></div></article>`).join("")}</div>
      <div class="panel"><h3>Seu acesso</h3><p><strong>${esc(firstName())}</strong> · ${esc(currentUser?.email||"—")} · <strong>${esc(userRoleLabel())}</strong></p><button class="secondary-btn" data-page="Perfil">Editar meu perfil</button></div></section>`;
  }
  function profilePage(){
    return `<section class="content-section"><div class="page-actions"><div><h2>Meu perfil</h2><p>Atualize seus dados, telefone e foto.</p></div></div>
      <div class="profile-layout"><div class="panel profile-preview"><div class="profile-photo-large">${profile.photo_url ? `<img src="${esc(profile.photo_url)}" alt="Foto de perfil">` : esc(firstName().charAt(0).toUpperCase())}</div><h3>${esc(firstName())}</h3><p>${esc(currentUser?.email||"")}</p><span class="role-pill role-${esc(profile.role)}">${esc(userRoleLabel())}</span></div>
      <form class="panel form-grid profile-form" id="profileForm"><label>Nome completo<input name="full_name" value="${esc(profile.full_name)}" required></label><label>Telefone<input name="phone" value="${esc(profile.phone)}" placeholder="(00) 00000-0000"></label><label class="full">Foto do perfil<input name="photo" type="file" accept="image/*"><small>PNG ou JPG. A imagem será armazenada na conta.</small></label><div class="profile-file-preview" id="profileFilePreview"></div><div class="modal-actions"><button type="submit" class="primary-btn">Salvar perfil</button><button type="button" class="secondary-btn" data-action="logout">Sair da conta</button></div></form></div></section>`;
  }
  function supportPage(){
    const canCreate=isAdmin();
    const tickets=state.supportTickets||[];
    return `<section class="content-section"><div class="page-actions"><div><h2>Suporte</h2><p>${canCreate?"Administradores podem abrir novos chamados. A equipe responde e acompanha os chamados existentes.":"Responda aos chamados recebidos e acompanhe o andamento."}</p></div>${canCreate?`<button class="primary-btn" data-action="new-ticket">+ Novo chamado</button>`:""}</div>
      <div class="support-ticket-grid">${tickets.length?tickets.map(t=>{const replies=(state.supportReplies||[]).filter(r=>r.ticket_id===t.id);const last=replies[replies.length-1];return `<article class="ticket-card"><div class="ticket-top"><span class="status ${t.status==="resolved"?"ok":"warning"}">${esc(t.status)}</span><span>${priorityLabel(t.priority)}</span></div><h3>${esc(t.subject)}</h3><p>${esc(t.message)}</p>${last?`<div class="ticket-last-reply"><strong>Última resposta</strong><span>${esc(last.message)}</span></div>`:""}<small>${date(t.created_at)} · ${replies.length} resposta(s)</small><button class="secondary-btn" data-action="respond-ticket" data-id="${esc(t.id)}">Responder</button></article>`}).join(""):`<div class="panel empty">Nenhum chamado registrado.</div>`}</div>
    </section>`;
  }
  function legalPage(title,text){return `<section class="content-section"><div class="panel legal"><h2>${title}</h2><p>${text}</p><p>O conteúdo jurídico definitivo deve ser revisado pelo responsável legal da organização antes da publicação.</p></div></section>`;}

  function openModal(title,body,onSubmit){
    const root=$("#modalRoot"); root.innerHTML=`<div class="modal-backdrop"><div class="modal"><button class="modal-close" aria-label="Fechar">×</button><h2>${title}</h2><form id="modalForm" class="form-grid">${body}<div class="modal-actions"><button type="button" class="secondary-btn modal-cancel">Cancelar</button><button class="primary-btn" type="submit">Salvar</button></div></form></div></div>`;
    $(".modal-close",root).onclick=closeModal; $(".modal-cancel",root).onclick=closeModal;
    $("#modalForm",root).addEventListener("submit",async e=>{e.preventDefault(); try{await onSubmit(new FormData(e.currentTarget));closeModal()}catch(err){console.error(err);toast(err.message||"Erro ao salvar","error")}});}
  function closeModal(){$("#modalRoot").innerHTML="";}
  function input(name,label,value="",type="text",required=false){return `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${required?"required":""}></label>`;}
  function productModal(item=null){
    openModal(item?"Editar produto":"Novo produto",
      input("name","Nome",item?.name||"","text",true)+
      `<label>Categoria<select name="category"><option value="">Sem categoria</option>${state.categories.map(c=>`<option value="${c.id}" ${item?.category===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select></label>`+
      input("stock","Estoque",item?.stock??0,"number",true)+input("cost","Custo",item?.cost??0,"text",true)+input("price","Preço",item?.price??0,"text",true),
      async f=>{const obj={id:item?.id||uid("prd"),name:String(f.get("name")).trim(),category:f.get("category"),stock:parseNumber(f.get("stock")),cost:parseNumber(f.get("cost")),price:parseNumber(f.get("price")),updated_at:new Date().toISOString()}; if(item) Object.assign(item,obj); else state.products.push({...obj,created_at:new Date().toISOString()}); queueSave("product");renderPage(); updateNotificationCount();});
  }
  function genericModal(kind,item){
    const specs={categories:[["name","Nome"],["description","Descrição"]],suppliers:[["name","Nome"],["document","CPF/CNPJ"],["contact","Contato"],["email","E-mail"]],customers:[["name","Nome"],["document","CPF/CNPJ"],["phone","Telefone"],["email","E-mail"]]}[kind];
    openModal(item?"Editar registro":"Adicionar registro",specs.map(([n,l])=>input(n,l,item?.[n]||"","text",n==="name")).join(""),async f=>{
      const obj={id:item?.id||uid(kind.slice(0,-1)),created_at:item?.created_at||new Date().toISOString()};
      specs.forEach(([n])=>obj[n]=String(f.get(n)||"").trim()); if(item) Object.assign(item,obj); else state[kind].push(obj); queueSave(kind); renderPage(); updateNotificationCount();
    });
  }
  function movementModal(type){
    if(!state.products.length){toast("Cadastre um produto primeiro.","error");return;}
    openModal(type==="in"?"Registrar entrada":"Registrar saída",
      `<label>Produto<select name="product_id" required>${state.products.map(p=>`<option value="${p.id}">${esc(p.name)} (${parseNumber(p.stock)})</option>`).join("")}</select></label>`+
      input("quantity","Quantidade","1","number",true)+input("note","Observação","","text"),
      async f=>{const p=state.products.find(x=>x.id===f.get("product_id"));const q=Math.max(0,parseNumber(f.get("quantity")));if(!p||q<=0)throw new Error("Informe uma quantidade válida.");if(type==="out"&&q>Number(parseNumber(p.stock)))throw new Error("Quantidade maior que o estoque disponível.");p.stock=Number(parseNumber(p.stock))+(type==="in"?q:-q);state.movements.push({id:uid("mov"),type,product_id:p.id,quantity:q,note:String(f.get("note")||"").trim(),created_at:new Date().toISOString()});queueSave("movement");renderPage(); updateNotificationCount();});
  }

  function alertModal(){
    if(!isAdmin()){toast("Apenas administradores podem criar alertas.","error");return;}
    openModal("Novo alerta interno",
      input("title","Título","","text",true)+input("message","Mensagem","","text",true),
      async f=>{
        if(!supabase||!organizationId) throw new Error("Configure o Supabase para criar alertas.");
        const {error}=await supabase.from("alerts").insert({
          organization_id:organizationId,created_by:currentUser.id,
          title:String(f.get("title")).trim(),message:String(f.get("message")).trim(),status:"open"
        });
        if(error) throw error;
        await loadAlerts(); updateNotificationCount(); renderPage(); toast("Alerta criado.","success");
      });
  }
  function ackAlert(alertId){
    const alert=state.alerts.find(a=>a.id===alertId);
    if(!alert||!supabase||!organizationId) return;
    supabase.from("alerts").update({status:"resolved"}).eq("id",alertId).then(async({error})=>{
      if(error){toast(error.message,"error");return;}
      await loadAlerts(); updateNotificationCount(); renderPage(); toast("Alerta marcado como resolvido.","success");
    });
  }
  function ticketModal(){
    if(!isAdmin()){toast("Apenas administradores podem abrir chamados.","error");return;}
    openModal("Novo chamado",
      input("subject","Assunto","","text",true)+`<label>Mensagem<textarea name="message" rows="5" required></textarea></label><label>Prioridade<select name="priority"><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>`,
      async f=>{
        if(!supabase||!organizationId) throw new Error("Configure o Supabase para enviar chamados.");
        const {error}=await supabase.from("support_tickets").insert({organization_id:organizationId,user_id:currentUser.id,subject:String(f.get("subject")).trim(),message:String(f.get("message")).trim(),priority:f.get("priority")});
        if(error) throw error;
        await loadSupportTickets(); updateNotificationCount(); renderPage(); toast("Chamado criado.","success");
      });
  }
  function respondTicketModal(ticket){
    if(!ticket) return;
    openModal(`Responder: ${ticket.subject}`,
      `<div class="ticket-context"><strong>Chamado</strong><p>${esc(ticket.message)}</p></div><label>Resposta<textarea name="reply" rows="5" required placeholder="Escreva sua resposta..."></textarea></label><label>Status<select name="status"><option value="in_progress" ${ticket.status==="in_progress"?"selected":""}>Em andamento</option><option value="resolved" ${ticket.status==="resolved"?"selected":""}>Resolvido</option></select></label>`,
      async f=>{
        if(!supabase||!organizationId) throw new Error("Configure o Supabase para responder chamados.");
        const {error}=await supabase.from("support_ticket_replies").insert({ticket_id:ticket.id,user_id:currentUser.id,message:String(f.get("reply")).trim()});
        if(error) throw error;
        const {error:updateError}=await supabase.from("support_tickets").update({status:f.get("status")}).eq("id",ticket.id);
        if(updateError) throw updateError;
        await loadSupportTickets(); updateNotificationCount(); renderPage(); toast("Resposta enviada.","success");
      });
  }
  async function saveProfileForm(e){
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const name=String(f.get("full_name")||"").trim();
    if(!name) { toast("Informe seu nome.","error"); return; }
    let photo=profile.photo_url||"";
    const file=f.get("photo");
    if(file instanceof File && file.size){
      if(file.size>2*1024*1024){toast("A foto deve ter no máximo 2 MB.","error");return;}
      photo=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file)});
    }
    const next={...profile,full_name:name,phone:String(f.get("phone")||"").trim(),photo_url:photo};
    if(!supabase||!currentUser) throw new Error("Sessão não disponível.");
    const {error}=await supabase.from("profiles").upsert({id:currentUser.id,full_name:next.full_name,phone:next.phone,photo_url:next.photo_url,role:profile.role});
    if(error) throw error;
    const {error:authError}=await supabase.auth.updateUser({data:{full_name:next.full_name,avatar_url:next.photo_url}});
    if(authError) console.warn("Metadados da conta não atualizados:",authError);
    profile=next; updateTopProfile(); renderPage(); toast("Perfil atualizado com sucesso.","success");
  }

  function bindPage(){
    $("#pageSearch")?.addEventListener("input",e=>{searchTerm=e.target.value;renderPage();const s=$("#pageSearch");if(s){s.focus();s.setSelectionRange(searchTerm.length,searchTerm.length)}})
    $$("#page [data-action]").forEach(b=>b.addEventListener("click",()=>{
      const a=b.dataset.action,k=b.dataset.kind,id=b.dataset.id,item=k&&state[k]?.find(x=>x.id===id);
      if(a==="new-product")productModal(); else if(a==="new-products")productModal();
      else if(a==="new-categories"||a==="new-suppliers"||a==="new-customers")genericModal({"new-categories":"categories","new-suppliers":"suppliers","new-customers":"customers"}[a]);
      else if(a==="edit"){if(k==="products")productModal(item);else genericModal(k,item)}
      else if(a==="delete"&&item){if(confirm("Excluir este registro?")){state[k]=state[k].filter(x=>x.id!==id);queueSave("delete");renderPage();updateNotificationCount()}}
      else if(a==="new-movement")movementModal(b.dataset.type);
      else if(a==="new-alert")alertModal();
      else if(a==="new-ticket")ticketModal();
      else if(a==="ack-alert")ackAlert(id);
      else if(a==="respond-ticket"){const ticket=state.supportTickets.find(t=>t.id===id);respondTicketModal(ticket);}
      else if(a==="save-settings"){state.settings.lowStockThreshold=Math.max(0,parseNumber($("#lowStock").value));queueSave("settings");toast("Configurações salvas.","success");renderPage()}
      else if(a==="export")exportState();
      else if(a==="export-excel")exportExcel();
      else if(a==="export-pdf")exportPdf();
      else if(a==="export-chart")exportChart();
      else if(a==="open-support")navigate("Suporte");
      else if(a==="logout")logout();
    }));
    $$("#page [data-page]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
    $("#supportForm")?.addEventListener("submit",sendSupport);
    renderMovementChart();
    renderDashboardCharts();
    $("#profileForm")?.addEventListener("submit",saveProfileForm);
    $("#profileForm input[name=\"photo\"]")?.addEventListener("change",e=>{
      const file=e.target.files?.[0]; const box=$("#profileFilePreview");
      if(file&&box){const r=new FileReader();r.onload=()=>box.innerHTML=`<img src="${esc(String(r.result))}" alt="Prévia da foto">`;r.readAsDataURL(file);}
    });
  }

  async function sendSupport(e){
    e.preventDefault(); const f=new FormData(e.currentTarget);
    if(!supabase||!organizationId){toast("Configure o Supabase para enviar chamados.","error");return;}
    const {error}=await supabase.from("support_tickets").insert({organization_id:organizationId,user_id:currentUser.id,subject:f.get("subject"),message:f.get("message"),priority:f.get("priority")});
    if(error){ toast(error.message,"error"); return; }
    await loadSupportTickets();
    await loadAlerts();
    updateNotificationCount();
    toast("Chamado enviado. O alerta foi adicionado.","success");
    e.currentTarget.reset();
    renderPage();
  }
  function downloadBlob(blob,name){
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  function exportState(){
    downloadBlob(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),`lara-iza-backup-${new Date().toISOString().slice(0,10)}.json`);
  }
  function reportRows(){
    return state.products.map(p=>({
      Produto:p.name||"", Categoria:categoryName(p.category), Estoque:parseNumber(p.stock),
      Custo:parseNumber(p.cost), Preço:parseNumber(p.price), "Valor em estoque":parseNumber(p.stock)*parseNumber(p.price)
    }));
  }
  function exportExcel(){
    if(!window.XLSX){toast("Biblioteca Excel indisponível.","error");return;}
    const wb=XLSX.utils.book_new();
    const products=XLSX.utils.json_to_sheet(reportRows());
    const movements=XLSX.utils.json_to_sheet(state.movements.map(m=>({Data:date(m.created_at),Produto:productName(m.product_id),Tipo:m.type==="in"?"Entrada":"Saída",Quantidade:parseNumber(m.quantity),Observação:m.note||""})));
    const suppliers=XLSX.utils.json_to_sheet(state.suppliers.map(s=>({Nome:s.name||"", "CPF/CNPJ":s.document||"",Contato:s.contact||"",Email:s.email||""})));
    const customers=XLSX.utils.json_to_sheet(state.customers.map(c=>({Nome:c.name||"", "CPF/CNPJ":c.document||"",Telefone:c.phone||"",Email:c.email||""})));
    XLSX.utils.book_append_sheet(wb,products,"Produtos"); XLSX.utils.book_append_sheet(wb,movements,"Movimentações"); XLSX.utils.book_append_sheet(wb,suppliers,"Fornecedores"); XLSX.utils.book_append_sheet(wb,customers,"Clientes");
    XLSX.writeFile(wb,`lara-iza-relatorio-${new Date().toISOString().slice(0,10)}.xlsx`);
    toast("Planilha Excel exportada.","success");
  }
  function exportChart(){
    const canvas=$("#movementChart"); if(!canvas){toast("Abra Relatórios para exportar o gráfico.","error");return;}
    const link=document.createElement("a"); link.download=`lara-iza-movimentacoes-${new Date().toISOString().slice(0,10)}.png`; link.href=canvas.toDataURL("image/png"); link.click();
  }
  function exportPdf(){
    if(!window.jspdf){toast("Biblioteca PDF indisponível.","error");return;}
    const {jsPDF}=window.jspdf; const doc=new jsPDF();
    doc.setFontSize(18); doc.text("Lara Iza — Relatório",14,18);
    doc.setFontSize(10); doc.text(`${greeting()} · ${userRoleLabel()} · ${new Date().toLocaleString("pt-BR")}`,14,26);
    let y=38; doc.setFontSize(11); doc.text(`Produtos: ${state.products.length}`,14,y); doc.text(`Categorias: ${state.categories.length}`,70,y); doc.text(`Fornecedores: ${state.suppliers.length}`,130,y); y+=10;
    doc.text("Produtos",14,y); y+=8;
    doc.setFontSize(8);
    reportRows().slice(0,22).forEach(r=>{doc.text(`${String(r.Produto).slice(0,28)} | ${r.Categoria} | Estoque: ${r.Estoque} | Preço: ${money(r.Preço)} | Valor: ${money(r["Valor em estoque"])}`,14,y); y+=5; if(y>280){doc.addPage();y=18;}});
    const canvas=$("#movementChart"); if(canvas){try{doc.addPage();doc.setFontSize(14);doc.text("Gráfico de movimentações",14,18);doc.addImage(canvas.toDataURL("image/png"),"PNG",14,28,180,90);}catch(e){console.warn(e)}}
    doc.save(`lara-iza-relatorio-${new Date().toISOString().slice(0,10)}.pdf`); toast("Relatório PDF exportado.","success");
  }
  function destroyChart(id){
    const canvas=$(id);
    if(canvas?._chart) canvas._chart.destroy();
    return canvas;
  }
  function chartPalette(n){
    const base=["#7c4dff","#236bd2","#c26b05","#258a3c","#c93670","#0f766e","#8b5cf6","#64748b"];
    return Array.from({length:n},(_,i)=>base[i%base.length]);
  }
  function renderDashboardCharts(){
    if(!window.Chart) return;
    const movement=destroyChart('#dashboardMovementChart');
    if(movement){
      const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});
      const labels=days.map(d=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));
      const ins=days.map(d=>state.movements.filter(m=>m.type==='in' && new Date(m.created_at)>=d && new Date(m.created_at)<new Date(d.getTime()+86400000)).reduce((s,m)=>s+parseNumber(m.quantity),0));
      const outs=days.map(d=>state.movements.filter(m=>m.type==='out' && new Date(m.created_at)>=d && new Date(m.created_at)<new Date(d.getTime()+86400000)).reduce((s,m)=>s+parseNumber(m.quantity),0));
      movement._chart=new Chart(movement,{type:'line',data:{labels,datasets:[{label:'Entradas',data:ins,tension:.35,borderWidth:3,pointRadius:3},{label:'Saídas',data:outs,tension:.35,borderWidth:3,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}});
    }
    const category=destroyChart('#categoryChart');
    if(category){
      const map=new Map(); state.products.forEach(p=>map.set(categoryName(p.category),(map.get(categoryName(p.category))||0)+parseNumber(p.stock)));
      const entries=[...map.entries()].sort((a,b)=>b[1]-a[1]);
      category._chart=new Chart(category,{type:'doughnut',data:{labels:entries.length?entries.map(x=>x[0]):['Sem dados'],datasets:[{data:entries.length?entries.map(x=>x[1]):[1],backgroundColor:chartPalette(Math.max(entries.length,1)),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom'}}}});
    }
    const status=destroyChart('#stockStatusChart');
    if(status){
      const threshold=Number(state.settings.lowStockThreshold||5);
      const low=state.products.filter(p=>parseNumber(p.stock)<=threshold).length;
      const normal=Math.max(0,state.products.length-low);
      status._chart=new Chart(status,{type:'doughnut',data:{labels:['Normal','Estoque baixo'],datasets:[{data:state.products.length?[normal,low]:[0,0],backgroundColor:['#258a3c','#c26b05'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{position:'bottom'}}}});
    }
  }
  function renderMovementChart(){
    const canvas=$("#movementChart"); if(!canvas||!window.Chart) return;
    const inCount=state.movements.filter(m=>m.type==="in").reduce((s,m)=>s+parseNumber(m.quantity),0);
    const outCount=state.movements.filter(m=>m.type==="out").reduce((s,m)=>s+parseNumber(m.quantity),0);
    if(canvas._chart) canvas._chart.destroy();
    canvas._chart=new Chart(canvas,{type:"bar",data:{labels:["Entradas","Saídas"],datasets:[{label:"Quantidade",data:[inCount,outCount],borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
  }

  function setupAuth(){
    const auth=$("#authScreen"), app=$("#app");
    const showAuth=()=>{auth.hidden=false;app.style.display="none"};
    const showApp=()=>{auth.hidden=true;app.style.display="flex";renderNav();renderPage();updateSaveIndicator()};
    $("#showRegister").onclick=()=>{$("#loginForm").hidden=true;$("#registerForm").hidden=false};
    $("#showLogin").onclick=()=>{$("#loginForm").hidden=false;$("#registerForm").hidden=true};
    $("#loginForm").addEventListener("submit",async e=>{e.preventDefault();setAuthMessage("Entrando…");if(!supabase){setAuthMessage("Supabase não configurado. Configure as variáveis no Netlify.","error");return}const email=$("#loginEmail")?.value?.trim();const password=$("#loginPassword")?.value||"";if(!email||!password){setAuthMessage("Informe o e-mail e a senha.","error");return}const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setAuthMessage(error.message,"error")});
    $("#registerForm").addEventListener("submit",async e=>{e.preventDefault();const name=$("#registerName")?.value?.trim();const email=$("#registerEmail")?.value?.trim();const password=$("#registerPassword")?.value||"";const passwordConfirm=$("#registerPasswordConfirm")?.value||"";if(password!==passwordConfirm){setAuthMessage("As senhas não coincidem.","error");return}if(!supabase){setAuthMessage("Supabase não configurado.","error");return}if(!email||!password){setAuthMessage("Informe o e-mail e a senha.","error");return}const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});if(error)setAuthMessage(error.message,"error");else setAuthMessage("Conta criada. Verifique seu e-mail se a confirmação estiver habilitada.","success")});
    if(supabase)supabase.auth.onAuthStateChange(async(_event,session)=>{if(session){try{currentUser=session.user;await loadBackend();showApp()}catch(err){console.error(err);setAuthMessage("Erro ao carregar seus dados: "+err.message,"error")}}else{currentUser=null;organizationId=null;showAuth()}});
    else showAuth();
  }
  function setAuthMessage(m,type="info"){const e=$("#authMessage");e.textContent=m;e.className=`auth-message ${type}`;}
  async function logout(){if(supabase)await supabase.auth.signOut();else location.reload();}
  function setupGlobal(){
    $("#globalSearch").addEventListener("input",e=>{searchTerm=e.target.value.trim();const q=searchTerm.toLowerCase();const hits=q?[...state.products.filter(p=>p.name.toLowerCase().includes(q)).slice(0,5),...state.categories.filter(c=>c.name.toLowerCase().includes(q)).slice(0,3)]:[];$("#searchResults").innerHTML=hits.map(x=>`<button data-result="${x.name}">${esc(x.name)}</button>`).join("");$("#searchResults").style.display=hits.length?"block":"none"});
    $("#searchResults").addEventListener("click",e=>{const b=e.target.closest("button");if(b){$("#globalSearch").value=b.dataset.result;$("#searchResults").style.display="none";navigate("Produtos")}})
    $("#notificationBtn").onclick=()=>navigate("Alertas");
    $("#profileBtn").onclick=()=>navigate("Perfil");
    $("#supportBtn").onclick=()=>navigate("Suporte");
    function applyTheme(theme) {
      const dark = theme === "dark";
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      localStorage.setItem("lara-theme", dark ? "dark" : "light");
      const label = $("#themeLabel");
      if (label) label.textContent = dark ? "Escuro" : "Claro";
      const sun = $(".theme-sun");
      const moon = $(".theme-moon");
      sun?.classList.toggle("is-active", !dark);
      moon?.classList.toggle("is-active", dark);
      $("#themeToggle")?.setAttribute("aria-pressed", String(dark));
    }
    $("#themeToggle").onclick=()=>applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    applyTheme(localStorage.getItem("lara-theme") === "dark" ? "dark" : "light");
    $$("#appFooter [data-page]").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
    $("#collapseBtn")?.addEventListener("click",()=>{
      $("#sidebar")?.classList.toggle("collapsed");
      localStorage.setItem("lara-sidebar-collapsed",$("#sidebar")?.classList.contains("collapsed")?"1":"0");
    });
    $("#mobileMenuBtn")?.addEventListener("click",()=>{$("#sidebar")?.classList.toggle("mobile-open");$("#sidebarBackdrop")?.classList.toggle("show");});
    $("#sidebarBackdrop")?.addEventListener("click",()=>{$("#sidebar")?.classList.remove("mobile-open");$("#sidebarBackdrop")?.classList.remove("show");});
    if(localStorage.getItem("lara-sidebar-collapsed")==="1") $("#sidebar")?.classList.add("collapsed");
  }
  async function init(){
    try{
      initInlineIcons();
      setupGlobal(); setupAuth();
      const ok=await loadBackend().catch(()=>false);
      if(ok){renderNav();renderPage()}
      updateSaveIndicator();
    }catch(e){console.error(e);toast("Erro ao inicializar o sistema.","error")}
  }
  document.addEventListener("DOMContentLoaded",init);
})();
