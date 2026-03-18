import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Data will not be saved.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const createSession = async (idTiquet = '') => {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .insert({
      status: 'started',
      started_at: new Date().toISOString(),
      id_tiquet: idTiquet || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }
  return data;
};

export const saveIntroData = async (sessionId, introData) => {
  if (!supabase || !sessionId) return null;

  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .update({
      intro_data: introData,
      status: 'intro_completed',
      cif_empresa: introData.cif_empresa,
      business_name: introData.business_name,
      contact_name: introData.contact_name,
      nif_usuari: introData.nif_usuari,
      nom_usuari: introData.nom_usuari,
      email: introData.email,
      phone: introData.phone,
      district: introData.district,
      barri: introData.barri,
      sector: introData.sector,
      activity_type: introData.activity_type,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error saving intro data:', error);
    return null;
  }
  return data;
};

export const saveAnswer = async (sessionId, question, answer) => {
  if (!supabase || !sessionId) return null;

  const type = question?.type || answer?.type || 'single_choice';
  const currentArea = question?.area;

  const payload = {
    session_id: sessionId,
    question_id: question.id,
    area: currentArea,
    answered_at: new Date().toISOString(),
    answer_type: type,
    score: Number(answer?.score || 0),
    option_id: null,
    option_ids: null,
    answer_text: null,
  };

  if (type === 'single_choice') {
    payload.option_id = answer.optionId;
  } else if (type === 'multiple_choice') {
    payload.option_ids = answer.optionIds || [];
  } else if (type === 'text') {
    payload.answer_text = answer.text || '';
  }

  const { data, error } = await supabase
    .from('diagnostic_answers')
    .upsert(payload, {
      onConflict: 'session_id,question_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving answer:', error);
    return null;
  }

  await supabase
    .from('diagnostic_sessions')
    .update({
      current_area: currentArea,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  return data;
};

export const completeSession = async (sessionId, results) => {
  if (!supabase || !sessionId) return null;

  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      total_score: results.totalScore,
      area_scores: results.areaScores,
      priority_areas: results.priorityAreas,
      global_threshold: results.globalThreshold?.key,
      recommended_hours: results.globalThreshold?.recommended_hours,
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error completing session:', error);
    return null;
  }
  return data;
};
