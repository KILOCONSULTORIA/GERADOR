/* ============================================================
   STATE
   ============================================================ */
const state = {
  config: {
    siteEmpresa: 'KILO EDUCACIONAL',
    cursoNome: '',
    cargaHoraria: '',
    dataInicio: '',
    dataFim: '',
    localTreinamento: 'Mossoró/RN',
    normasTexto: '',
    conteudoTexto: ''
  },
  cursos: [],
  instrutores: [],
  alunos: []
};

let editingInstrutorId = null;
let editingCursoId = null;

const STORAGE_KEY = 'certificados-data';
const appShell = document.getElementById('appShell');

function showView(viewName){
  const targetBtn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
  if(!targetBtn) return;

  document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.remove('active'));
  document.querySelectorAll('.view').forEach(view=>view.classList.remove('active'));
  targetBtn.classList.add('active');
  const targetView = document.getElementById(`view-${viewName}`);
  if(targetView) targetView.classList.add('active');

  if(viewName === 'emitir') refreshPreviewSelect();
  if(viewName === 'config') refreshCursoSelect();
}

if(appShell){
  appShell.hidden = false;
  appShell.style.display = 'grid';
}

/* ============================================================
   HELPERS
   ============================================================ */
function toast(msg, isErr){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.className = 'toast', 2600);
}

function fileToBase64(file){
  return new Promise((resolve, reject)=>{
    const r = new FileReader();
    r.onload = ()=> resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function fmtDate(iso){
  if(!iso) return '';
  const [y,m,d] = iso.split('-');
  if(!y||!m||!d) return iso;
  return `${d}/${m}/${y}`;
}

function uid(){ return 'id' + Math.random().toString(36).slice(2,10); }

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(!saved) return;
  try{
    const parsed = JSON.parse(saved);
    if(parsed.config) Object.assign(state.config, parsed.config);
    if(parsed.cursos) state.cursos = parsed.cursos;
    if(parsed.instrutores) state.instrutores = parsed.instrutores;
    if(parsed.alunos) state.alunos = parsed.alunos;
  }catch(err){
    console.error('Erro ao carregar dados salvos:', err);
  }
}

/* the fixed KILO brand mark, reproduced exactly as it appears on the
   original certificate template — not user-editable */
function kiloLogoSVG(){
  return `
  <svg viewBox="0 0 60 36" xmlns="http://www.w3.org/2000/svg">
    <polygon points="0,36 14,36 34,4 20,4" fill="#c9cdc4"/>
    <polygon points="10,36 22,36 42,0 30,0" fill="#1f7a75"/>
  </svg>`;
}

/* ============================================================
   NAVIGATION
   ============================================================ */
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    showView(btn.dataset.view);
  });
});

/* ============================================================
   CATÁLOGO DE CURSOS
   ============================================================ */
function splitConteudo(raw){
  if(!raw) return [];
  return raw.split(/\r?\n|;|\|/).map(s=>s.trim()).filter(Boolean);
}

document.getElementById('addCursoBtn').addEventListener('click', ()=>{
  const nome = document.getElementById('cursoNomeCad').value.trim();
  const carga = document.getElementById('cursoCargaCad').value.trim();
  const normas = document.getElementById('cursoNormasCad').value.trim();
  const conteudoRaw = document.getElementById('cursoConteudoCad').value;

  if(!nome){ toast('Informe o nome do curso.', true); return; }

  if(editingCursoId){
    const item = state.cursos.find(c=>c.id===editingCursoId);
    Object.assign(item, {nome, cargaHoraria: carga, normasTexto: normas, conteudoTexto: conteudoRaw});
  } else {
    state.cursos.push({id: uid(), nome, cargaHoraria: carga, normasTexto: normas, conteudoTexto: conteudoRaw});
  }
  resetCursoForm();
  renderCursos();
  refreshCursoSelect();
  saveState();
  toast('Curso salvo no catálogo.');
});

document.getElementById('cancelCursoEditBtn').addEventListener('click', resetCursoForm);

