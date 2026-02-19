import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@barcelonactiva.cat";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "comercapunt@barcelonactiva.cat";
const CONSULTANT_EMAIL = Deno.env.get("CONSULTANT_EMAIL") || "";

// Microsoft Graph API for Excel Online
const MS_TENANT_ID = Deno.env.get("MS_TENANT_ID") || "";
const MS_CLIENT_ID = Deno.env.get("MS_CLIENT_ID") || "";
const MS_CLIENT_SECRET = Deno.env.get("MS_CLIENT_SECRET") || "";
const MS_EXCEL_DRIVE_ID = Deno.env.get("MS_EXCEL_DRIVE_ID") || "";
const MS_EXCEL_ITEM_ID = Deno.env.get("MS_EXCEL_ITEM_ID") || "";
const MS_EXCEL_WORKSHEET = Deno.env.get("MS_EXCEL_WORKSHEET") || "Sheet1";

async function getAccessToken(): Promise<string | null> {
  if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) {
    console.warn("Microsoft Graph API not configured");
    return null;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      console.error("Failed to get access token:", await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

async function addRowToExcel(rowData: (string | number)[]): Promise<boolean> {
  const accessToken = await getAccessToken();
  if (!accessToken || !MS_EXCEL_DRIVE_ID || !MS_EXCEL_ITEM_ID) {
    console.warn("Excel integration not configured or token failed");
    return false;
  }

  try {
    const url = `https://graph.microsoft.com/v1.0/drives/${MS_EXCEL_DRIVE_ID}/items/${MS_EXCEL_ITEM_ID}/workbook/worksheets/${MS_EXCEL_WORKSHEET}/tables/Table1/rows`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [rowData],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to add row to Excel:", errorText);
      return false;
    }

    console.log("Row added to Excel successfully");
    return true;
  } catch (error) {
    console.error("Error adding row to Excel:", error);
    return false;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AreaScore {
  id: string;
  area: number;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
}

interface EmailRequest {
  session_id: string;
  to_email: string;
  to_name: string;
  business_name: string;
  phone: string;
  address: string;
  district: string;
  activity_type: string;
  activity_other?: string;
  years_in_operation: string;
  team_size: string;
  total_score: number;
  max_score: number;
  percentage: number;
  priority_areas: string[];
  area_scores: Record<number, AreaScore>;
  recommended_hours: string;
  pdf_base64: string;
}

const DISTRICT_LABELS: Record<string, string> = {
  ciutat_vella: "Ciutat Vella",
  eixample: "Eixample",
  sants_montjuic: "Sants-Montjuïc",
  les_corts: "Les Corts",
  sarria_sant_gervasi: "Sarrià-Sant Gervasi",
  gracia: "Gràcia",
  horta_guinardo: "Horta-Guinardó",
  nou_barris: "Nou Barris",
  sant_andreu: "Sant Andreu",
  sant_marti: "Sant Martí",
};

const ACTIVITY_LABELS: Record<string, string> = {
  alimentacio: "Alimentació",
  moda: "Moda i complements",
  llar: "Llar i decoració",
  bellesa: "Bellesa i salut",
  llibreria: "Llibreria i papereria",
  tecnologia: "Tecnologia i electrònica",
  serveis: "Serveis (perruqueria, estètica, etc.)",
  restauracio: "Restauració",
  altres: "Altres",
};

const YEARS_LABELS: Record<string, string> = {
  lt_1: "Menys d'1 any",
  "1_3": "1-3 anys",
  "3_5": "3-5 anys",
  "5_10": "5-10 anys",
  gt_10: "Més de 10 anys",
};

const TEAM_LABELS: Record<string, string> = {
  solo: "Jo sol/a",
  "2": "2 persones",
  "3_5": "3-5 persones",
  gt_5: "Més de 5 persones",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const data: EmailRequest = await req.json();
    
    const {
      to_email,
      to_name,
      business_name,
      phone,
      address,
      district,
      activity_type,
      activity_other,
      years_in_operation,
      team_size,
      total_score,
      percentage,
      priority_areas,
      area_scores,
      recommended_hours,
      pdf_base64,
    } = data;

    const districtLabel = DISTRICT_LABELS[district] || district;
    const activityLabel = activity_type === "altres" && activity_other 
      ? activity_other 
      : ACTIVITY_LABELS[activity_type] || activity_type;
    const yearsLabel = YEARS_LABELS[years_in_operation] || years_in_operation;
    const teamLabel = TEAM_LABELS[team_size] || team_size;

    const userEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 30px; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .score-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .score { font-size: 48px; font-weight: bold; color: #2563eb; }
    .priority-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .priority-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .priority-item:last-child { border-bottom: none; }
    .cta { background: #2563eb; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
    .phone { font-size: 20px; font-weight: bold; color: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏪 Comerç a Punt</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${to_name}</strong>,</p>
      
      <p>Adjunt trobaràs el teu informe de diagnosi complet.</p>
      
      <div class="score-box">
        <p style="margin: 0; color: #6b7280;">📊 LA TEVA PUNTUACIÓ</p>
        <p class="score">${total_score}<span style="font-size: 24px; color: #9ca3af;">/63</span> punts</p>
      </div>
      
      <div class="priority-list">
        <p style="margin: 0 0 15px 0; font-weight: bold;">🎯 ÀREES PRIORITÀRIES:</p>
        ${priority_areas.map((area, i) => `
          <div class="priority-item">
            <strong>${i + 1}.</strong> ${area}
          </div>
        `).join('')}
      </div>
      
      <p>En menys de <strong>3 dies laborables</strong>, un assessor et trucarà per programar la primera sessió.</p>
      
      <p>Si tens pressa o vols canviar alguna cosa, truca'ns:</p>
      <p class="phone">☎️ 900 533 175</p>
      
      <p style="margin-top: 30px;">Salut i bons negocis!</p>
      
      <p><strong>Equip Comerç a Punt</strong><br>Barcelona Activa</p>
    </div>
    <div class="footer">
      <p>Aquest correu s'ha enviat automàticament des del sistema de diagnosi de Comerç a Punt.</p>
    </div>
  </div>
</body>
</html>
    `;

    const userEmailText = `
Hola ${to_name},

Adjunt trobaràs el teu informe de diagnosi complet.

📊 LA TEVA PUNTUACIÓ: ${total_score}/63 punts

🎯 ÀREES PRIORITÀRIES:
${priority_areas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

En menys de 3 dies laborables, un assessor et trucarà per programar la primera sessió.

Si tens pressa o vols canviar alguna cosa, truca'ns:
☎️ 900 533 175

Salut i bons negocis!

Equip Comerç a Punt
Barcelona Activa
    `;

    const userEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Comerç a Punt <${FROM_EMAIL}>`,
        to: [to_email],
        subject: "El teu informe Comerç a Punt - Pròxims passos",
        html: userEmailHtml,
        text: userEmailText,
        attachments: [
          {
            filename: `informe-diagnosi-${business_name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            content: pdf_base64,
          },
        ],
      }),
    });

    if (!userEmailResponse.ok) {
      const error = await userEmailResponse.text();
      throw new Error(`Failed to send user email: ${error}`);
    }

    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; padding: 20px; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 20px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Nova diagnosi completada</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <p class="label">Comerç</p>
        <p class="value">${business_name}</p>
      </div>
      <div class="info-box">
        <p class="label">Contacte</p>
        <p class="value">${to_name}</p>
        <p>${to_email}</p>
      </div>
      <div class="info-box">
        <p class="label">Puntuació</p>
        <p class="value">${total_score}/63 punts</p>
        <p>Hores recomanades: ${recommended_hours}</p>
      </div>
      <div class="info-box">
        <p class="label">Àrees prioritàries</p>
        ${priority_areas.map((area, i) => `<p>${i + 1}. ${area}</p>`).join('')}
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Comerç a Punt <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject: `Nova diagnosi: ${business_name} - ${total_score}/63 punts`,
        html: adminEmailHtml,
        attachments: [
          {
            filename: `informe-diagnosi-${business_name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            content: pdf_base64,
          },
        ],
      }),
    });

    if (!adminEmailResponse.ok) {
      const error = await adminEmailResponse.text();
      console.error("Failed to send admin email:", error);
    }

    // Send consultant email if configured
    if (CONSULTANT_EMAIL) {
      const consultantEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; padding: 20px; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 18px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; color: #1e40af; margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
    .data-row { display: flex; margin-bottom: 8px; }
    .data-label { color: #6b7280; min-width: 120px; }
    .data-value { font-weight: 500; }
    .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .score-item { background: white; padding: 10px; border-radius: 6px; border-left: 4px solid #e5e7eb; }
    .score-item.red { border-left-color: #dc2626; }
    .score-item.yellow { border-left-color: #eab308; }
    .score-item.green { border-left-color: #16a34a; }
    .priority-list { background: #fef2f2; padding: 15px; border-radius: 8px; }
    .priority-item { padding: 8px 0; border-bottom: 1px solid #fecaca; }
    .priority-item:last-child { border-bottom: none; }
    .reminder-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .reminder-item { margin: 5px 0; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🆕 [NOU] Comerç inscrit - ${business_name} - ${districtLabel}</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; margin-bottom: 25px;"><strong>Nou comerç per assessorar:</strong></p>
      
      <div class="section">
        <div class="section-title">📋 DADES BÀSIQUES</div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 120px;">Comerç:</td><td style="padding: 8px 0; font-weight: 500;">${business_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Contacte:</td><td style="padding: 8px 0; font-weight: 500;">${to_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Telèfon:</td><td style="padding: 8px 0; font-weight: 500;">${phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email:</td><td style="padding: 8px 0; font-weight: 500;">${to_email}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Adreça:</td><td style="padding: 8px 0; font-weight: 500;">${address}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Districte:</td><td style="padding: 8px 0; font-weight: 500;">${districtLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Activitat:</td><td style="padding: 8px 0; font-weight: 500;">${activityLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Antiguitat:</td><td style="padding: 8px 0; font-weight: 500;">${yearsLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Equip:</td><td style="padding: 8px 0; font-weight: 500;">${teamLabel}</td></tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">📊 DIAGNOSI</div>
        <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">
          Puntuació global: <span style="color: #2563eb;">${total_score}/63</span> 
          <span style="font-size: 16px; color: #6b7280;">(${percentage}%)</span>
        </p>
        
        <p style="margin: 15px 0 10px 0; font-weight: 500;">Desglossament:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0;">• Finançament:</td>
            <td style="padding: 6px 0; font-weight: 500;">${area_scores[1]?.score || 0}/9</td>
            <td style="padding: 6px 0;">• Digitalització:</td>
            <td style="padding: 6px 0; font-weight: 500;">${area_scores[4]?.score || 0}/9</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">• Model negoci:</td>
            <td style="padding: 6px 0; font-weight: 500;">${area_scores[2]?.score || 0}/9</td>
            <td style="padding: 6px 0;">• Imatge:</td>
            <td style="padding: 6px 0; font-weight: 500;">${area_scores[5]?.score || 0}/9</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">• Comunicació:</td>
            <td style="padding: 6px 0; font-weight: 500;">${area_scores[3]?.score || 0}/9</td>
            <td style="padding: 6px 0;">• Ajuts:</td>
            <td style="padding: 6px 0; font-weight: 500;">${area_scores[6]?.score || 0}/9</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"></td>
            <td style="padding: 6px 0;"></td>
            <td style="padding: 6px 0;">• Organització:</td>
            <td style="padding: 6px 0; font-weight: 500;">${area_scores[7]?.score || 0}/9</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <div class="section-title">🎯 ÀREES PRIORITÀRIES</div>
        <div class="priority-list">
          ${priority_areas.map((area, i) => `
            <div class="priority-item">
              <strong>${i + 1}.</strong> ${area}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-title">⏰ HORES RECOMANADES</div>
        <p style="font-size: 20px; font-weight: bold; color: #2563eb;">${recommended_hours} hores</p>
      </div>

      <div class="reminder-box">
        <div class="section-title" style="border-bottom: none; margin-bottom: 5px;">⚠️ RECORDATORI</div>
        <div class="reminder-item">• Contactar en màxim <strong>3 dies laborables</strong></div>
        <div class="reminder-item">• Primera sessió presencial en màxim <strong>2 setmanes</strong></div>
        <div class="reminder-item">• Validar diagnosi i dissenyar pla d'acció</div>
      </div>

      <div class="footer">
        <p>—<br>Sistema automàtic Comerç a Punt</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      const consultantEmailText = `
[NOU] Comerç inscrit - ${business_name} - ${districtLabel}

Nou comerç per assessorar:

📋 DADES BÀSIQUES:
Comerç: ${business_name}
Contacte: ${to_name}
Telèfon: ${phone}
Email: ${to_email}
Adreça: ${address}
Districte: ${districtLabel}
Activitat: ${activityLabel}
Antiguitat: ${yearsLabel}
Equip: ${teamLabel}

📊 DIAGNOSI:
Puntuació global: ${total_score}/63 (${percentage}%)

Desglossament:
• Finançament: ${area_scores[1]?.score || 0}/9
• Model negoci: ${area_scores[2]?.score || 0}/9
• Comunicació: ${area_scores[3]?.score || 0}/9
• Digitalització: ${area_scores[4]?.score || 0}/9
• Imatge: ${area_scores[5]?.score || 0}/9
• Ajuts: ${area_scores[6]?.score || 0}/9
• Organització: ${area_scores[7]?.score || 0}/9

🎯 ÀREES PRIORITÀRIES:
${priority_areas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

⏰ HORES RECOMANADES: ${recommended_hours} hores

⚠️ RECORDATORI:
- Contactar en màxim 3 dies laborables
- Primera sessió presencial en màxim 2 setmanes
- Validar diagnosi i dissenyar pla d'acció

—
Sistema automàtic Comerç a Punt
      `;

      const consultantEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Comerç a Punt <${FROM_EMAIL}>`,
          to: [CONSULTANT_EMAIL],
          subject: `[NOU] Comerç inscrit - ${business_name} - ${districtLabel}`,
          html: consultantEmailHtml,
          text: consultantEmailText,
          attachments: [
            {
              filename: `informe-diagnosi-${business_name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
              content: pdf_base64,
            },
          ],
        }),
      });

      if (!consultantEmailResponse.ok) {
        const error = await consultantEmailResponse.text();
        console.error("Failed to send consultant email:", error);
      }
    }

    // Add row to Excel Online spreadsheet
    const today = new Date().toLocaleDateString('ca-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });

    const excelRowData = [
      today,                                    // Data inscripció
      business_name,                            // Nom comerç
      to_name,                                  // Contacte
      phone,                                    // Telèfon
      to_email,                                 // Email
      address,                                  // Adreça
      districtLabel,                            // Districte
      activityLabel,                            // Activitat
      yearsLabel,                               // Antiguitat
      teamLabel,                                // Equip
      area_scores[1]?.score || 0,               // Finançament
      area_scores[2]?.score || 0,               // Model negoci
      area_scores[3]?.score || 0,               // Comunicació
      area_scores[4]?.score || 0,               // Digitalització
      area_scores[5]?.score || 0,               // Imatge
      area_scores[6]?.score || 0,               // Ajuts
      area_scores[7]?.score || 0,               // Organització
      total_score,                              // Puntuació total
      `${percentage}%`,                         // Percentatge
      priority_areas[0] || "",                  // Àrea prioritària 1
      priority_areas[1] || "",                  // Àrea prioritària 2
      priority_areas[2] || "",                  // Àrea prioritària 3
      recommended_hours,                        // Hores recomanades
      "",                                       // Assessor assignat (to be filled manually)
      "",                                       // Data primer contacte (to be filled manually)
      "",                                       // Data primera sessió (to be filled manually)
      "Pendent",                                // Estat
    ];

    await addRowToExcel(excelRowData);

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent and data added to Excel" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
