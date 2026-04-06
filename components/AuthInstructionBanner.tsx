import React from "react";
import { Info, CheckCircle2, Mail, Users, Calendar, ArrowRight, ClipboardCheck, Sparkles } from "lucide-react";

export default function AuthInstructionBanner() {
  const steps = [
    {
      icon: <CheckCircle2 size={18} style={{ color: "var(--accent)" }} />,
      text: "Тіркеліңіз."
    },
    {
      icon: <Mail size={18} style={{ color: "var(--accent)" }} />,
      text: "Сіздің поштаңызға сілтеме келеді, осы сілтемені бассаңыз, платформаға кіресіз."
    },
    {
      icon: <Users size={18} style={{ color: "var(--accent)" }} />,
      text: "«Мұғалімді бағалау» бөліміндегі мұғалімді таңдаңыз. (Ескерту: бұл жоба, сіз сабаққа қатысқан мұғалімнің аты-жөні жоқ, ойдан шығарылған есімдер бар)"
    },
    {
      icon: <Calendar size={18} style={{ color: "var(--accent)" }} />,
      text: "Сабақтың күнін, уақытын, нөмірін белгілеңіз. (Ескерту: бұл жоба, сондықтан шамамен жазыңыз)"
    },
    {
      icon: <ArrowRight size={18} style={{ color: "var(--accent)" }} />,
      text: "«Келесі» батырмасы арқылы мұғалімді бағалаудың 1-бөліміне өтіңіз. Бағалау критерийлері арқылы мұғалімнің әрекетін бағалаңыз."
    },
    {
      icon: <ClipboardCheck size={18} style={{ color: "var(--accent)" }} />,
      text: "Келесі батырмасын басып, 2-бөлім бойынша оқушылардың жобалық-зерттеушілік дағдыларын бағалаңыз."
    },
    {
      icon: <Sparkles size={18} style={{ color: "var(--accent)" }} />,
      text: "Келесі батырмасын басып, «Ұсыныстар» бөліміне өтіңіз. Оқушылардың жобалық-зерттеушілік дағдыларын дамытуға байланысты бөлімдер бойынша мұғалімге қолдау білдіріп, тиісті ұсыныстарды таңдаңыз."
    }
  ];

  return (
    <div className="glass-card animate-fade-in" style={{ 
      padding: "24px 28px", 
      maxWidth: 480, 
      height: 'fit-content',
      borderLeft: "4px solid var(--accent)"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          background: 'var(--accent-glow)', 
          borderRadius: 12, 
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Info size={22} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          Smart teacher веб-платформасын қолдану нұсқаулығы
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ 
              marginTop: 2, 
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#f0f4ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {step.icon}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', marginRight: 4 }}>{idx + 1}.</span>
              {step.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
