import { useState, useEffect } from "react";

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #C2DDF5", background: "#F7FBFF",
  fontSize: 14, color: "#1B3A5C", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};
const lblStyle = { fontSize: 11, color: "#4A7FA5", fontWeight: "600", letterSpacing: "0.05em", display: "block", marginBottom: 5 };
const cardStyle = { background: "#FFFFFF", border: "1px solid #C2DDF5", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(27,58,92,0.06)", marginBottom: 14 };
const secTitleStyle = { fontSize: 12, color: "#2E6DA4", fontWeight: "700", marginBottom: 14, letterSpacing: "0.05em" };

// ── 工具一：屋主回訪提醒 ──
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
function addDays(s, n) { var d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }
function diffDays(s) { var t = new Date(); t.setHours(0,0,0,0); var d = new Date(s); d.setHours(0,0,0,0); return Math.round((d-t)/86400000); }
function fmtDate(s) { var p = s.split("-"); return p[1] + "/" + p[2]; }

var EMPTY_OWNER = { community:"", floor:"", price:"", ownerName:"", ownerTitle:"先生", result:"還在考慮", visitDate:todayStr(), nextVisit:addDays(todayStr(),3), note:"" };

function ToolReminder() {
  var [owners, setOwners] = useState(function() { try { return JSON.parse(localStorage.getItem("owners_v1") || "[]"); } catch(e) { return []; } });
  var [showForm, setShowForm] = useState(false);
  var [form, setForm] = useState(EMPTY_OWNER);
  var [editId, setEditId] = useState(null);
  var [filter, setFilter] = useState("全部");
  var [expandId, setExpandId] = useState(null);

  useEffect(function() { localStorage.setItem("owners_v1", JSON.stringify(owners)); }, [owners]);

  function save() {
    if (!form.community.trim()) return;
    if (editId !== null) {
      setOwners(owners.map(function(o) { return o.id === editId ? Object.assign({}, form, {id:editId}) : o; }));
      setEditId(null);
    } else {
      setOwners([Object.assign({}, form, {id:Date.now()})].concat(owners));
    }
    setForm(EMPTY_OWNER); setShowForm(false);
  }

  function del(id) { setOwners(owners.filter(function(o) { return o.id !== id; })); }
  function startEdit(o) { setForm(Object.assign({}, o)); setEditId(o.id); setShowForm(true); setExpandId(null); }
  function checkin(id) { setOwners(owners.map(function(o) { return o.id === id ? Object.assign({}, o, {visitDate:todayStr(), nextVisit:addDays(todayStr(),3)}) : o; })); }

  var filtered = owners.filter(function(o) { return filter === "全部" || o.result === filter; });
  var sorted = filtered.slice().sort(function(a,b) { return diffDays(a.nextVisit) - diffDays(b.nextVisit); });
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
          return <div key={s.l} style={{flex:1, background:"#FFFFFF", border:"1px solid #C2DDF5", borderRadius:10, padding:"12px 0", textAlign:"center"}}><div style={{fontSize:24, fontWeight:"bold", color:s.c}}>{s.v}</div><div style={{fontSize:10, color:"#A0BCD8", marginTop:2}}>{s.l}</div></div>;
        })}
      </div>
      <div style={{display:"flex", gap:6, marginBottom:14, flexWrap:"wrap"}}>
        {["全部"].concat(RESULT_OPTIONS).map(function(f) {
          return <button key={f} onClick={function() { setFilter(f); }} style={{padding:"5px 12px", borderRadius:16, border:"none", cursor:"pointer", fontSize:11, fontFamily:"inherit", background:filter===f?"#1B3A5C":"#FFFFFF", color:filter===f?"white":"#4A7FA5"}}>{f}</button>;
        })}
      </div>
      <button onClick={function() { setForm(EMPTY_OWNER); setEditId(null); setShowForm(true); }} style={{width:"100%", padding:"12px", background:"#1B3A5C", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginBottom:16}}>＋ 新增屋主</button>
      {sorted.length === 0 && <div style={{textAlign:"center", padding:"40px 0", color:"#A0BCD8", fontSize:13}}>還沒有屋主資料，點上方新增</div>}
      {sorted.map(function(o) {
        var st = stLabel(o.nextVisit, o.result);
        var rs = RESULT_STYLE[o.result] || RESULT_STYLE["還在考慮"];
        var isExp = expandId === o.id;
        var isOvd = diffDays(o.nextVisit) < 0 && o.result !== "不賣了" && o.result !== "已給他家";
        return (
          <div key={o.id} style={{background:"#FFFFFF", borderRadius:12, marginBottom:10, border:"1px solid " + (isOvd?"#FCA5A5":"#C2DDF5"), overflow:"hidden"}}>
            <div style={{padding:"14px 16px", cursor:"pointer"}} onClick={function() { setExpandId(isExp?null:o.id); }}>
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
        <div style={{position:"fixed", inset:0, background:"rgba(27,58,92,0.5)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200}} onClick={function(e) { if(e.target===e.currentTarget){setShowForm(false);setEditId(null);} }}>
          <div style={{background:"white", borderRadius:"20px 20px 0 0", padding:"24px 20px 32px", width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
              <div style={{fontSize:16, fontWeight:"bold", color:"#1B3A5C"}}>{editId?"編輯屋主":"新增屋主"}</div>
              <button onClick={function(){setShowForm(false);setEditId(null);}} style={{background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#A0BCD8"}}>×</button>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <div style={{gridColumn:"1/-1"}}><label style={lblStyle}>社區名稱</label><input value={form.community} onChange={function(e){setForm(function(f){return Object.assign({},f,{community:e.target.value});});}} placeholder="例：廣三大時代" style={inputStyle}/></div>
              <div><label style={lblStyle}>樓層</label><input value={form.floor} onChange={function(e){setForm(function(f){return Object.assign({},f,{floor:e.target.value});});}} placeholder="例：6/12" style={inputStyle}/></div>
              <div><label style={lblStyle}>開價（萬）</label><input value={form.price} onChange={function(e){setForm(function(f){return Object.assign({},f,{price:e.target.value});});}} placeholder="例：1088" type="number" style={inputStyle}/></div>
              <div><label style={lblStyle}>屋主姓氏</label><input value={form.ownerName} onChange={function(e){setForm(function(f){return Object.assign({},f,{ownerName:e.target.value});});}} placeholder="例：張" style={inputStyle}/></div>
              <div><label style={lblStyle}>稱謂</label>
                <div style={{display:"flex", gap:8}}>
                  {["先生","小姐"].map(function(t){ return <button key={t} onClick={function(){setForm(function(f){return Object.assign({},f,{ownerTitle:t});});}} style={{flex:1, padding:"10px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:14, fontWeight:"bold", background:form.ownerTitle===t?"#1B3A5C":"#F0F6FC", color:form.ownerTitle===t?"white":"#4A7FA5"}}>{t}</button>; })}
                </div>
              </div>
              <div style={{gridColumn:"1/-1"}}><label style={lblStyle}>拜訪結果</label>
                <div style={{display:"flex", flexWrap:"wrap", gap:7}}>
                  {RESULT_OPTIONS.map(function(r){ return <button key={r} onClick={function(){setForm(function(f){return Object.assign({},f,{result:r});});}} style={{padding:"7px 13px", borderRadius:16, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, background:form.result===r?"#1B3A5C":"#F0F6FC", color:form.result===r?"white":"#4A7FA5", fontWeight:form.result===r?"bold":"normal"}}>{r}</button>; })}
                </div>
              </div>
              <div><label style={lblStyle}>拜訪日期</label><input type="date" value={form.visitDate} onChange={function(e){setForm(function(f){return Object.assign({},f,{visitDate:e.target.value, nextVisit:addDays(e.target.value,3)});});}} style={inputStyle}/></div>
              <div><label style={lblStyle}>下次回訪日</label><input type="date" value={form.nextVisit} onChange={function(e){setForm(function(f){return Object.assign({},f,{nextVisit:e.target.value});});}} style={inputStyle}/></div>
              <div style={{gridColumn:"1/-1"}}><label style={lblStyle}>備註</label><textarea value={form.note} onChange={function(e){setForm(function(f){return Object.assign({},f,{note:e.target.value});});}} placeholder="屋主說了什麼..." rows={3} style={Object.assign({},inputStyle,{resize:"none",lineHeight:1.7})}/></div>
            </div>
            <button onClick={save} disabled={!form.community.trim()} style={{width:"100%", marginTop:16, padding:"14px", background:form.community.trim()?"#1B3A5C":"#C2DDF5", border:"none", borderRadius:10, color:form.community.trim()?"white":"#A0BCD8", fontSize:15, fontWeight:"bold", cursor:form.community.trim()?"pointer":"not-allowed", fontFamily:"inherit"}}>{editId?"儲存變更":"新增屋主"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 工具二：LINE 群發（純手動，無 AI）──
function parseMsg(text) {
  function get() {
    for (var i=0; i<arguments.length; i++) {
      var m = text.match(new RegExp(arguments[i]+"[：:＊*\\s🔥]*([^\n]+)"));
      if (m) return m[1].replace(/🔥/g,"").trim();
    }
    return "";
  }
  var typeM = text.match(/一般委託|專任委託|租賃委託/);
  return {
    委託類型: typeM ? typeM[0] : "一般委託",
    案名:get("案名"), 地址:get("地址"), 總建:get("總建"), 主建:get("主建"),
    樓層:get("樓層"), 格局:get("格局"), 屋齡:get("屋齡"), 售價:get("售價"),
    店名:get("店名"), 物件編號:get("物件編號"), 附屬:get("附屬"), 共用:get("共用"),
    車位:get("車位")||"", 管理費:get("管理費")||""
  };
}

function ToolLine(props) {
  var myName = props.myName; var myPhone = props.myPhone;
  var [paste, setPaste] = useState("");
  var [data, setData] = useState(null);
  var [highlights, setHighlights] = useState(["","","","",""]);
  var [copied, setCopied] = useState(false);

  function handleParse() {
    var d = parseMsg(paste);
    setData(d);
    // Extract ✅ lines if present
    var hlLines = [];
    var re = /✅([^\n]+)/g; var m;
    while ((m = re.exec(paste)) !== null) hlLines.push(m[1].trim());
    while (hlLines.length < 5) hlLines.push("");
    setHighlights(hlLines.slice(0,5));
  }

  function buildMsg() {
    if (!data) return "";
    var hlStr = highlights.filter(Boolean).map(function(h){ return "✅"+h; }).join("\n");
    return "新接🔥"+data.委託類型+"🔥\n店名："+data.店名+"\n物件編號："+data.物件編號+"\n案名🔥"+data.案名+"\n地址："+data.地址+"\n總建："+data.總建+"坪\n主建："+data.主建+"坪\n附屬："+data.附屬+"坪\n共用："+data.共用+"坪\n樓層："+data.樓層+"\n格局："+data.格局+"\n屋齡："+data.屋齡+"年\n售價："+data.售價+"\n"+hlStr+"\n\n經紀人\n"+myName+"："+myPhone;
  }

  var msg = buildMsg();
  function copy() { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(function(){ setCopied(false); }, 2000); }
  function reset() { setPaste(""); setData(null); setHighlights(["","","","",""]); setCopied(false); }

  return (
    <div style={{padding:"16px", maxWidth:560, margin:"0 auto"}}>
      {!data ? (
        <div style={cardStyle}>
          <div style={secTitleStyle}>貼入 LINE 群組案件訊息</div>
          <textarea value={paste} onChange={function(e){setPaste(e.target.value);}} placeholder={"新接🔥一般委託🔥\n店名：...\n案名🔥..."} rows={8} style={Object.assign({},inputStyle,{resize:"none",lineHeight:1.7})}/>
          <button onClick={handleParse} disabled={!paste.trim()} style={{marginTop:10, width:"100%", padding:"12px", borderRadius:10, border:"none", cursor:paste.trim()?"pointer":"not-allowed", background:paste.trim()?"#1B3A5C":"#C2DDF5", color:paste.trim()?"white":"#A0BCD8", fontSize:14, fontWeight:"bold", fontFamily:"inherit"}}>⚡ 解析案件資料</button>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <div style={secTitleStyle}>✅ 亮點條列（手動填寫）</div>
            <div style={{fontSize:11, color:"#A0BCD8", marginBottom:10}}>填入想強調的亮點，空白的不會顯示</div>
            {highlights.map(function(h,i){
              return (
                <div key={i} style={{display:"flex", gap:8, marginBottom:8, alignItems:"center"}}>
                  <span style={{color:"#27AE60", flexShrink:0}}>✅</span>
                  <input value={h} onChange={function(e){ var n=highlights.slice(); n[i]=e.target.value; setHighlights(n); }} placeholder={"亮點 "+(i+1)} style={Object.assign({},inputStyle,{flex:1})}/>
                </div>
              );
            })}
          </div>
          <div style={cardStyle}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
              <div style={secTitleStyle}>📤 完整訊息預覽</div>
              <div style={{display:"flex", gap:8}}>
                <button onClick={copy} style={{padding:"7px 16px", borderRadius:16, border:"none", cursor:"pointer", background:copied?"rgba(39,174,96,0.15)":"#1B3A5C", color:copied?"#27AE60":"white", fontSize:12, fontFamily:"inherit"}}>{copied?"✓ 已複製":"複製"}</button>
                <button onClick={reset} style={{padding:"7px 16px", borderRadius:16, cursor:"pointer", background:"#F0F6FC", border:"1px solid #C2DDF5", color:"#4A7FA5", fontSize:12, fontFamily:"inherit"}}>貼下一個</button>
              </div>
            </div>
            <div style={{background:"#F0F6FC", borderRadius:8, padding:16, fontSize:13, lineHeight:2, whiteSpace:"pre-wrap", color:"#1B3A5C", border:"1px solid #C2DDF5"}}>{msg}</div>
          </div>
        </>
      )}
    </div>
  );
}

// ── 工具三：業績試算 ──
function ToolCommission() {
  var [price, setPrice] = useState("");
  var [buyerRate, setBuyerRate] = useState("2");
  var [sellerRate, setSellerRate] = useState("4");
  var [type, setType] = useState("half");
  var [partner, setPartner] = useState(true);

  var p=parseFloat(price)||0, br=parseFloat(buyerRate)||0, sr=parseFloat(sellerRate)||0;
  var totalFee=p*(br+sr)/100;
  var afterType=type==="half"?totalFee/2:totalFee;
  var myPerf=partner?afterType/2:afterType;
  var base=Math.min(myPerf,30), above=Math.max(myPerf-30,0);
  var mySalary=base*0.417+above*0.467;

  function fmt(n){ return n>=1 ? n.toFixed(1).replace(/\.0$/,"")+" 萬" : Math.round(n*10000).toLocaleString()+" 元"; }

  function Row(p2){ return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #C2DDF5"}}><div><div style={{fontSize:13,color:p2.hl?"#1B3A5C":"#4A7FA5"}}>{p2.label}</div>{p2.sub&&<div style={{fontSize:11,color:"#A0BCD8",marginTop:2}}>{p2.sub}</div>}</div><div style={{fontSize:p2.hl?22:16,fontWeight:p2.hl?"bold":"normal",color:p2.hl?"#2E6DA4":"#4A7FA5"}}>{p2.value}</div></div>; }
  function Btn(p2){ return <button onClick={p2.onClick} style={{flex:1,padding:"10px 0",border:"none",borderRadius:8,background:p2.active?"#1B3A5C":"#F0F6FC",color:p2.active?"white":"#4A7FA5",fontSize:13,fontWeight:p2.active?"bold":"normal",cursor:"pointer",fontFamily:"inherit"}}>{p2.children}</button>; }

  return (
    <div style={{padding:"16px", maxWidth:420, margin:"0 auto"}}>
      <div style={cardStyle}>
        <label style={lblStyle}>成交價（萬元）</label>
        <input type="number" value={price} onChange={function(e){setPrice(e.target.value);}} placeholder="例：1000" style={Object.assign({},inputStyle,{fontSize:22,fontWeight:"bold"})}/>
        <div style={{display:"flex",gap:12,marginTop:14}}>
          <div style={{flex:1}}><label style={lblStyle}>賣方服務費 %</label><input type="number" value={sellerRate} onChange={function(e){setSellerRate(e.target.value);}} placeholder="4" style={Object.assign({},inputStyle,{fontSize:16})}/></div>
          <div style={{flex:1}}><label style={lblStyle}>買方服務費 %</label><input type="number" value={buyerRate} onChange={function(e){setBuyerRate(e.target.value);}} placeholder="2" style={Object.assign({},inputStyle,{fontSize:16})}/></div>
        </div>
      </div>
      <div style={cardStyle}>
        <div style={secTitleStyle}>代表方</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn active={type==="half"} onClick={function(){setType("half");}}>半泡（買或賣）</Btn>
          <Btn active={type==="full"} onClick={function(){setType("full");}}>全泡（買賣雙方）</Btn>
        </div>
        <div style={secTitleStyle}>搭檔</div>
        <div style={{display:"flex",gap:8}}>
          <Btn active={partner} onClick={function(){setPartner(true);}}>有搭檔（÷2）</Btn>
          <Btn active={!partner} onClick={function(){setPartner(false);}}>無搭檔</Btn>
        </div>
      </div>
      {p>0&&(
        <div style={cardStyle}>
          <Row label="總服務費" value={fmt(totalFee)} sub={p+"萬 × ("+sr+"%+"+br+"%)"}/>
          <Row label={type==="half"?"半泡（÷2）":"全泡"} value={fmt(afterType)}/>
          {partner&&<Row label="搭檔拆分（÷2）" value={fmt(myPerf)}/>}
          <div style={{height:1,background:"#C2DDF5",margin:"4px 0"}}/>
          <Row label="我的業績" value={fmt(myPerf)} hl={true}/>
          <div style={{background:myPerf>=30?"rgba(39,174,96,0.08)":"rgba(212,105,10,0.08)",border:"1px solid "+(myPerf>=30?"rgba(39,174,96,0.25)":"rgba(212,105,10,0.25)"),borderRadius:8,padding:"12px 14px",margin:"8px 0"}}>
            {myPerf>=30?(
              <div>
                <div style={{fontSize:12,color:"#27AE60",marginBottom:6}}>✓ 累進抽成適用</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#4A7FA5",marginBottom:4}}><span>前30萬 × 41.7%</span><span>{fmt(base*0.417)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#2E6DA4"}}><span>超過 {fmt(above)} × 46.7%</span><span>{fmt(above*0.467)}</span></div>
              </div>
            ):(
              <div style={{fontSize:12,color:"#D4690A"}}>還差 {fmt(30-myPerf)} 達累進門檻</div>
            )}
          </div>
          <Row label="到手薪水" value={fmt(mySalary)} hl={true}/>
        </div>
      )}
    </div>
  );
}

// ── 設定 ──
function ToolSettings(props) {
  var [saved, setSaved] = useState(false);
  function save() {
    localStorage.setItem("myinfo", JSON.stringify({myName:props.myName,myPhone:props.myPhone,myLine:props.myLine,myStore:props.myStore}));
    setSaved(true); setTimeout(function(){ setSaved(false); }, 2000);
  }
  return (
    <div style={{padding:"16px", maxWidth:420, margin:"0 auto"}}>
      <div style={cardStyle}>
        <div style={secTitleStyle}>我的資訊</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={lblStyle}>姓名</label><input value={props.myName} onChange={function(e){props.setMyName(e.target.value);}} placeholder="林昀蓁" style={inputStyle}/></div>
          <div><label style={lblStyle}>電話</label><input value={props.myPhone} onChange={function(e){props.setMyPhone(e.target.value);}} placeholder="0909-998263" style={inputStyle}/></div>
          <div><label style={lblStyle}>LINE ID</label><input value={props.myLine} onChange={function(e){props.setMyLine(e.target.value);}} placeholder="yun826_" style={inputStyle}/></div>
          <div><label style={lblStyle}>店名</label><input value={props.myStore} onChange={function(e){props.setMyStore(e.target.value);}} placeholder="永慶 西屯安和創意店" style={inputStyle}/></div>
        </div>
        <button onClick={save} style={{width:"100%",marginTop:18,padding:"13px",background:"#1B3A5C",border:"none",borderRadius:10,color:"white",fontSize:14,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>
          {saved?"✓ 已儲存！":"儲存設定"}
        </button>
      </div>
      <div style={{background:"#EBF4FF",border:"1px solid #C2DDF5",borderRadius:12,padding:16}}>
        <div style={{fontSize:12,color:"#2E6DA4",fontWeight:"700",marginBottom:8}}>💡 說明</div>
        <div style={{fontSize:12,color:"#4A7FA5",lineHeight:1.8}}>
          填入後會自動帶入 LINE 群發工具的經紀人資訊。<br/>
          AI 功能（文案、PPTX）請在 Claude.ai 對話中使用。
        </div>
      </div>
    </div>
  );
}

// ── 主 App ──
var TABS = [
  {id:"reminder", label:"回訪提醒", icon:"📌"},
  {id:"line",     label:"LINE群發", icon:"💬"},
  {id:"calc",     label:"業績試算", icon:"💰"},
  {id:"settings", label:"設定",     icon:"⚙️"},
];

export default function App() {
  var [activeTab, setActiveTab] = useState("reminder");
  var [myName, setMyName] = useState("");
  var [myPhone, setMyPhone] = useState("");
  var [myLine, setMyLine] = useState("");
  var [myStore, setMyStore] = useState("");

  useEffect(function() {
    try {
      var s = JSON.parse(localStorage.getItem("myinfo")||"{}");
      if(s.myName) setMyName(s.myName);
      if(s.myPhone) setMyPhone(s.myPhone);
      if(s.myLine) setMyLine(s.myLine);
      if(s.myStore) setMyStore(s.myStore);
    } catch(e) {}
  }, []);

  var overdueCount = 0;
  try {
    var owners = JSON.parse(localStorage.getItem("owners_v1")||"[]");
    overdueCount = owners.filter(function(o){ return diffDays(o.nextVisit)<0 && o.result!=="不賣了" && o.result!=="已給他家"; }).length;
  } catch(e) {}

  var currentTab = TABS.find(function(t){ return t.id===activeTab; });

  return (
    <div style={{minHeight:"100vh", background:"#F0F6FC", fontFamily:"system-ui,'Noto Sans TC',sans-serif", color:"#1B3A5C", paddingBottom:70}}>
      <div style={{background:"#1B3A5C", padding:"14px 20px", borderBottom:"3px solid #4A90D9", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100}}>
        <div style={{width:36,height:36,background:"#4A90D9",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:"bold",color:"white",flexShrink:0}}>永</div>
        <div>
          <div style={{fontSize:15,fontWeight:"bold",color:"white"}}>{currentTab?currentTab.icon+" "+currentTab.label:""}</div>
          <div style={{fontSize:10,color:"#7EB8E8",marginTop:1}}>永慶不動產工作台</div>
        </div>
      </div>

      {activeTab==="reminder" && <ToolReminder/>}
      {activeTab==="line" && <ToolLine myName={myName} myPhone={myPhone}/>}
      {activeTab==="calc" && <ToolCommission/>}
      {activeTab==="settings" && <ToolSettings myName={myName} setMyName={setMyName} myPhone={myPhone} setMyPhone={setMyPhone} myLine={myLine} setMyLine={setMyLine} myStore={myStore} setMyStore={setMyStore}/>}

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#FFFFFF",borderTop:"1px solid #C2DDF5",display:"flex",zIndex:100,boxShadow:"0 -2px 12px rgba(27,58,92,0.08)"}}>
        {TABS.map(function(tab){
          return (
            <button key={tab.id} onClick={function(){setActiveTab(tab.id);}} style={{flex:1,padding:"10px 0 8px",border:"none",cursor:"pointer",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
              <span style={{fontSize:20}}>{tab.icon}</span>
              <span style={{fontSize:9,color:activeTab===tab.id?"#2E6DA4":"#A0BCD8",fontWeight:activeTab===tab.id?"700":"400",fontFamily:"inherit"}}>{tab.label}</span>
              {activeTab===tab.id&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:32,height:2,background:"#2E6DA4",borderRadius:"0 0 2px 2px"}}/>}
              {tab.id==="reminder"&&overdueCount>0&&<div style={{position:"absolute",top:6,right:"50%",transform:"translateX(14px)",width:14,height:14,background:"#C0392B",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white",fontWeight:"bold"}}>{overdueCount}</div>}
            </button>
          );
        })}
      </div>
      <style>{"* { box-sizing: border-box; }"}</style>
    </div>
  );
}
