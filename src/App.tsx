import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { Chess } from 'chess.js';
import { newGame, statusText } from './game/chess';
import { ensureGuestSession, createRoom, joinRoom, getRoom, subscribeRoom, savePosition } from './game/online';
import './styles.css';

const icon:any={p:'♟',r:'♜',n:'♞',b:'♝',q:'♛',k:'♚'};
function Piece({p,attack,selected}:{p:any,attack:boolean,selected:boolean}){const dark=p.color==='b';return <group scale={attack?1.16:selected?1.08:1}>
  <mesh position={[0,.18,0]}><cylinderGeometry args={[.36,.46,.18,24]}/><meshStandardMaterial color={dark?'#171820':'#e8dcc2'} metalness={.55} roughness={.25}/></mesh>
  {p.type==='n'?<><mesh position={[0,.57,0]}><capsuleGeometry args={[.18,.5,8,16]}/><meshStandardMaterial color={dark?'#252630':'#f1eadb'} metalness={.3}/></mesh><mesh position={[.12,.88,.03]}><sphereGeometry args={[.22,20,14]}/><meshStandardMaterial color={dark?'#20212a':'#f4eee0'}/></mesh></>:
   p.type==='b'?<><mesh position={[0,.56,0]}><coneGeometry args={[.27,.65,20]}/><meshStandardMaterial color={dark?'#252630':'#f1eadb'} metalness={.3}/></mesh><mesh position={[0,.98,0]}><sphereGeometry args={[.14,18,12]}/><meshStandardMaterial color={dark?'#171820':'#d4a72c'} metalness={.7}/></mesh></>:
   <><mesh position={[0,.58,0]}><sphereGeometry args={[p.type==='k'?.3:p.type==='q'?.27:.22,20,14]}/><meshStandardMaterial color={dark?'#292a32':'#f4eee0'} metalness={.3}/></mesh>
   {p.type==='k'&&<mesh position={[0,1.0,0]}><torusGeometry args={[.21,.05,12,24]}/><meshStandardMaterial color="#d4a72c" metalness={.9}/></mesh>}
   {p.type==='q'&&<mesh position={[0,.98,0]}><coneGeometry args={[.16,.35,8]}/><meshStandardMaterial color="#d4a72c" metalness={.8}/></mesh>}
   {p.type==='r'&&<mesh position={[0,.92,0]}><cylinderGeometry args={[.16,.18,.35,8]}/><meshStandardMaterial color={dark?'#30313a':'#ded4bf'} metalness={.5}/></mesh>}
   {p.type==='p'&&<mesh position={[0,.86,.2]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.035,.035,.65,12]}/><meshStandardMaterial color="#a77b35"/></mesh>}</>}
  <Html center position={[0,.58,0]}><span className="piece-label">{icon[p.type]}</span></Html>
  {attack&&<Html center position={[0,1.18,0]}><span className="hit">⚔</span></Html>}
</group>}

function Board({game,onMove,locked=false}:{game:Chess,onMove:(g:Chess)=>void,locked?:boolean}){
 const [sel,setSel]=useState<string|null>(null);
 const legal=useMemo(()=>sel?game.moves({square:sel as any,verbose:true}).map((m:any)=>m.to):[],[game,sel]);
 const squares=useMemo(()=>{const a:any[]=[];for(let r=7;r>=0;r--)for(let c=0;c<8;c++){const s=String.fromCharCode(97+c)+(r+1);a.push({s,p:game.get(s as any)});}return a},[game]);
 const click=(s:string)=>{if(locked)return;const p=game.get(s as any);if(!sel){if(p?.color===game.turn())setSel(s);return}
   if(sel===s){setSel(null);return}
   try{const g=new Chess(game.fen());const moving=g.get(sel as any);const promotion=moving?.type==='p'&&(s[1]==='8'||s[1]==='1')?'q':undefined;g.move({from:sel,to:s,...(promotion?{promotion}: {})});setSel(null);onMove(g)}
   catch{if(p?.color===game.turn())setSel(s);else setSel(null)}};
 return <group rotation={[-Math.PI/2,0,0]}>{squares.map(({s,p},i)=>{const x=(i%8)-3.5,y=Math.floor(i/8)-3.5;const light=(i+Math.floor(i/8))%2===0;return <group key={s} position={[x*1.1,0,y*1.1]} onClick={()=>click(s)}>
   <mesh position={[0,-.08,0]}><boxGeometry args={[1.05,.16,1.05]}/><meshStandardMaterial color={sel===s?'#d4a72c':legal.includes(s)?'#708f58':light?'#d8c29b':'#3b2d25'}/></mesh>
   {p&&<Piece p={p} attack={legal.includes(s)} selected={sel===s}/>}
   {legal.includes(s)&&!p&&<mesh position={[0,.02,0]}><cylinderGeometry args={[.11,.11,.035,16]}/><meshStandardMaterial color="#d4a72c" emissive="#8b6b32" emissiveIntensity={.8}/></mesh>}
 </group>})}</group>}

