import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Data will not be saved.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const createSession = async () => {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('diagnostic_sessions')
    .insert({
      status: 'started',
      started_at: new Date().toISOString(),
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
      business_name: introData.business_name,
      contact_name: introData.contact_name,
      email: introData.email,
      phone: introData.phone,
      district: introData.district,
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

export const saveAnswer = async (sessionId, questionId, optionId, score, currentArea) => {
  if (!supabase || !sessionId) return null;

  const { data, error } = await supabase
    .from('diagnostic_answers')
    .upsert({
      session_id: sessionId,
      question_id: questionId,
      option_id: optionId,
      score: score,
      area: currentArea,
      answered_at: new Date().toISOString(),
    }, {
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