function resetCursoForm(){
  editingCursoId = null;
  document.getElementById('cursoNomeCad').value = '';
  document.getElementById('cursoCargaCad').value = '';
  document.getElementById('cursoNormasCad').value = '';
  document.getElementById('cursoConteudoCad').value = '';
  document.getElementById('addCursoBtn').textContent = 'Salvar curso';
  document.getElementById('cancelCursoEditBtn').style.display = 'none';
}

function renderCursos(){
  const wrap = document.getElementById('cursosList');
  wrap.innerHTML = '';
  document.getElementById('cursoCount').textContent = state.cursos.length;
  document.getElementById('cursosEmpty').style.display = state.cursos.length ? 'none' : 'block';
  state.cursos.forEach(c=>{
    const topicos = splitConteudo(c.conteudoTexto).length;
    const div = document.createElement('div');
    div.className = 'course-card';
    div.innerHTML = `
      <div class="course-meta">
        <b>${c.nome}</b>
        <span>${c.cargaHoraria || 'carga horária não informada'} · ${topicos} tópico(s) programáticos</span>
        <span>${c.normasTexto || ''}</span>
      </div>
      <div class="row-actions">
        <button class="btn small secondary" data-edit="${c.id}">Editar</button>
        <button class="btn small danger" data-del="${c.id}">Remover</button>
      </div>`;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=>startEditCurso(b.dataset.edit)));
  wrap.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
    state.cursos = state.cursos.filter(c=>c.id!==b.dataset.del);
    renderCursos();
    refreshCursoSelect();
    saveState();
  }));
}

function startEditCurso(id){
  const c = state.cursos.find(x=>x.id===id);
  if(!c) return;
  editingCursoId = id;
  document.getElementById('cursoNomeCad').value = c.nome;
  document.getElementById('cursoCargaCad').value = c.cargaHoraria || '';
  document.getElementById('cursoNormasCad').value = c.normasTexto || '';
  document.getElementById('cursoConteudoCad').value = c.conteudoTexto || '';
  document.getElementById('addCursoBtn').textContent = 'Atualizar curso';
  document.getElementById('cancelCursoEditBtn').style.display = 'inline-block';
  window.scrollTo({top:0, behavior:'smooth'});
}

function refreshCursoSelect(){
  const sel = document.getElementById('cursoSelect');
  const current = sel.value;
  sel.innerHTML = '<option value="">— selecione um curso cadastrado —</option>';
  state.cursos.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nome;
    sel.appendChild(opt);
  });
  if(state.cursos.some(c=>c.id===current)) sel.value = current;
}

document.getElementById('cursoSelect').addEventListener('change', (e)=>{
  const c = state.cursos.find(x=>x.id===e.target.value);
  if(!c) return;
  document.getElementById('cursoNome').value = c.nome;
  document.getElementById('cargaHoraria').value = c.cargaHoraria || '';
  document.getElementById('normasTexto').value = c.normasTexto || '';
  document.getElementById('conteudoTexto').value = c.conteudoTexto || '';
});

/* ============================================================
   CONFIG VIEW
   ============================================================ */
document.getElementById('saveConfigBtn').addEventListener('click', ()=>{
  const c = state.config;
  c.siteEmpresa = document.getElementById('siteEmpresa').value.trim();
  c.cursoNome = document.getElementById('cursoNome').value.trim();
  c.cargaHoraria = document.getElementById('cargaHoraria').value.trim();
  c.dataInicio = document.getElementById('dataInicio').value;
  c.dataFim = document.getElementById('dataFim').value;
  c.localTreinamento = document.getElementById('localTreinamento').value.trim();
  c.normasTexto = document.getElementById('normasTexto').value.trim();
  c.conteudoTexto = document.getElementById('conteudoTexto').value;
  saveState();
  toast('Modelo salvo. Vá para "Turma" ou "Emitir" quando quiser.');
});

