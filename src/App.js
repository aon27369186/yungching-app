import { useState, useEffect, useRef } from "react";

const C = {
  navy: "#1B3A5C", blue: "#2E6DA4", accent: "#4A90D9",
  light: "#EBF4FF", pale: "#F0F6FC", border: "#C2DDF5",
  white: "#FFFFFF", gray: "#4A7FA5", muted: "#A0BCD8",
  green: "#27AE60", red: "#C0392B", orange: "#D4690A",
};

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #C2DDF5", background: "#F7FBFF",
  fontSize: 14, color: "#1B3A5C", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};
const lblStyle = { fontSize: 11, color: "#4A7FA5", fontWeight: "600", letterSpacing: "0.05em", display: "block", marginBottom: 5 };
const cardStyle = { background: "#FFFFFF", border: "1px solid #C2DDF5", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(27,58,92,0.06)", marginBottom: 14 };
const secTitleStyle = { fontSize: 12, color: "#2E6DA4", fontWeight: "700", marginBottom: 14, letterSpacing: "0.05em" };

// ── 屋主回訪提醒 ──
const RESULT_OPTIONS = ["還在考慮","有住人沒遇到","沒住人","已簽委託","已給他家","不賣了"];
const RESULT_STYLE = {
  "還在考慮": { bg:"#FFF8E1", color:"#B7770D" },
  "有住人沒遇到": { bg:"#FFF0E6", color:"#C05621" },
  "沒住人": { bg:"#EDF2F7", color:"#4A5568" },
  "已簽委託": { bg:"#E6F4EA", color:"#1E6E37" },
  "已給他家": { bg:"#EBF4FF", color:"#2B5FA0" },
  "不賣了": { bg:"#F7F7F7", color:"#888888" },
};

function todayStr() { return new Date().toISOString().split("T")[0]; }
function addDays(s, n) { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function diffDays(s) { const t = new Date(); t.setHours(0,0,0,0); const d = new Date(s); d.setHours(0,0,0,0); return Math.round((d-t)/86400000); }
function fmtDate(s) { const parts = s.split("-"); return parts[1] + "/" + parts[2]; }

const EMPTY_OWNER = { community:"", floor:"", price:"", ownerName:"", ownerTitle:"先生", result:"還在考慮", visitDate:todayStr(), nextVisit:addDays(todayStr(),3), note:"" };

function ToolReminder() {
  const [owners, setOwners] = useState(function() {
    try { return JSON.parse(localStorage.getItem("owners_v1") || "[]"); } catch(e) { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_OWNER);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("全部");
  const [expandId, setExpandId] = useState(null);

  useEffect(function() { localStorage.setItem("owners_v1", JSON.stringify(owners)); }, [owners]);

  function save() {
    if (!form.community.trim()) return;
    if (editId !== null) {
      setOwners(owners.map(function(o) { return o.id === editId ? Object.assign({}, form, {id: editId}) : o; }));
      setEditId(null);
    } else {
      setOwners([Object.assign({}, form, {id: Date.now()})].concat(owners));
    }
    setForm(EMPTY_OWNER);
    setShowForm(false);
  }

  function del(id) { setOwners(owners.filter(function(o) { return o.id !== id; })); }

  function startEdit(o) {
    setForm(Object.assign({}, o));
    setEditId(o.id);
    setShowForm(true);
    setExpandId(null);
  }

  function checkin(id) {
    setOwners(owners.map(function(o) {
      return o.id === id ? Object.assign({}, o, {visitDate: todayStr(), nextVisit: addDays(todayStr(), 3)}) : o;
    }));
  }

  var filtered = owners.filter(function(o) { return filter === "全部" || o.result === filter; });
  var sorted = filtered.slice().sort(function(a, b) { return diffDays(a.nextVisit) - diffDays(b.nextVisit); });
  var overdue = owners.filter(function(o) { return diffDays(o.nextVisit) < 0 && o.result !== "不賣了" && o.result !== "已給他家"; }).length;
  var todayCnt = owners.filter(function(o) { return diffDays(o.nextVisit) === 0; }).length;
  var active = owners.filter(function(o) { return o.result !== "不賣了" && o.result !== "已給他家"; }).length;

  function stLabel(s, r) {
    if (r === "不賣了" || r === "已給他家") return {text:"—", color:"#A0BCD8", bg:"#F7F7F7"};
    var d = diffDays(s);
    if (d < 0) return {text:"逾期" + Math.abs(d) + "天", color:"#C0392B", bg:"#FFE5E5"};
    if (d === 0) return {text:"今天拜訪", color:"#D4690A", bg:"#FFF0E6"};
    if (d === 1) return {text:"明天拜訪", color:"#B7770D", bg:"#FFF8E1"};
    if (d <= 3) return {text:d + "天後", color:"#2E6DA4", bg:"#EBF4FF"};
    return {text:fmtDate(s) + "拜訪", color:"#4A7FA5", bg:"#F0F6FC"};
  }

  return (
    <div style={{padding:"16px", maxWidth:560, margin:"0 auto"}}>
      <div style={{display:"flex", gap:10, marginBottom:16}}>
        {[{l:"追蹤中",v:active,c:"#2E6DA4"},{l:"今日",v:todayCnt,c:"#D4690A"},{l:"逾期",v:overdue,c:"#C0392B"}].map(function(s) {
          return (
            <div key={s.l} style={{flex:1, background:"#FFFFFF", border:"1px solid #C2DDF5", borderRadius:10, padding:"12px 0", textAlign:"center"}}>
              <div style={{fontSize:24, fontWeight:"bold", color:s.c}}>{s.v}</div>
              <div style={{fontSize:10, color:"#A0BCD8", marginTop:2}}>{s.l}</div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex", gap:6, marginBottom:14, flexWrap:"wrap"}}>
        {["全部"].concat(RESULT_OPTIONS).map(function(f) {
          return (
            <button key={f} onClick={function() { setFilter(f); }} style={{
              padding:"5px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11, fontFamily:"inherit",
              background: filter === f ? "#1B3A5C" : "#FFFFFF",
              color: filter === f ? "white" : "#4A7FA5",
            }}>{f}</button>
          );
        })}
      </div>
      <button onClick={function() { setForm(EMPTY_OWNER); setEditId(null); setShowForm(true); }} style={{
        width:"100%", padding:"12px", background:"#1B3A5C", border:"none", borderRadius:10,
        color:"white", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginBottom:16,
      }}>＋ 新增屋主</button>

      {sorted.length === 0 && <div style={{textAlign:"center", padding:"40px 0", color:"#A0BCD8", fontSize:13}}>還沒有屋主資料，點上方新增</div>}

      {sorted.map(function(o) {
        var st = stLabel(o.nextVisit, o.result);
        var rs = RESULT_STYLE[o.result] || RESULT_STYLE["還在考慮"];
        var isExp = expandId === o.id;
        var isOvd = diffDays(o.nextVisit) < 0 && o.result !== "不賣了" && o.result !== "已給他家";
        return (
          <div key={o.id} style={{background:"#FFFFFF", borderRadius:12, marginBottom:10, border:"1px solid " + (isOvd ? "#FCA5A5" : "#C2DDF5"), overflow:"hidden"}}>
            <div style={{padding:"14px 16px", cursor:"pointer"}} onClick={function() { setExpandId(isExp ? null : o.id); }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:5}}>
                    <span style={{fontSize:15, fontWeight:"bold", color:"#1B3A5C"}}>{o.community}</span>
                    <span style={{fontSize:11, color:"#A0BCD8"}}>{o.floor}樓</span>
                  </div>
                  <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
                    <span style={{fontSize:12, color:"#4A7FA5"}}>{o.ownerName}{o.ownerTitle}</span>
                    <span style={{fontSize:12, color:"#1B3A5C", fontWeight:"600"}}>{o.price}萬</span>
                    <span style={{fontSize:11, padding:"2px 8px", borderRadius:10, background:rs.bg, color:rs.color, fontWeight:"600"}}>{o.result}</span>
                  </div>
                </div>
                <div style={{padding:"5px 10px", borderRadius:8, background:st.bg, flexShrink:0, marginLeft:8, textAlign:"center"}}>
                  <div style={{fontSize:11, fontWeight:"bold", color:st.color, whiteSpace:"nowrap"}}>{st.text}</div>
                  {o.result !== "不賣了" && o.result !== "已給他家" && <div style={{fontSize:10, color:"#A0BCD8", marginTop:1}}>上次{fmtDate(o.visitDate)}</div>}
                </div>
              </div>
            </div>
            {isExp && (
              <div style={{borderTop:"1px solid #EBF4FF", padding:"12px 16px", background:"#F0F6FC"}}>
                {o.note && <div style={{fontSize:12, color:"#4A5568", marginBottom:12, padding:"8px 12px", background:"#FFFFFF", borderRadius:8, borderLeft:"3px solid #4A90D9", lineHeight:1.7}}>{o.note}</div>}
                <div style={{display:"flex", gap:8}}>
                  <button onClick={function() { checkin(o.id); }} style={{flex:1, padding:"9px 0", borderRadius:8, border:"none", background:"#1B3A5C", color:"white", fontSize:12, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit"}}>✓ 今天已拜訪（+3天）</button>
                  <button onClick={function() { startEdit(o); }} style={{padding:"9px 14px", borderRadius:8, border:"1px solid #C2DDF5", background:"#FFFFFF", color:"#4A7FA5", fontSize:12, cursor:"pointer", fontFamily:"inherit"}}>編輯</button>
                  <button onClick={function() { del(o.id); }} style={{padding:"9px 14px", borderRadius:8, border:"1px solid #FCA5A5", background:"#FFFFFF", color:"#C0392B", fontSize:12, cursor:"pointer", fontFamily:"inherit"}}>刪除</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {showForm && (
        <div style={{position:"fixed", inset:0, background:"rgba(27,58,92,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200}} onClick={function(e) { if (e.target === e.currentTarget) { setShowForm(false); setEditId(null); } }}>
          <div style={{background:"white", borderRadius:"20px 20px 0 0", padding:"24px 20px 32px", width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
              <div style={{fontSize:16, fontWeight:"bold", color:"#1B3A5C"}}>{editId ? "編輯屋主" : "新增屋主"}</div>
              <button onClick={function() { setShowForm(false); setEditId(null); }} style={{background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#A0BCD8"}}>×</button>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>社區名稱</label>
                <input value={form.community} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {community: e.target.value}); }); }} placeholder="例：廣三大時代" style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>樓層</label>
                <input value={form.floor} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {floor: e.target.value}); }); }} placeholder="例：6/12" style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>開價（萬）</label>
                <input value={form.price} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {price: e.target.value}); }); }} placeholder="例：1088" type="number" style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>屋主姓氏</label>
                <input value={form.ownerName} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {ownerName: e.target.value}); }); }} placeholder="例：張" style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>稱謂</label>
                <div style={{display:"flex", gap:8}}>
                  {["先生","小姐"].map(function(t) {
                    return <button key={t} onClick={function() { setForm(function(f) { return Object.assign({}, f, {ownerTitle: t}); }); }} style={{flex:1, padding:"10px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:"bold", background: form.ownerTitle === t ? "#1B3A5C" : "#F0F6FC", color: form.ownerTitle === t ? "white" : "#4A7FA5"}}>{t}</button>;
                  })}
                </div>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>拜訪結果</label>
                <div style={{display:"flex", flexWrap:"wrap", gap:7}}>
                  {RESULT_OPTIONS.map(function(r) {
                    return <button key={r} onClick={function() { setForm(function(f) { return Object.assign({}, f, {result: r}); }); }} style={{padding:"7px 13px", borderRadius:16, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, background: form.result === r ? "#1B3A5C" : "#F0F6FC", color: form.result === r ? "white" : "#4A7FA5", fontWeight: form.result === r ? "bold" : "normal"}}>{r}</button>;
                  })}
                </div>
              </div>
              <div>
                <label style={lblStyle}>拜訪日期</label>
                <input type="date" value={form.visitDate} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {visitDate: e.target.value, nextVisit: addDays(e.target.value, 3)}); }); }} style={inputStyle} />
              </div>
              <div>
                <label style={lblStyle}>下次回訪日</label>
                <input type="date" value={form.nextVisit} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {nextVisit: e.target.value}); }); }} style={inputStyle} />
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label style={lblStyle}>備註</label>
                <textarea value={form.note} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, {note: e.target.value}); }); }} placeholder="屋主說了什麼..." rows={3} style={Object.assign({}, inputStyle, {resize:"none", lineHeight:1.7})} />
              </div>
            </div>
            <button onClick={save} disabled={!form.community.trim()} style={{width:"100%", marginTop:16, padding:"14px", background: form.community.trim() ? "#1B3A5C" : "#C2DDF5", border:"none", borderRadius:10, color: form.community.trim() ? "white" : "#A0BCD8", fontSize:15, fontWeight:"bold", cursor: form.community.trim() ? "pointer" : "not-allowed", fontFamily:"inherit"}}>{editId ? "儲存變更" : "新增屋主"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── LINE 群發工具 ──
function parseMsg(text) {
  function get() {
    for (var i = 0; i < arguments.length; i++) {
      var key = arguments[i];
      var re = new RegExp(key + "[：:＊*\\s🔥]*([^\n]+)");
      var m = text.match(re);
      if (m) return m[1].replace(/🔥/g, "").trim();
    }
    return "";
  }
  var highlights = [];
  var hlRe = /✅([^\n]+)/g;
  var hm;
  while ((hm = hlRe.exec(text)) !== null) highlights.push(hm[1].trim());
  var typeM = text.match(/一般委託|專任委託|租賃委託/);
  return {
    委託類型: typeM ? typeM[0] : "一般委託",
    案名: get("案名"), 地址: get("地址"), 總建: get("總建"), 主建: get("主建"),
    樓層: get("樓層"), 格局: get("格局"), 屋齡: get("屋齡"), 售價: get("售價"),
    店名: get("店名"), 物件編號: get("物件編號"),
    附屬: get("附屬"), 共用: get("共用"),
    車位: get("車位") || "", 管理費: get("管理費") || "", highlights: highlights
  };
}

function buildMsg(form, highlights, myName, myPhone) {
  var hlStr = highlights.filter(Boolean).map(function(h) { return "✅" + h; }).join("\n");
  return "新接🔥" + form.委託類型 + "🔥\n店名：" + form.店名 + "\n物件編號：" + form.物件編號 +
    "\n案名🔥" + form.案名 + "\n地址：" + form.地址 +
    "\n總建：" + form.總建 + "坪\n主建：" + form.主建 + "坪" +
    "\n附屬：" + form.附屬 + "坪\n共用：" + form.共用 + "坪" +
    "\n樓層：" + form.樓層 + "\n格局：" + form.格局 + "\n屋齡：" + form.屋齡 + "年\n售價：" + form.售價 +
    "\n" + hlStr + "\n\n經紀人\n" + myName + "：" + myPhone;
}

function ToolLine(props) {
  var myName = props.myName; var myPhone = props.myPhone;
  var [step, setStep] = useState(0);
  var [paste, setPaste] = useState("");
  var [data, setData] = useState(null);
  var [highlights, setHighlights] = useState([]);
  var [loading, setLoading] = useState(false);
  var [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setHighlights([]);
    var parsed = parseMsg(paste); setData(parsed);
    var prompt = "你是永慶不動產的房仲，根據以下物件資訊產出5條LINE群發亮點條列。\n物件：" + parsed.案名 + "\n地址：" + parsed.地址 + "\n格局：" + parsed.格局 + "\n坪數：總建" + parsed.總建 + "坪\n樓層：" + parsed.樓層 + "\n屋齡：" + parsed.屋齡 + "年\n售價：" + parsed.售價 + "\n規則：每條不超過28字，語氣精準簡潔，符合台灣房仲用語。只輸出5條純文字，每條一行，不加符號或編號。";
    try {
      var res = await fetch("https://api.anthropic.com/v1/messages", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:400, messages:[{role:"user", content:prompt}]})});
      var json = await res.json();
      var lines = (json.content || []).map(function(b) { return b.text || ""; }).join("").split("\n").map(function(l) { return l.replace(/^[✅\-\d\.、]+/, "").trim(); }).filter(Boolean).slice(0, 5);
      setHighlights(lines);
    } catch(e) { setHighlights(["生成失敗，請重試"]); }
    setLoading(false); setStep(1);
  }

  var lineMsg = data ? buildMsg(data, highlights, myName, myPhone) : "";
  function copy() { navigator.clipboard.writeText(lineMsg); setCopied(true); setTimeout(function() { setCopied(false); }, 2000); }
  function reset() { setPaste(""); setData(null); setHighlights([]); setCopied(false); setStep(0); }

  return (
    <div style={{padding:"16px", maxWidth:560, margin:"0 auto"}}>
      {step === 0 && (
        <div style={cardStyle}>
          <div style={secTitleStyle}>貼入 LINE 群組案件訊息</div>
          <textarea value={paste} onChange={function(e) { setPaste(e.target.value); }} placeholder={"新接🔥一般委託🔥\n店名：...\n案名🔥..."} rows={8} style={Object.assign({}, inputStyle, {resize:"none", lineHeight:1.7})} />
          <button onClick={generate} disabled={!paste.trim() || loading} style={{marginTop:10, width:"100%", padding:"12px", borderRadius:10, border:"none", cursor: paste.trim() ? "pointer" : "not-allowed", background: paste.trim() ? "#1B3A5C" : "#C2DDF5", color: paste.trim() ? "white" : "#A0BCD8", fontSize:14, fontWeight:"bold", fontFamily:"inherit"}}>
            {loading ? "⟳ AI 生成亮點中..." : "⚡ 解析 + 生成亮點"}
          </button>
        </div>
      )}
      {step === 1 && (
        <>
          <div style={cardStyle}>
            <div style={secTitleStyle}>✅ 亮點條列（可編輯）</div>
            {highlights.map(function(h, i) {
              return (
                <div key={i} style={{display:"flex", gap:8, marginBottom:8, alignItems:"center"}}>
                  <span style={{color:"#27AE60", flexShrink:0}}>✅</span>
                  <input value={h} onChange={function(e) { var n = highlights.slice(); n[i] = e.target.value; setHighlights(n); }} style={Object.assign({}, inputStyle, {flex:1})} />
                </div>
              );
            })}
          </div>
          <div style={cardStyle}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <div style={secTitleStyle}>📤 完整訊息預覽</div>
              <div style={{display:"flex", gap:8}}>
                <button onClick={copy} style={{padding:"7px 16px", borderRadius:16, border:"none", cursor:"pointer", background: copied ? "rgba(39,174,96,0.15)" : "#1B3A5C", color: copied ? "#27AE60" : "white", fontSize:12, fontFamily:"inherit"}}>{copied ? "✓ 已複製" : "複製"}</button>
                <button onClick={reset} style={{padding:"7px 16px", borderRadius:16, cursor:"pointer", background:"#F0F6FC", border:"1px solid #C2DDF5", color:"#4A7FA5", fontSize:12, fontFamily:"inherit"}}>貼下一個</button>
              </div>
            </div>
            <div style={{background:"#F0F6FC", borderRadius:8, padding:16, fontSize:13, lineHeight:2, whiteSpace:"pre-wrap", color:"#1B3A5C", border:"1px solid #C2DDF5"}}>{lineMsg}</div>
          </div>
        </>
      )}
    </div>
  );
}

