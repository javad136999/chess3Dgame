import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { Chess } from 'chess.js';
import { newGame, statusText } from './game/chess';
import { ensureGuestSession, createRoom, joinRoom, getRoom, subscribeRoom, savePosition } from './game/online';
import './styles.css';

function Piece({p,attack,selected}:{p:any,attack:boolean,selected:boolean}){
 const dark=p.color==='b', ref=useRef<any>(null);
 useFrame(({clock})=>{if(!ref.current)return;const t=clock.getElapsedTime();const bob=Math.sin(t*(p.type==='p'?4:2.2))*(p.type==='p'?.035:.015);ref.current.position.y=bob;ref.current.rotation.z=attack?Math.sin(t*16)*.1:0;const base=selected?1.08:1;ref.current.scale.setScalar(base+(attack?.05:0));});
 const body=dark?'#242630':'#e8dfca', metal=dark?'#11131a':'#d5c6a6', gold='#d2a52f', skin=dark?'#36313a':'#8f6d4b';
 const spear=<><mesh position={[0,.92,.32]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.028,.028,.9,10]}/><meshStandardMaterial color={gold} metalness={.8}/></mesh><mesh position={[0,1.39,.32]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.08,.25,8]}/><meshStandardMaterial color={metal} metalness={.7}/></mesh></>;
 return <group ref={ref}>
  <mesh position={[0,.1,0]}><cylinderGeometry args={[.4,.5,.2,28]}/><meshStandardMaterial color={metal} metalness={.75} roughness={.22}/></mesh>
  {p.type==='b'?<group>
    <mesh position={[0,.48,0]} scale={[1.2,.82,1.35]}><sphereGeometry args={[.36,24,16]}/><meshStandardMaterial color={skin} roughness={.75}/></mesh>
    <mesh position={[0,.78,0]}><sphereGeometry args={[.27,22,15]}/><meshStandardMaterial color={skin} roughness={.75}/></mesh>
    <mesh position={[0,.94,0]}><sphereGeometry args={[.12,18,12]}/><meshStandardMaterial color={body}/></mesh>
    <mesh position={[0,.54,-.27]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.08,.12,.42,16]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh position={[0,.54,.27]} rotation={[-Math.PI/2,0,0]}><coneGeometry args={[.12,.32,16]}/><meshStandardMaterial color={skin}/></mesh>
    <mesh position={[0,.73,0]}><torusGeometry args={[.27,.035,12,28]}/><meshStandardMaterial color={gold} metalness={.9}/></mesh>
    <group position={[0,1.0,0]} scale={.58}><mesh position={[0,.4,0]}><capsuleGeometry args={[.16,.3,6,12]}/><meshStandardMaterial color={body} metalness={.35}/></mesh><mesh position={[0,.65,0]}><sphereGeometry args={[.14,18,12]}/><meshStandardMaterial color={body}/></mesh>{spear}</group>
  </group>:p.type==='n'?<group>
    <mesh position={[0,.42,0]} scale={[1.25,.7,1.5]}><sphereGeometry args={[.34,24,16]}/><meshStandardMaterial color={body} metalness={.4}/></mesh>
    <mesh position={[0,.62,-.12]} rotation={[0,.18,-.1]}><capsuleGeometry args={[.19,.52,8,14]}/><meshStandardMaterial color={body} metalness={.4}/></mesh>
    <mesh position={[0,.9,.02]}><sphereGeometry args={[.2,20,14]}/><meshStandardMaterial color={body}/></mesh>
    <mesh position={[0,1.0,.2]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.045,.5,10]}/><meshStandardMaterial color={gold} metalness={.9}/></mesh>
    <mesh position={[0,.25,.27]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.075,.075,.52,12]}/><meshStandardMaterial color={metal}/></mesh>{spear}
  </group>:p.type==='p'?<group>
    <mesh position={[0,.43,0]}><capsuleGeometry args={[.2,.4,8,12]}/><meshStandardMaterial color={body} metalness={.35}/></mesh>
    <mesh position={[0,.8,0]}><sphereGeometry args={[.18,20,14]}/><meshStandardMaterial color={body}/></mesh>
    <mesh position={[0,.9,.03]}><torusGeometry args={[.13,.025,10,20]}/><meshStandardMaterial color={gold} metalness={.8}/></mesh>{spear}
  </group>:<group>
    <mesh position={[0,.55,0]}><sphereGeometry args={[p.type==='k'?.31:p.type==='q'?.28:.23,24,16]}/><meshStandardMaterial color={body} metalness={.35}/></mesh>
    {p.type==='k'?<><mesh position={[0,.98,0]}><torusGeometry args={[.23,.055,14,28]}/><meshStandardMaterial color={gold} metalness={.95}/></mesh><mesh position={[0,1.22,0]}><boxGeometry args={[.08,.45,.08]}/><meshStandardMaterial color={gold} metalness={.9}/></mesh><mesh position={[0,1.36,0]}><boxGeometry args={[.28,.07,.07]}/><meshStandardMaterial color={gold} metalness={.9}/></mesh></>:p.type==='q'?<mesh position={[0,1.02,0]}><coneGeometry args={[.18,.42,8]}/><meshStandardMaterial color={gold} metalness={.9}/></mesh>:p.type==='r'?<mesh position={[0,.95,0]}><cylinderGeometry args={[.18,.21,.4,10]}/><meshStandardMaterial color={body} metalness={.55}/></mesh>:null}
  </group>}
  {attack&&<Html center position={[0,1.35,0]}><span className="hit">⚔</span></Html>}
 </group>
}
function Board({game,onMove,locked=false}:{game:Chess,onMove:(g:Chess)=>void,locked?:boolean}){
 const [sel,setSel]=useState<string|null>(null);
 const [moving,setMoving]=useState<string|null>(null);
 const legal=useMemo(()=>sel?game.moves({square:sel as any,verbose:true}).map((m:any)=>m.to):[],[game,sel]);
 const squares=useMemo(()=>{const a:any[]=[];for(let r=7;r>=0;r--)for(let c=0;c<8;c++){const sq=String.fromCharCode(97+c)+(r+1);a.push({sq,p:game.get(sq as any)});}return a},[game]);
 const click=(sq:string)=>{if(locked||moving)return;const p=game.get(sq as any);
   if(!sel){if(p?.color===game.turn())setSel(sq);return}
   if(sel===sq){setSel(null);return}
   try{
    const g=new Chess(game.fen());const piece=g.get(sel as any);
    const promotion=piece?.type==='p'&&(sq[1]==='8'||sq[1]==='1')?'q':undefined;
    g.move({from:sel,to:sq,...(promotion?{promotion}:{})});
    setMoving(sel+'-'+sq);setSel(null);
    window.setTimeout(()=>{setMoving(null);onMove(g)},220);
   }catch{if(p?.color===game.turn())setSel(sq);else setSel(null)}
 };
 return <group>{squares.map(({sq,p},i)=>{const x=(i%8)-3.5,z=Math.floor(i/8)-3.5;const light=(i+Math.floor(i/8))%2===0;const isFrom=moving?.startsWith(sq+'-');return <group key={sq} position={[x*1.1,0,z*1.1]} onClick={()=>click(sq)}>
   <mesh position={[0,-.08,0]}><boxGeometry args={[1.05,.16,1.05]}/><meshStandardMaterial color={sel===sq?'#d4a72c':legal.includes(sq)?'#708f58':light?'#d8c29b':'#3b2d25'}/></mesh>
   {p&&<Piece p={p} attack={legal.includes(sq)} selected={sel===sq}/>}
   {legal.includes(sq)&&!p&&<mesh position={[0,.02,0]}><cylinderGeometry args={[.11,.11,.035,16]}/><meshStandardMaterial color="#d4a72c" emissive="#8b6b32" emissiveIntensity={.8}/></mesh>}
   {isFrom&&<mesh position={[0,.13,0]}><ringGeometry args={[.28,.34,24]}/><meshStandardMaterial color="#e2b63d" emissive="#9b6b18" emissiveIntensity={1.2}/></mesh>}
 </group>})}</group>
}
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
 <div className="scene"><Canvas camera={{position:[-5.4,6.2,5.4],fov:42}}><ambientLight intensity={1.15}/><directionalLight position={[4,8,5]} intensity={3}/><pointLight position={[-5,4,-4]} intensity={1.5}/><Environment preset="sunset"/><Board game={game} onMove={move} locked={onlineLocked}/><ContactShadows position={[0,-.15,0]} opacity={.5} scale={12} blur={2}/><OrbitControls enablePan={false} enableRotate={false} minDistance={6} maxDistance={13} minPolarAngle={0.88} maxPolarAngle={0.88} minAzimuthAngle={-0.78} maxAzimuthAngle={-0.78} target={[0,0,0]}/></Canvas></div>
 <footer><span>♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜</span><small>{mode==='online'?(roomId?'🌐 اتاق آنلاین فعال':'🌐 حالت آنلاین آماده'): '🎮 بازی آفلاین دو نفره'} {onlineLocked&&' • منتظر نوبت شما'}</small></footer></main>}