document.getElementById('exportConfigBtn').addEventListener('click', ()=>{
  document.getElementById('saveConfigBtn').click();
  const data = JSON.stringify({config: state.config, instrutores: state.instrutores, cursos: state.cursos}, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'configuracao_certificado.json';
  a.click();
});

document.getElementById('importConfigInput').addEventListener('change', async ()=>{
  const f = document.getElementById('importConfigInput').files[0];
  if(!f) return;
  try{
    const text = await f.text();
    const parsed = JSON.parse(text);
    if(parsed.config) Object.assign(state.config, parsed.config);
    if(parsed.instrutores) state.instrutores = parsed.instrutores;
    if(parsed.cursos) state.cursos = parsed.cursos;
    saveState();
    fillConfigForm();
    renderInstrutores();
    renderCursos();
    refreshCursoSelect();
    toast('Configuração importada.');
  }catch(e){
    toast('Não foi possível ler esse arquivo.', true);
  }
});

function fillConfigForm(){
  const c = state.config;
  document.getElementById('siteEmpresa').value = c.siteEmpresa || '';
  document.getElementById('cursoNome').value = c.cursoNome || '';
  document.getElementById('cargaHoraria').value = c.cargaHoraria || '';
  document.getElementById('dataInicio').value = c.dataInicio || '';
  document.getElementById('dataFim').value = c.dataFim || '';
  document.getElementById('localTreinamento').value = c.localTreinamento || '';
  document.getElementById('normasTexto').value = c.normasTexto || '';
  document.getElementById('conteudoTexto').value = c.conteudoTexto || '';
}
fillConfigForm();

/* ============================================================
   INSTRUTORES VIEW
   ============================================================ */
const sigInput = document.getElementById('sigInput');
document.getElementById('sigDrop').addEventListener('click', e=>{ if(e.target!==sigInput) sigInput.click(); });
let pendingSig = null;
sigInput.addEventListener('change', async ()=>{
  const f = sigInput.files[0];
  if(!f) return;
  pendingSig = await fileToBase64(f);
  document.getElementById('sigDropLabel').textContent = 'Assinatura carregada: ' + f.name;
});

document.getElementById('instrutorFuncao').addEventListener('change', (e)=>{
  document.getElementById('instrutorFuncaoCustom').style.display = e.target.value === '__custom' ? 'block' : 'none';
});

document.getElementById('addInstrutorBtn').addEventListener('click', ()=>{
  const nome = document.getElementById('instrutorNome').value.trim();
  const qualificacao = document.getElementById('instrutorQualificacao').value.trim();
  const registro = document.getElementById('instrutorRegistro').value.trim();
  const funcaoSel = document.getElementById('instrutorFuncao');
  const funcao = funcaoSel.value === '__custom' ? document.getElementById('instrutorFuncaoCustom').value.trim() : funcaoSel.value;

  if(!nome){ toast('Informe o nome do instrutor.', true); return; }

  if(editingInstrutorId){
    const item = state.instrutores.find(i=>i.id===editingInstrutorId);
    Object.assign(item, {nome, qualificacao, registro, funcao});
    if(pendingSig) item.assinatura = pendingSig;
  } else {
    state.instrutores.push({id: uid(), nome, qualificacao, registro, funcao, assinatura: pendingSig});
  }

  resetInstrutorForm();
  renderInstrutores();
  saveState();
  toast('Assinatura salva.');
});

document.getElementById('cancelInstrutorEditBtn').addEventListener('click', resetInstrutorForm);

function resetInstrutorForm(){
  editingInstrutorId = null;
  pendingSig = null;
  document.getElementById('instrutorNome').value = '';
  document.getElementById('instrutorQualificacao').value = '';
  document.getElementById('instrutorRegistro').value = '';
  document.getElementById('instrutorFuncao').value = 'INSTRUTORA E RESPONSÁVEL TÉCNICA';
  document.getElementById('instrutorFuncaoCustom').style.display = 'none';
  document.getElementById('instrutorFuncaoCustom').value = '';
  document.getElementById('sigDropLabel').textContent = 'Clique para enviar a assinatura em PNG';
  document.getElementById('addInstrutorBtn').textContent = 'Salvar assinatura';
  document.getElementById('cancelInstrutorEditBtn').style.display = 'none';
}

function renderInstrutores(){
  const wrap = document.getElementById('instrutoresList');
  wrap.innerHTML = '';
  document.getElementById('instrutoresEmpty').style.display = state.instrutores.length ? 'none' : 'block';
  state.instrutores.forEach(i=>{
    const div = document.createElement('div');
    div.className = 'instructor-card';
    div.innerHTML = `
      <div class="sig-thumb" style="${i.assinatura ? `background-image:url('${i.assinatura}')` : ''}">${i.assinatura ? '' : 'sem imagem'}</div>
      <div class="instructor-meta">
        <b>${i.nome}</b>
        <span>${i.qualificacao || ''}${i.registro ? ' · ' + i.registro : ''}</span>
        <span class="tag">${i.funcao}</span>
      </div>
      <div class="row-actions">
        <button class="btn small secondary" data-edit="${i.id}">Editar</button>
        <button class="btn small danger" data-del="${i.id}">Remover</button>
      </div>`;
    wrap.appendChild(div);
  });
  wrap.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', ()=>startEditInstrutor(b.dataset.edit)));
  wrap.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
    state.instrutores = state.instrutores.filter(i=>i.id!==b.dataset.del);
    renderInstrutores();
    saveState();
  }));
}