// ── 業績試算 ──
function ToolCommission() {
  var [price, setPrice] = useState("");
  var [buyerRate, setBuyerRate] = useState("2");
  var [sellerRate, setSellerRate] = useState("4");
  var [type, setType] = useState("half");
  var [partner, setPartner] = useState(true);

  var p = parseFloat(price) || 0;
  var br = parseFloat(buyerRate) || 0;
  var sr = parseFloat(sellerRate) || 0;
  var totalFee = p * (br + sr) / 100;
  var afterType = type === "half" ? totalFee / 2 : totalFee;
  var myPerf = partner ? afterType / 2 : afterType;
  var base = Math.min(myPerf, 30);
  var above = Math.max(myPerf - 30, 0);
  var mySalary = base * 0.417 + above * 0.467;

  function fmt(n) {
    if (n >= 1) return n.toFixed(1).replace(/\.0$/, "") + " 萬";
    return Math.round(n * 10000).toLocaleString() + " 元";
  }

  function Row(props) {
    return (
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #C2DDF5"}}>
        <div>
          <div style={{fontSize:13, color: props.hl ? "#1B3A5C" : "#4A7FA5"}}>{props.label}</div>
          {props.sub && <div style={{fontSize:11, color:"#A0BCD8", marginTop:2}}>{props.sub}</div>}
        </div>
        <div style={{fontSize: props.hl ? 22 : 16, fontWeight: props.hl ? "bold" : "normal", color: props.hl ? "#2E6DA4" : "#4A7FA5"}}>{props.value}</div>
      </div>
    );
  }

  function Btn(props) {
    return <button onClick={props.onClick} style={{flex:1, padding:"10px 0", border:"none", borderRadius:8, background: props.active ? "#1B3A5C" : "#F0F6FC", color: props.active ? "white" : "#4A7FA5", fontSize:13, fontWeight: props.active ? "bold" : "normal", cursor:"pointer", fontFamily:"inherit"}}>{props.children}</button>;
  }

  return (
    <div style={{padding:"16px", maxWidth:420, margin:"0 auto"}}>
      <div style={cardStyle}>
        <label style={lblStyle}>成交價（萬元）</label>
        <input type="number" value={price} onChange={function(e) { setPrice(e.target.value); }} placeholder="例：1000" style={Object.assign({}, inputStyle, {fontSize:22, fontWeight:"bold"})} />
        <div style={{display:"flex", gap:12, marginTop:14}}>
          <div style={{flex:1}}>
            <label style={lblStyle}>賣方服務費 %</label>
            <input type="number" value={sellerRate} onChange={function(e) { setSellerRate(e.target.value); }} placeholder="4" style={Object.assign({}, inputStyle, {fontSize:16})} />
          </div>
          <div style={{flex:1}}>
            <label style={lblStyle}>買方服務費 %</label>
            <input type="number" value={buyerRate} onChange={function(e) { setBuyerRate(e.target.value); }} placeholder="2" style={Object.assign({}, inputStyle, {fontSize:16})} />
          </div>
        </div>
      </div>
      <div style={cardStyle}>
        <div style={secTitleStyle}>代表方</div>
        <div style={{display:"flex", gap:8, marginBottom:16}}>
          <Btn active={type === "half"} onClick={function() { setType("half"); }}>半泡（買或賣）</Btn>
          <Btn active={type === "full"} onClick={function() { setType("full"); }}>全泡（買賣雙方）</Btn>
        </div>
        <div style={secTitleStyle}>搭檔</div>
        <div style={{display:"flex", gap:8}}>
          <Btn active={partner} onClick={function() { setPartner(true); }}>有搭檔（÷2）</Btn>
          <Btn active={!partner} onClick={function() { setPartner(false); }}>無搭檔</Btn>
        </div>
      </div>
      {p > 0 && (
        <div style={cardStyle}>
          <Row label="總服務費" value={fmt(totalFee)} sub={p + "萬 × (" + sr + "%+" + br + "%)"} />
          <Row label={type === "half" ? "半泡（÷2）" : "全泡"} value={fmt(afterType)} />
          {partner && <Row label="搭檔拆分（÷2）" value={fmt(myPerf)} />}
          <div style={{height:1, background:"#C2DDF5", margin:"4px 0"}} />
          <Row label="我的業績" value={fmt(myPerf)} hl={true} />
          <div style={{background: myPerf >= 30 ? "rgba(39,174,96,0.08)" : "rgba(212,105,10,0.08)", border:"1px solid " + (myPerf >= 30 ? "rgba(39,174,96,0.25)" : "rgba(212,105,10,0.25)"), borderRadius:8, padding:"12px 14px", margin:"8px 0"}}>
            {myPerf >= 30 ? (
              <div>
                <div style={{fontSize:12, color:"#27AE60", marginBottom:6}}>✓ 累進抽成適用</div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:"#4A7FA5", marginBottom:4}}><span>前30萬 × 41.7%</span><span>{fmt(base * 0.417)}</span></div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:"#2E6DA4"}}><span>超過 {fmt(above)} × 46.7%</span><span>{fmt(above * 0.467)}</span></div>
              </div>
            ) : (
              <div style={{fontSize:12, color:"#D4690A"}}>還差 {fmt(30 - myPerf)} 達累進門檻</div>
            )}
          </div>
          <Row label="到手薪水" value={fmt(mySalary)} hl={true} />
        </div>
      )}
    </div>
  );
}

