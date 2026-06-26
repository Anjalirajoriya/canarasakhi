import { useState, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

const PRIORITY_COLOR = {
  High:   { background:"#FAE7E7", color:"#712B13" },
  Medium: { background:"#FAEEDA", color:"#633806" },
  Low:    { background:"#E1F5EE", color:"#085041" }
}
const DEPT_COLOR = {
  IT:         { background:"#F3E8FF", color:"#5B21B6" },
  Credit:     { background:"#DBEAFE", color:"#1E40AF" },
  Legal:      { background:"#FEF3C7", color:"#92400E" },
  HR:         { background:"#FCE7F3", color:"#9D174D" },
  Treasury:   { background:"#E0E7FF", color:"#3730A3" },
  Operations: { background:"#F1F5F9", color:"#475569" }
}
const RISK_COLOR = {
  Critical: { background:"#7f1d1d", color:"white" },
  High:     { background:"#FAE7E7", color:"#712B13" },
  Medium:   { background:"#FAEEDA", color:"#633806" },
  Low:      { background:"#E1F5EE", color:"#085041" }
}
const DEPTS = ["Credit","Treasury","IT","HR","Legal","Operations"]

function daysLeft(map) {
  if (!map.deadline_days || map.deadline_days === -1) return null
  try {
    const created = new Date(map.created_at)
    const due = new Date(created)
    due.setDate(due.getDate() + map.deadline_days)
    const diff = Math.ceil((due - new Date()) / (1000*60*60*24))
    return isNaN(diff) ? null : diff
  } catch { return null }
}

function dueDateStr(map) {
  if (!map.deadline_days || map.deadline_days === -1) return null
  try {
    const created = new Date(map.created_at)
    const due = new Date(created)
    due.setDate(due.getDate() + map.deadline_days)
    return due.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })
  } catch { return null }
}

function createdDateStr(map) {
  try {
    return new Date(map.created_at).toLocaleDateString("en-IN", {
      day:"numeric", month:"short", year:"numeric"
    })
  } catch { return "" }
}