function startEditInstrutor(id){
  const i = state.instrutores.find(x=>x.id===id);
  if(!i) return;
  editingInstrutorId = id;
  pendingSig = null;
  document.getElementById('instrutorNome').value = i.nome;
  document.getElementById('instrutorQualificacao').value = i.qualificacao || '';
  document.getElementById('instrutorRegistro').value = i.registro || '';
  const sel = document.getElementById('instrutorFuncao');
  const known = Array.from(sel.options).some(o=>o.value===i.funcao);
  if(known){ sel.value = i.funcao; document.getElementById('instrutorFuncaoCustom').style.display='none'; }
  else { sel.value = '__custom'; document.getElementById('instrutorFuncaoCustom').style.display='block'; document.getElementById('instrutorFuncaoCustom').value = i.funcao; }
  document.getElementById('sigDropLabel').textContent = i.assinatura ? 'Assinatura atual mantida (envie outra para trocar)' : 'Clique para enviar a assinatura em PNG';
  document.getElementById('addInstrutorBtn').textContent = 'Atualizar assinatura';
  document.getElementById('cancelInstrutorEditBtn').style.display = 'inline-block';
  document.querySelector('[data-view="instrutores"]').click();
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ============================================================
   ALUNOS VIEW
   ============================================================ */
const planilhaInput = document.getElementById('planilhaInput');
document.getElementById('planilhaDrop').addEventListener('click', e=>{ if(e.target!==planilhaInput) planilhaInput.click(); });
planilhaInput.addEventListener('change', ()=>{
  const f = planilhaInput.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = (e)=>{
    try{
      const wb = XLSX.read(e.target.result, {type:'binary'});
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, {defval:''});
      let added = 0;
      rows.forEach(row=>{
        const keys = Object.keys(row);
        const nomeKey = keys.find(k=> /^nome( completo)?$/i.test(k.trim()));
        const cpfKey = keys.find(k=> /^cpf$/i.test(k.trim()));
        const nome = nomeKey ? String(row[nomeKey]).trim() : '';
        const cpf = cpfKey ? String(row[cpfKey]).trim() : '';
        if(nome){ state.alunos.push({id: uid(), nome, cpf}); added++; }
      });
      renderAlunos();
      saveState();
      toast(added ? `${added} aluno(s) importado(s).` : 'Nenhuma linha reconhecida. Verifique os cabeçalhos "Nome" e "CPF".', !added);
    }catch(err){
      toast('Erro ao ler a planilha.', true);
    }
    planilhaInput.value = '';
  };
  reader.readAsBinaryString(f);
});

document.getElementById('addAlunoBtn').addEventListener('click', ()=>{
  const nome = document.getElementById('manualNome').value.trim();
  const cpf = document.getElementById('manualCpf').value.trim();
  if(!nome){ toast('Informe o nome do aluno.', true); return; }
  state.alunos.push({id: uid(), nome, cpf});
  document.getElementById('manualNome').value = '';
  document.getElementById('manualCpf').value = '';
  renderAlunos();
  saveState();
});

