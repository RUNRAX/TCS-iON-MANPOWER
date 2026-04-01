"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SceneBackground, GlassCard } from "@/components/ui/glass3d";
import { useTheme } from "@/lib/context/ThemeContext";

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Chandigarh","Puducherry","Ladakh","Jammu and Kashmir"];
const STEPS = ["PERSONAL INFO","ADDRESS","BANK DETAILS","DOCUMENTS"];

function StepIcon({n,active,done}:{n:number;active:boolean;done:boolean}){
  return(
    <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:done?"rgba(16,185,129,0.15)":active?"rgba(79,158,255,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${done?"rgba(16,185,129,0.4)":active?"rgba(79,158,255,0.4)":"rgba(255,255,255,0.07)"}`,transition:"all 0.5s cubic-bezier(0.4,0,0.2,1)"}}>
      {done?(
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      ):(
        <span style={{fontSize:10,fontFamily:"'Black Ops One',cursive",color:active?"#4F9EFF":"#2D3F5A",letterSpacing:0}}>{n}</span>
      )}
    </div>
  );
}

const LBL=(t:string,req=false)=><label style={{display:"block",fontSize:9,color:"rgba(255,255,255,0.22)",letterSpacing:"2.5px",textTransform:"uppercase" as const,marginBottom:7,fontFamily:"'Bebas Neue',sans-serif"}}>{t}{req&&<span style={{color:"#EF4444",marginLeft:3}}>*</span>}</label>;