// ── Pending Card ─────────────────────────────────────────────
function PendingCard({ map, onComplete, onDeptChange }) {
  const [note, setNote]                 = useState("")
  const [showNote, setShowNote]         = useState(false)
  const [changingDept, setChangingDept] = useState(false)
  const [completing, setCompleting]     = useState(false)
  const [hiding, setHiding]             = useState(false)

  const days    = daysLeft(map)
  const dueDate = dueDateStr(map)
  const isOverdue = days !== null && days < 0
  const isUrgent  = days !== null && days >= 0 && days <= 7

  const handleComplete = async () => {
    setCompleting(true)
    setHiding(true)
    setTimeout(async () => { await onComplete(map.id, note) }, 300)
  }

  return (
    <div style={{
      background:"white", borderRadius:12, padding:18,
      border: isOverdue?"2px solid #c0392b": isUrgent?"2px solid #e08c2a":"1px solid #e2e8f0",
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)",
      opacity: hiding?0:1, transform: hiding?"scale(0.95)":"scale(1)",
      transition:"opacity 0.3s, transform 0.3s"
    }}>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
        <span style={{ ...PRIORITY_COLOR[map.priority], fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>{map.priority}</span>
        <span style={{ ...(DEPT_COLOR[map.department]||DEPT_COLOR.Operations), fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>{map.department}</span>
        <span style={{ ...(RISK_COLOR[map.risk_level]||RISK_COLOR.Medium), fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>⚠ {map.risk_level||"Medium"} Risk</span>
      </div>

      <p style={{ fontWeight:700, color:"#1e293b", marginBottom:6, fontSize:14, lineHeight:1.5 }}>{map.action}</p>

      {map.circular_summary && (
        <p style={{ fontSize:12, color:"#94a3b8", marginBottom:8, fontStyle:"italic", lineHeight:1.4 }}>
          📋 {map.circular_summary}
        </p>
      )}

      <div style={{ background: isOverdue?"#FAE7E7":isUrgent?"#FAEEDA":"#F8FAFC", borderRadius:8, padding:"8px 12px", marginBottom:8, display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4 }}>
        <span style={{ fontSize:12, color:"#475569" }}>
          📅 {dueDate ? <><strong>Due: {dueDate}</strong></> : <span style={{color:"#94a3b8"}}>{map.deadline_text||"Deadline not specified in circular"}</span>}
        </span>
        {days !== null && (
          <span style={{ fontSize:12, fontWeight:700, color:isOverdue?"#c0392b":isUrgent?"#e08c2a":"#16a34a" }}>
            {isOverdue?`🔴 Overdue by ${Math.abs(days)}d`:isUrgent?`🟠 ${days}d left`:`🟢 ${days} days left`}
          </span>
        )}
      </div>

      <p style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>📎 Evidence: <strong>{map.evidence_required||"Not specified"}</strong></p>
      {map.penalty_if_missed && map.penalty_if_missed.trim() !== "" && (
        <p style={{ fontSize:12, color:"#c0392b", marginBottom:8, fontWeight:600, background:"#FAE7E7", padding:"4px 10px", borderRadius:6, display:"inline-block" }}>
          💰 Penalty: {map.penalty_if_missed}
        </p>
      )}
      <p style={{ fontSize:11, color:"#cbd5e1", marginBottom:10 }}>
        📁 {map.circular_name} · Added {createdDateStr(map)}
      </p>

      {changingDept && (
        <div style={{ marginBottom:10, background:"#F8FAFC", borderRadius:8, padding:"10px 12px" }}>
          <p style={{ fontSize:12, color:"#475569", marginBottom:6, fontWeight:600 }}>Move this task to:</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {DEPTS.map(d => (
              <button key={d} onClick={() => { onDeptChange(map.id, d); setChangingDept(false) }}
                style={{ padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:700,
                  border:d===map.department?"none":"1px solid #e2e8f0",
                  background:d===map.department?"#1e3a5f":"white",
                  color:d===map.department?"white":"#475569", cursor:"pointer" }}>
                {d}{d===map.department?" ✓":""}
              </button>
            ))}
            <button onClick={() => setChangingDept(false)} style={{ padding:"5px 12px", borderRadius:8, fontSize:11, border:"1px solid #fca5a5", color:"#dc2626", background:"white", cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {showNote && (
        <textarea value={note} onChange={e=>setNote(e.target.value)}
          placeholder="Add note: reference number, who did it, remarks..."
          style={{ width:"100%", borderRadius:8, border:"1px solid #e2e8f0", padding:"8px 10px", fontSize:12, marginBottom:8, resize:"vertical", minHeight:60, boxSizing:"border-box" }}
        />
      )}

      <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
        <button onClick={() => setChangingDept(!changingDept)} style={{ flex:1, minWidth:80, background:changingDept?"#e2e8f0":"#f1f5f9", color:"#475569", border:"1px solid #e2e8f0", padding:"8px 0", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer" }}>🔀 Move Dept</button>
        <button onClick={() => setShowNote(!showNote)} style={{ flex:1, minWidth:80, background:showNote?"#e2e8f0":"#f1f5f9", color:"#475569", border:"1px solid #e2e8f0", padding:"8px 0", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer" }}>📝 {showNote?"Hide":"Note"}</button>
        <button onClick={handleComplete} disabled={completing} style={{ flex:2, minWidth:120, background:completing?"#86efac":"#16a34a", color:"white", border:"none", padding:"8px 0", borderRadius:8, fontSize:12, fontWeight:700, cursor:completing?"not-allowed":"pointer", transition:"background 0.2s" }}>
          {completing?"✓ Moving...":"Mark Complete ✓"}
        </button>
      </div>
    </div>
  )
}

// ── Completed Card ───────────────────────────────────────────
function CompletedCard({ map, onUndo }) {
  const [expanded, setExpanded] = useState(false)
  const dueDate = dueDateStr(map)

  return (
    <div style={{ background:"#F0FDF4", borderRadius:10, padding:14, border:"1px solid #bbf7d0", marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
            <span style={{ ...(DEPT_COLOR[map.department]||DEPT_COLOR.Operations), fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{map.department}</span>
            <span style={{ background:"#16a34a", color:"white", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>✓ Complete</span>
            <span style={{ ...PRIORITY_COLOR[map.priority], fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:20 }}>{map.priority}</span>
          </div>
          <p style={{ fontWeight:600, fontSize:13, color:"#166534", margin:"0 0 4px", lineHeight:1.4 }}>{map.action}</p>
          <p style={{ fontSize:11, color:"#86efac", margin:"0 0 2px" }}>
            📅 {dueDate?`Was due: ${dueDate}`:`Deadline: ${map.deadline_text||"Not specified"}`}
          </p>
          <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>
            📁 {map.circular_name} · Added {createdDateStr(map)}
          </p>
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#16a34a", padding:"0 4px", flexShrink:0 }}>
          {expanded?"▲":"▼"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop:10, borderTop:"1px solid #bbf7d0", paddingTop:10 }}>
          <p style={{ fontSize:12, color:"#475569", marginBottom:6 }}>📎 Evidence: {map.evidence_required}</p>
          {map.circular_summary && <p style={{ fontSize:11, color:"#64748b", marginBottom:8, fontStyle:"italic" }}>📋 {map.circular_summary}</p>}
          {map.completion_note && map.completion_note.trim()!=="" && (
            <div style={{ background:"white", borderRadius:8, padding:"8px 12px", marginBottom:10, border:"1px solid #bbf7d0" }}>
              <p style={{ fontSize:12, color:"#166534", margin:0 }}>📝 Note: {map.completion_note}</p>
            </div>
          )}
          <button onClick={() => onUndo(map.id)} style={{ background:"white", color:"#dc2626", border:"1px solid #fca5a5", padding:"6px 16px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer" }}>↩ Undo</button>
        </div>
      )}
    </div>
  )
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [maps, setMaps]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [view, setView]             = useState("pending")
  const [summary, setSummary]       = useState("")
  const [circularName, setCircularName] = useState("")

  // Pending filters
  const [pDept, setPDept]           = useState("All")
  const [pSearch, setPSearch]       = useState("")

  // Completed filters
  const [cDept, setCDept]           = useState("All")
  const [cSearch, setCSearch]       = useState("")
  const [cCircular, setCCircular]   = useState("All")
  const [cStatus, setCStatus]       = useState("All") // All, done-with-note, done-no-note

  const fetchMaps = async () => {
    const res = await axios.get(`${API}/maps`)
    setMaps(res.data)
  }

  useEffect(() => { fetchMaps() }, [])

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".pdf")) { alert("PDF files only"); return }
    setLoading(true)
    setSummary("")
    const form = new FormData()
    form.append("file", file)
    try {
      const res = await axios.post(`${API}/upload-circular`, form)
      setSummary(res.data.summary||"")
      setCircularName(file.name)
      await fetchMaps()
      setView("pending")
      setPDept("All")
      setPSearch("")
    } catch (err) { alert("Upload failed: "+err.message) }
    setLoading(false)
    e.target.value=""
  }

  const complete = async (id, note) => {
    try { await axios.patch(`${API}/maps/${id}/complete`, { note }); await fetchMaps() }
    catch (err) { alert("Error: "+err.message) }
  }

  const undo = async (id) => {
    try { await axios.patch(`${API}/maps/${id}/undo`); await fetchMaps() }
    catch (err) { alert("Error: "+err.message) }
  }

  const changeDept = async (id, dept) => {
    try { await axios.patch(`${API}/maps/${id}/department`, { department:dept }); await fetchMaps() }
    catch (err) { alert("Error: "+err.message) }
  }

  const pending   = maps.filter(m => m.status==="Pending")
  const completed = maps.filter(m => m.status==="Complete")
  const overdue   = pending.filter(m => { const d=daysLeft(m); return d!==null&&d<0 }).length

  // Unique circular names for filter
  const circularNames = [...new Set(maps.map(m => m.circular_name).filter(Boolean))]

  // Apply pending filters
  const filteredPending = pending.filter(m => {
    if (pDept!=="All" && m.department!==pDept) return false
    if (pSearch && !m.action.toLowerCase().includes(pSearch.toLowerCase()) &&
        !m.circular_name?.toLowerCase().includes(pSearch.toLowerCase())) return false
    return true
  })

  // Apply completed filters
  const filteredCompleted = completed.filter(m => {
    if (cDept!=="All" && m.department!==cDept) return false
    if (cCircular!=="All" && m.circular_name!==cCircular) return false
    if (cSearch && !m.action.toLowerCase().includes(cSearch.toLowerCase()) &&
        !m.circular_name?.toLowerCase().includes(cSearch.toLowerCase())) return false
    if (cStatus==="with-note" && (!m.completion_note||m.completion_note.trim()==="")) return false
    if (cStatus==="no-note"   && m.completion_note && m.completion_note.trim()!=="") return false
    return true
  })

  // Dept stats for completed tab only
  const deptStats = DEPTS.map(d => ({
    dept:d,
    total: maps.filter(m=>m.department===d).length,
    done:  maps.filter(m=>m.department===d&&m.status==="Complete").length
  })).filter(d=>d.total>0)

  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc", fontFamily:"system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ background:"#1e3a5f", color:"white", padding:"18px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:800 }}>🏦 CanaraSakhi</h1>
          <p style={{ margin:"3px 0 0", fontSize:12, color:"#93c5fd" }}>Offline Regulatory Compliance · All data stays on your device 🔒</p>
        </div>
        <label style={{ background:loading?"#475569":"#2563eb", color:"white", padding:"10px 22px", borderRadius:10, fontWeight:600, fontSize:13, cursor:loading?"not-allowed":"pointer", display:"inline-flex", alignItems:"center", gap:6 }}>
          {loading?"⏳ AI processing locally...":"📄 Upload RBI Circular"}
          <input type="file" accept=".pdf" onChange={upload} disabled={loading} style={{ display:"none" }}/>
        </label>
      </div>

      <div style={{ padding:"24px 32px" }}>

        {/* Summary banner */}
        {summary && (
          <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#1E40AF", lineHeight:1.6 }}>
            📋 <strong>{circularName}:</strong> {summary}
          </div>
        )}

        {/* Stats — only show if there are maps */}
        {maps.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
            {[
              { label:"Total MAPs", val:maps.length,     color:"#1e293b" },
              { label:"Complete",   val:completed.length, color:"#16a34a" },
              { label:"Pending",    val:pending.length,   color:"#d97706" },
              { label:"Overdue",    val:overdue,          color:"#dc2626" }
            ].map(s => (
              <div key={s.label} style={{ background:"white", borderRadius:12, padding:16, textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab toggle */}
        {maps.length > 0 && (
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            <button onClick={() => setView("pending")} style={{ padding:"9px 24px", borderRadius:10, fontWeight:700, fontSize:13, border:"none", cursor:"pointer", background:view==="pending"?"#1e3a5f":"white", color:view==="pending"?"white":"#475569", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              ⏳ Pending ({pending.length})
            </button>
            <button onClick={() => setView("completed")} style={{ padding:"9px 24px", borderRadius:10, fontWeight:700, fontSize:13, border:"none", cursor:"pointer", background:view==="completed"?"#16a34a":"white", color:view==="completed"?"white":"#475569", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              ✓ Completed ({completed.length})
            </button>
          </div>
        )}

        {/* ══ PENDING VIEW ══ */}
        {view==="pending" && (
          <>
            {/* Filters — only show if there are pending tasks */}
            {pending.length > 0 && (
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
                {/* Search */}
                <input value={pSearch} onChange={e=>setPSearch(e.target.value)}
                  placeholder="🔍 Search tasks..."
                  style={{ padding:"7px 14px", borderRadius:20, border:"1px solid #e2e8f0", fontSize:12, minWidth:200, outline:"none" }}
                />
                {/* Dept pills */}
                {["All",...DEPTS].map(d => (
                  <button key={d} onClick={() => setPDept(d)} style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700, border:pDept===d?"none":"1px solid #e2e8f0", background:pDept===d?"#1e3a5f":"white", color:pDept===d?"white":"#475569", cursor:"pointer" }}>
                    {d} ({d==="All"?pending.length:pending.filter(m=>m.department===d).length})
                  </button>
                ))}
              </div>
            )}

          {/* Dept progress bars — only depts with pending tasks */}
{pending.length > 0 && (() => {
  const pendingDeptStats = DEPTS.map(d => ({
    dept: d,
    total: maps.filter(m => m.department === d).length,
    done:  maps.filter(m => m.department === d && m.status === "Complete").length
  })).filter(d => d.total > 0 && d.done < d.total) // only incomplete depts

  return pendingDeptStats.length > 0 ? (
    <div style={{ background:"white", borderRadius:12, padding:18, marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1e293b" }}>
          Pending by Department
        </h3>
        <span style={{ fontSize:11, color:"#94a3b8" }}>Click to filter</span>
      </div>
      {pendingDeptStats.map(d => {
        const pct = d.total ? Math.round(d.done/d.total*100) : 0
        return (
          <div key={d.dept}
            onClick={() => setPDept(pDept===d.dept?"All":d.dept)}
            style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10,
              cursor:"pointer", padding:"6px 10px", borderRadius:8,
              background: pDept===d.dept?"#FFF7ED":"transparent",
              border: pDept===d.dept?"1px solid #FED7AA":"1px solid transparent" }}>
            <div style={{ width:90, fontSize:13, fontWeight:600,
              color: pDept===d.dept?"#9A3412":"#475569" }}>{d.dept}</div>
            <div style={{ flex:1, background:"#f1f5f9", borderRadius:6, height:10 }}>
              <div style={{ width:`${pct}%`, height:10, borderRadius:6,
                background: pct>50?"#d97706":"#dc2626",
                transition:"width 0.5s ease" }}/>
            </div>
            <div style={{ fontSize:12, color:"#64748b", width:65, textAlign:"right" }}>
              {d.done}/{d.total} done
            </div>
            <div style={{ fontSize:12, fontWeight:800, width:40, textAlign:"right",
              color: pct>50?"#d97706":"#dc2626" }}>{pct}%</div>
          </div>
        )
      })}
    </div>
  ) : null
})()}

            {/* Empty state — clean, no bars */}
            {pending.length === 0 ? (
              <div style={{ textAlign:"center", padding:"100px 0", color:"#94a3b8" }}>
                <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
                <p style={{ fontSize:18, fontWeight:700, color:"#64748b", margin:"0 0 8px" }}>All tasks complete!</p>
                <p style={{ fontSize:13, margin:"0 0 20px" }}>
                  Upload another circular or{" "}
                  <span style={{ color:"#16a34a", cursor:"pointer", fontWeight:600 }}
                    onClick={() => setView("completed")}>
                    view completed tasks →
                  </span>
                </p>
                <label style={{ background:"#2563eb", color:"white", padding:"10px 24px", borderRadius:10, fontWeight:600, fontSize:13, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }}>
                  📄 Upload New Circular
                  <input type="file" accept=".pdf" onChange={upload} disabled={loading} style={{ display:"none" }}/>
                </label>
              </div>
            ) : filteredPending.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#94a3b8" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                <p>No tasks match your filter</p>
                <button onClick={() => { setPDept("All"); setPSearch("") }}
                  style={{ marginTop:8, padding:"6px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:12, color:"#475569" }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {filteredPending.map(m => (
                  <PendingCard key={m.id} map={m} onComplete={complete} onDeptChange={changeDept}/>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ COMPLETED VIEW ══ */}
        {view==="completed" && (
          <>
            {/* Dept progress bars — ONLY in completed tab */}
            {deptStats.length > 0 && (
              <div style={{ background:"white", borderRadius:12, padding:18, marginBottom:20, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#1e293b" }}>Compliance by Department</h3>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>Click to filter</span>
                </div>
                {deptStats.map(d => {
                  const pct = d.total?Math.round(d.done/d.total*100):0
                  return (
                    <div key={d.dept} onClick={() => setCDept(cDept===d.dept?"All":d.dept)}
                      style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, cursor:"pointer", padding:"6px 10px", borderRadius:8, background:cDept===d.dept?"#EFF6FF":"transparent", border:cDept===d.dept?"1px solid #BFDBFE":"1px solid transparent" }}>
                      <div style={{ width:90, fontSize:13, fontWeight:600, color:cDept===d.dept?"#1E40AF":"#475569" }}>{d.dept}</div>
                      <div style={{ flex:1, background:"#f1f5f9", borderRadius:6, height:10 }}>
                        <div style={{ width:`${pct}%`, height:10, borderRadius:6, background:pct===100?"#16a34a":pct>50?"#d97706":"#dc2626", transition:"width 0.5s" }}/>
                      </div>
                      <div style={{ fontSize:12, color:"#64748b", width:65, textAlign:"right" }}>{d.done}/{d.total} done</div>
                      <div style={{ fontSize:12, fontWeight:800, width:40, textAlign:"right", color:pct===100?"#16a34a":pct>50?"#d97706":"#dc2626" }}>{pct}%</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Completed filters */}
            {completed.length > 0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
                {/* Search */}
                <input value={cSearch} onChange={e=>setCSearch(e.target.value)}
                  placeholder="🔍 Search completed..."
                  style={{ padding:"7px 14px", borderRadius:20, border:"1px solid #e2e8f0", fontSize:12, minWidth:180, outline:"none" }}
                />
                {/* By circular */}
                <select value={cCircular} onChange={e=>setCCircular(e.target.value)}
                  style={{ padding:"7px 14px", borderRadius:20, border:"1px solid #e2e8f0", fontSize:12, outline:"none", background:"white", cursor:"pointer" }}>
                  <option value="All">All Circulars</option>
                  {circularNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                {/* By dept */}
                <select value={cDept} onChange={e=>setCDept(e.target.value)}
                  style={{ padding:"7px 14px", borderRadius:20, border:"1px solid #e2e8f0", fontSize:12, outline:"none", background:"white", cursor:"pointer" }}>
                  <option value="All">All Departments</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {/* By note status */}
                <select value={cStatus} onChange={e=>setCStatus(e.target.value)}
                  style={{ padding:"7px 14px", borderRadius:20, border:"1px solid #e2e8f0", fontSize:12, outline:"none", background:"white", cursor:"pointer" }}>
                  <option value="All">All</option>
                  <option value="with-note">With notes</option>
                  <option value="no-note">Without notes</option>
                </select>
                {/* Clear */}
                {(cSearch||cCircular!=="All"||cDept!=="All"||cStatus!=="All") && (
                  <button onClick={() => { setCSearch(""); setCCircular("All"); setCDept("All"); setCStatus("All") }}
                    style={{ padding:"7px 14px", borderRadius:20, border:"1px solid #fca5a5", fontSize:12, color:"#dc2626", background:"white", cursor:"pointer" }}>
                    ✕ Clear
                  </button>
                )}
              </div>
            )}

            {completed.length === 0 ? (
              <div style={{ textAlign:"center", padding:"80px 0", color:"#94a3b8" }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📋</div>
                <p style={{ fontSize:15 }}>No completed tasks yet</p>
                <span style={{ color:"#1e3a5f", cursor:"pointer", fontWeight:600, fontSize:13 }}
                  onClick={() => setView("pending")}>← Back to pending</span>
              </div>
            ) : filteredCompleted.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:"#94a3b8" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
                <p>No completed tasks match your filter</p>
                <button onClick={() => { setCSearch(""); setCCircular("All"); setCDept("All"); setCStatus("All") }}
                  style={{ marginTop:8, padding:"6px 16px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", cursor:"pointer", fontSize:12, color:"#475569" }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div style={{ maxWidth:720 }}>
                <p style={{ fontSize:12, color:"#94a3b8", marginBottom:12 }}>
                  Showing {filteredCompleted.length} of {completed.length} completed tasks
                </p>
                {filteredCompleted.map(m => (
                  <CompletedCard key={m.id} map={m} onUndo={undo}/>
                ))}
              </div>
            )}
          </>
        )}

        {/* Empty state — no maps at all */}
        {maps.length === 0 && !loading && (
          <div style={{ textAlign:"center", padding:"120px 0", color:"#94a3b8" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📄</div>
            <p style={{ fontSize:18, fontWeight:700, color:"#64748b", margin:"0 0 8px" }}>Welcome to CanaraSakhi</p>
            <p style={{ fontSize:13, margin:"0 0 24px" }}>Upload an RBI/SEBI circular PDF to extract compliance tasks automatically</p>
            <p style={{ fontSize:12, color:"#cbd5e1" }}>🔒 All processing happens locally · No internet required · No data leaves your device</p>
          </div>
        )}

      </div>
    </div>
  )
}