document.getElementById('clearAlunosBtn').addEventListener('click', ()=>{
  state.alunos = [];
  renderAlunos();
  saveState();
});

function renderAlunos(){
  const body = document.getElementById('alunosTableBody');
  body.innerHTML = '';
  document.getElementById('alunoCount').textContent = state.alunos.length;
  document.getElementById('alunosEmpty').style.display = state.alunos.length ? 'none' : 'block';
  state.alunos.forEach((a, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td><input type="text" value="${a.nome.replace(/"/g,'&quot;')}" data-field="nome" data-id="${a.id}"></td>
      <td><input type="text" value="${a.cpf.replace(/"/g,'&quot;')}" data-field="cpf" data-id="${a.id}"></td>
      <td><button class="btn small danger" data-del="${a.id}">Remover</button></td>`;
    body.appendChild(tr);
  });
  body.querySelectorAll('input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      const a = state.alunos.find(x=>x.id===inp.dataset.id);
      if(a) a[inp.dataset.field] = inp.value;
    });
  });
  body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click', ()=>{
    state.alunos = state.alunos.filter(a=>a.id!==b.dataset.del);
    renderAlunos();
    saveState();
  }));
}

/* ============================================================
   CERTIFICATE TEMPLATE (HTML STRING)
   ============================================================ */
function buildCertificateFront(aluno){
  const c = state.config;
  const instrutores = state.instrutores.slice(0,3);
  const sigBlocks = instrutores.map(i => `
    <div class="sig-block">
      <div class="sig-role">${i.funcao || ''}</div>
      ${i.assinatura ? `<img class="sig-img" src="${i.assinatura}">` : '<div style="height:46px;"></div>'}
      <div class="sig-line">
        <div class="sig-name">${i.nome}</div>
        <div class="sig-qual">${i.qualificacao || ''}</div>
        <div class="sig-reg">${i.registro || ''}</div>
      </div>
    </div>`).join('');

  return `
  <div class="sheet">
    <div class="cert-site">${c.siteEmpresa || ''}</div>
    <div class="diag-mark">
      <svg width="78" height="78" viewBox="0 0 78 78"><polygon points="0,78 30,78 78,0 48,0" fill="#2ea39a"/><polygon points="24,78 40,78 78,20 62,20" fill="#c9cdc4"/></svg>
    </div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="diag-mark2">
      <svg width="70" height="180" viewBox="0 0 70 180"><polygon points="70,180 20,180 70,60" fill="#2ea39a"/><polygon points="70,150 40,150 70,90" fill="#c9cdc4"/></svg>
    </div>
    <div class="kilo-logo">
      ${kiloLogoSVG()}
      <div class="kilo-word">KILO</div>
      <div class="kilo-sub">Q H S E</div>
    </div>
    <div class="cert-title">CERTIFICADO</div>
    <div class="cert-body">
      Certificamos para os devidos fins que <b>${aluno.nome}</b> - CPF <b>${aluno.cpf}</b><br>
      Concluiu integralmente a capacitação de <b>${c.cursoNome}</b><br>
      Realizado no período de <b>${fmtDate(c.dataInicio)} a ${fmtDate(c.dataFim)}</b> com carga horária de <b>${c.cargaHoraria}</b>.
    </div>
    <div class="cert-norms">${c.normasTexto}</div>
    <div class="sig-zone">${sigBlocks}</div>
  </div>`;
}

function buildCertificateBack(aluno){
  const c = state.config;
  const topics = splitConteudo(c.conteudoTexto);
  const items = topics.map(t=>`<li>${t}</li>`).join('');
  return `
  <div class="sheet">
    <div class="content-title">CONTEÚDO PROGRAMÁTICO</div>
    <div class="content-list"><ol>${items}</ol></div>
    <div class="content-foot">
      <div class="loc">Realizado em ${c.localTreinamento}</div>
      <div class="sig-line-portador">Assinatura de ${aluno.nome}</div>
    </div>
  </div>`;
}

/* ============================================================
   PREVIEW
   ============================================================ */
function refreshPreviewSelect(){
  const sel = document.getElementById('previewAlunoSelect');
  sel.innerHTML = '';
  if(!state.alunos.length){
    const opt = document.createElement('option');
    opt.textContent = 'Aluno de exemplo (Fulano de Tal)';
    opt.value = '__sample';
    sel.appendChild(opt);
  } else {
    state.alunos.forEach(a=>{
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.nome}${a.cpf ? ' - ' + a.cpf : ''}`;
      sel.appendChild(opt);
    });
  }
  renderPreview();
}
document.getElementById('previewAlunoSelect').addEventListener('change', renderPreview);

