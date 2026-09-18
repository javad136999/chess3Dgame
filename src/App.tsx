import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { Chess } from 'chess.js';
import { newGame, statusText } from './game/chess';
import { ensureGuestSession, createRoom, joinRoom, getRoom, subscribeRoom, savePosition } from './game/online';
import './styles.css';

const icon:any={p:'♟',r:'♜',n:'♞',b:'♝',q:'♛',k:'♚'};
function Piece({p,attack}:{p:any,attack:boolean}){return <group scale={attack?1.18:1}>
 <mesh position={[0,.22,0]}><cylinderGeometry args={[.34,.43,.22,24]}/><meshStandardMaterial color={p.color==='w'?'#e8dcc2':'#171820'} metalness={.45} roughness={.28}/></mesh>
 <mesh position={[0,.58,0]}><sphereGeometry args={[p.type==='k'?.28:p.type==='q'?.25:.21,20,14]}/><meshStandardMaterial color={p.color==='w'?'#f4eee0':'#292a32'} metalness={.25}/></mesh>
 {p.type==='k'&&<mesh position={[0,.94,0]}><torusGeometry args={[.2,.045,12,24]}/><meshStandardMaterial color='#d4a72c' metalness={.9}/></mesh>}
 {p.type==='p'&&<mesh position={[0,.73,.18]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.035,.035,.62,12]}/><meshStandardMaterial color='#a77b35'/></mesh>}
 <Html center position={[0,.58,0]}><span className="piece-label">{icon[p.type]}</span></Html>
 {attack&&<Html center position={[0,1.15,0]}><span className="hit">⚔</span></Html>}
 </group>}

function Board({game,onMove,locked=false}:{game:Chess,onMove:(g:Chess)=>void,locked?:boolean}){
 const [sel,setSel]=useState<string|null>(null);
 const legal=useMemo(()=>sel?game.moves({square:sel as any,verbose:true}).map((m:any)=>m.to):[],[game,sel]);
 const squares=useMemo(()=>{const a:any[]=[];for(let r=7;r>=0;r--)for(let c=0;c<8;c++){const s=String.fromCharCode(97+c)+(r+1);a.push({s,p:game.get(s as any)});}return a},[game]);
 const click=(s:string)=>{if(locked)return;const p=game.get(s as any);if(!sel){if(p?.color===game.turn())setSel(s);return}
 try{const g=new Chess(game.fen());g.move({from:sel,to:s,promotion:'q'});setSel(null);onMove(g)}
 catch{if(p?.color===game.turn())setSel(s);else setSel(null)}};
 return <group rotation={[-Math.PI/2,0,0]}>{squares.map(({s,p},i)=>{const x=(i%8)-3.5,y=Math.floor(i/8)-3.5;return <group key={s} position={[x*1.1,0,y*1.1]} onClick={()=>click(s)}>
 <mesh position={[0,-.08,0]}><boxGeometry args={[1.05,.16,1.05]}/><meshStandardMaterial color={sel===s?'#d4a72c':legal.includes(s)?'#667c4c':((i+Math.floor(i/8))%2?'#3b2d25':'#d8c29b')}/></mesh>
 {p&&<Piece p={p} attack={legal.includes(s)}/>}
 </group>})}</group>}

