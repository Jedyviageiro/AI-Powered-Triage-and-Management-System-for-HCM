import React from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Facebook,
  HeartPulse,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { motion } from "framer-motion";

const teamHeroImage = "/assets/foto-da-equipa-pediatrica-do-hcm.png";
const consultationImage = "/assets/foto-de-medico-enfermeiro-pediatrico.png";
const doctorFatimaImage = "/assets/dra-fatima-machava.png";
const doctorSergioImage = "/assets/dr-sergio-bila.png";

const up = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
});

const modules = [
  {
    title: "Registo de Pacientes",
    desc: "Criacao e gestao do processo clinico com foco em rapidez e consistencia.",
  },
  {
    title: "Sinais Vitais",
    desc: "Visualizacao clara da evolucao clinica ao longo de cada consulta.",
  },
  {
    title: "Seguimento Clinico",
    desc: "Historico comparativo para consultas de retorno e reavaliacoes.",
  },
  {
    title: "Apoio Inteligente",
    desc: "Sugestoes contextuais para apoiar a equipa durante o atendimento.",
  },
];

const team = [
  {
    name: "Dra. Fatima Machava",
    dept: "Pediatra",
    bio: "Especialista em pediatria geral com foco em doencas infecciosas e seguimento neonatal.",
    image: doctorFatimaImage,
  },
  {
    name: "Dr. Sergio Bila",
    dept: "Director Clinico",
    bio: "Director do departamento pediatrico com longa experiencia clinica e academica.",
    image: doctorSergioImage,
  },
  {
    name: "Equipa de Enfermagem",
    dept: "Cuidados Continuos",
    bio: "Profissionais focados em triagem, observacao e monitorizacao do cuidado pediatrico.",
    image: consultationImage,
  },
];