function currentPreviewAluno(){
  const sel = document.getElementById('previewAlunoSelect');
  if(sel.value === '__sample' || !sel.value){
    return {nome:'Fulano de Tal da Silva', cpf:'000.000.000-00'};
  }
  return state.alunos.find(a=>a.id===sel.value) || {nome:'Fulano de Tal da Silva', cpf:'000.000.000-00'};
}

function renderPreview(){
  const aluno = currentPreviewAluno();
  document.getElementById('previewStageFront').innerHTML = buildCertificateFront(aluno);
  document.getElementById('previewStageBack').innerHTML = buildCertificateBack(aluno);
}

/* ============================================================
   PDF GENERATION
   ============================================================ */
async function renderNodeToImage(html){
  const host = document.getElementById('renderHost');
  host.innerHTML = html;
  const sheetEl = host.querySelector('.sheet');
  const canvas = await html2canvas(sheetEl, {scale: 3, useCORS: true, backgroundColor:'#ffffff'});
  host.innerHTML = '';
  return canvas.toDataURL('image/jpeg', 0.95);
}

async function buildAlunoPdfBlob(aluno){
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation:'landscape', unit:'mm', format:[210,148]});
  const img1 = await renderNodeToImage(buildCertificateFront(aluno));
  pdf.addImage(img1, 'JPEG', 0, 0, 210, 148);
  pdf.addPage([210,148], 'landscape');
  const img2 = await renderNodeToImage(buildCertificateBack(aluno));
  pdf.addImage(img2, 'JPEG', 0, 0, 210, 148);
  return pdf.output('blob');
}

function safeFileName(str){
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').toLowerCase();
}

document.getElementById('generateOneBtn').addEventListener('click', async ()=>{
  const aluno = currentPreviewAluno();
  setStatus('Gerando PDF...');
  try{
    const blob = await buildAlunoPdfBlob(aluno);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `certificado_${safeFileName(aluno.nome)}.pdf`;
    a.click();
    setStatus('PDF gerado.');
  }catch(e){
    console.error(e);
    setStatus('Falha ao gerar o PDF.', true);
  }
});

document.getElementById('generateAllBtn').addEventListener('click', async ()=>{
  if(!state.alunos.length){ toast('Adicione ao menos um aluno na turma.', true); return; }
  if(!state.instrutores.length){ toast('Cadastre ao menos um instrutor antes de emitir.', true); return; }
  const btn = document.getElementById('generateAllBtn');
  btn.disabled = true;
  const zip = new JSZip();
  for(let i=0;i<state.alunos.length;i++){
    const aluno = state.alunos[i];
    setStatus(`Gerando ${i+1} de ${state.alunos.length}: ${aluno.nome}...`);
    try{
      const blob = await buildAlunoPdfBlob(aluno);
      zip.file(`certificado_${safeFileName(aluno.nome)}.pdf`, blob);
    }catch(e){
      console.error('Erro no aluno', aluno.nome, e);
    }
  }
  setStatus('Compactando arquivos...');
  const zipBlob = await zip.generateAsync({type:'blob'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = 'certificados.zip';
  a.click();
  setStatus(`Concluído: ${state.alunos.length} certificado(s) gerado(s).`);
  btn.disabled = false;
});

function setStatus(msg, isErr){
  const el = document.getElementById('generateStatus');
  el.textContent = msg;
  el.style.color = isErr ? 'var(--danger)' : 'var(--stone-600)';
}

/* ============================================================
   INIT
   ============================================================ */
loadState();
renderCursos();
renderInstrutores();
renderAlunos();
refreshCursoSelect();
fillConfigForm();