export default function RegisterPage(){
  const { dark } = useTheme();
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const idRef    = useRef<HTMLInputElement>(null);

  const [step,setStep]=useState(1);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState(false);

  const [form,setForm]=useState({
    fullName:"",phone:"",altPhone:"",email:"",
    addressLine1:"",addressLine2:"",city:"",state:"",pincode:"",
    bankAccount:"",bankIfsc:"",bankName:"",
    idProofType:"",
  });
  const [photoFile,setPhotoFile]=useState<File|null>(null);
  const [idProofFile,setIdProofFile]=useState<File|null>(null);
  const [photoPreview,setPhotoPreview]=useState("");

  const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"12px 14px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#e8eeff",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none",transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)",boxSizing:"border-box"} as React.CSSProperties;
  const inpFocus=(e:any)=>{e.target.style.borderColor="rgba(79,158,255,0.5)";e.target.style.boxShadow="0 0 0 3px rgba(79,158,255,0.1)";e.target.style.background="rgba(30,60,160,0.07)";};
  const inpBlur=(e:any)=>{e.target.style.borderColor="rgba(255,255,255,0.08)";e.target.style.boxShadow="none";e.target.style.background="rgba(255,255,255,0.04)";};

  function validate(s:number):string|null{
    if(s===1){
      if(!form.fullName.trim())return"FULL NAME IS REQUIRED";
      if(!/^[6-9]\d{9}$/.test(form.phone))return"ENTER A VALID 10-DIGIT MOBILE NUMBER";
      if(!form.email||!form.email.includes("@"))return"ENTER A VALID EMAIL ADDRESS";
    }
    if(s===2){
      if(!form.addressLine1.trim())return"ADDRESS IS REQUIRED";
      if(!form.city.trim())return"CITY IS REQUIRED";
      if(!form.state)return"STATE IS REQUIRED";
      if(!/^\d{6}$/.test(form.pincode))return"ENTER A VALID 6-DIGIT PINCODE";
    }
    if(s===3){
      if(!form.bankAccount||form.bankAccount.length<9)return"ENTER A VALID BANK ACCOUNT NUMBER";
      if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bankIfsc.toUpperCase()))return"ENTER A VALID IFSC CODE (E.G. SBIN0001234)";
      if(!form.bankName.trim())return"BANK NAME IS REQUIRED";
    }
    if(s===4){
      if(!form.idProofType)return"SELECT AN ID PROOF TYPE";
      if(!idProofFile)return"UPLOAD YOUR ID PROOF DOCUMENT";
    }
    return null;
  }

  function next(){
    const err=validate(step);
    if(err){setError(err);return;}
    setError("");setStep(s=>s+1);
  }

  function handlePhoto(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0];if(!f)return;
    if(f.size>2*1024*1024){setError("PHOTO MUST BE UNDER 2MB");return;}
    setPhotoFile(f);
    const r=new FileReader();r.onload=ev=>setPhotoPreview(ev.target?.result as string);r.readAsDataURL(f);
  }

  function handleId(e:React.ChangeEvent<HTMLInputElement>){
    const f=e.target.files?.[0];if(!f)return;
    if(f.size>5*1024*1024){setError("ID PROOF MUST BE UNDER 5MB");return;}
    setIdProofFile(f);setError("");
  }

  async function submit(){
    const err=validate(4);if(err){setError(err);return;}
    setLoading(true);setError("");
    try{
      const fd=new FormData();
      Object.entries(form).forEach(([k,v])=>fd.append(k,v));
      if(photoFile)fd.append("photoFile",photoFile);
      if(idProofFile)fd.append("idProofFile",idProofFile);
      const r=await fetch("/api/auth/register",{method:"POST",body:fd});
      const d=await r.json();
      if(r.ok)setSuccess(true);
      else setError((d.message??"REGISTRATION FAILED").toUpperCase());
    }catch{setError("NETWORK ERROR. CHECK YOUR CONNECTION.");}
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"flex-start",justifyContent:"center",
      background: dark ? "linear-gradient(135deg, #07070f 0%, #0a0820 40%, #060d1a 100%)" : "linear-gradient(135deg, #f0f0ff 0%, #e8e4ff 40%, #eef6ff 100%)",
      padding:"32px 20px",position:"relative",overflow:"hidden",transition:"background 0.5s ease"}}>

        <SceneBackground cubeCount={5} showGrid />

        <GlassCard depth={10} className="w-full rounded-3xl" style={{maxWidth:520,zIndex:10}}>
          <div style={{width:"100%",animation:"fadeUp .4s cubic-bezier(0.22,1,0.36,1)"}}>

          {/* Logo */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:46,height:46,borderRadius:13,background:"linear-gradient(135deg,#1864ff,#5e2fff)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",boxShadow:"0 6px 22px rgba(24,100,255,0.35)"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style={{fontSize:9,letterSpacing:4,color:"rgba(79,158,255,0.55)",fontFamily:"'Bebas Neue',sans-serif",marginBottom:4}}>TCS ION MANPOWER</div>
            <h1 style={{fontSize:20,color:"#f0f4ff",letterSpacing:3,fontFamily:"'Black Ops One',cursive",textTransform:"uppercase"}}>CREATE ACCOUNT</h1>
          </div>

          {success?(
            <div style={{background:"rgba(4,12,38,0.92)",backdropFilter:"blur(28px)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:20,padding:40,textAlign:"center"}}>
              <div style={{width:64,height:64,borderRadius:20,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"checkPop .5s cubic-bezier(0.34,1.56,0.64,1)"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{fontSize:18,color:"#E2E8F0",letterSpacing:3,fontFamily:"'Black Ops One',cursive",marginBottom:10}}>REGISTRATION SUBMITTED</h2>
              <p style={{fontSize:11,color:"#4F6A8A",lineHeight:1.8,marginBottom:24,letterSpacing:.5}}>
                YOUR PROFILE IS UNDER REVIEW.<br/>
                YOU'LL RECEIVE A WHATSAPP NOTIFICATION ONCE<br/>
                AN ADMIN APPROVES YOUR ACCOUNT.
              </p>
              <Link href="/login">
                <button style={{width:"100%",padding:13,borderRadius:12,background:"linear-gradient(135deg,#1a6cff,#6e3eff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:13,cursor:"pointer",transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(56,100,253,.5)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                  GO TO LOGIN →
                </button>
              </Link>
            </div>
          ):(
            <div style={{background:"rgba(4,12,38,0.92)",backdropFilter:"blur(28px)",border:"1px solid rgba(79,158,255,0.1)",borderRadius:20,overflow:"hidden"}}>

              {/* Step indicator */}
              <div style={{padding:"20px 24px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:0}}>
                  {STEPS.map((label,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:0}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                        <StepIcon n={i+1} active={step===i+1} done={step>i+1}/>
                        <span style={{fontSize:7,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1.5,color:step===i+1?"#4F9EFF":step>i+1?"#10B981":"#2D3F5A",whiteSpace:"nowrap",transition:"color 0.4s ease"}}>{label}</span>
                      </div>
                      {i<STEPS.length-1&&<div style={{flex:1,height:1,background:step>i+1?"rgba(16,185,129,0.4)":"rgba(255,255,255,0.06)",margin:"0 8px",marginBottom:18,transition:"background 0.5s ease"}}/>}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{padding:"24px 28px 28px"}}>
                {error&&<div style={{marginBottom:16,padding:"10px 14px",borderRadius:9,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#FCA5A5",fontSize:9,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,display:"flex",alignItems:"center",gap:8}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {error}
                </div>}

                {/* Step 1 — Personal Info */}
                {step===1&&(
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div style={{gridColumn:"1/-1"}}>{LBL("FULL NAME",true)}<input value={form.fullName} onChange={e=>set("fullName",e.target.value)} placeholder="As per ID proof" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                      <div>{LBL("MOBILE NUMBER",true)}<input value={form.phone} onChange={e=>set("phone",e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit number" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                      <div>{LBL("ALT PHONE")}<input value={form.altPhone} onChange={e=>set("altPhone",e.target.value)} placeholder="Optional" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                      <div style={{gridColumn:"1/-1"}}>{LBL("EMAIL",true)}<input type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="your@email.com" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                    </div>
                  </div>
                )}

                {/* Step 2 — Address */}
                {step===2&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div style={{gridColumn:"1/-1"}}>{LBL("ADDRESS LINE 1",true)}<input value={form.addressLine1} onChange={e=>set("addressLine1",e.target.value)} placeholder="House/flat no., street" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                    <div style={{gridColumn:"1/-1"}}>{LBL("ADDRESS LINE 2")}<input value={form.addressLine2} onChange={e=>set("addressLine2",e.target.value)} placeholder="Landmark, area (optional)" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                    <div>{LBL("CITY",true)}<input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="City" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                    <div>{LBL("PINCODE",true)}<input value={form.pincode} onChange={e=>set("pincode",e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit pincode" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                    <div style={{gridColumn:"1/-1"}}>{LBL("STATE",true)}
                      <select value={form.state} onChange={e=>set("state",e.target.value)} style={{...inp,cursor:"pointer"}}>
                        <option value="">SELECT STATE</option>
                        {STATES.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 3 — Bank */}
                {step===3&&(
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{padding:"10px 13px",borderRadius:9,background:"rgba(79,158,255,0.05)",border:"1px solid rgba(79,158,255,0.13)",display:"flex",alignItems:"center",gap:9}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F9EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <span style={{fontSize:10,color:"#3D5070",letterSpacing:.5}}>Your account number is AES-256 encrypted before storage. Only used for salary payouts.</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div>{LBL("BANK NAME",true)}<input value={form.bankName} onChange={e=>set("bankName",e.target.value)} placeholder="State Bank of India" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                      <div>{LBL("IFSC CODE",true)}<input value={form.bankIfsc} onChange={e=>set("bankIfsc",e.target.value.toUpperCase())} placeholder="SBIN0001234" style={{...inp,textTransform:"uppercase"}} onFocus={inpFocus} onBlur={inpBlur}/></div>
                      <div style={{gridColumn:"1/-1"}}>{LBL("ACCOUNT NUMBER",true)}<input type="password" value={form.bankAccount} onChange={e=>set("bankAccount",e.target.value)} placeholder="Your account number (hidden)" autoComplete="off" style={inp} onFocus={inpFocus} onBlur={inpBlur}/></div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Documents */}
                {step===4&&(
                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div>{LBL("ID PROOF TYPE",true)}
                      <select value={form.idProofType} onChange={e=>set("idProofType",e.target.value)} style={{...inp,cursor:"pointer"}}>
                        <option value="">SELECT TYPE</option>
                        <option value="aadhaar">AADHAAR CARD</option>
                        <option value="pan">PAN CARD</option>
                        <option value="voter_id">VOTER ID</option>
                        <option value="passport">PASSPORT</option>
                      </select>
                    </div>

                    {/* ID Proof Upload */}
                    <div>
                      {LBL("ID PROOF DOCUMENT",true)}
                      <div onClick={()=>idRef.current?.click()} style={{border:"1px dashed rgba(79,158,255,0.28)",borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)",background:"rgba(79,158,255,0.03)",display:"flex",alignItems:"center",gap:12}}
                        onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="rgba(79,158,255,0.55)";el.style.background="rgba(79,158,255,0.07)";}}
                        onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="rgba(79,158,255,0.28)";el.style.background="rgba(79,158,255,0.03)";}}>
                        <div style={{width:40,height:40,borderRadius:9,background:"rgba(79,158,255,0.1)",border:"1px solid rgba(79,158,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {idProofFile
                            ?<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F9EFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
                        </div>
                        <div>
                          <div style={{fontSize:11,color:idProofFile?"#10B981":"#3D5070",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,marginBottom:2}}>{idProofFile?idProofFile.name.toUpperCase():"UPLOAD ID PROOF"}</div>
                          <div style={{fontSize:9,color:"#334155"}}>JPG, PNG OR PDF · MAX 5MB</div>
                        </div>
                      </div>
                      <input ref={idRef} type="file" accept="image/jpeg,image/png,application/pdf" style={{display:"none"}} onChange={handleId}/>
                    </div>

                    {/* Photo Upload */}
                    <div>
                      {LBL("PROFILE PHOTO (OPTIONAL)")}
                      <div onClick={()=>photoRef.current?.click()} style={{border:"1px dashed rgba(99,102,241,0.25)",borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)",background:"rgba(99,102,241,0.03)",display:"flex",alignItems:"center",gap:12}}
                        onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="rgba(99,102,241,0.5)";el.style.background="rgba(99,102,241,0.07)";}}
                        onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor="rgba(99,102,241,0.25)";el.style.background="rgba(99,102,241,0.03)";}}>
                        <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
                          {photoPreview?<img src={photoPreview} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
                            :<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                        </div>
                        <div>
                          <div style={{fontSize:11,color:photoFile?"#818CF8":"#3D5070",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,marginBottom:2}}>{photoFile?photoFile.name.toUpperCase():"UPLOAD PHOTO"}</div>
                          <div style={{fontSize:9,color:"#334155"}}>JPG OR PNG · MAX 2MB</div>
                        </div>
                      </div>
                      <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={handlePhoto}/>
                    </div>
                  </div>
                )}

                {/* Nav buttons */}
                <div style={{display:"flex",gap:10,marginTop:24}}>
                  {step>1&&<button onClick={()=>{setStep(s=>s-1);setError("");}} style={{flex:1,padding:12,borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"#64748B",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,fontSize:12,cursor:"pointer",transition:"all 0.35s cubic-bezier(0.4,0,0.2,1)"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#94A3B8";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="#64748B";}}>
                    BACK
                  </button>}
                  {step<4?(
                    <button onClick={next} style={{flex:2,padding:12,borderRadius:10,background:"linear-gradient(135deg,#1760ff,#5e2fff)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:13,cursor:"pointer",transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(56,100,253,.4)";}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                      NEXT →
                    </button>
                  ):(
                    <button onClick={submit} disabled={loading} style={{flex:2,padding:12,borderRadius:10,background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",border:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,fontSize:13,cursor:loading?"not-allowed":"pointer",opacity:loading?.7:1,transition:"all 0.45s cubic-bezier(0.34,1.56,0.64,1)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
                      onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(5,150,105,.4)";}}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                      {loading?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .8s linear infinite"}}/>SUBMITTING…</>:"SUBMIT REGISTRATION"}
                    </button>
                  )}
                </div>

                <div style={{marginTop:18,textAlign:"center"}}>
                  <span style={{fontSize:9,color:"#334155",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>ALREADY HAVE AN ACCOUNT? </span>
                  <Link href="/login" style={{fontSize:9,color:"#4F9EFF",textDecoration:"none",fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,transition:"opacity 0.35s ease"}}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.opacity=".7"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.opacity="1"}>
                    SIGN IN
                  </Link>
                </div>
              </div>
            </div>
          )}
          </div>
        </GlassCard>
    </div>
  );
}