// ── 房源文案 ──
var STYLES = ["溫馨居家感","專業精準型","豪華尊榮感","年輕活力風"];
var STYLE_HINTS = {"溫馨居家感":"適合家庭買家，強調生活感","專業精準型":"數據導向，適合投資客","豪華尊榮感":"高端物件，強調品味","年輕活力風":"首購族，輕鬆活潑語氣"};

function ToolCopywriter() {
  var [form, setForm] = useState({address:"", type:"", area:"", floor:"", price:"", features:"", nearby:"", style:"溫馨居家感"});
  var [result, setResult] = useState("");
  var [loading, setLoading] = useState(false);
  var [copied, setCopied] = useState(false);

  async function generate() {
    var filled = Object.entries(form).filter(function(e) { return e[0] !== "style" && e[1].trim(); });
    if (filled.length < 3) return;
    setLoading(true); setResult(""); setCopied(false);
    var parts = [
      "你是永慶不動產的專業文案撰寫師，請根據以下物件資訊，撰寫一段吸引人的房源介紹文案。",
      form.address ? "地址：" + form.address : "",
      form.type ? "類型：" + form.type : "",
      form.area ? "坪數：" + form.area : "",
      form.floor ? "樓層：" + form.floor : "",
      form.price ? "價格：" + form.price : "",
      form.features ? "特色：" + form.features : "",
      form.nearby ? "周邊：" + form.nearby : "",
      "文案風格：" + form.style + "（" + (STYLE_HINTS[form.style] || "") + "）",
      "請撰寫約150-250字，包含吸引眼球的標題、核心賣點、生活情境、結尾呼籲。語氣自然，符合台灣房仲用語。"
    ];
    var prompt = parts.filter(Boolean).join("\n");
    try {
      var res = await fetch("https://api.anthropic.com/v1/messages", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user", content:prompt}]})});
      var data = await res.json();
      setResult((data.content || []).map(function(b) { return b.text || ""; }).join("") || "無法生成，請再試一次");
    } catch(e) { setResult("發生錯誤，請稍後再試"); }
    setLoading(false);
  }

  var filledCount = Object.entries(form).filter(function(e) { return e[0] !== "style" && e[1].trim(); }).length;
  function copy() { navigator.clipboard.writeText(result); setCopied(true); setTimeout(function() { setCopied(false); }, 2000); }

  var fieldMap = {地址:"address", 類型:"type", 坪數:"area", 樓層:"floor", "售價/租金":"price"};
  var phMap = {地址:"台中市南區工學一街177號", 類型:"例：3房2廳、電梯大樓", 坪數:"例：32坪（室內28坪）", 樓層:"例：8F/12F", "售價/租金":"例：1,280萬"};

  return (
    <div style={{padding:"16px", maxWidth:560, margin:"0 auto"}}>
      <div style={cardStyle}>
        <div style={secTitleStyle}>填入物件資訊（至少3項）</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          {["地址","類型","坪數","樓層","售價/租金"].map(function(label) {
            var key = fieldMap[label] || label;
            return (
              <div key={label} style={{gridColumn: label === "地址" ? "1/-1" : "auto"}}>
                <label style={lblStyle}>{label}</label>
                <input value={form[key]} onChange={function(e) { var val = e.target.value; setForm(function(f) { var n = Object.assign({}, f); n[key] = val; return n; }); }} placeholder={phMap[label]} style={inputStyle} />
              </div>
            );
          })}
          <div style={{gridColumn:"1/-1"}}>
            <label style={lblStyle}>特色亮點</label>
            <input value={form.features} onChange={function(e) { var val = e.target.value; setForm(function(f) { return Object.assign({}, f, {features: val}); }); }} placeholder="例：南北向採光、近捷運、全新裝潢" style={inputStyle} />
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={lblStyle}>周邊機能</label>
            <input value={form.nearby} onChange={function(e) { var val = e.target.value; setForm(function(f) { return Object.assign({}, f, {nearby: val}); }); }} placeholder="例：步行5分鐘大安森林公園" style={inputStyle} />
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <label style={lblStyle}>文案風格</label>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              {STYLES.map(function(s) {
                return <button key={s} onClick={function() { setForm(function(f) { return Object.assign({}, f, {style: s}); }); }} style={{padding:"7px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, background: form.style === s ? "#1B3A5C" : "#F0F6FC", color: form.style === s ? "white" : "#4A7FA5", fontWeight: form.style === s ? "bold" : "normal"}}>{s}</button>;
              })}
            </div>
            <div style={{fontSize:11, color:"#A0BCD8", marginTop:6}}>💡 {STYLE_HINTS[form.style]}</div>
          </div>
        </div>
      </div>
      <button onClick={generate} disabled={filledCount < 3 || loading} style={{width:"100%", padding:"14px", borderRadius:12, border:"none", cursor: filledCount >= 3 ? "pointer" : "not-allowed", background: filledCount >= 3 ? "#1B3A5C" : "#C2DDF5", color: filledCount >= 3 ? "white" : "#A0BCD8", fontSize:14, fontWeight:"bold", fontFamily:"inherit", marginBottom:14}}>
        {loading ? "⟳ 生成中..." : filledCount >= 3 ? "✦ 生成房源文案" : "還需填入 " + (3 - filledCount) + " 項"}
      </button>
      {result && (
        <div style={cardStyle}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
            <div style={secTitleStyle}>生成文案</div>
            <button onClick={copy} style={{padding:"7px 16px", borderRadius:16, border:"none", cursor:"pointer", background: copied ? "rgba(39,174,96,0.15)" : "#1B3A5C", color: copied ? "#27AE60" : "white", fontSize:12, fontFamily:"inherit"}}>{copied ? "✓ 已複製" : "複製文案"}</button>
          </div>
          <div style={{lineHeight:1.9, fontSize:14, color:"#1B3A5C", whiteSpace:"pre-wrap"}}>{result}</div>
        </div>
      )}
    </div>
  );
}

// ── IG PPTX ──
function fileToBase64(file) {
  return new Promise(function(res, rej) {
    var r = new FileReader();
    r.onload = function() { res(r.result); };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function ToolPPTX(props) {
  var myName = props.myName; var myPhone = props.myPhone; var myLine = props.myLine; var myStore = props.myStore;
  var [paste, setPaste] = useState("");
  var [data, setData] = useState(null);
  var [photos, setPhotos] = useState([]);
  var [quote, setQuote] = useState("");
  var [nearbyText, setNearbyText] = useState({交通:"", 學區:"", 生活:"", 醫療:""});
  var [loading, setLoading] = useState(false);
  var [status, setStatus] = useState("");
  var [aiLoading, setAiLoading] = useState(false);
  var photoRef = useRef();

  function handleParse() {
    var d = parseMsg(paste);
    setData(d);
    var nb = {交通:"", 學區:"", 生活:"", 醫療:""};
    d.highlights.forEach(function(h) {
      if (!nb["交通"] && /交通|捷運|公車|站/.test(h)) nb["交通"] = h;
      else if (!nb["學區"] && /國小|國中|學校|學區/.test(h)) nb["學區"] = h;
      else if (!nb["生活"] && /全聯|超市|家樂福|市場|採買/.test(h)) nb["生活"] = h;
      else if (!nb["醫療"] && /醫院|診所/.test(h)) nb["醫療"] = h;
    });
    setNearbyText(nb);
  }

  function handlePhotos(files) {
    var labels = ["封面主照片","室內空間照","空間照3","空間照4","空間照5"];
    Promise.all(Array.from(files).slice(0,5).map(function(f, i) {
      return fileToBase64(f).then(function(b64) { return {file:f, preview:URL.createObjectURL(f), label:labels[i], base64:b64}; });
    })).then(setPhotos);
  }

  async function genQuote() {
    if (!data) return; setAiLoading(true);
    try {
      var prompt = "你是高端房仲文案師。根據以下物件，寫一句20字以內的情境金句，用「」包起來，富有詩意。\n物件：" + data.案名 + "，" + data.格局 + "，" + data.總建 + "坪，" + data.地址 + "\n只輸出那一句金句。";
      var res = await fetch("https://api.anthropic.com/v1/messages", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:200, messages:[{role:"user", content:prompt}]})});
      var json = await res.json();
      setQuote((json.content || []).map(function(b) { return b.text || ""; }).join("").trim() || "");
    } catch(e) { setQuote("「光與靜謐，是這個家最好的語言。」"); }
    setAiLoading(false);
  }

  async function generatePPTX() {
    if (!data) return; setLoading(true); setStatus("載入中...");
    try {
      if (!window.PptxGenJS) {
        await new Promise(function(res, rej) {
          var s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      setStatus("生成 PPTX...");
      var pptx = new window.PptxGenJS();
      // Ensure shape types work in browser bundle
      if (!pptx.ShapeType) {
        pptx.ShapeType = { rect: "rect", oval: "ellipse" };
      }
      pptx.defineLayout({name:"SQUARE", width:7.5, height:7.5});
      pptx.layout = "SQUARE";
      var d = data;
      var CC = {navy:"1E2D3D", gold:"C9A84C", cream:"EDE8DC", white:"FFFFFF", gray:"8A8A8A"};
      function imgD(b64) { return b64 ? b64.replace(/^data:[^;]+;base64,/, "image/jpeg;base64,") : null; }
      var ph0 = photos[0] ? photos[0].base64 : null;
      var ph1 = photos[1] ? photos[1].base64 : null;
      var q = quote || "「光與靜謐，是這個家最好的語言。」";
      var qClean = q.replace(/「|」/g, "");

      // Slide 1
      var s1 = pptx.addSlide();
      s1.background = {color: CC.navy};
      if (ph0) {
        s1.addImage({data: imgD(ph0), x:0, y:0, w:7.5, h:4.8, sizing:{type:"cover", w:7.5, h:4.8}});
        s1.addShape("rect", {x:0, y:0, w:7.5, h:4.8, fill:{color:CC.navy, transparency:30}});
      }
      s1.addShape("rect", {x:0.35, y:0.3, w:1.4, h:0.35, fill:{color:CC.gold}});
      s1.addText("IN SALE", {x:0.35, y:0.3, w:1.4, h:0.35, fontSize:10, bold:true, color:CC.navy, align:"center", valign:"middle", margin:0});
      s1.addShape("rect", {x:0, y:4.8, w:7.5, h:0.05, fill:{color:CC.gold}});
      s1.addShape("rect", {x:0, y:4.85, w:7.5, h:2.65, fill:{color:CC.white}});
      s1.addText(d.案名.substring(0,12), {x:0.35, y:5.0, w:6.5, h:0.9, fontSize:30, bold:true, color:CC.navy, fontFace:"微軟正黑體"});
      s1.addText(d.地址.substring(0,20) + "・" + d.樓層, {x:0.35, y:5.9, w:6, h:0.35, fontSize:12, color:CC.gray, fontFace:"微軟正黑體"});
      s1.addText(d.售價, {x:0.35, y:6.35, w:4, h:0.7, fontSize:26, bold:true, color:CC.navy, fontFace:"微軟正黑體"});
      s1.addText(myName, {x:5.2, y:6.35, w:2, h:0.7, fontSize:16, bold:true, color:CC.gold, align:"right", fontFace:"微軟正黑體"});

      // Slide 2
      var s2 = pptx.addSlide();
      s2.background = {color: CC.navy};
      if (ph1) {
        s2.addImage({data: imgD(ph1), x:0, y:0, w:7.5, h:7.5, sizing:{type:"cover", w:7.5, h:7.5}});
        s2.addShape("rect", {x:0, y:0, w:7.5, h:7.5, fill:{color:"000000", transparency:45}});
      }
      s2.addShape("ellipse", {x:0.3, y:6.1, w:0.22, h:0.22, fill:{color:CC.gold}});
      s2.addText(q, {x:0.65, y:6.0, w:6.5, h:0.7, fontSize:15, color:CC.white, fontFace:"微軟正黑體", italic:true});
      s2.addText("02 / 06", {x:6.5, y:7.1, w:0.9, h:0.3, fontSize:10, color:CC.gold, align:"right"});

      // Slide 3
      var s3 = pptx.addSlide();
      s3.background = {color: CC.white};
      s3.addText("物件規格", {x:0.35, y:0.25, w:4, h:0.55, fontSize:24, bold:true, color:CC.navy, fontFace:"微軟正黑體"});
      s3.addText("03 / 06", {x:6.3, y:0.25, w:0.9, h:0.55, fontSize:11, color:CC.gold, align:"right"});
      s3.addShape("rect", {x:0.35, y:0.85, w:6.8, h:0.04, fill:{color:CC.gold}});
      var specs = [
        {label:"格局", value:d.格局}, {label:"坪數", value:d.主建 + " 坪"},
        {label:"樓層", value:d.樓層}, {label:"屋齡", value:d.屋齡 + " 年"},
        {label:"車位", value:d.車位 || "無"}, {label:"管理費", value:d.管理費 || "—"}
      ];
      specs.forEach(function(sp, i) {
        var col = i % 2; var row = Math.floor(i / 2);
        var x = col === 0 ? 0.35 : 3.95; var y = 1.05 + row * 1.65; var w = 3.4;
        s3.addShape("rect", {x:x, y:y, w:w, h:1.4, fill:{color:"F5F2EC"}});
        s3.addShape("rect", {x:x, y:y, w:0.06, h:1.4, fill:{color:CC.gold}});
        s3.addText(sp.label, {x:x+0.15, y:y+0.12, w:w-0.2, h:0.3, fontSize:11, color:CC.gray, fontFace:"微軟正黑體"});
        s3.addText(sp.value, {x:x+0.15, y:y+0.45, w:w-0.2, h:0.6, fontSize:20, bold:true, color:CC.navy, fontFace:"微軟正黑體"});
      });
      s3.addText(myName + "　" + myPhone, {x:0.35, y:7.05, w:6.8, h:0.3, fontSize:10, color:CC.gray, align:"center"});

      // Slide 4
      var s4 = pptx.addSlide();
      s4.background = {color: CC.navy};
      s4.addText("HIGHLIGHT", {x:0.35, y:0.3, w:3, h:0.35, fontSize:11, bold:true, color:CC.gold, charSpacing:3});
      s4.addText("「" + qClean + "」", {x:0.35, y:1.2, w:6.8, h:2.5, fontSize:28, bold:true, italic:true, color:CC.white, fontFace:"微軟正黑體"});
      s4.addShape("rect", {x:0.35, y:5.5, w:1.2, h:0.06, fill:{color:CC.gold}});
      s4.addText("有興趣了解更多？歡迎私訊", {x:0.35, y:5.7, w:6, h:0.35, fontSize:13, color:CC.white, fontFace:"微軟正黑體"});
      s4.addText("或加 LINE：" + (myLine || myPhone), {x:0.35, y:6.1, w:6, h:0.35, fontSize:13, color:CC.white, fontFace:"微軟正黑體"});
      s4.addText("我來為您安排帶看。", {x:0.35, y:6.5, w:6, h:0.35, fontSize:13, color:CC.white, fontFace:"微軟正黑體"});
      s4.addText("04 / 06", {x:6.5, y:7.1, w:0.9, h:0.3, fontSize:10, color:CC.gold, align:"right"});

      // Slide 5
      var s5 = pptx.addSlide();
      s5.background = {color: CC.white};
      s5.addText("周邊生活機能", {x:0.35, y:0.2, w:5, h:0.6, fontSize:24, bold:true, color:CC.navy, fontFace:"微軟正黑體"});
      s5.addShape("rect", {x:0.35, y:0.82, w:6.8, h:0.04, fill:{color:CC.gold}});
      var cats = [
        {label:"交通", text:nearbyText["交通"] || "鄰近大眾交通"},
        {label:"學區", text:nearbyText["學區"] || "優質學區資源"},
        {label:"生活", text:nearbyText["生活"] || "生活機能完善"},
        {label:"醫療", text:nearbyText["醫療"] || "鄰近醫療資源"}
      ];
      cats.forEach(function(cat, i) {
        var y = 1.1 + i * 1.45;
        s5.addShape("ellipse", {x:0.35, y:y, w:0.55, h:0.55, fill:{color:CC.navy}});
        s5.addText(cat.label[0], {x:0.35, y:y, w:0.55, h:0.55, fontSize:11, color:CC.gold, align:"center", valign:"middle", bold:true});
        s5.addText(cat.label, {x:1.1, y:y+0.01, w:1.1, h:0.3, fontSize:14, bold:true, color:CC.navy, fontFace:"微軒正黑體"});
        s5.addText(cat.text, {x:2.5, y:y+0.01, w:4.6, h:0.5, fontSize:13, color:CC.gray, fontFace:"微軟正黑體"});
      });
      s5.addText(myName + "  " + (myLine || myPhone), {x:5.0, y:7.1, w:2.2, h:0.3, fontSize:10, color:CC.gray, align:"right"});

      // Slide 6
      var s6 = pptx.addSlide();
      s6.background = {color: CC.white};
      var bk = CC.gold; var bW = 0.4; var bH = 0.4; var bT = 0.04;
      var corners = [[0.25,0.25,bW,bT],[0.25,0.25,bT,bH],[7.5-0.25-bW,0.25,bW,bT],[7.5-0.25-bT,0.25,bT,bH],[0.25,7.5-0.25-bT,bW,bT],[0.25,7.5-0.25-bH,bT,bH],[7.5-0.25-bW,7.5-0.25-bT,bW,bT],[7.5-0.25-bT,7.5-0.25-bH,bT,bH]];
      corners.forEach(function(c) { s6.addShape("rect", {x:c[0], y:c[1], w:c[2], h:c[3], fill:{color:bk}}); });
      s6.addText("CONTACT", {x:0, y:1.8, w:7.5, h:0.45, fontSize:13, bold:true, color:CC.gold, align:"center", charSpacing:4});
      s6.addText("有任何問題", {x:0, y:2.5, w:7.5, h:0.8, fontSize:34, bold:true, color:CC.navy, align:"center", fontFace:"微軟正黑體"});
      s6.addText("歡迎直接找我", {x:0, y:3.3, w:7.5, h:0.8, fontSize:34, bold:true, color:CC.navy, align:"center", fontFace:"微軟正黑體"});
      s6.addShape("rect", {x:3.3, y:4.2, w:0.9, h:0.06, fill:{color:CC.gold}});
      s6.addText(myName, {x:0, y:4.5, w:7.5, h:0.55, fontSize:22, bold:true, color:CC.navy, align:"center", fontFace:"微軟正黑體"});
      s6.addText(myStore || "永慶不動產", {x:0, y:5.1, w:7.5, h:0.4, fontSize:13, color:CC.gray, align:"center", fontFace:"微軟正黑體"});
      s6.addText("📞  " + myPhone, {x:0, y:5.6, w:7.5, h:0.38, fontSize:13, color:CC.navy, align:"center", fontFace:"微軟正黑體"});
      if (myLine) s6.addText("LINE：" + myLine, {x:0, y:6.05, w:7.5, h:0.38, fontSize:13, color:CC.navy, align:"center", fontFace:"微軟正黑體"});
      s6.addText("YUN REAL ESTATE", {x:0, y:6.9, w:7.5, h:0.4, fontSize:11, bold:true, color:CC.gold, align:"center", charSpacing:3});

      await pptx.writeFile({fileName: d.案名.substring(0,10).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "") + "_IG貼文.pptx"});
      setStatus("✓ PPTX 已下載！");
    } catch(e) { console.error("PPTX Error:", e); setStatus("發生錯誤：" + (e.message || e.toString())); }
    setLoading(false);
  }

  return (
    <div style={{padding:"16px", maxWidth:560, margin:"0 auto"}}>
      <div style={cardStyle}>
        <div style={secTitleStyle}>① 貼入新接案訊息</div>
        <textarea value={paste} onChange={function(e) { setPaste(e.target.value); }} placeholder={"新接🔥一般委託🔥\n店名：...\n案名🔥..."} rows={6} style={Object.assign({}, inputStyle, {resize:"none", lineHeight:1.7})} />
        <button onClick={handleParse} disabled={!paste.trim()} style={{marginTop:10, padding:"9px 22px", borderRadius:20, border:"none", cursor: paste.trim() ? "pointer" : "not-allowed", background: paste.trim() ? "#2E6DA4" : "#C2DDF5", color: paste.trim() ? "white" : "#A0BCD8", fontSize:13, fontWeight:"bold", fontFamily:"inherit"}}>⚡ 解析案件資料</button>
        {data && <span style={{marginLeft:12, fontSize:12, color:"#27AE60"}}>✓ {data.案名.substring(0,15)}...</span>}
      </div>
      <div style={cardStyle}>
        <div style={secTitleStyle}>② 上傳照片（最多5張，第1張封面）</div>
        <input ref={photoRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={function(e) { handlePhotos(e.target.files); }} />
        <button onClick={function() { photoRef.current.click(); }} style={{padding:"10px 22px", borderRadius:20, border:"1px dashed #4A90D9", background:"#EBF4FF", color:"#2E6DA4", cursor:"pointer", fontSize:13, fontFamily:"inherit"}}>📷 選擇照片</button>
        {photos.length > 0 && (
          <div style={{display:"flex", gap:8, marginTop:12, flexWrap:"wrap"}}>
            {photos.map(function(p, i) {
              return (
                <div key={i} style={{position:"relative"}}>
                  <img src={p.preview} style={{width:72, height:72, objectFit:"cover", borderRadius:8, border:"2px solid #4A90D9"}} alt={p.label} />
                  <div style={{position:"absolute", bottom:0, left:0, right:0, background:"rgba(27,58,92,0.75)", fontSize:9, color:"white", textAlign:"center", padding:"2px 0", borderRadius:"0 0 6px 6px"}}>{p.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {data && (
        <div style={cardStyle}>
          <div style={secTitleStyle}>③ 情境金句（Slide 2 & 4）</div>
          <div style={{display:"flex", gap:8}}>
            <input value={quote} onChange={function(e) { setQuote(e.target.value); }} placeholder="例：「光與靜謐，是這個家最好的語言。」" style={Object.assign({}, inputStyle, {flex:1})} />
            <button onClick={genQuote} disabled={aiLoading} style={{padding:"9px 14px", borderRadius:8, border:"1px solid #4A90D9", background:"#EBF4FF", color:"#2E6DA4", cursor:"pointer", fontSize:12, fontFamily:"inherit", whiteSpace:"nowrap"}}>{aiLoading ? "⟳" : "AI 生成"}</button>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12}}>
            {["交通","學區","生活","醫療"].map(function(k) {
              return (
                <div key={k}>
                  <label style={lblStyle}>{k}</label>
                  <input value={nearbyText[k]} onChange={function(e) { var val = e.target.value; setNearbyText(function(n) { var x = Object.assign({}, n); x[k] = val; return x; }); }} placeholder={k + "資訊"} style={inputStyle} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <button onClick={generatePPTX} disabled={!data || loading} style={{width:"100%", padding:"14px", borderRadius:12, border:"none", cursor: data ? "pointer" : "not-allowed", background: data ? "#1B3A5C" : "#C2DDF5", color: data ? "white" : "#A0BCD8", fontSize:14, fontWeight:"bold", fontFamily:"inherit", marginBottom:8}}>
        {loading ? status : "✦ 生成 PPTX（6張 IG 貼文）"}
      </button>
      {status && !loading && <div style={{textAlign:"center", fontSize:13, color: status.startsWith("✓") ? "#27AE60" : "#D4690A", paddingBottom:8}}>{status}</div>}
      <div style={{textAlign:"center", fontSize:11, color:"#A0BCD8", paddingBottom:20}}>下載後開啟 PPTX → 另存為 PNG → 上傳 Instagram</div>
    </div>
  );
}

// ── 設定 ──
function ToolSettings(props) {
  var [saved, setSaved] = useState(false);
  function save() {
    localStorage.setItem("myinfo", JSON.stringify({myName:props.myName, myPhone:props.myPhone, myLine:props.myLine, myStore:props.myStore}));
    setSaved(true);
    setTimeout(function() { setSaved(false); }, 2000);
  }
  return (
    <div style={{padding:"16px", maxWidth:420, margin:"0 auto"}}>
      <div style={cardStyle}>
        <div style={secTitleStyle}>我的資訊</div>
        <div style={{display:"flex", flexDirection:"column", gap:14}}>
          <div><label style={lblStyle}>姓名</label><input value={props.myName} onChange={function(e) { props.setMyName(e.target.value); }} placeholder="林昀蓁" style={inputStyle} /></div>
          <div><label style={lblStyle}>電話</label><input value={props.myPhone} onChange={function(e) { props.setMyPhone(e.target.value); }} placeholder="0909-998263" style={inputStyle} /></div>
          <div><label style={lblStyle}>LINE ID</label><input value={props.myLine} onChange={function(e) { props.setMyLine(e.target.value); }} placeholder="yun826_" style={inputStyle} /></div>
          <div><label style={lblStyle}>店名</label><input value={props.myStore} onChange={function(e) { props.setMyStore(e.target.value); }} placeholder="永慶 西屯安和創意店" style={inputStyle} /></div>
        </div>
        <button onClick={save} style={{width:"100%", marginTop:18, padding:"13px", background:"#1B3A5C", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit"}}>
          {saved ? "✓ 已儲存！" : "儲存設定"}
        </button>
      </div>
      <div style={{background:"#EBF4FF", border:"1px solid #C2DDF5", borderRadius:12, padding:16}}>
        <div style={{fontSize:12, color:"#2E6DA4", fontWeight:"700", marginBottom:8}}>💡 說明</div>
        <div style={{fontSize:12, color:"#4A7FA5", lineHeight:1.8}}>
          這裡填入的資訊會自動帶入所有工具。<br/>
          LINE 群發工具會用你的名字和電話取代原本的經紀人資訊。<br/>
          PPTX 貼文的聯絡頁也會自動帶入。
        </div>
      </div>
    </div>
  );
}

// ── 主 App ──
var TABS = [
  {id:"reminder", label:"回訪提醒", icon:"📌"},
  {id:"line", label:"LINE", icon:"💬"},
  {id:"pptx", label:"IG貼文", icon:"📸"},
  {id:"copy", label:"文案", icon:"✍️"},
  {id:"calc", label:"業績", icon:"💰"},
  {id:"settings", label:"設定", icon:"⚙️"},
];

export default function App() {
  var [activeTab, setActiveTab] = useState("reminder");
  var [myName, setMyName] = useState("");
  var [myPhone, setMyPhone] = useState("");
  var [myLine, setMyLine] = useState("");
  var [myStore, setMyStore] = useState("");

  useEffect(function() {
    try {
      var s = JSON.parse(localStorage.getItem("myinfo") || "{}");
      if (s.myName) setMyName(s.myName);
      if (s.myPhone) setMyPhone(s.myPhone);
      if (s.myLine) setMyLine(s.myLine);
      if (s.myStore) setMyStore(s.myStore);
    } catch(e) {}
  }, []);

  var overdueCount = 0;
  try {
    var owners = JSON.parse(localStorage.getItem("owners_v1") || "[]");
    overdueCount = owners.filter(function(o) { return diffDays(o.nextVisit) < 0 && o.result !== "不賣了" && o.result !== "已給他家"; }).length;
  } catch(e) {}

  var currentTab = TABS.find(function(t) { return t.id === activeTab; });

  return (
    <div style={{minHeight:"100vh", background:"#F0F6FC", fontFamily:"system-ui,'Noto Sans TC',sans-serif", color:"#1B3A5C", paddingBottom:70}}>
      <div style={{background:"#1B3A5C", padding:"14px 20px", borderBottom:"3px solid #4A90D9", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100}}>
        <div style={{width:36, height:36, background:"#4A90D9", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:"bold", color:"white", flexShrink:0}}>永</div>
        <div>
          <div style={{fontSize:15, fontWeight:"bold", color:"white", letterSpacing:"0.05em"}}>
            {currentTab ? currentTab.icon + " " + currentTab.label : ""}
          </div>
          <div style={{fontSize:10, color:"#7EB8E8", marginTop:1}}>永慶不動產工作台</div>
        </div>
      </div>

      {activeTab === "reminder" && <ToolReminder />}
      {activeTab === "line" && <ToolLine myName={myName} myPhone={myPhone} />}
      {activeTab === "pptx" && <ToolPPTX myName={myName} myPhone={myPhone} myLine={myLine} myStore={myStore} />}
      {activeTab === "copy" && <ToolCopywriter />}
      {activeTab === "calc" && <ToolCommission />}
      {activeTab === "settings" && <ToolSettings myName={myName} setMyName={setMyName} myPhone={myPhone} setMyPhone={setMyPhone} myLine={myLine} setMyLine={setMyLine} myStore={myStore} setMyStore={setMyStore} />}

      <div style={{position:"fixed", bottom:0, left:0, right:0, background:"#FFFFFF", borderTop:"1px solid #C2DDF5", display:"flex", zIndex:100, boxShadow:"0 -2px 12px rgba(27,58,92,0.08)"}}>
        {TABS.map(function(tab) {
          return (
            <button key={tab.id} onClick={function() { setActiveTab(tab.id); }} style={{flex:1, padding:"10px 0 8px", border:"none", cursor:"pointer", background:"transparent", display:"flex", flexDirection:"column", alignItems:"center", gap:2, position:"relative"}}>
              <span style={{fontSize:18}}>{tab.icon}</span>
              <span style={{fontSize:9, color: activeTab === tab.id ? "#2E6DA4" : "#A0BCD8", fontWeight: activeTab === tab.id ? "700" : "400", fontFamily:"inherit"}}>{tab.label}</span>
              {activeTab === tab.id && <div style={{position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:32, height:2, background:"#2E6DA4", borderRadius:"0 0 2px 2px"}} />}
              {tab.id === "reminder" && overdueCount > 0 && <div style={{position:"absolute", top:6, right:"50%", transform:"translateX(14px)", width:14, height:14, background:"#C0392B", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"white", fontWeight:"bold"}}>{overdueCount}</div>}
            </button>
          );
        })}
      </div>

      <style>{".input-focus:focus { border-color: #4A90D9 !important; background: white !important; } * { box-sizing: border-box; }"}</style>
    </div>
  );
}