export default function App(){
 const[game,setGame]=useState(newGame);const[mode,setMode]=useState<'offline'|'online'>('offline');const[room,setRoom]=useState('');const[roomId,setRoomId]=useState<string|null>(null);const[playerId,setPlayerId]=useState<string|null>(null);const[playerColor,setPlayerColor]=useState<'w'|'b'|null>(null);const[msg,setMsg]=useState('');const[timer,setTimer]=useState({w:600,b:600});const last=useRef(Date.now());
 useEffect(()=>{if(!roomId)return;let active=true;getRoom(roomId).then((r:any)=>{if(!active)return;if(r?.fen&&r.fen!=='startpos')try{setGame(new Chess(r.fen))}catch{};if(playerId)setPlayerColor(r.white_id===playerId?'w':r.black_id===playerId?'b':null)}).catch(()=>setMsg('اتاق پیدا نشد'));const stop=subscribeRoom(roomId,(r:any)=>{if(r?.fen&&r.fen!=='startpos')try{setGame(new Chess(r.fen))}catch{};if(playerId)setPlayerColor(r.white_id===playerId?'w':r.black_id===playerId?'b':null)});return()=>{active=false;stop()};},[roomId,playerId]);
 useEffect(()=>{const t=setInterval(()=>{const now=Date.now(),d=(now-last.current)/1000;last.current=now;setTimer(v=>{const n={...v};n[game.turn()]-=d;return n})},250);return()=>clearInterval(t)},[game]);
 const move=async(g:Chess)=>{setGame(g);if(mode==='online'&&roomId){try{await savePosition(roomId,g.fen(),g.turn())}catch{setMsg('ذخیره حرکت ناموفق بود')}}};
 const newOnline=async()=>{try{const u=await ensureGuestSession();setPlayerId(u.id);const r=await createRoom(u.id);setPlayerColor('w');setRoomId(r.id);setRoom(r.id);setMsg('اتاق ساخته شد؛ کد یا لینک اتاق را برای بازیکن دوم بفرستید')}catch(e:any){setMsg(e?.message||'Supabase یا Anonymous Auth را تنظیم کنید')}}
 const join=async()=>{try{const code=room.trim();if(!code)throw new Error('کد اتاق را وارد کنید');const u=await ensureGuestSession();setPlayerId(u.id);const r=await joinRoom(code,u.id);setPlayerColor('b');setRoomId(r.id);setRoom(r.id);setMsg('با مهره‌های سیاه وارد شدید')}catch(e:any){setMsg(e?.message||'اتاق پیدا نشد یا پر است')}};
 const fmt=(n:number)=>{n=Math.max(0,Math.floor(n));return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0')};
 return <main><header><div><h1>FANTASY CHESS 3D</h1><span>شطرنج فانتزی • آفلاین / آنلاین • ۱۰ دقیقه‌ای</span></div><div className="actions"><button onClick={()=>setMode(mode==='offline'?'online':'offline')}>{mode==='offline'?'ONLINE':'OFFLINE'}</button><button onClick={()=>{setGame(newGame());setTimer({w:600,b:600})}}>بازی جدید</button></div></header>
 <div className="onlinebar">{mode==='online'&&<><button onClick={newOnline}>ساخت اتاق</button><input value={room} onChange={e=>setRoom(e.target.value)} placeholder="کد اتاق"/><button onClick={join}>ورود</button>{roomId&&<button onClick={()=>navigator.clipboard?.writeText(window.location.origin+window.location.pathname+'?room='+roomId)}>کپی لینک</button>}</>}{msg&&<span>{msg}</span>}</div>
 <section className="hud"><b>{statusText(game)}</b><span>سفید {fmt(timer.w)}</span><span>سیاه {fmt(timer.b)}</span></section>
 <div className="scene"><Canvas camera={{position:[0,8,7],fov:42}}><ambientLight intensity={1.2}/><directionalLight position={[4,8,5]} intensity={3}/><Environment preset="sunset"/><Board game={game} onMove={move} locked={mode==='online' && (!playerColor || playerColor!==game.turn())}/><ContactShadows position={[0,-.15,0]} opacity={.45} scale={12} blur={2}/><OrbitControls enablePan={false} minDistance={6} maxDistance={13} maxPolarAngle={Math.PI/2.05}/></Canvas></div>
 <footer><span>♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜</span><small>{mode==='online'?(roomId?'اتاق آنلاین فعال':'اتاق آنلاین آماده'): 'بازی آفلاین دو نفره'}</small></footer></main>}