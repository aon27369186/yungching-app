import { useState, useEffect, useRef } from "react";

// ── 共用色系 ──
const C = {
  navy:    "#1B3A5C",
  blue:    "#2E6DA4",
  accent:  "#4A90D9",
  light:   "#EBF4FF",
  pale:    "#F0F6FC",
  border:  "#C2DDF5",
  white:   "#FFFFFF",
  gray:    "#4A7FA5",
  muted:   "#A0BCD8",
  green:   "#27AE60",
  red:     "#C0392B",
  orange:  "#D4690A",
};

const inp = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: "#F7FBFF",
  fontSize: 14, color: C.navy, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};
const lbl = { fontSize: 11, color: C.gray, fontWeight: "600", letterSpacing: "0.05em", display: "block", marginBottom: 5 };
const card = { background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(27,58,92,0.06)", marginBottom: 14 };
const secTitle = { fontSize: 12, color: C.blue, fontWeight: "700", marginBottom: 14, letterSpacing: "0.05em" };

// ════════════════════════════════════════════
// 工具一：屋主回訪提醒
// ════════════════════════════════════════════
const RESULT_OPTIONS = ["還在考慮","有住人沒遇到","沒住人","已簽委託","已給他家","不賣了"];
const RESULT_STYLE = {
  "還在考慮":    { bg:"#FFF8E1", color:"#B7770D" },
  "有住人沒遇到":{ bg:"#FFF0E6", color:"#C05621" },
  "沒住人":      { bg:"#EDF2F7", color:"#4A5568" },
  "已簽委託":    { bg:"#E6F4EA", color:"#1E6E37" },
  "已給他家":    { bg:"#EBF4FF", color:"#2B5FA0" },
  "不賣了":      { bg:"#F7F7F7", color:"#888888" },
};
function todayStr(){ return new Date().toISOString().split("T")[0]; }
function addDays(s,n){ const d=new Date(s); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; }
function diffDays(s){ const t=new Date(); t.setHours(0,0,0,0); const d=new Date(s); d.setHours(0,0,0,0); return Math.round((d-t)/86400000); }
function fmtDate(s){ const [,m,d]=s.split("-"); return `${m}/${d}`; }
const EMPTY_OWNER = { community:"",floor:"",price:"",ownerName:"",ownerTitle:"先生",result:"還在考慮",visitDate:todayStr(),nextVisit:addDays(todayStr(),3),note:"" };

function ToolReminder() {
  const [owners, setOwners] = useState(()=>{ try{return JSON.parse(localStorage.getItem("owners_v1")||"[]");}catch{return [];} });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_OWNER);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("全部");
  const [expandId, setExpandId] = useState(null);
  useEffect(()=>{ localStorage.setItem("owners_v1",JSON.stringify(owners)); },[owners]);

  const save = () => {
    if(!form.community.trim()) return;
    if(editId!==null){ setOwners(owners.map(o=>o.id===editId?{...form,id:editId}:o)); setEditId(null); }
    else { setOwners([{...form,id:Date.now()},...owners]); }
    setForm(EMPTY_OWNER); setShowForm(false);
  };
  const del = id => setOwners(owners.filter(o=>o.id!==id));
  const startEdit = o => { setForm({...o}); setEditId(o.id); setShowForm(true); setExpandId(null); };
  const checkin = id => setOwners(owners.map(o=>o.id===id?{...o,visitDate:todayStr(),nextVisit:addDays(todayStr(),3)}:o));

  const filtered = owners.filter(o=>filter==="全部"||o.result===filter);
  const sorted = [...filtered].sort((a,b)=>diffDays(a.nextVisit)-diffDays(b.nextVisit));
  const overdue = owners.filter(o=>diffDays(o.nextVisit)<0&&o.result!=="不賣了"&&o.result!=="已給他家").length;
  const todayCnt = owners.filter(o=>diffDays(o.nextVisit)===0).length;
  const active = owners.filter(o=>o.result!=="不賣了"&&o.result!=="已給他家").length;

  const stLabel = (s,r) => {
    if(r==="不賣了"||r==="已給他家") return {text:"—",color:C.muted,bg:"#F7F7F7"};
    const d=diffDays(s);
    if(d<0)  return {text:`逾期${Math.abs(d)}天`,color:C.red,bg:"#FFE5E5"};
    if(d===0) return {text:"今天拜訪",color:C.orange,bg:"#FFF0E6"};
    if(d===1) return {text:"明天拜訪",color:"#B7770D",bg:"#FFF8E1"};
    if(d<=3)  return {text:`${d}天後`,color:C.blue,bg:C.light};
    return {text:`${fmtDate(s)}拜訪`,color:C.gray,bg:C.pale};
  };

  return (
    <div style={{padding:"16px",maxWidth:560,margin:"0 auto"}}>
      {/* Stats */}
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        {[{l:"追蹤中",v:active,c:C.blue},{l:"今日",v:todayCnt,c:C.orange},{l:"逾期",v:overdue,c:C.red}].map(s=>(
          <div key={s.l} style={{flex:1,background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 0",textAlign:"center",boxShadow:"0 1px 4px rgba(27,58,92,0.06)"}}>
            <div style={{fontSize:24,fontWeight:"bold",color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {["全部",...RESULT_OPTIONS].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",fontSize:11,fontFamily:"inherit",
            background:filter===f?C.navy:C.white, color:filter===f?"white":C.gray,
            boxShadow:filter===f?`0 2px 8px rgba(27,58,92,0.3)`:`0 1px 3px rgba(0,0,0,0.08)`,
          }}>{f}</button>
        ))}
      </div>

      <button onClick={()=>{setForm(EMPTY_OWNER);setEditId(null);setShowForm(true);}} style={{
        width:"100%",padding:"12px",background:C.navy,border:"none",borderRadius:10,
        color:"white",fontSize:14,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",marginBottom:16,
      }}>＋ 新增屋主</button>

      {sorted.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:13}}>還沒有屋主資料，點上方新增</div>}

      {sorted.map(o=>{
        const st=stLabel(o.nextVisit,o.result);
        const rs=RESULT_STYLE[o.result]||RESULT_STYLE["還在考慮"];
        const isExp=expandId===o.id;
        const isOvd=diffDays(o.nextVisit)<0&&o.result!=="不賣了"&&o.result!=="已給他家";
        return (
          <div key={o.id} style={{background:C.white,borderRadius:12,marginBottom:10,border:`1px solid ${isOvd?"#FCA5A5":C.border}`,boxShadow:"0 2px 8px rgba(27,58,92,0.06)",overflow:"hidden"}}>
            <div style={{padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandId(isExp?null:o.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <span style={{fontSize:15,fontWeight:"bold",color:C.navy}}>{o.community}</span>
                    <span style={{fontSize:11,color:C.muted}}>{o.floor}樓</span>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:12,color:C.gray}}>{o.ownerName}{o.ownerTitle}</span>
                    <span style={{fontSize:12,color:C.navy,fontWeight:"600"}}>{o.price}萬</span>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:rs.bg,color:rs.color,fontWeight:"600"}}>{o.result}</span>
                  </div>
                </div>
                <div style={{padding:"5px 10px",borderRadius:8,background:st.bg,flexShrink:0,marginLeft:8,textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:"bold",color:st.color,whiteSpace:"nowrap"}}>{st.text}</div>
                  {o.result!=="不賣了"&&o.result!=="已給他家"&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>上次{fmtDate(o.visitDate)}</div>}
                </div>
              </div>
            </div>
            {isExp&&(
              <div style={{borderTop:`1px solid ${C.light}`,padding:"12px 16px",background:C.pale}}>
                {o.note&&<div style={{fontSize:12,color:"#4A5568",marginBottom:12,padding:"8px 12px",background:C.white,borderRadius:8,borderLeft:`3px solid ${C.accent}`,lineHeight:1.7}}>{o.note}</div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>checkin(o.id)} style={{flex:1,padding:"9px 0",borderRadius:8,border:"none",background:C.navy,color:"white",fontSize:12,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>✓ 今天已拜訪（+3天）</button>
                  <button onClick={()=>startEdit(o)} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,color:C.gray,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>編輯</button>
                  <button onClick={()=>del(o.id)} style={{padding:"9px 14px",borderRadius:8,border:"1px solid #FCA5A5",background:C.white,color:C.red,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>刪除</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(27,58,92,0.5)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,backdropFilter:"blur(3px)"}} onClick={e=>{if(e.target===e.currentTarget){setShowForm(false);setEditId(null);}}}>
          <div style={{background:"white",borderRadius:"20px 20px 0 0",padding:"24px 20px 32px",width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(27,58,92,0.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:"bold",color:C.navy}}>{editId?"編輯屋主":"新增屋主"}</div>
              <button onClick={()=>{setShowForm(false);setEditId(null);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.muted}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>社區名稱</label><input value={form.community} onChange={e=>setForm(f=>({...f,community:e.target.value}))} placeholder="例：廣三大時代" style={inp}/></div>
              <div><label style={lbl}>樓層</label><input value={form.floor} onChange={e=>setForm(f=>({...f,floor:e.target.value}))} placeholder="例：6/12" style={inp}/></div>
              <div><label style={lbl}>開價（萬）</label><input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="例：1088" type="number" style={inp}/></div>
              <div><label style={lbl}>屋主姓氏</label><input value={form.ownerName} onChange={e=>setForm(f=>({...f,ownerName:e.target.value}))} placeholder="例：張" style={inp}/></div>
              <div><label style={lbl}>稱謂</label>
                <div style={{display:"flex",gap:8}}>
                  {["先生","小姐"].map(t=>(
                    <button key={t} onClick={()=>setForm(f=>({...f,ownerTitle:t}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:"bold",background:form.ownerTitle===t?C.navy:C.pale,color:form.ownerTitle===t?"white":C.gray}}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>拜訪結果</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                  {RESULT_OPTIONS.map(r=>(
                    <button key={r} onClick={()=>setForm(f=>({...f,result:r}))} style={{padding:"7px 13px",borderRadius:16,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,background:form.result===r?C.navy:C.pale,color:form.result===r?"white":C.gray,fontWeight:form.result===r?"bold":"normal"}}>{r}</button>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>拜訪日期</label><input type="date" value={form.visitDate} onChange={e=>setForm(f=>({...f,visitDate:e.target.value,nextVisit:addDays(e.target.value,3)}))} style={inp}/></div>
              <div><label style={lbl}>下次回訪日</label><input type="date" value={form.nextVisit} onChange={e=>setForm(f=>({...f,nextVisit:e.target.value}))} style={inp}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={lbl}>備註</label><textarea value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="屋主說了什麼..." rows={3} style={{...inp,resize:"none",lineHeight:1.7}}/></div>
            </div>
            <button onClick={save} disabled={!form.community.trim()} style={{width:"100%",marginTop:16,padding:"14px",background:form.community.trim()?C.navy:C.border,border:"none",borderRadius:10,color:form.community.trim()?"white":C.muted,fontSize:15,fontWeight:"bold",cursor:form.community.trim()?"pointer":"not-allowed",fontFamily:"inherit"}}>{editId?"儲存變更":"新增屋主"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// 工具二：LINE 群發工具
// ════════════════════════════════════════════
function parseLineText(text) {
  const get = (...keys) => { for(const key of keys){const m=text.match(new RegExp(`${key}[：:＊*\\s🔥]*([^\n]+)`));if(m)return m[1].replace(/🔥/g,"").trim();} return ""; };
  const highlights=[]; for(const m of text.matchAll(/✅([^\n]+)/g)) highlights.push(m[1].trim());
  return { 委託類型:(text.match(/一般委託|專任委託|租賃委託/)||["一般委託"])[0], 案名:get("案名"), 地址:get("地址"), 總建:get("總建"), 主建:get("主建"), 樓層:get("樓層"), 格局:get("格局"), 屋齡:get("屋齡"), 售價:get("售價"), 車位:get("車位")||"", 管理費:get("管理費")||"", highlights };
}
function buildLineMsg(form, highlights, myName, myPhone) {
  return `新接🔥${form.委託類型}🔥\n店名：${form.店名}\n物件編號：${form.物件編號}\n案名🔥${form.案名}\n地址：${form.地址}\n總建：${form.總建}坪\n主建：${form.主建}坪\n附屬：${form.附屬}坪\n共用：${form.共用}坪\n樓層：${form.樓層}\n格局：${form.格局}\n屋齡：${form.屋齡}年\n售價：${form.售價}\n${highlights.filter(Boolean).map(h=>`✅${h}`).join("\n")}\n\n經紀人\n${myName}：${myPhone}`;
}

function ToolLine({ myName, myPhone }) {
  const [step, setStep] = useState(0);
  const [paste, setPaste] = useState("");
  const [data, setData] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleParse = () => { const p=parseLineText(paste); setData(p); };

  const generate = async () => {
    setLoading(true); setHighlights([]);
    const parsed = parseLineText(paste); setData(parsed);
    const prompt = `你是永慶不動產的房仲，根據以下物件資訊產出5條LINE群發亮點條列。\n物件：${parsed.案名}\n地址：${parsed.地址}\n格局：${parsed.格局}\n坪數：總建${parsed.總建}坪\n樓層：${parsed.樓層}\n屋齡：${parsed.屋齡}年\n售價：${parsed.售價}\n規則：每條不超過28字，語氣精準簡潔，符合台灣房仲用語。只輸出5條純文字，每條一行，不加符號或編號。`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:prompt}]})});
      const json = await res.json();
      const lines = (json.content?.map(b=>b.text||"").join("")||"").split("\n").map(l=>l.replace(/^[✅\-\d\.、]+/,"").trim()).filter(Boolean).slice(0,5);
      setHighlights(lines);
    } catch { setHighlights(["生成失敗，請重試"]); }
    setLoading(false); setStep(1);
  };

  const lineMsg = data ? buildLineMsg(data, highlights, myName, myPhone) : "";
  const copy = () => { navigator.clipboard.writeText(lineMsg); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const reset = () => { setPaste(""); setData(null); setHighlights([]); setCopied(false); setStep(0); };

  return (
    <div style={{padding:"16px",maxWidth:560,margin:"0 auto"}}>
      {step===0&&(
        <>
          <div style={card}>
            <div style={secTitle}>貼入 LINE 群組案件訊息</div>
            <textarea value={paste} onChange={e=>setPaste(e.target.value)} placeholder={"新接🔥一般委託🔥\n店名：...\n案名🔥..."} rows={8} style={{...inp,resize:"none",lineHeight:1.7}}/>
            <button onClick={generate} disabled={!paste.trim()||loading} style={{marginTop:10,width:"100%",padding:"12px",borderRadius:10,border:"none",cursor:paste.trim()?"pointer":"not-allowed",background:paste.trim()?C.navy:C.border,color:paste.trim()?"white":C.muted,fontSize:14,fontWeight:"bold",fontFamily:"inherit"}}>
              {loading?"⟳ AI 生成亮點中...":"⚡ 解析 + 生成亮點"}
            </button>
          </div>
          <div style={{...card,background:C.light,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.gray}}>💡 會自動帶入你在「設定」填的姓名和電話</div>
          </div>
        </>
      )}
      {step===1&&(
        <>
          <div style={card}>
            <div style={secTitle}>✅ 亮點條列（可編輯）</div>
            {highlights.map((h,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                <span style={{color:C.green,flexShrink:0}}>✅</span>
                <input value={h} onChange={e=>{const n=[...highlights];n[i]=e.target.value;setHighlights(n);}} style={{...inp,flex:1}}/>
              </div>
            ))}
            <button onClick={()=>setHighlights([...highlights,""])} style={{padding:"7px 16px",borderRadius:16,border:`1px dashed ${C.accent}`,background:C.light,color:C.blue,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>＋ 新增</button>
          </div>
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={secTitle}>📤 完整訊息預覽</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={copy} style={{padding:"7px 16px",borderRadius:16,border:"none",cursor:"pointer",background:copied?"rgba(39,174,96,0.15)":C.navy,color:copied?C.green:"white",fontSize:12,fontFamily:"inherit"}}>{copied?"✓ 已複製":"複製"}</button>
                <button onClick={reset} style={{padding:"7px 16px",borderRadius:16,cursor:"pointer",background:C.pale,border:`1px solid ${C.border}`,color:C.gray,fontSize:12,fontFamily:"inherit"}}>貼下一個</button>
              </div>
            </div>
            <div style={{background:C.pale,borderRadius:8,padding:16,fontSize:13,lineHeight:2,whiteSpace:"pre-wrap",color:C.navy,border:`1px solid ${C.border}`}}>{lineMsg}</div>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// 工具三：業績試算
// ════════════════════════════════════════════
function ToolCommission() {
  const [price, setPrice] = useState("");
  const [buyerRate, setBuyerRate] = useState("2");
  const [sellerRate, setSellerRate] = useState("4");
  const [type, setType] = useState("half");
  const [partner, setPartner] = useState(true);

  const p=parseFloat(price)||0, br=parseFloat(buyerRate)||0, sr=parseFloat(sellerRate)||0;
  const totalFee=p*(br+sr)/100;
  const afterType=type==="half"?totalFee/2:totalFee;
  const myPerf=partner?afterType/2:afterType;
  const base=Math.min(myPerf,30), above=Math.max(myPerf-30,0);
  const mySalary=base*0.417+above*0.467;
  const fmt=n=>n>=1?n.toFixed(1).replace(/\.0$/,"")+" 萬":Math.round(n*10000).toLocaleString()+" 元";

  const Row=({label,value,hl,sub})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
      <div><div style={{fontSize:13,color:hl?C.navy:C.gray}}>{label}</div>{sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>}</div>
      <div style={{fontSize:hl?22:16,fontWeight:hl?"bold":"normal",color:hl?C.blue:C.gray}}>{value}</div>
    </div>
  );
  const Btn=({active,onClick,children})=>(
    <button onClick={onClick} style={{flex:1,padding:"10px 0",border:"none",borderRadius:8,background:active?C.navy:C.pale,color:active?"white":C.gray,fontSize:13,fontWeight:active?"bold":"normal",cursor:"pointer",fontFamily:"inherit"}}>{children}</button>
  );

  return (
    <div style={{padding:"16px",maxWidth:420,margin:"0 auto"}}>
      <div style={card}>
        <label style={lbl}>成交價（萬元）</label>
        <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="例：1000" style={{...inp,fontSize:22,fontWeight:"bold"}}/>
        <div style={{display:"flex",gap:12,marginTop:14}}>
          {[["賣方服務費 %",sellerRate,setSellerRate,"4"],["買方服務費 %",buyerRate,setBuyerRate,"2"]].map(([label,val,setter,ph])=>(
            <div key={label} style={{flex:1}}><label style={lbl}>{label}</label><input type="number" value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={{...inp,fontSize:16}}/></div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={secTitle}>代表方</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn active={type==="half"} onClick={()=>setType("half")}>半泡（買或賣）</Btn>
          <Btn active={type==="full"} onClick={()=>setType("full")}>全泡（買賣雙方）</Btn>
        </div>
        <div style={secTitle}>搭檔</div>
        <div style={{display:"flex",gap:8}}>
          <Btn active={partner} onClick={()=>setPartner(true)}>有搭檔（÷2）</Btn>
          <Btn active={!partner} onClick={()=>setPartner(false)}>無搭檔</Btn>
        </div>
      </div>
      {p>0&&(
        <div style={card}>
          <Row label="總服務費" value={fmt(totalFee)} sub={`${p}萬 × (${sr}%+${br}%)`}/>
          <Row label={type==="half"?"半泡（÷2）":"全泡"} value={fmt(afterType)}/>
          {partner&&<Row label="搭檔拆分（÷2）" value={fmt(myPerf)}/>}
          <div style={{height:1,background:C.border,margin:"4px 0"}}/>
          <Row label="我的業績" value={fmt(myPerf)} hl/>
          <div style={{background:myPerf>=30?"rgba(39,174,96,0.08)":"rgba(212,105,10,0.08)",border:`1px solid ${myPerf>=30?"rgba(39,174,96,0.25)":"rgba(212,105,10,0.25)"}`,borderRadius:8,padding:"12px 14px",margin:"8px 0"}}>
            {myPerf>=30?(
              <>
                <div style={{fontSize:12,color:C.green,marginBottom:6}}>✓ 累進抽成適用</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.gray,marginBottom:4}}><span>前30萬 × 41.7%</span><span>{fmt(base*0.417)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.blue}}><span>超過 {fmt(above)} × 46.7%</span><span>{fmt(above*0.467)}</span></div>
              </>
            ):(
              <div style={{fontSize:12,color:C.orange}}>還差 {fmt(30-myPerf)} 達累進門檻（≥30萬超出部分改46.7%）</div>
            )}
          </div>
          <Row label="到手薪水" value={fmt(mySalary)} hl/>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// 工具四：房源文案
// ════════════════════════════════════════════
const STYLES = ["溫馨居家感","專業精準型","豪華尊榮感","年輕活力風"];
const STYLE_HINTS = {"溫馨居家感":"適合家庭買家，強調生活感","專業精準型":"數據導向，適合投資客","豪華尊榮感":"高端物件，強調品味","年輕活力風":"首購族，輕鬆活潑語氣"};

function ToolCopywriter() {
  const [form, setForm] = useState({address:"",type:"",area:"",floor:"",price:"",features:"",nearby:"",style:"溫馨居家感"});
  const [result, setResult] = useState(""); const [loading, setLoading] = useState(false); const [copied, setCopied] = useState(false);

  const generate = async () => {
    const filled=Object.entries(form).filter(([k,v])=>k!=="style"&&v.trim());
    if(filled.length<3) return;
    setLoading(true); setResult(""); setCopied(false);
    const prompt = `你是永慶不動產的專業文案撰寫師，請根據以下物件資訊，撰寫一段吸引人的房源介紹文案。\n${form.address?`地址：${form.address}`""}\n${form.type?`類型：${form.type}`:""}\n${form.area?`坪數：${form.area}`:""}\n${form.floor?`樓層：${form.floor}`:""}\n${form.price?`價格：${form.price}`:""}\n${form.features?`特色：${form.features}`:""}\n${form.nearby?`周邊：${form.nearby}`:""}\n文案風格：${form.style}（${STYLE_HINTS[form.style]}）\n請撰寫約150-250字，包含吸引眼球的標題、核心賣點、生活情境、結尾呼籲。語氣自然，符合台灣房仲用語。`;
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      setResult(data.content?.map(b=>b.text||"").join("")||"無法生成，請再試一次");
    } catch { setResult("發生錯誤，請稍後再試"); }
    setLoading(false);
  };

  const filledCount=Object.entries(form).filter(([k,v])=>k!=="style"&&v.trim()).length;
  const copy=()=>{navigator.clipboard.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);};

  return (
    <div style={{padding:"16px",maxWidth:560,margin:"0 auto"}}>
      <div style={card}>
        <div style={secTitle}>填入物件資訊（至少3項）</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["地址","台中市南區工學一街177號"],["類型","例：3房2廳、電梯大樓"],["坪數","例：32坪（室內28坪）"],["樓層","例：8F/12F"],["售價/租金","例：1,280萬"]].map(([label,ph])=>(
            <div key={label} style={{gridColumn:label==="地址"?"1/-1":"auto"}}>
              <label style={lbl}>{label}</label>
              <input value={form[{地址:"address",類型:"type",坪數:"area",樓層:"floor","售價/租金":"price"}[label]||label]} onChange={e=>setForm(f=>({...f,[{地址:"address",類型:"type",坪數:"area",樓層:"floor","售價/租金":"price"}[label]||label]:e.target.value}))} placeholder={ph} style={inp}/>
            </div>
          ))}
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>特色亮點</label><input value={form.features} onChange={e=>setForm(f=>({...f,features:e.target.value}))} placeholder="例：南北向採光、近捷運、全新裝潢" style={inp}/></div>
          <div style={{gridColumn:"1/-1"}}><label style={lbl}>周邊機能</label><input value={form.nearby} onChange={e=>setForm(f=>({...f,nearby:e.target.value}))} placeholder="例：步行5分鐘大安森林公園" style={inp}/></div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={lbl}>文案風格</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {STYLES.map(s=>(
                <button key={s} onClick={()=>setForm(f=>({...f,style:s}))} style={{padding:"7px 14px",borderRadius:20,border:"none",cursor:"pointer",fontSize:12,background:form.style===s?C.navy:C.pale,color:form.style===s?"white":C.gray,fontWeight:form.style===s?"bold":"normal"}}>{s}</button>
              ))}
            </div>
            <div style={{fontSize:11,color:C.muted,marginTop:6}}>💡 {STYLE_HINTS[form.style]}</div>
          </div>
        </div>
      </div>
      <button onClick={generate} disabled={filledCount<3||loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",cursor:filledCount>=3?"pointer":"not-allowed",background:filledCount>=3?C.navy:C.border,color:filledCount>=3?"white":C.muted,fontSize:14,fontWeight:"bold",fontFamily:"inherit",marginBottom:14}}>
        {loading?"⟳ 生成中...":filledCount>=3?"✦ 生成房源文案":`還需填入 ${3-filledCount} 項`}
      </button>
      {result&&(
        <div style={card}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={secTitle}>生成文案</div>
            <button onClick={copy} style={{padding:"7px 16px",borderRadius:16,border:"none",cursor:"pointer",background:copied?"rgba(39,174,96,0.15)":C.navy,color:copied?C.green:"white",fontSize:12,fontFamily:"inherit"}}>{copied?"✓ 已複製":"複製文案"}</button>
          </div>
          <div style={{lineHeight:1.9,fontSize:14,color:C.navy,whiteSpace:"pre-wrap"}}>{result}</div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// 工具五：IG PPTX 產生器（簡化版入口）
// ════════════════════════════════════════════
function formatLayout(l){if(!l)return l;const p=l.split("/");if(p.length===3)return`${p[0]}房${p[1]}廳${p[2]}衛`;if(p.length===2)return`${p[0]}房${p[1]}衛`;return l;}
function stripUnit(v,u){return v?v.replace(u,"").trim():v;}
function fileToBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}

function ToolPPTX({ myName, myPhone, myLine, myStore }) {
  const [paste, setPaste] = useState("");
  const [data, setData] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [quote, setQuote] = useState("");
  const [nearbyText, setNearbyText] = useState({交通:"",學區:"",生活:"",醫療:""});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const photoRef = useRef();

  const handleParse = () => {
    const get=(...keys)=>{for(const key of keys){const m=paste.match(new RegExp(`${key}[：:＊*\\s🔥]*([^\n]+)`));if(m)return m[1].replace(/🔥/g,"").trim();}return"";};
    const highlights=[]; for(const m of paste.matchAll(/✅([^\n]+)/g)) highlights.push(m[1].trim());
    const parsed={委託類型:(paste.match(/一般委託|專任委託|租賃委託/)||["一般委託"])[0],案名:get("案名"),地址:get("地址"),總建:get("總建"),主建:get("主建"),樓層:get("樓層"),格局:get("格局"),屋齡:get("屋齡"),售價:get("售價"),車位:get("車位")||"",管理費:get("管理費")||"",highlights};
    setData(parsed);
    const nb={交通:"",學區:"",生活:"",醫療:""};
    for(const h of highlights){if(!nb.交通&&/交通|捷運|公車|站/.test(h))nb.交通=h;else if(!nb.學區&&/國小|國中|學校|學區/.test(h))nb.學區=h;else if(!nb.生活&&/全聯|超市|家樂福|市場|採買/.test(h))nb.生活=h;else if(!nb.醫療&&/醫院|診所/.test(h))nb.醫療=h;}
    setNearbyText(nb);
  };

  const handlePhotos=files=>{const labels=["封面主照片","室內空間照","空間照3","空間照4","空間照5"];Promise.all(Array.from(files).slice(0,5).map(async(f,i)=>({file:f,preview:URL.createObjectURL(f),label:labels[i],base64:await fileToBase64(f)}))).then(setPhotos);};

  const genQuote=async()=>{
    if(!data)return;setAiLoading(true);
    try{const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,messages:[{role:"user",content:`你是高端房仲文案師。根據以下物件，寫一句20字以內的情境金句，用「」包起來，富有詩意。\n物件：${data.案名}，${data.格局}，${data.總建}坪，${data.地址}\n只輸出那一句金句。`}]})});const json=await res.json();setQuote(json.content?.map(b=>b.text||"").join("").trim()||"");}catch{setQuote("「光與靜謐，是這個家最好的語言。」");}
    setAiLoading(false);
  };

  const generatePPTX=async()=>{
    if(!data)return;setLoading(true);setStatus("載入中...");
    try{
      if(!window.PptxGenJS){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
      setStatus("生成 PPTX...");
      const pptx=new window.PptxGenJS();
      pptx.defineLayout({name:"SQUARE",width:7.5,height:7.5});pptx.layout="SQUARE";
      const d=data;const imgD=b64=>b64?b64.replace(/^data:[^;]+;base64,/,"image/jpeg;base64,"):null;
      const ph0=photos[0]?.base64||null,ph1=photos[1]?.base64||null;
      const CC={navy:"1E2D3D",gold:"C9A84C",cream:"EDE8DC",white:"FFFFFF",gray:"8A8A8A"};
      // Slide 1
      {const s=pptx.addSlide();s.background={color:CC.navy};if(ph0){s.addImage({data:imgD(ph0),x:0,y:0,w:7.5,h:4.8,sizing:{type:"cover",w:7.5,h:4.8}});s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:7.5,h:4.8,fill:{color:CC.navy,transparency:30}});}s.addShape(pptx.ShapeType.rect,{x:0.35,y:0.3,w:1.4,h:0.35,fill:{color:CC.gold}});s.addText("IN SALE",{x:0.35,y:0.3,w:1.4,h:0.35,fontSize:10,bold:true,color:CC.navy,align:"center",valign:"middle",margin:0});s.addShape(pptx.ShapeType.rect,{x:0,y:4.8,w:7.5,h:0.05,fill:{color:CC.gold}});s.addShape(pptx.ShapeType.rect,{x:0,y:4.85,w:7.5,h:2.65,fill:{color:CC.white}});const caseShort=d.案名.substring(0,12);s.addText(caseShort,{x:0.35,y:5.0,w:6.5,h:0.9,fontSize:30,bold:true,color:CC.navy,fontFace:"微軟正黑體"});s.addText(`${d.地址.substring(0,20)}・${d.樓層}・屋齡${stripUnit(d.屋齡,"年")}年`,{x:0.35,y:5.9,w:6,h:0.35,fontSize:12,color:CC.gray,fontFace:"微軟正黑體"});s.addText(d.售價,{x:0.35,y:6.35,w:4,h:0.7,fontSize:26,bold:true,color:CC.navy,fontFace:"微軟正黑體"});s.addText(myName,{x:5.2,y:6.35,w:2,h:0.7,fontSize:16,bold:true,color:CC.gold,align:"right",fontFace:"微軟正黑體"});}
      // Slide 2
      {const s=pptx.addSlide();s.background={color:CC.navy};if(ph1){s.addImage({data:imgD(ph1),x:0,y:0,w:7.5,h:7.5,sizing:{type:"cover",w:7.5,h:7.5}});s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:7.5,h:7.5,fill:{color:"000000",transparency:45}});}s.addShape(pptx.ShapeType.rect,{x:0,y:5.9,w:7.5,h:1.6,fill:{color:CC.navy,transparency:15}});s.addShape(pptx.ShapeType.oval,{x:0.3,y:6.1,w:0.22,h:0.22,fill:{color:CC.gold}});s.addText(quote||"「光與靜謐，是這個家最好的語言。」",{x:0.65,y:6.0,w:6.5,h:0.7,fontSize:15,color:CC.white,fontFace:"微軟正黑體",italic:true});s.addText("02 / 06",{x:6.5,y:7.1,w:0.9,h:0.3,fontSize:10,color:CC.gold,align:"right"});}
      // Slide 3
      {const s=pptx.addSlide();s.background={color:CC.white};s.addText("物件規格",{x:0.35,y:0.25,w:4,h:0.55,fontSize:24,bold:true,color:CC.navy,fontFace:"微軟正黑體"});s.addText("03 / 06",{x:6.3,y:0.25,w:0.9,h:0.55,fontSize:11,color:CC.gold,align:"right"});s.addShape(pptx.ShapeType.rect,{x:0.35,y:0.85,w:6.8,h:0.04,fill:{color:CC.gold}});const specs=[{label:"格局",value:formatLayout(d.格局)},{label:"坪數",value:`${stripUnit(d.主建,"坪")} 坪`},{label:"樓層",value:d.樓層},{label:"屋齡",value:`${stripUnit(d.屋齡,"年")} 年`},{label:"車位",value:d.車位||"無"},{label:"管理費",value:d.管理費||"—"}];specs.forEach((sp,i)=>{const col=i%2,row=Math.floor(i/2),x=col===0?0.35:3.95,y=1.05+row*1.65,w=3.4;s.addShape(pptx.ShapeType.rect,{x,y,w,h:1.4,fill:{color:"F5F2EC"}});s.addShape(pptx.ShapeType.rect,{x,y,w:0.06,h:1.4,fill:{color:CC.gold}});s.addText(sp.label,{x:x+0.15,y:y+0.12,w:w-0.2,h:0.3,fontSize:11,color:CC.gray,fontFace:"微軟正黑體"});s.addText(sp.value,{x:x+0.15,y:y+0.45,w:w-0.2,h:0.6,fontSize:20,bold:true,color:CC.navy,fontFace:"微軟正黑體"});});s.addText(`${myName}　${myPhone}`,{x:0.35,y:7.05,w:6.8,h:0.3,fontSize:10,color:CC.gray,align:"center"});}
      // Slide 4
      {const s=pptx.addSlide();s.background={color:CC.navy};s.addText("HIGHLIGHT",{x:0.35,y:0.3,w:3,h:0.35,fontSize:11,bold:true,color:CC.gold,charSpacing:3});s.addText(`「${(quote||"光與靜謐，是這個家最好的語言").replace(/「|」/g,"")}」`,{x:0.35,y:1.2,w:6.8,h:2.5,fontSize:28,bold:true,italic:true,color:CC.white,fontFace:"微軟正黑體"});s.addShape(pptx.ShapeType.rect,{x:0.35,y:5.5,w:1.2,h:0.06,fill:{color:CC.gold}});s.addText(`有興趣了解更多？歡迎私訊`,{x:0.35,y:5.7,w:6,h:0.35,fontSize:13,color:CC.white,fontFace:"微軟正黑體"});s.addText(`或加 LINE：${myLine||myPhone}`,{x:0.35,y:6.1,w:6,h:0.35,fontSize:13,color:CC.white,fontFace:"微軟正黑體"});s.addText("我來為您安排帶看。",{x:0.35,y:6.5,w:6,h:0.35,fontSize:13,color:CC.white,fontFace:"微軟正黑體"});s.addText("04 / 06",{x:6.5,y:7.1,w:0.9,h:0.3,fontSize:10,color:CC.gold,align:"right"});}
      // Slide 5
      {const s=pptx.addSlide();s.background={color:CC.white};s.addText("周邊生活機能",{x:0.35,y:0.2,w:5,h:0.6,fontSize:24,bold:true,color:CC.navy,fontFace:"微軟正黑體"});s.addShape(pptx.ShapeType.rect,{x:5.8,y:0.2,w:1.4,h:0.5,fill:{color:"transparent"},line:{color:CC.gold,width:1.5}});s.addText("LOCATION",{x:5.8,y:0.2,w:1.4,h:0.5,fontSize:9,bold:true,color:CC.gold,align:"center",valign:"middle",charSpacing:2});s.addShape(pptx.ShapeType.rect,{x:0.35,y:0.82,w:6.8,h:0.04,fill:{color:CC.gold}});const cats=[{label:"交通",text:nearbyText.交通||"鄰近大眾交通"},{label:"學區",text:nearbyText.學區||"優質學區資源"},{label:"生活",text:nearbyText.生活||"生活機能完善"},{label:"醫療",text:nearbyText.醫療||"鄰近醫療資源"}];cats.forEach((cat,i)=>{const y=1.1+i*1.45;s.addShape(pptx.ShapeType.oval,{x:0.35,y,w:0.55,h:0.55,fill:{color:CC.navy}});s.addText(cat.label[0],{x:0.35,y,w:0.55,h:0.55,fontSize:11,color:CC.gold,align:"center",valign:"middle",bold:true});s.addText(cat.label,{x:1.1,y:y+0.01,w:1.1,h:0.3,fontSize:14,bold:true,color:CC.navy,fontFace:"微軟正黑體"});s.addText(cat.text,{x:2.5,y:y+0.01,w:4.6,h:0.5,fontSize:13,color:CC.gray,fontFace:"微軟正黑體"});});s.addText(`${myName}  ${myLine||myPhone}`,{x:5.0,y:7.1,w:2.2,h:0.3,fontSize:10,color:CC.gray,align:"right"});}
      // Slide 6
      {const s=pptx.addSlide();s.background={color:CC.white};const bk=CC.gold,bW=0.4,bH=0.4,bT=0.04;[[0.25,0.25,bW,bT],[0.25,0.25,bT,bH],[7.5-0.25-bW,0.25,bW,bT],[7.5-0.25-bT,0.25,bT,bH],[0.25,7.5-0.25-bT,bW,bT],[0.25,7.5-0.25-bH,bT,bH],[7.5-0.25-bW,7.5-0.25-bT,bW,bT],[7.5-0.25-bT,7.5-0.25-bH,bT,bH]].forEach(([x,y,w,h])=>s.addShape(pptx.ShapeType.rect,{x,y,w,h,fill:{color:bk}}));s.addText("CONTACT",{x:0,y:1.8,w:7.5,h:0.45,fontSize:13,bold:true,color:CC.gold,align:"center",charSpacing:4});s.addText("有任何問題",{x:0,y:2.5,w:7.5,h:0.8,fontSize:34,bold:true,color:CC.navy,align:"center",fontFace:"微軟正黑體"});s.addText("歡迎直接找我",{x:0,y:3.3,w:7.5,h:0.8,fontSize:34,bold:true,color:CC.navy,align:"center",fontFace:"微軟正黑體"});s.addShape(pptx.ShapeType.rect,{x:3.3,y:4.2,w:0.9,h:0.06,fill:{color:CC.gold}});s.addText(myName,{x:0,y:4.5,w:7.5,h:0.55,fontSize:22,bold:true,color:CC.navy,align:"center",fontFace:"微軟正黑體"});s.addText(myStore||"永慶不動產",{x:0,y:5.1,w:7.5,h:0.4,fontSize:13,color:CC.gray,align:"center",fontFace:"微軟正黑體"});s.addText(`📞  ${myPhone}`,{x:0,y:5.6,w:7.5,h:0.38,fontSize:13,color:CC.navy,align:"center",fontFace:"微軟正黑體"});if(myLine)s.addText(`LINE：${myLine}`,{x:0,y:6.05,w:7.5,h:0.38,fontSize:13,color:CC.navy,align:"center",fontFace:"微軟正黑體"});s.addText("YUN REAL ESTATE",{x:0,y:6.9,w:7.5,h:0.4,fontSize:11,bold:true,color:CC.gold,align:"center",charSpacing:3});}
      await pptx.writeFile({fileName:`${d.案名.substring(0,10).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,"")}_IG貼文.pptx`});
      setStatus("✓ PPTX 已下載！");
    } catch(e){ setStatus("發生錯誤："+e.message); }
    setLoading(false);
  };

  return (
    <div style={{padding:"16px",maxWidth:560,margin:"0 auto"}}>
      <div style={card}>
        <div style={secTitle}>① 貼入新接案訊息</div>
        <textarea value={paste} onChange={e=>setPaste(e.target.value)} placeholder={"新接🔥一般委託🔥\n店名：...\n案名🔥..."} rows={6} style={{...inp,resize:"none",lineHeight:1.7}}/>
        <button onClick={handleParse} disabled={!paste.trim()} style={{marginTop:10,padding:"9px 22px",borderRadius:20,border:"none",cursor:paste.trim()?"pointer":"not-allowed",background:paste.trim()?C.blue:C.border,color:paste.trim()?"white":C.muted,fontSize:13,fontWeight:"bold",fontFamily:"inherit"}}>⚡ 解析案件資料</button>
        {data&&<span style={{marginLeft:12,fontSize:12,color:C.green}}>✓ {data.案名.substring(0,15)}...</span>}
      </div>
      <div style={card}>
        <div style={secTitle}>② 上傳照片（最多5張，第1張封面）</div>
        <input ref={photoRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={e=>handlePhotos(e.target.files)}/>
        <button onClick={()=>photoRef.current.click()} style={{padding:"10px 22px",borderRadius:20,border:`1px dashed ${C.accent}`,background:C.light,color:C.blue,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>📷 選擇照片</button>
        {photos.length>0&&<div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>{photos.map((p,i)=><div key={i} style={{position:"relative"}}><img src={p.preview} style={{width:72,height:72,objectFit:"cover",borderRadius:8,border:`2px solid ${C.accent}`}}/><div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(27,58,92,0.75)",fontSize:9,color:"white",textAlign:"center",padding:"2px 0",borderRadius:"0 0 6px 6px"}}>{p.label}</div></div>)}</div>}
      </div>
      {data&&(
        <div style={card}>
          <div style={secTitle}>③ 情境金句（Slide 2 & 4）</div>
          <div style={{display:"flex",gap:8}}>
            <input value={quote} onChange={e=>setQuote(e.target.value)} placeholder="例：「光與靜謐，是這個家最好的語言。」" style={{...inp,flex:1}}/>
            <button onClick={genQuote} disabled={aiLoading} style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${C.accent}`,background:C.light,color:C.blue,cursor:"pointer",fontSize:12,fontFamily:"inherit",whiteSpace:"nowrap"}}>{aiLoading?"⟳":"AI 生成"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
            {["交通","學區","生活","醫療"].map(k=>(
              <div key={k}><label style={lbl}>{k}</label><input value={nearbyText[k]} onChange={e=>setNearbyText(n=>({...n,[k]:e.target.value}))} placeholder={`${k}資訊`} style={inp}/></div>
            ))}
          </div>
        </div>
      )}
      <button onClick={generatePPTX} disabled={!data||loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",cursor:data?"pointer":"not-allowed",background:data?C.navy:C.border,color:data?"white":C.muted,fontSize:14,fontWeight:"bold",fontFamily:"inherit",marginBottom:8}}>
        {loading?status:"✦ 生成 PPTX（6張 IG 貼文）"}
      </button>
      {status&&!loading&&<div style={{textAlign:"center",fontSize:13,color:status.startsWith("✓")?C.green:C.orange,paddingBottom:8}}>{status}</div>}
      <div style={{textAlign:"center",fontSize:11,color:C.muted,paddingBottom:20}}>下載後開啟 PPTX → 另存為 PNG → 上傳 Instagram</div>
    </div>
  );
}

// ════════════════════════════════════════════
// 設定頁
// ════════════════════════════════════════════
function ToolSettings({ myName,setMyName,myPhone,setMyPhone,myLine,setMyLine,myStore,setMyStore }) {
  const [saved,setSaved]=useState(false);
  const save=()=>{localStorage.setItem("myinfo",JSON.stringify({myName,myPhone,myLine,myStore}));setSaved(true);setTimeout(()=>setSaved(false),2000);};
  return (
    <div style={{padding:"16px",maxWidth:420,margin:"0 auto"}}>
      <div style={card}>
        <div style={secTitle}>我的資訊</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {[["姓名",myName,setMyName,"林昀蓁"],["電話",myPhone,setMyPhone,"0909-998263"],["LINE ID",myLine,setMyLine,"yun826_"],["店名",myStore,setMyStore,"永慶 西屯安和創意店"]].map(([label,val,setter,ph])=>(
            <div key={label}><label style={lbl}>{label}</label><input value={val} onChange={e=>setter(e.target.value)} placeholder={ph} style={inp}/></div>
          ))}
        </div>
        <button onClick={save} style={{width:"100%",marginTop:18,padding:"13px",background:C.navy,border:"none",borderRadius:10,color:"white",fontSize:14,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>
          {saved?"✓ 已儲存！":"儲存設定"}
        </button>
      </div>
      <div style={{...card,background:C.light,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,color:C.blue,fontWeight:"700",marginBottom:8}}>💡 說明</div>
        <div style={{fontSize:12,color:C.gray,lineHeight:1.8}}>
          這裡填入的資訊會自動帶入所有工具。<br/>
          LINE 群發工具會用你的名字和電話取代原本的經紀人資訊。<br/>
          PPTX 貼文的聯絡頁也會自動帶入。
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// 主 App
// ════════════════════════════════════════════
const TABS = [
  { id:"reminder", label:"回訪提醒", icon:"📌" },
  { id:"line",     label:"LINE",     icon:"💬" },
  { id:"pptx",     label:"IG貼文",  icon:"📸" },
  { id:"copy",     label:"文案",     icon:"✍️"  },
  { id:"calc",     label:"業績",     icon:"💰" },
  { id:"settings", label:"設定",     icon:"⚙️"  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("reminder");
  const [myName,setMyName]=useState("");
  const [myPhone,setMyPhone]=useState("");
  const [myLine,setMyLine]=useState("");
  const [myStore,setMyStore]=useState("");

  useEffect(()=>{
    try{const s=JSON.parse(localStorage.getItem("myinfo")||"{}");if(s.myName)setMyName(s.myName);if(s.myPhone)setMyPhone(s.myPhone);if(s.myLine)setMyLine(s.myLine);if(s.myStore)setMyStore(s.myStore);}catch{}
  },[]);

  const overdueCount = (() => {
    try{ const owners=JSON.parse(localStorage.getItem("owners_v1")||"[]"); return owners.filter(o=>diffDays(o.nextVisit)<0&&o.result!=="不賣了"&&o.result!=="已給他家").length; }catch{return 0;}
  })();

  return (
    <div style={{minHeight:"100vh",background:C.pale,fontFamily:"system-ui,'Noto Sans TC',sans-serif",color:C.navy,paddingBottom:70}}>
      {/* Header */}
      <div style={{background:C.navy,padding:"14px 20px",borderBottom:`3px solid ${C.accent}`,display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:100}}>
        <div style={{width:36,height:36,background:C.accent,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:"bold",color:"white",flexShrink:0}}>永</div>
        <div>
          <div style={{fontSize:15,fontWeight:"bold",color:"white",letterSpacing:"0.05em"}}>
            {TABS.find(t=>t.id===activeTab)?.icon} {TABS.find(t=>t.id===activeTab)?.label}
            {activeTab==="settings"&&myName&&<span style={{fontSize:12,color:"#7EB8E8",marginLeft:8}}>— {myName}</span>}
          </div>
          <div style={{fontSize:10,color:"#7EB8E8",marginTop:1}}>永慶不動產工作台</div>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab==="reminder" && <ToolReminder/>}
        {activeTab==="line"     && <ToolLine myName={myName} myPhone={myPhone}/>}
        {activeTab==="pptx"     && <ToolPPTX myName={myName} myPhone={myPhone} myLine={myLine} myStore={myStore}/>}
        {activeTab==="copy"     && <ToolCopywriter/>}
        {activeTab==="calc"     && <ToolCommission/>}
        {activeTab==="settings" && <ToolSettings myName={myName} setMyName={setMyName} myPhone={myPhone} setMyPhone={setMyPhone} myLine={myLine} setMyLine={setMyLine} myStore={myStore} setMyStore={setMyStore}/>}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,boxShadow:"0 -2px 12px rgba(27,58,92,0.08)"}}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:1,padding:"10px 0 8px",border:"none",cursor:"pointer",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
            <span style={{fontSize:18}}>{tab.icon}</span>
            <span style={{fontSize:9,color:activeTab===tab.id?C.blue:C.muted,fontWeight:activeTab===tab.id?"700":"400",fontFamily:"inherit"}}>{tab.label}</span>
            {activeTab===tab.id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:32,height:2,background:C.blue,borderRadius:"0 0 2px 2px"}}/>}
            {tab.id==="reminder"&&overdueCount>0&&<div style={{position:"absolute",top:6,right:"50%",transform:"translateX(14px)",width:14,height:14,background:C.red,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white",fontWeight:"bold"}}>{overdueCount}</div>}
          </button>
        ))}
      </div>

      <style>{`input::placeholder,textarea::placeholder{color:${C.muted};}input:focus,textarea:focus{border-color:${C.accent}!important;background:white!important;}*{box-sizing:border-box;}input[type=number]::-webkit-inner-spin-button{opacity:.4;}`}</style>
    </div>
  );
}
