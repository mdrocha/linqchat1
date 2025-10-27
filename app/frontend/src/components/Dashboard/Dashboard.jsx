
import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { api } from "@/services/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

/* ============== Layout ============== */
const Shell = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 64px 1fr;
  grid-template-areas:
    "sidebar topbar"
    "sidebar content";
  height: 100vh;
  background: #f7f8fb;
`;
const Sidebar = styled.aside`
  grid-area: sidebar;
  background: #1f2937;
  color: #fff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #111827;
`;
const Brand = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-weight: 700;
  border-bottom: 1px solid #111827;
`;
const SideNav = styled.nav`padding: 12px; overflow: auto;`;
const SideItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  font-size: 14px;
  border-radius: 10px;
  color: ${p => (p.active ? "#fff" : "#e5e7eb")};
  background: ${p => (p.active ? "#374151" : "transparent")};
  border: 1px solid ${p => (p.active ? "#4b5563" : "transparent")};
  cursor: pointer;
  &:hover { background: #374151; color: #fff; }
`;
const Topbar = styled.header`
  grid-area: topbar;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  gap: 16px;
`;
const Profile = styled.div` position: relative; `;
const ProfileButton = styled.button`
  width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid #e5e7eb; background: #f3f4f6;
  display: grid; place-items: center; cursor: pointer;
`;
const Dropdown = styled.div`
  position: absolute; top: 44px; right: 0; background: #fff;
  border: 1px solid #e5e7eb; border-radius: 10px; min-width: 220px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1); overflow: hidden; z-index: 50;
`;
const DropItem = styled.button`
  width: 100%; text-align: left; background: #fff; border: 0;
  padding: 10px 12px; font-size: 14px; cursor: pointer;
  &:hover { background: #f9fafb; }
`;
const Content = styled.main` grid-area: content; padding: 20px; overflow: auto; `;
const Grid = styled.div` display: grid; gap: 16px; grid-template-columns: repeat(12, 1fr); `;
const Col = styled.div` grid-column: span ${p => p.span || 12}; `;
const SectionTitle = styled.h2` font-size: 18px; margin: 0 0 12px; `;

/* ============== Auxiliares ============== */
function LineChart({ data = [] }) {
  const w = 560, h = 140, pad = 18;
  if (!data.length) return <div style={{height:h, display:"grid", placeItems:"center"}}>Sem dados</div>;
  const ys = data.map(d=>d.value);
  const min = Math.min(...ys), max = Math.max(...ys);
  const nx = (i,n)=> pad + (i/(n-1))*(w-2*pad);
  const ny = (v)=> h-pad - ((v-min)/(max-min || 1))*(h-2*pad);
  const pts = data.map((p,i)=> `${nx(i,data.length)},${ny(p.value)}`).join(" ");
  return <svg width={w} height={h}><polyline fill="none" stroke="#60a5fa" strokeWidth="2" points={pts}/></svg>;
}

/* ============== Dashboard ============== */
export default function Dashboard() {
  const isPremium = (localStorage.getItem("plan")==="premium") || (localStorage.getItem("isPremium")==="1");

  const [tab, setTab] = useState("home");
  const [showMenu, setShowMenu] = useState(false);
  const [botActive, setBotActive] = useState(true);
  const [period, setPeriod] = useState("week");
  const [series, setSeries] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [testInput, setTestInput] = useState("");
  const [testLog, setTestLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await api.get(`/metrics/messages?period=${period}`).catch(()=>null);
      setSeries(res?.data?.points || [
        { label:"Seg", value:10 },{label:"Ter",value:14},{label:"Qua",value:9},
        { label:"Qui", value:20 },{label:"Sex",value:12},{label:"Sáb",value:8},{label:"Dom",value:6}
      ]);
    })();
  }, [period]);

  useEffect(() => {
    if (tab!=="invoices") return;
    (async ()=>{ const r = await api.get("/billing/invoices").catch(()=>null); setInvoices(r?.data?.invoices || []); })();
  }, [tab]);

  useEffect(() => {
    if (tab!=="contacts") return;
    (async ()=>{ const r = await api.get("/contacts").catch(()=>null); setContacts(r?.data?.items || []); })();
  }, [tab]);

  const exportCsv = async () => {
    try {
      const r = await api.get("/conversations/export", { responseType: "blob" }).catch(()=>null);
      if (r?.data) {
        const url = URL.createObjectURL(r.data);
        const a = document.createElement("a"); a.href = url; a.download = "conversas.csv"; a.click();
        URL.revokeObjectURL(url); return;
      }
    } catch {}
    const rows = [["id","from","to","message","at"]];
    testLog.forEach((m,i)=> rows.push([i+1,"me","bot",m.text,new Date().toISOString()]));
    const csv = rows.map(r=> r.map(v=>`\"${String(v).replace(/"/g,'""')}\"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"}); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "conversas.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const payInvoice = async (id) => {
    setLoading(true);
    try {
      const r = await api.post("/billing/pay", { id }).catch(()=>null);
      const url = r?.data?.checkoutUrl; if (url) window.location.href = url;
    } finally { setLoading(false); }
  };

  const sendTest = async () => {
    if (!testInput.trim()) return;
    setTestLog(l=>[...l,{role:"user", text:testInput}]); const input=testInput; setTestInput("");
    try { const r = await api.post("/bots/test", { input }).catch(()=>null);
      const reply = r?.data?.reply || "OK."; setTestLog(l=>[...l,{role:"bot", text:reply}]); }
    catch { setTestLog(l=>[...l,{role:"bot", text:"OK."}]); }
  };

  return (
    <Shell>
      <Sidebar>
        <Brand>LinQChat</Brand>
        <SideNav>
          <SideItem active={tab==="home"} onClick={()=>setTab("home")}>Início</SideItem>
          <SideItem active={tab==="instructions"} onClick={()=>setTab("instructions")}>Instruções</SideItem>
          <SideItem active={tab==="contacts"} onClick={()=>setTab("contacts")}>Meus contatos</SideItem>
          <SideItem active={tab==="invoices"} onClick={()=>setTab("invoices")}>Faturas</SideItem>
          <SideItem active={tab==="tickets"} onClick={()=>setTab("tickets")}>Chamados</SideItem>
          <hr style={{borderColor:"#111827", opacity:.3, margin:"12px 4px"}} />
          <SideItem active={tab==="premium"} onClick={()=>setTab("premium")}>Premium</SideItem>
        </SideNav>
      </Sidebar>

      <Topbar>
        <Profile>
          <ProfileButton onClick={()=>setShowMenu(s=>!s)} aria-label="perfil">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="#111827" strokeWidth="1.8" />
              <path d="M4 20c1.7-3.3 5-5 8-5s6.3 1.7 8 5" stroke="#111827" strokeWidth="1.8" fill="none"/>
            </svg>
          </ProfileButton>
          {showMenu && (
            <Dropdown onMouseLeave={()=>setShowMenu(false)}>
              <DropItem onClick={()=>alert("Meu perfil")}>Meu perfil</DropItem>
              <DropItem onClick={()=>alert("Upgrade premium")}>Upgrade premium</DropItem>
              <DropItem onClick={()=>alert("Alterar senha")}>Alterar senha</DropItem>
              <DropItem onClick={()=>alert("Termos de uso")}>Termos de uso</DropItem>
              <DropItem onClick={()=>alert("Políticas de privacidade")}>Políticas de privacidade</DropItem>
              <DropItem onClick={()=>{ localStorage.clear(); window.location.href="/login"; }}>Sair</DropItem>
            </Dropdown>
          )}
        </Profile>
      </Topbar>

      <Content>
        {tab==="home" && (
          <>
            <SectionTitle>Início</SectionTitle>
            <Grid>
              <Col span={6}>
                <Card>
                  <h3>Status do Bot</h3>
                  <div style={{display:"flex", alignItems:"center", gap:12}}>
                    <label>Pausar/Ativar</label>
                    <input type="checkbox" checked={botActive}
                      onChange={async e=>{
                        const v=e.target.checked; setBotActive(v);
                        await api.post("/bot/toggle", { active:v }).catch(()=>{});
                      }} />
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <h3>Mensagens enviadas</h3>
                    <select value={period} onChange={e=>setPeriod(e.target.value)}>
                      <option value="day">Dia</option>
                      <option value="week">Semana</option>
                      <option value="month">Mês</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  <LineChart data={series} />
                </Card>
              </Col>
            </Grid>
          </>
        )}

        {tab==="instructions" && (
          <>
            <SectionTitle>Instruções do Bot</SectionTitle>
            <Card>
              <p>Envie regras e arquivos para treinar o contexto do bot.</p>
              {isPremium ? (
                <>
                  <Input type="file" multiple onChange={()=>{}} />
                  <div style={{height:8}} />
                  <Button onClick={()=>alert("Enviar instruções")}>Enviar</Button>
                </>
              ) : (
                <p>Disponível no plano Premium.</p>
              )}
            </Card>
          </>
        )}

        {tab==="contacts" && (
          <>
            <SectionTitle>Meus contatos</SectionTitle>
            <Card>
              <div style={{ marginBottom: 12 }}>Total: {contacts.length || 0}</div>
              <Button onClick={exportCsv}>Exportar conversas em CSV</Button>
            </Card>
          </>
        )}

        {tab==="invoices" && (
          <>
            <SectionTitle>Faturas</SectionTitle>
            <Card>
              <table style={{width:"100%", borderCollapse:"collapse"}}>
                <thead><tr><th>ID</th><th>Referência</th><th>Status</th><th>Valor</th><th>Ação</th></tr></thead>
                <tbody>
                  {invoices.length ? invoices.map(inv => (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>{inv.reference || "-"}</td>
                      <td>{inv.status}</td>
                      <td>{inv.amount_formatted || inv.amount || "-"}</td>
                      <td>{inv.status==="open" ? <Button disabled={loading} onClick={()=>payInvoice(inv.id)}>Pagar</Button> : "-"}</td>
                    </tr>
                  )) : <tr><td colSpan={5}>Sem faturas</td></tr>}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {tab==="tickets" && (
          <>
            <SectionTitle>Chamados</SectionTitle>
            <Card>
              <p>Abrir/acompanhar tickets de suporte.</p>
              <Button onClick={()=>alert("Novo chamado")}>Novo chamado</Button>
            </Card>
          </>
        )}

        {tab==="premium" && (
          <>
            <SectionTitle>Premium</SectionTitle>
            {isPremium ? (
              <Grid>
                <Col span={6}><Card><h3>Respostas condicionadas</h3><p>Se X, responder Y.</p></Card></Col>
                <Col span={6}><Card><h3>Reconhecimento de comprovantes</h3><p>Validar anexos do cliente.</p></Card></Col>
                <Col span={6}><Card><h3>Mensagens em massa</h3><p>Campanhas para sua base.</p></Card></Col>
                <Col span={6}><Card><h3>Criar campanha</h3><p>Nome, mensagem e mídia.</p></Card></Col>
                <Col span={6}><Card><h3>Widget chat flutuante</h3><p>Integração e suporte.</p></Card></Col>
                <Col span={6}><Card><h3>Reativar usuário</h3><p>Detecta inativos e reengaja.</p></Card></Col>
                <Col span={12}><Card><h3>Painel CRM</h3><p>Organize conversas em um board visual.</p></Card></Col>
              </Grid>
            ) : (
              <Card><p>As funcionalidades Premium ficam disponíveis após o upgrade.</p></Card>
            )}
          </>
        )}
      </Content>
    </Shell>
  );
}
