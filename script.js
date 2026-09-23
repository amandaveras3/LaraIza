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
    settings: { lowStockThreshold: 5 }
  });

  const state = emptyState();
  let organizationId = null;
  let currentUser = null;
  let currentPage = "Dashboard";
  let searchTerm = "";
  let saveTimer = null;
  let saving = false;

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
  function money(v) { return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0); }
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

  async function loadBackend() {
    if (!supabase) return false;
    const {data:{session}} = await supabase.auth.getSession();
    if (!session) return false;
    currentUser=session.user;
    const {data:org,error:orgError}=await supabase.rpc("ensure_my_organization");
    if(orgError) throw orgError;
    organizationId=org;
    const {data,rowError}=await supabase.from("app_state").select("state,version").eq("organization_id",organizationId).maybeSingle();
    if(rowError) throw rowError;
    if(data?.state) Object.assign(state,data.state);
    normalize();
    await loadSupportTickets();
    updateNotificationCount();
    setupSupportRealtime();
    return true;
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
  }
  function updateNotificationCount() {
    const lowCount = state.products.filter(p => (Number(p.stock) || 0) <= Number(state.settings.lowStockThreshold || 5)).length;
    const ticketCount = state.supportTickets.filter(t => ["open", "in_progress"].includes(t.status)).length;
    const total = lowCount + ticketCount;
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
      <span class="nav-icon">${icons[key] ? `<img src="assets/icons/${icons[key]}.svg" alt="">`:""}</span><span>${label}</span>
    </button>`).join("");
    $("#mainNav").innerHTML=make(navMain); $("#adminNav").innerHTML=make(navAdmin);
    $$(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  }

  function navigate(page) {
    currentPage=page; renderNav(); renderPage();
    document.title=`${page} | Lara Iza`;
  }

  function stat(title,value,sub) {
    return `<article class="dashboard-card"><small>${esc(title)}</small><strong>${esc(value)}</strong><span>${esc(sub||"")}</span></article>`;
  }

  function dashboard() {
    const low=state.products.filter(p=>(Number(p.stock)||0)<=Number(state.settings.lowStockThreshold||5));
    const totalValue=state.products.reduce((s,p)=>s+(Number(p.stock)||0)*(Number(p.cost)||0),0);
    const recent=[...state.movements].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,6);
    return `<section class="content-section">
      <div class="page-actions"><div><h2>Visão geral</h2><p>Resumo operacional do seu estoque.</p></div><button class="primary-btn" data-action="new-product">+ Novo produto</button></div>
      <div class="dashboard-grid">
        ${stat("Produtos",state.products.length,"itens cadastrados")}
        ${stat("Estoque",""+state.products.reduce((s,p)=>s+(Number(p.stock)||0),0),"unidades")}
        ${stat("Valor em estoque",money(totalValue),"custo estimado")}
        ${stat("Estoque baixo",low.length,low.length?"requer atenção":"nenhum alerta")}
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
    $("#pageTitle").textContent=currentUser?.user_metadata?.full_name ? `Bem-vinda, ${currentUser.user_metadata.full_name.split(" ")[0]}!` : "Lara Iza";
    $("#pageSubtitle").textContent=subtitle;
    let html="";
    if(currentPage==="Dashboard") html=dashboard();
    else if(currentPage==="Produtos") html=crudPage("products","Produtos","Cadastre e acompanhe seus produtos.",[
      {label:"Produto",key:"name"},{label:"Categoria",key:"category",format:x=>categoryName(x.category)},
      {label:"Estoque",key:"stock"},{label:"Preço",key:"price",format:x=>money(x.price)}
    ]);
    else if(currentPage==="Categorias") html=crudPage("categories","Categorias","Organize os produtos por categoria.",[{label:"Nome",key:"name"},{label:"Descrição",key:"description"}]);
    else if(currentPage==="Fornecedores") html=crudPage("suppliers","Fornecedores","Mantenha os dados dos fornecedores atualizados.",[{label:"Nome",key:"name"},{label:"Contato",key:"contact"},{label:"E-mail",key:"email"}]);
    else if(currentPage==="Clientes") html=crudPage("customers","Clientes","Cadastre clientes e contatos.",[{label:"Nome",key:"name"},{label:"Telefone",key:"phone"},{label:"E-mail",key:"email"}]);
    else if(currentPage==="Estoque") html=stockPage();
    else if(currentPage==="Entradas"||currentPage==="Saídas") html=movementPage(currentPage==="Entradas"?"in":"out");
    else if(currentPage==="Alertas") html=alertsPage();
    else if(currentPage==="Relatórios") html=reportsPage();
    else if(currentPage==="Configurações") html=settingsPage();
    else if(currentPage==="Usuários") html=usersPage();
    else if(currentPage==="Suporte") html=supportPage();
    else if(currentPage==="Termos de Uso") html=legalPage("Termos de Uso","Use este espaço para publicar os termos oficiais da operação.");
    else if(currentPage==="Privacidade") html=legalPage("Privacidade","Use este espaço para publicar a política de privacidade oficial.");
    $("#page").innerHTML=html;
    bindPage();
  }
  function categoryName(id){return state.categories.find(c=>c.id===id)?.name || id || "Sem categoria";}
  function stockPage(){
    const low=state.products.filter(p=>(Number(p.stock)||0)<=Number(state.settings.lowStockThreshold||5));
    return `<section class="content-section"><div class="page-actions"><div><h2>Estoque</h2><p>Acompanhe quantidades e níveis de reposição.</p></div></div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Quantidade</th><th>Custo</th><th>Valor</th><th>Status</th></tr></thead><tbody>
      ${state.products.length?state.products.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(categoryName(p.category))}</td><td>${p.stock||0}</td><td>${money(p.cost)}</td><td>${money((p.stock||0)*(p.cost||0))}</td><td><span class="status ${low.includes(p)?"warning":"ok"}">${low.includes(p)?"Estoque baixo":"Normal"}</span></td></tr>`).join(""):`<tr><td colspan="6" class="empty">Cadastre seu primeiro produto.</td></tr>`}
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
    const low=state.products.filter(p=>(Number(p.stock)||0)<=Number(state.settings.lowStockThreshold||5));
    const tickets=state.supportTickets.filter(t=>["open","in_progress"].includes(t.status));
    const lowHtml=low.map(p=>`<div class="alert-row"><div><strong>Estoque baixo: ${esc(p.name)}</strong><span>${p.stock||0} unidade(s) — mínimo ${state.settings.lowStockThreshold}</span></div><span class="status warning">Estoque</span></div>`).join("");
    const ticketHtml=tickets.map(t=>`<div class="alert-row alert-ticket"><div><strong>Chamado: ${esc(t.subject)}</strong><span>${esc(t.message)} · ${priorityLabel(t.priority)} · ${date(t.created_at)}</span></div><button class="secondary-btn" data-action="open-support">Ver suporte</button></div>`).join("");
    const empty=!lowHtml && !ticketHtml;
    return `<section class="content-section"><div class="page-actions"><div><h2>Alertas</h2><p>Itens e chamados que precisam de atenção.</p></div></div><div class="panel">${ticketHtml}${lowHtml}${empty?`<div class="empty">Tudo certo! Não há alertas ou chamados pendentes.</div>`:""}</div></section>`;
  }
  function reportsPage(){
    const total=state.products.reduce((s,p)=>s+(+p.stock||0)*(+p.price||0),0);
    return `<section class="content-section"><div class="page-actions"><div><h2>Relatórios</h2><p>Indicadores atuais do cadastro e estoque.</p></div><button class="secondary-btn" data-action="export">Exportar JSON</button></div>
      <div class="dashboard-grid">${stat("Produtos",state.products.length,"cadastros")}${stat("Categorias",state.categories.length,"cadastros")}${stat("Fornecedores",state.suppliers.length,"cadastros")}${stat("Valor de venda",money(total),"estoque atual")}</div>
      <div class="panel"><h3>Movimentações</h3><p>${state.movements.length} movimentação(ões) registrada(s).</p></div></section>`;
  }
  function settingsPage(){
    return `<section class="content-section"><div class="page-actions"><div><h2>Configurações</h2><p>Preferências da operação.</p></div></div><div class="panel form-grid">
      <label>Limite para alerta de estoque<input id="lowStock" type="number" min="0" value="${state.settings.lowStockThreshold}"></label>
      <button class="primary-btn" data-action="save-settings">Salvar configurações</button>
    </div></section>`;
  }
  function usersPage(){
    return `<section class="content-section"><div class="page-actions"><div><h2>Usuário atual</h2><p>Dados da sessão autenticada.</p></div></div><div class="panel"><p><strong>E-mail:</strong> ${esc(currentUser?.email||"—")}</p><p><strong>ID:</strong> ${esc(currentUser?.id||"—")}</p><button class="secondary-btn" data-action="logout">Sair da conta</button></div></section>`;
  }
  function supportPage(){
    return `<section class="content-section"><div class="page-actions"><div><h2>Suporte</h2><p>Envie uma solicitação para a equipe.</p></div></div><form class="panel form-grid" id="supportForm"><label>Assunto<input name="subject" required></label><label>Mensagem<textarea name="message" rows="5" required></textarea></label><label>Prioridade<select name="priority"><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label><button class="primary-btn">Enviar chamado</button></form></section>`;
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
      input("stock","Estoque",item?.stock??0,"number",true)+input("cost","Custo",item?.cost??0,"number",true)+input("price","Preço",item?.price??0,"number",true),
      async f=>{const obj={id:item?.id||uid("prd"),name:String(f.get("name")).trim(),category:f.get("category"),stock:Number(f.get("stock"))||0,cost:Number(f.get("cost"))||0,price:Number(f.get("price"))||0,updated_at:new Date().toISOString()}; if(item) Object.assign(item,obj); else state.products.push({...obj,created_at:new Date().toISOString()}); queueSave("product");renderPage(); updateNotificationCount();});
  }
  function genericModal(kind,item){
    const specs={categories:[["name","Nome"],["description","Descrição"]],suppliers:[["name","Nome"],["contact","Contato"],["email","E-mail"]],customers:[["name","Nome"],["phone","Telefone"],["email","E-mail"]]}[kind];
    openModal(item?"Editar registro":"Adicionar registro",specs.map(([n,l])=>input(n,l,item?.[n]||"","text",n==="name")).join(""),async f=>{
      const obj={id:item?.id||uid(kind.slice(0,-1)),created_at:item?.created_at||new Date().toISOString()};
      specs.forEach(([n])=>obj[n]=String(f.get(n)||"").trim()); if(item) Object.assign(item,obj); else state[kind].push(obj); queueSave(kind); renderPage(); updateNotificationCount();
    });
  }
  function movementModal(type){
    if(!state.products.length){toast("Cadastre um produto primeiro.","error");return;}
    openModal(type==="in"?"Registrar entrada":"Registrar saída",
      `<label>Produto<select name="product_id" required>${state.products.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.stock||0})</option>`).join("")}</select></label>`+
      input("quantity","Quantidade","1","number",true)+input("note","Observação","","text"),
      async f=>{const p=state.products.find(x=>x.id===f.get("product_id"));const q=Math.max(0,Number(f.get("quantity"))||0);if(!p||q<=0)throw new Error("Informe uma quantidade válida.");if(type==="out"&&q>Number(p.stock||0))throw new Error("Quantidade maior que o estoque disponível.");p.stock=Number(p.stock||0)+(type==="in"?q:-q);state.movements.push({id:uid("mov"),type,product_id:p.id,quantity:q,note:String(f.get("note")||"").trim(),created_at:new Date().toISOString()});queueSave("movement");renderPage(); updateNotificationCount();});
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
      else if(a==="save-settings"){state.settings.lowStockThreshold=Math.max(0,Number($("#lowStock").value)||0);queueSave("settings");toast("Configurações salvas.","success");renderPage()}
      else if(a==="export")exportState();
      else if(a==="open-support")navigate("Suporte");
      else if(a==="logout")logout();
    }));
    $$("#page [data-page]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
    $("#supportForm")?.addEventListener("submit",sendSupport);
  }

  async function sendSupport(e){
    e.preventDefault(); const f=new FormData(e.currentTarget);
    if(!supabase||!organizationId){toast("Configure o Supabase para enviar chamados.","error");return;}
    const {error}=await supabase.from("support_tickets").insert({organization_id:organizationId,user_id:currentUser.id,subject:f.get("subject"),message:f.get("message"),priority:f.get("priority")});
    if(error){ toast(error.message,"error"); return; }
    await loadSupportTickets();
    updateNotificationCount();
    toast("Chamado enviado. O alerta foi adicionado.","success");
    e.currentTarget.reset();
    renderPage();
  }
  function exportState(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=`lara-iza-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
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
    $("#profileBtn").onclick=()=>navigate("Usuários");
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
