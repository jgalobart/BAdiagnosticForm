import { useMemo, useEffect, useState } from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip 
} from 'recharts';
import { 
  Trophy, AlertTriangle, TrendingUp, Clock, Download, 
  CheckCircle2, AlertCircle, Target, Mail, Loader2, CheckCheck 
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import ResultsPDF from './ResultsPDF';
import { sendResultsEmail } from '../lib/emailService';

export default function ResultsReport({ formData, answers, areas, questions, scoring, sessionId }) {
  const [emailStatus, setEmailStatus] = useState('idle');
  const [emailSent, setEmailSent] = useState(false);

  const results = useMemo(() => {
    const areaScores = {};
    
    areas.forEach(area => {
      const areaQuestions = questions.filter(q => q.area === area.area);
      const totalScore = areaQuestions.reduce((sum, q) => {
        return sum + (answers[q.id]?.score || 0);
      }, 0);
      areaScores[area.area] = {
        ...area,
        score: totalScore,
        maxScore: area.max_score,
        percentage: Math.round((totalScore / area.max_score) * 100)
      };
    });

    const totalScore = Object.values(areaScores).reduce((sum, a) => sum + a.score, 0);
    const maxTotal = scoring.global.max_score;

    const getThreshold = (score, thresholds) => {
      return thresholds.find(t => 
        score >= t.range_inclusive[0] && score <= t.range_inclusive[1]
      );
    };

    const globalThreshold = getThreshold(totalScore, scoring.global.thresholds);
    
    const priorityAreas = Object.values(areaScores)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return {
      areaScores,
      totalScore,
      maxTotal,
      globalThreshold,
      priorityAreas,
      percentage: Math.round((totalScore / maxTotal) * 100)
    };
  }, [answers, areas, questions, scoring]);

  const radarData = areas.map(area => ({
    area: `Àrea ${area.area}`,
    score: results.areaScores[area.area].score,
    fullMark: area.max_score
  }));

  const barData = areas.map(area => {
    const areaScore = results.areaScores[area.area];
    return {
      name: `Àrea ${area.area}`,
      score: areaScore.score,
      maxScore: area.max_score,
      title: area.title.split('"')[0].trim()
    };
  });

  const getColorByScore = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage <= 33) return '#dc2626';
    if (percentage <= 66) return '#eab308';
    return '#16a34a';
  };

  const getStatusIcon = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage <= 33) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (percentage <= 66) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  };

  const getStatusLabel = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage <= 33) return { text: 'Prioritat ALTA', color: 'bg-red-100 text-red-700' };
    if (percentage <= 66) return { text: 'Prioritat MITJANA', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Ben encaminat', color: 'bg-green-100 text-green-700' };
  };

  useEffect(() => {
    const sendEmail = async () => {
      if (emailSent || emailStatus === 'sending') return;
      
      setEmailStatus('sending');
      
      try {
        const pdfDoc = <ResultsPDF formData={formData} results={results} areas={areas} />;
        const pdfBlob = await pdf(pdfDoc).toBlob();
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1];
          
          const response = await sendResultsEmail(sessionId, formData, results, base64);
          
          if (response) {
            setEmailStatus('sent');
            setEmailSent(true);
          } else {
            setEmailStatus('error');
          }
        };
        reader.readAsDataURL(pdfBlob);
      } catch (error) {
        console.error('Error generating PDF or sending email:', error);
        setEmailStatus('error');
      }
    };

    if (results && formData && !emailSent) {
      sendEmail();
    }
  }, [results, formData, sessionId, emailSent, emailStatus, areas]);

  const handleDownloadPDF = async () => {
    try {
      const pdfDoc = <ResultsPDF formData={formData} results={results} areas={areas} />;
      const pdfBlob = await pdf(pdfDoc).toBlob();
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe-diagnosi-${formData.business_name?.replace(/\s+/g, '-').toLowerCase() || 'comerc'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-white">
            <h1 className="text-3xl font-bold mb-2">Informe de Diagnosi</h1>
            <p className="text-blue-100 text-lg">{formData.business_name}</p>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Puntuació Global</p>
                <div className="flex items-baseline gap-2 justify-center md:justify-start">
                  <span className="text-6xl font-bold text-gray-800">{results.totalScore}</span>
                  <span className="text-2xl text-gray-400">/ {results.maxTotal}</span>
                </div>
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
                    results.globalThreshold?.key === 'red' ? 'bg-red-100 text-red-700' :
                    results.globalThreshold?.key === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {results.globalThreshold?.key === 'red' ? <AlertCircle className="w-5 h-5" /> :
                     results.globalThreshold?.key === 'yellow' ? <AlertTriangle className="w-5 h-5" /> :
                     <Trophy className="w-5 h-5" />}
                    {results.globalThreshold?.label}
                  </span>
                </div>
              </div>

              <div className="w-full md:w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 9]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Puntuació"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Hours */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Recomanació d'hores d'assessorament</p>
              <p className="text-2xl font-bold text-gray-800">{results.globalThreshold?.recommended_hours} hores</p>
            </div>
          </div>
        </div>

        {/* Priority Areas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Les teves 3 àrees prioritàries</h2>
          </div>
          <div className="space-y-4">
            {results.priorityAreas.map((area, idx) => {
              const status = getStatusLabel(area.score, area.maxScore);
              return (
                <div key={area.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{area.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                      <span className="text-sm text-gray-500">{area.score}/{area.maxScore} punts</span>
                    </div>
                  </div>
                  {getStatusIcon(area.score, area.maxScore)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Area Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Desglossament per àrees</h2>
          </div>

          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" domain={[0, 9]} />
                <YAxis type="category" dataKey="name" width={60} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border">
                          <p className="font-medium">{data.title}</p>
                          <p className="text-sm text-gray-600">{data.score}/{data.maxScore} punts</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorByScore(entry.score, entry.maxScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3">
            {areas.map(area => {
              const areaScore = results.areaScores[area.area];
              const status = getStatusLabel(areaScore.score, areaScore.maxScore);
              return (
                <div key={area.id} className="flex items-center gap-4 p-4 border rounded-xl">
                  {getStatusIcon(areaScore.score, areaScore.maxScore)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{area.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>
                      {status.text}
                    </span>
                    <span className="font-bold text-gray-700 w-12 text-right">
                      {areaScore.score}/{areaScore.maxScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-gray-800 mb-4">Llegenda de colors</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-gray-600">Prioritat ALTA (0-3 punts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Prioritat MITJANA (4-6 punts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Ben encaminat (7-9 punts)</span>
            </div>
          </div>
        </div>

        {/* Email Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              emailStatus === 'sent' ? 'bg-green-100' :
              emailStatus === 'error' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              {emailStatus === 'sending' ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : emailStatus === 'sent' ? (
                <CheckCheck className="w-8 h-8 text-green-600" />
              ) : emailStatus === 'error' ? (
                <Mail className="w-8 h-8 text-red-600" />
              ) : (
                <Mail className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-gray-500 text-sm">Correu electrònic</p>
              <p className={`text-lg font-medium ${
                emailStatus === 'sent' ? 'text-green-700' :
                emailStatus === 'error' ? 'text-red-700' :
                'text-gray-800'
              }`}>
                {emailStatus === 'sending' ? 'Enviant informe...' :
                 emailStatus === 'sent' ? `Enviat a ${formData.email}` :
                 emailStatus === 'error' ? 'Error en enviar. Descarrega el PDF manualment.' :
                 'Preparant enviament...'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">
            Informe generat per Comerç a Punt - Barcelona Activa
          </p>
          <button 
            onClick={handleDownloadPDF}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Descarregar informe PDF
          </button>
        </div>
      </div>
    </div>
  );
}