export default function App(){
 const[game,setGame]=useState(newGame);const[mode,setMode]=useState<'offline'|'online'>('offline');const[room,setRoom]=useState('');const[roomId,setRoomId]=useState<string|null>(null);const[playerId,setPlayerId]=useState<string|null>(null);const[playerColor,setPlayerColor]=useState<'w'|'b'|null>(null);const[msg,setMsg]=useState('');const[timer,setTimer]=useState({w:600,b:600});const last=useRef(Date.now());
 useEffect(()=>{const code=new URLSearchParams(window.location.search).get('room');if(code){setMode('online');setRoom(code)}},[]);
 useEffect(()=>{if(!roomId)return;let active=true;getRoom(roomId).then((r:any)=>{if(!active)return;if(r?.fen&&r.fen!=='startpos')try{setGame(new Chess(r.fen))}catch{};if(playerId)setPlayerColor(r.white_id===playerId?'w':r.black_id===playerId?'b':null)}).catch(()=>setMsg('اتاق پیدا نشد'));const stop=subscribeRoom(roomId,(r:any)=>{if(r?.fen&&r.fen!=='startpos')try{setGame(new Chess(r.fen))}catch{};if(playerId)setPlayerColor(r.white_id===playerId?'w':r.black_id===playerId?'b':null)});return()=>{active=false;stop()};},[roomId,playerId]);
 useEffect(()=>{last.current=Date.now();const t=setInterval(()=>{setTimer(v=>{if(game.isGameOver())return v;const now=Date.now(),d=(now-last.current)/1000;last.current=now;const side=game.turn();return {...v,[side]:Math.max(0,v[side]-d)}})},250);return()=>clearInterval(t)},[game]);
 const move=async(g:Chess)=>{setGame(g);last.current=Date.now();if(mode==='online'&&roomId){try{await savePosition(roomId,g.fen(),g.turn())}catch{setMsg('ذخیره حرکت ناموفق بود')}}};
 const newOnline=async()=>{try{const u=await ensureGuestSession();setPlayerId(u.id);const r=await createRoom(u.id);setPlayerColor('w');setRoomId(r.id);setRoom(r.id);setGame(newGame());setTimer({w:600,b:600});setMsg('اتاق ساخته شد؛ لینک دعوت را کپی کنید')}catch(e:any){setMsg(e?.message||'Supabase یا Anonymous Auth را تنظیم کنید')}};
 const join=async()=>{try{const code=room.trim();if(!code)throw new Error('کد اتاق را وارد کنید');const u=await ensureGuestSession();setPlayerId(u.id);const r=await joinRoom(code,u.id);setPlayerColor('b');setRoomId(r.id);setRoom(r.id);setMsg('با مهره‌های سیاه وارد شدید')}catch(e:any){setMsg(e?.message||'اتاق پیدا نشد یا پر است')}};
 const fmt=(n:number)=>{n=Math.max(0,Math.floor(n));return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0')};
 const onlineLocked=mode==='online'&&(!playerColor||playerColor!==game.turn());
 return <main><header><div><h1>FANTASY CHESS 3D</h1><span>شطرنج فانتزی • نبرد آنلاین و آفلاین</span></div><div className="actions"><button className="modeBtn" onClick={()=>setMode(mode==='offline'?'online':'offline')}>{mode==='offline'?'🌐 آنلاین':'🎮 آفلاین'}</button><button onClick={()=>{setGame(newGame());setTimer({w:600,b:600});setMsg('بازی جدید شروع شد')}}>⚔ بازی جدید</button></div></header>
 <div className="onlinebar">{mode==='online'&&<><button onClick={newOnline}>🏰 ساخت اتاق</button><input value={room} onChange={e=>setRoom(e.target.value)} placeholder="شناسه اتاق"/><button onClick={join}>ورود</button>{roomId&&<button onClick={()=>navigator.clipboard?.writeText(window.location.origin+window.location.pathname+'?room='+roomId)}>🔗 کپی لینک</button>}</>}{msg&&<span>{msg}</span>}</div>
 <section className="hud"><div className={game.turn()==='w'?'turn active':'turn'}>♔ سفید <b>{fmt(timer.w)}</b></div><div className="status">{statusText(game)}</div><div className={game.turn()==='b'?'turn active':'turn'}>♚ سیاه <b>{fmt(timer.b)}</b></div></section>
 <div className="scene"><Canvas camera={{position:[0,8,7],fov:42}}><ambientLight intensity={1.15}/><directionalLight position={[4,8,5]} intensity={3}/><pointLight position={[-5,4,-4]} intensity={1.5}/><Environment preset="sunset"/><Board game={game} onMove={move} locked={onlineLocked}/><ContactShadows position={[0,-.15,0]} opacity={.5} scale={12} blur={2}/><OrbitControls enablePan={false} minDistance={6} maxDistance={13} maxPolarAngle={Math.PI/2.05}/></Canvas></div>
 <footer><span>♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜</span><small>{mode==='online'?(roomId?'🌐 اتاق آنلاین فعال':'🌐 حالت آنلاین آماده'): '🎮 بازی آفلاین دو نفره'} {onlineLocked&&' • منتظر نوبت شما'}</small></footer></main>}
