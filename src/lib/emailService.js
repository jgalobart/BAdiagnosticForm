import { supabase } from './supabase';

export const sendResultsEmail = async (sessionId, formData, results, pdfBase64, idTiquet = '') => {
  if (!supabase) {
    console.warn('Supabase not configured, email not sent');
    return null;
  }

  const { totalScore, priorityAreas, globalThreshold, areaScores } = results;
  const maxScore = 63;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const emailData = {
    session_id: sessionId,
    id_tiquet: idTiquet || null,
    to_email: formData.email,
    to_name: formData.contact_name,
    business_name: formData.business_name,
    phone: formData.phone,
    address: formData.address,
    district: formData.district,
    activity_type: formData.activity_type,
    activity_other: formData.activity_other,
    years_in_operation: formData.years_in_operation,
    team_size: formData.team_size,
    total_score: totalScore,
    max_score: maxScore,
    percentage: percentage,
    priority_areas: priorityAreas.map(a => a.title),
    area_scores: areaScores,
    recommended_hours: globalThreshold?.recommended_hours,
    pdf_base64: pdfBase64,
  };

  try {
    const { data, error } = await supabase.functions.invoke('send-results-email', {
      body: emailData,
    });

    if (error) {
      console.error('Error sending email:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error invoking email function:', err);
    return null;
  }
};
