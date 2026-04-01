import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { evaluationId, toEmail, data } = await req.json();

    if (!toEmail) {
      return NextResponse.json({ error: "No email address provided" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    
    // Fallback/Mock behavior if Resend API key is not configured.
                     
    if (!resendApiKey) {
      console.warn("🔔 [MOCK EMAIL SEND] No RESEND_API_KEY found in .env.local", {
        to: toEmail,
        score: data.score,
        teacher: data.teacherName,
        evaluator: data.evaluatorName,
      });
      // Acknowledge the developer that it ran successfully (mock)
      return NextResponse.json({ success: true, mocked: true, message: "Add RESEND_API_KEY to actually send." });
    }

    const resend = new Resend(resendApiKey);
    const scorePct = Math.round((data.score / 26) * 100);

    const emailHtml = `
      <div style="font-family: sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4f7ef8;">Мұғалімді бағалау есебі</h2>
        <p>Құрметті <strong>${data.teacherName}</strong>,</p>
        <p>Сіздің жобалық-зерттеушілік іс-әрекетіңіз бойынша сабақтағы жұмысыңыз бағаланды.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 16px;">
            Жалпы балл: <strong style="color: #4f7ef8; font-size: 20px;">${data.score} / 26</strong> (${scorePct}%)
          </p>
          <p style="margin: 8px 0 0 0; color: #64748b;">
            Бағалаған сарапшы: ${data.evaluatorName}
          </p>
          <p style="margin: 8px 0 0 0; color: #64748b;">
            Бағаланған уақыт: ${new Date(data.created_at).toLocaleString('kk-KZ')}
          </p>
        </div>

        ${data.feedback ? `
        <h3>🤖 Жасанды интеллект қорытындысы:</h3>
        
        <h4 style="color: #059669;">Күшті жақтары:</h4>
        <p style="margin-left: 10px;">${data.feedback.strengths.replace(/\n/g, '<br/>')}</p>

        <h4 style="color: #e11d48;">Жақсартуды қажет ететін тұстар:</h4>
        <p style="margin-left: 10px;">${data.feedback.weaknesses.replace(/\n/g, '<br/>')}</p>

        <h4 style="color: #4f7ef8;">💡 Ұсыныстар:</h4>
        <p style="margin-left: 10px;">${data.feedback.suggestions.replace(/\n/g, '<br/>')}</p>
        ` : ''}

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Бұл хат EduAssess AI платформасынан автоматты түрде жіберілді.
        </p>
      </div>
    `;

    const sendRes = await resend.emails.send({
      from: "EduAssess AI <onboarding@resend.dev>", // Default test domain. Replace with your verified domain in production.
      to: [toEmail],
      subject: `Бағалау есебі: ${data.score}/26 балл`,
      html: emailHtml,
    });

    if (sendRes.error) {
      console.error("Resend API error:", sendRes.error);
      return NextResponse.json({ error: sendRes.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: sendRes.data?.id });
  } catch (error) {
    console.error("Email send crash:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
