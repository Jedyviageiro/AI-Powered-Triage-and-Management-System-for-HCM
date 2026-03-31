import React from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse, ArrowUpRight, ArrowRight, ArrowLeft,
  Activity, Brain, ClipboardList, Stethoscope,
  Star, MapPin, Phone, Mail, Clock,
  Facebook, Twitter, Instagram, Linkedin,
} from "lucide-react";
import { motion } from "framer-motion";

const _MOTION = motion;

/* ── Font ── */
const Font = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Bricolage Grotesque', sans-serif; }
  `}</style>
);

/* ── Motion shorthand ── */
const up = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
});

/* ── Photo placeholder ── */
function Photo({ caption, className = "", style = {} }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#f1f5f2] ${className}`}
      style={style}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#a8bfb0" strokeWidth="1.2" style={{ width: 40, height: 40 }}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#94a3b8", maxWidth: 160, lineHeight: 1.5 }}>
          {caption}
        </span>
      </div>
    </div>
  );
}

/* ── Data ── */
const modules = [
  {
    title: "Registo de Pacientes",
    desc:  "Criação e gestão do processo clínico com dados essenciais do atendimento pediátrico, centralizado e rápido.",
  },
  {
    title: "Sinais Vitais",
    desc:  "Visualização clara de peso, altura, pulso e temperatura com evolução histórica ao longo das consultas.",
  },
  {
    title: "Seguimento Clínico",
    desc:  "Acompanhamento longitudinal com histórico comparativo para decisões melhor documentadas e mais seguras.",
  },
  {
    title: "Apoio Inteligente (IA)",
    desc:  "Alertas contextuais e sugestões clínicas automáticas para apoiar a tomada de decisão em tempo real.",
  },
];

const team = [
  {
    name: "Dra. Fátima Machava",
    dept: "PEDIATRA",
    bio:  "Especialista em pediatria geral com foco em doenças infecciosas e seguimento neonatal.",
    initials: "FM",
  },
  {
    name: "Dr. Sérgio Bila",
    dept: "DIRECTOR CLÍNICO",
    bio:  "Director do departamento pediátrico com mais de 15 anos de experiência clínica e académica.",
    initials: "SB",
  },
  {
    name: "Enf. Carlos Nhantumbo",
    dept: "ENFERMEIRO-CHEFE",
    bio:  "Responsável pela UCI pediátrica, especializado em cuidados intensivos e monitorização contínua.",
    initials: "CN",
  },
];