function PhotoCard({ src, alt, height, radius = 24 }) {
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: radius,
        overflow: "hidden",
        background: "#e5efe7",
        boxShadow: "0 24px 60px rgba(12, 58, 36, 0.12)",
      }}
    >
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#f2f8f3", color: "#0f172a" }}>
      <header
        style={{
          position: "fixed",
          inset: "0 0 auto",
          zIndex: 50,
          background: "rgba(242, 248, 243, 0.94)",
          borderBottom: "1px solid #dbe9df",
          backdropFilter: "blur(14px)",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            padding: "0 24px",
            height: 68,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: "#0c3a24",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HeartPulse size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94a3b8" }}>
                HCM
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Gestao Pediatrica</div>
            </div>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[
              ["Modulos", "#modulos"],
              ["Como funciona", "#como"],
              ["Equipa", "#equipa"],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: 13, fontWeight: 600, color: "#475569", textDecoration: "none" }}>
                {label}
              </a>
            ))}
          </nav>

          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#0c3a24",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Entrar
          </Link>
        </div>
      </header>

      <main style={{ paddingTop: 68 }}>
        <section
          style={{
            padding: "72px 24px 40px",
            background: "linear-gradient(180deg, #f2f8f3 0%, #f8fcf9 42%, #eef6f0 100%)",
          }}
        >
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1.05fr 0.95fr",
              gap: 42,
              alignItems: "end",
            }}
          >
            <div style={{ paddingBottom: 60 }}>
              <motion.p {...up(0)} style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "#1f6a48", marginBottom: 16 }}>
                Plataforma interna do HCM
              </motion.p>
              <motion.h1 {...up(0.05)} style={{ fontSize: "clamp(2.8rem, 5vw, 4.4rem)", lineHeight: 0.95, letterSpacing: "-0.05em", fontWeight: 800, margin: 0 }}>
                Cuida melhor.
                <br />
                Regista mais rapido.
              </motion.h1>
              <motion.p {...up(0.1)} style={{ maxWidth: 470, marginTop: 22, fontSize: 16, lineHeight: 1.8, color: "#64748b" }}>
                Uma plataforma pensada para a equipa pediatrica do Hospital Central de Maputo trabalhar com menos atrito, mais contexto clinico e melhor continuidade de cuidado.
              </motion.p>
              <motion.div {...up(0.15)} style={{ display: "flex", gap: 14, marginTop: 30, flexWrap: "wrap" }}>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#0c3a24",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "13px 24px",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Aceder ao sistema
                </Link>
                <a href="#modulos" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#334155", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                  Ver modulos <ArrowUpRight size={15} />
                </a>
              </motion.div>
              <motion.div {...up(0.2)} style={{ marginTop: 38, display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: "2.8rem", fontWeight: 800, letterSpacing: "-0.05em" }}>12+</span>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>anos de cuidado pediatrico no HCM</span>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} style={{ position: "relative" }}>
              <PhotoCard src={teamHeroImage} alt="Equipa pediatrica do HCM" height={500} radius={28} />
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  background: "rgba(248, 252, 249, 0.96)",
                  border: "1px solid #e1ece4",
                  borderRadius: 18,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 16px 32px rgba(15, 23, 42, 0.08)",
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: "#0c3a24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Activity size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>34 consultas hoje</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>mais fluxo, menos papel</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="modulos" style={{ padding: "72px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
              {modules.map((module, index) => (
                <motion.div
                  key={module.title}
                  {...up(index * 0.06)}
                  style={{
                    background: "#f9fcfa",
                    border: "1px solid #e2e8f0",
                    borderRadius: 24,
                    padding: "30px 28px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 18,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{module.title}</h3>
                    <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.8, color: "#64748b" }}>{module.desc}</p>
                  </div>
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: index === 0 ? "#fff" : "#94a3b8",
                      background: index === 0 ? "#0c3a24" : "#fff",
                    }}
                  >
                    <ArrowUpRight size={18} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="como" style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "420px 1fr", gap: 70, alignItems: "center" }}>
            <motion.div {...up(0)}>
              <PhotoCard src={consultationImage} alt="Medico e enfermeiro pediatricos" height={460} />
            </motion.div>
            <motion.div {...up(0.08)}>
              <h2 style={{ fontSize: "clamp(2rem, 3.5vw, 2.9rem)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.04em", margin: 0 }}>
                Uma ferramenta pensada para o HCM
              </h2>
              <div style={{ marginTop: 22, display: "grid", gap: 14, fontSize: 15, lineHeight: 1.8, color: "#64748b" }}>
                <p>O sistema foi desenhado a partir dos desafios reais da enfermaria pediatrica do Hospital Central de Maputo.</p>
                <p>Cada ecran, alerta e formulario foi pensado para reduzir atrito e melhorar a qualidade do registo clinico.</p>
                <p>Da admissao ao seguimento, a informacao do paciente fica acessivel, organizada e pronta para apoiar a decisao.</p>
              </div>
              <div style={{ marginTop: 28 }}>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#0c3a24",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Aceder ao sistema
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="equipa" style={{ padding: "40px 24px 90px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <motion.h2 {...up(0)} style={{ textAlign: "center", fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 44 }}>
              A Equipa Clinica
            </motion.h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 24 }}>
              {team.map((person, index) => (
                <motion.div key={person.name} {...up(index * 0.08)}>
                  <PhotoCard src={person.image} alt={person.name} height={300} radius={22} />
                  <div style={{ marginTop: 16, paddingInline: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#1f6a48" }}>
                      {person.dept}
                    </div>
                    <h3 style={{ marginTop: 4, fontSize: 20, fontWeight: 800 }}>{person.name}</h3>
                    <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: "#64748b" }}>{person.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "0 24px 100px", textAlign: "center" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <motion.h2 {...up(0)} style={{ fontSize: "clamp(2.3rem, 5vw, 4rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.05em", margin: 0 }}>
              Acede a plataforma com a tua equipa
            </motion.h2>
            <motion.div {...up(0.1)} style={{ marginTop: 28 }}>
              <Link
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#0c3a24",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "14px 32px",
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Entrar no sistema
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #dbe9df", background: "#edf6ef", padding: "42px 24px 28px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 36 }}>
          <div>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#0c3a24", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <HeartPulse size={14} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#94a3b8" }}>HCM</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Gestao Pediatrica</div>
              </div>
            </Link>
            <p style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>HCM. Todos os direitos reservados.</p>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              {[
                [Facebook, "Facebook"],
                [Twitter, "Twitter"],
                [Instagram, "Instagram"],
                [Linkedin, "LinkedIn"],
              ].map(([Icon, label]) => (
                <a key={label} href="#" aria-label={label} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.createElement(Icon, { size: 12, color: "#94a3b8" })}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 14 }}>Modulos</div>
            <div style={{ display: "grid", gap: 9, fontSize: 13, color: "#64748b" }}>
              <span>Registo de pacientes</span>
              <span>Sinais vitais</span>
              <span>Seguimento clinico</span>
              <span>Apoio IA</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 14 }}>Hospital</div>
            <div style={{ display: "grid", gap: 9, fontSize: 13, color: "#64748b" }}>
              <span>Sobre o HCM</span>
              <span>Servicos pediatricos</span>
              <span>Equipa clinica</span>
              <span>Urgencias</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
