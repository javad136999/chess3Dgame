import { supabase } from '../lib/supabase';

export async function ensureGuestSession() {
  if (!supabase) throw new Error('Supabase env is not configured');
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session?.user) return existing.session.user;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('Anonymous session was not created');
  return data.user;
}

export async function createRoom(userId: string) {
  if (!supabase) throw new Error('Supabase env is not configured');
  const { data, error } = await supabase
    .from('chess_rooms')
    .insert({
      white_id: userId,
      fen: 'startpos',
      turn: 'w',
      status: 'waiting'
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function joinRoom(roomId: string, userId: string) {
  if (!supabase) throw new Error('Supabase env is not configured');
  const { data, error } = await supabase
    .from('chess_rooms')
    .update({ black_id: userId, status: 'playing' })
    .eq('id', roomId)
    .is('black_id', null)
    .eq('status', 'waiting')
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRoom(roomId: string) {
  if (!supabase) throw new Error('Supabase env is not configured');
  const { data, error } = await supabase
    .from('chess_rooms')
    .select('*')
    .eq('id', roomId)
    .single();
  if (error) throw error;
  return data;
}

export function subscribeRoom(roomId: string, onChange: (room: any) => void) {
  if (!supabase) return () => {};
  const client = supabase;
  const channel = client
    .channel('chess-room-' + roomId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chess_rooms',
        filter: 'id=eq.' + roomId
      },
      payload => onChange(payload.new)
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export async function savePosition(roomId: string, fen: string, turn: string) {
  if (!supabase) throw new Error('Supabase env is not configured');
  const { data, error } = await supabase
    .from('chess_rooms')
    .update({ fen, turn, updated_at: new Date().toISOString() })
    .eq('id', roomId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