/* ─────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", background: "#f2f8f3", color: "#0f172a" }}>
      <Font />

      {/* ═══════════ HEADER ═══════════ */}
      <header style={{
        position: "fixed", inset: "0 0 auto", zIndex: 50,
        background: "rgba(242, 248, 243, 0.94)", borderBottom: "1px solid #dbe9df",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#0c3a24", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HeartPulse size={15} color="#fff" />
            </div>
            <div>
              <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94a3b8" }}>HCM</span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>Gestão Pediátrica</span>
            </div>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["Serviços","#servicos"],["Módulos","#modulos"],["Como funciona","#como"],["A equipa","#equipa"]].map(([l,h]) => (
              <a key={l} href={h} style={{ fontSize: 13, fontWeight: 500, color: "#475569", textDecoration: "none" }}>{l}</a>
            ))}
          </nav>

          <Link to="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#0c3a24", color: "#fff", borderRadius: 9999,
            padding: "10px 20px", fontSize: 13, fontWeight: 600,
            textDecoration: "none",
          }}>
            Aceder ao sistema
          </Link>
        </div>
      </header>

      <main style={{ paddingTop: 64, background: "linear-gradient(180deg, #f2f8f3 0%, #f8fcf9 42%, #eef6f0 100%)" }}>

        {/* ═══════════ HERO ═══════════ */}
        <section style={{ padding: "64px 24px 0" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "flex-end" }}>

            {/* Left */}
            <div style={{ paddingBottom: 80 }}>
              <motion.p {...up(0)} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: "#1f6a48", marginBottom: 16 }}>
                Plataforma interna do HCM
              </motion.p>

              <motion.h1 {...up(0.05)} style={{ fontSize: "clamp(2.8rem, 5vw, 4.2rem)", fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.045em", color: "#0f172a" }}>
                Cuida melhor.<br />Regista mais<br />
                <span style={{ color: "#0c3a24" }}>rápido.</span>
              </motion.h1>

              <motion.p {...up(0.1)} style={{ fontFamily: "'Inter', sans-serif", marginTop: 20, maxWidth: 400, fontSize: 15, lineHeight: 1.75, color: "#64748b" }}>
                A plataforma de gestão pediátrica do Hospital Central de Maputo —
                concebida para a equipa clínica trabalhar com mais foco, menos papel e melhores dados.
              </motion.p>

              <motion.div {...up(0.15)} style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <Link to="/login" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#0c3a24", color: "#fff", borderRadius: 9999,
                  padding: "12px 24px", fontSize: 14, fontWeight: 700,
                  textDecoration: "none",
                }}>
                  Aceder ao sistema
                </Link>
                <a href="#modulos" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#334155", textDecoration: "none" }}>
                  Como funciona <ArrowUpRight size={15} />
                </a>
              </motion.div>

              <motion.div {...up(0.2)} style={{ marginTop: 40, display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: "2.6rem", fontWeight: 800, letterSpacing: "-0.05em", color: "#0f172a" }}>12</span>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "#0c3a24" }}>+</span>
                <span style={{ fontFamily: "'Inter', sans-serif", marginLeft: 10, fontSize: 13, color: "#94a3b8" }}>Anos de cuidado pediátrico no HCM</span>
              </motion.div>
            </div>

            {/* Right — hero photo */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, ease:[0.22,1,0.36,1], delay:0.1 }} style={{ position: "relative", alignSelf: "flex-end" }}>
              <Photo
                caption="Foto da equipa pediátrica do HCM — substituir com imagem real"
                style={{ width: "100%", height: 480, borderRadius: "24px 24px 0 0" }}
              />
              {/* floating badge */}
              <div style={{
                position: "absolute", bottom: 20, left: 20,
                background: "#f8fcf9", border: "1px solid #e1ece4", borderRadius: 16, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0c3a24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={15} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>34 consultas hoje</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "#94a3b8", marginTop: 2 }}>↑ 8 % vs semana passada</p>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ═══════════ MODULES 2×2 ═══════════ */}
        <section id="modulos" style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden" }}>
              {modules.map((m, i) => (
                <motion.div
                  key={m.title}
                  {...up(i * 0.07)}
                  style={{
                    padding: "40px 36px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24,
                    background: "#f9fcfa",
                    borderBottom: i < 2 ? "1px solid #e2e8f0" : "none",
                    borderRight: i % 2 === 0 ? "1px solid #e2e8f0" : "none",
                    cursor: "default",
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{m.title}</h3>
                    <p style={{ fontFamily: "'Inter',sans-serif", marginTop: 12, fontSize: 13, lineHeight: 1.75, color: "#94a3b8", maxWidth: 280 }}>{m.desc}</p>
                  </div>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i === 0 ? "#0c3a24" : "transparent",
                    border: i === 0 ? "none" : "1.5px solid #cbd5e1",
                    color: i === 0 ? "#fff" : "#94a3b8",
                  }}>
                    <ArrowUpRight size={18} />
                  </div>
                </motion.div>
              ))}
            </div>
            {/* dots */}
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 24, height: 8, borderRadius: 99, background: "#0c3a24", display: "block" }} />
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#e2e8f0", display: "block" }} />
            </div>
          </div>
        </section>

        {/* ═══════════ PHOTO + TEXT (Consultation) ═══════════ */}
        <section id="como" style={{ padding: "20px 24px 80px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "420px 1fr", gap: 80, alignItems: "center" }}>

            <motion.div {...up(0)}>
              <Photo
                caption="Foto de médico/enfermeiro pediátrico — substituir com imagem real"
                style={{ width: "100%", height: 460, borderRadius: 24 }}
              />
            </motion.div>

            <motion.div {...up(0.1)}>
              <h2 style={{ fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 800, lineHeight: 1.07, letterSpacing: "-0.04em", color: "#0f172a" }}>
                Uma ferramenta pensada para o HCM
              </h2>
              <div style={{ fontFamily: "'Inter',sans-serif", marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#64748b" }}>
                  O sistema foi construído com base nos desafios reais da enfermaria pediátrica
                  do Hospital Central de Maputo.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#64748b" }}>
                  Cada ecrã, campo e alerta foi pensado para reduzir o atrito no trabalho diário
                  e melhorar a qualidade do registo clínico.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#64748b" }}>
                  Da admissão ao seguimento, toda a informação do paciente está acessível,
                  organizada e protegida — na mesma plataforma.
                </p>
              </div>
              <div style={{ marginTop: 32 }}>
                <Link to="/login" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#0c3a24", color: "#fff", borderRadius: 9999,
                  padding: "12px 24px", fontSize: 14, fontWeight: 700,
                  textDecoration: "none",
                }}>
                  Aceder ao sistema
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ═══════════ TESTIMONIAL ═══════════ */}
        <section style={{ padding: "60px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            <motion.div {...up(0)}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: "#1f6a48", marginBottom: 16 }}>Experiências</p>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", color: "#0f172a" }}>
                O que a equipa diz sobre o sistema
              </h2>
              <p style={{ fontFamily: "'Inter',sans-serif", marginTop: 16, fontSize: 14, lineHeight: 1.75, color: "#94a3b8" }}>
                A nossa equipa está comprometida com um cuidado personalizado e dados clínicos de qualidade.
              </p>
            </motion.div>

            <motion.div {...up(0.1)} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <button style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #dbe7df", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", background: "#f8fcf9", marginTop: 4 }}>
                <ArrowLeft size={13} color="#94a3b8" />
              </button>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, letterSpacing: "-0.02em", color: "#0f172a" }}>
                  "O sistema transformou o nosso fluxo de trabalho. O registo que antes demorava 15 minutos agora leva menos de 5. A equipa adaptou-se em dias."
                </p>
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0c3a24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                    FM
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Dra. Fátima Machava</p>
                    <div style={{ marginTop: 3, display: "flex", gap: 2 }}>
                      {[...Array(5)].map((_,i)=>(
                        <Star key={i} size={11} fill="#fbbf24" color="#fbbf24" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button style={{ width: 36, height: 36, borderRadius: "50%", background: "#0c3a24", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", border: "none", marginTop: 4 }}>
                <ArrowRight size={13} color="#fff" />
              </button>
            </motion.div>

          </div>
        </section>

        {/* ═══════════ TEAM ═══════════ */}
        <section id="equipa" style={{ padding: "60px 24px 80px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <motion.h2 {...up(0)} style={{ textAlign: "center", fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#0f172a", marginBottom: 48 }}>
              A Equipa Clínica
            </motion.h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
              {team.map((p, i) => (
                <motion.div key={p.name} {...up(i * 0.08)}>
                  <Photo
                    caption={`Foto — ${p.name}`}
                    style={{ width: "100%", height: 280, borderRadius: 20 }}
                  />
                  <div style={{ marginTop: 16, paddingInline: 4 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#1f6a48" }}>{p.dept}</p>
                    <h3 style={{ marginTop: 4, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{p.name}</h3>
                    <p style={{ fontFamily: "'Inter',sans-serif", marginTop: 8, fontSize: 13, lineHeight: 1.65, color: "#94a3b8" }}>{p.bio}</p>
                    <Link to="/login" style={{
                      marginTop: 14, display: "inline-flex", alignItems: "center",
                      border: "1.5px solid #e2e8f0", borderRadius: 9999,
                      padding: "8px 16px", fontSize: 12, fontWeight: 600,
                      color: "#334155", textDecoration: "none",
                    }}>
                      Ver perfil
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ CTA BOTTOM ═══════════ */}
        <section style={{ padding: "80px 24px 100px", textAlign: "center" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <motion.h2 {...up(0)} style={{ fontSize: "clamp(2.4rem,5vw,4rem)", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1.0, color: "#0f172a", maxWidth: 640, margin: "0 auto" }}>
              Acede à plataforma com a tua equipa
            </motion.h2>
            <motion.div {...up(0.1)} style={{ marginTop: 32 }}>
              <Link to="/login" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#0c3a24", color: "#fff", borderRadius: 9999,
                padding: "14px 32px", fontSize: 15, fontWeight: 700,
                textDecoration: "none",
              }}>
                Entrar no sistema
              </Link>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: "1px solid #dbe9df", background: "#edf6ef", padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 48 }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "#0c3a24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HeartPulse size={13} color="#fff" />
              </div>
              <div>
                <span style={{ display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94a3b8" }}>HCM</span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>Gestão Pediátrica</span>
              </div>
            </Link>
            <p style={{ fontFamily: "'Inter',sans-serif", marginTop: 10, fontSize: 12, color: "#94a3b8" }}>© HCM. Todos os direitos reservados.</p>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              {[[Facebook,"Facebook"],[Twitter,"Twitter"],[Instagram,"Instagram"],[Linkedin,"LinkedIn"]].map(([Icon,label])=>(
                <a key={label} href="#" aria-label={label} style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.createElement(Icon, { size: 12, color: "#94a3b8" })}
                </a>
              ))}
            </div>
          </div>

          {[
            ["Módulos", ["Registo de pacientes","Sinais vitais","Seguimento clínico","Apoio IA","Relatórios"]],
            ["Hospital", ["Sobre o HCM","Serviços pediátricos","Equipa clínica","Internamento","Urgências"]],
            ["Suporte",  ["Centro de ajuda","Documentação","Privacidade","Termos de uso","Actualizações"]],
          ].map(([title, links]) => (
            <div key={title}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: "#0f172a", marginBottom: 16 }}>{title}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(l=>(
                  <li key={l}><a href="#" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#64748b", textDecoration: "none" }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </footer>
    </div>
  );
}
