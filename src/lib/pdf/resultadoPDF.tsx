import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  lime: "#C4FF57",
  dark: "#4A5452",
  bg: "#F5F7F0",
  white: "#FFFFFF",
  gray: "#6B7280",
  lightGray: "#E5E7EB",
  text: "#1F2937",
};

const styles = StyleSheet.create({
  page: { backgroundColor: C.bg, paddingHorizontal: 40, paddingVertical: 36, fontFamily: "Helvetica" },
  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: C.lime },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.dark },
  headerSub: { fontSize: 9, color: C.gray, marginTop: 2 },
  // Section card
  card: { backgroundColor: C.white, borderRadius: 8, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: C.lightGray },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.lightGray },
  stepBadge: { backgroundColor: C.dark, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  stepBadgeText: { color: C.lime, fontSize: 9, fontFamily: "Helvetica-Bold" },
  cardTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.dark },
  // Dominant
  dominantRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  emoji: { fontSize: 22, marginRight: 10 },
  dominantType: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.dark },
  dominantSub: { fontSize: 10, color: C.gray, marginTop: 1 },
  // Bar
  barRow: { marginBottom: 6 },
  barLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  barLabelText: { fontSize: 9, color: C.text },
  barLabelPct: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },
  barBg: { height: 6, backgroundColor: C.lightGray, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },
  // Description box
  descBox: { backgroundColor: C.bg, borderRadius: 6, padding: 12, marginTop: 10 },
  descText: { fontSize: 9, color: C.text, lineHeight: 1.5 },
  // Grid 2col
  grid: { flexDirection: "row", gap: 12, marginTop: 10 },
  col: { flex: 1 },
  colTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.gray, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  colItem: { fontSize: 9, color: C.text, marginBottom: 2 },
  // MBTI type big
  mbtiType: { fontSize: 32, fontFamily: "Helvetica-Bold", color: C.dark, letterSpacing: 4, marginBottom: 4 },
  mbtiName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 2 },
  mbtiTagline: { fontSize: 10, color: C.gray, fontFamily: "Helvetica-Oblique" },
  // Dimension row
  dimRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  dimLabel: { width: 20, fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark },
  dimBarBg: { flex: 1, height: 8, backgroundColor: C.lightGray, borderRadius: 4, marginHorizontal: 6 },
  dimBarFill: { height: 8, borderRadius: 4, backgroundColor: C.dark },
  dimPct: { width: 28, fontSize: 8, color: C.gray, textAlign: "right" },
  // Footer
  footer: { marginTop: "auto", paddingTop: 16, borderTopWidth: 1, borderTopColor: C.lightGray },
  footerText: { fontSize: 7, color: C.gray, textAlign: "center", lineHeight: 1.5 },
  pageNum: { fontSize: 8, color: C.gray, textAlign: "center", marginTop: 4 },
});

// ── Types info (inline to avoid import issues) ───────────────────────────────
const DISC_LABELS: Record<string, { label: string; description: string }> = {
  D: { label: "Dominância", description: "Orientado a resultados, direto e assertivo. Toma decisões rápidas, gosta de desafios e lidera com confiança." },
  I: { label: "Influência", description: "Comunicativo, entusiasta e inspirador. Constrói relações com facilidade e motiva equipes com energia positiva." },
  S: { label: "Estabilidade", description: "Paciente, leal e colaborativo. Cria ambientes harmoniosos e é confiável em funções que exigem continuidade." },
  C: { label: "Conformidade", description: "Analítico, preciso e criterioso. Segue padrões elevados de qualidade e decide com base em dados e evidências." },
};

const ENN_LABELS: Record<number, { label: string; tagline: string }> = {
  1: { label: "Perfeccionista", tagline: "O Reformador Ético" },
  2: { label: "Prestativo", tagline: "O Doador Generoso" },
  3: { label: "Realizador", tagline: "O Alcançador Adaptável" },
  4: { label: "Individualista", tagline: "O Romântico Introspectivo" },
  5: { label: "Investigador", tagline: "O Observador Perspicaz" },
  6: { label: "Leal", tagline: "O Questionador Comprometido" },
  7: { label: "Entusiasta", tagline: "O Epicurista Espontâneo" },
  8: { label: "Desafiador", tagline: "O Protetor Poderoso" },
  9: { label: "Pacificador", tagline: "O Mediador Receptivo" },
};

const MBTI_INFO: Record<string, { name: string; tagline: string; description: string }> = {
  ISTJ: { name: "O Inspetor", tagline: "Responsável e metódico", description: "Confiável, organizado e dedicado. Cumpre compromissos com rigor e valoriza tradição e estabilidade." },
  ISFJ: { name: "O Protetor", tagline: "Dedicado e atencioso", description: "Carinhoso, responsável e comprometido. Cuida das necessidades alheias com atenção e constância." },
  INFJ: { name: "O Advogado", tagline: "Visionário e idealista", description: "Perspicaz, empático e determinado. Busca significado profundo e trabalha por causas que acredita." },
  INTJ: { name: "O Arquiteto", tagline: "Estratégico e independente", description: "Analítico, estratégico e decidido. Tem visão de longo prazo e executa planos com eficiência e rigor." },
  ISTP: { name: "O Virtuoso", tagline: "Prático e curioso", description: "Observador, analítico e habilidoso. Aprende fazendo e resolve problemas com lógica e eficiência prática." },
  ISFP: { name: "O Aventureiro", tagline: "Flexível e criativo", description: "Gentil, aberto e presente. Vive o momento, valoriza estética e age com espontaneidade e bondade." },
  INFP: { name: "O Mediador", tagline: "Idealista e empático", description: "Criativo, idealista e empático. Busca autenticidade e significado em tudo o que faz." },
  INTP: { name: "O Lógico", tagline: "Analítico e inventivo", description: "Curioso, analítico e objetivo. Explora ideias complexas com rigor intelectual e pensamento independente." },
  ESTP: { name: "O Empreendedor", tagline: "Energético e direto", description: "Ativo, observador e pragmático. Age com rapidez, gosta de desafios e aprende pela ação." },
  ESFP: { name: "O Animador", tagline: "Espontâneo e sociável", description: "Entusiasta, amigável e presente. Traz alegria e energia, e prospera em interações e experiências novas." },
  ENFP: { name: "O Ativista", tagline: "Criativo e entusiasta", description: "Imaginativo, sociável e cheio de energia. Inspira os outros com entusiasmo e visão de possibilidades." },
  ENTP: { name: "O Debatedor", tagline: "Inovador e argumentativo", description: "Inteligente, curioso e direto. Gosta de debater ideias, questionar o status quo e explorar soluções criativas." },
  ESTJ: { name: "O Executivo", tagline: "Organizado e decisivo", description: "Leal, organizado e focado em resultados. Lidera com clareza, segue regras e espera o mesmo dos outros." },
  ESFJ: { name: "O Cônsul", tagline: "Cuidadoso e social", description: "Caloroso, leal e atento às necessidades da equipe. Cria harmonia e senso de pertencimento." },
  ENFJ: { name: "O Protagonista", tagline: "Inspirador e empático", description: "Carismático, empático e orientado às pessoas. Lidera com paixão e inspira outros a crescerem." },
  ENTJ: { name: "O Comandante", tagline: "Líder nato e estratégico", description: "Assertivo, estratégico e eficiente. Assume a liderança naturalmente e busca sempre melhorar sistemas e resultados." },
};

// ── Bar component helper ─────────────────────────────────────────────────────
function Bar({ label, pct, color }: { label: string; pct: number; color?: string }) {
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabel}>
        <Text style={styles.barLabelText}>{label}</Text>
        <Text style={styles.barLabelPct}>{pct}%</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color ?? C.dark }]} />
      </View>
    </View>
  );
}

// ── Main PDF Component ───────────────────────────────────────────────────────
interface ResultadoPDFProps {
  candidateName: string;
  companyName: string;
  disc: { dominant: string; percentages: Record<string, number> };
  enneagram: { dominant: number; wing: number; scores: Record<string, number> } | null;
  mbti: { type: string; percentages: Record<string, number> } | null;
  createdAt: Date;
}

export function ResultadoPDF({ candidateName, companyName, disc, enneagram, mbti, createdAt }: ResultadoPDFProps) {
  const discInfo = DISC_LABELS[disc.dominant] ?? { label: disc.dominant, description: "" };
  const ennInfo = enneagram ? ENN_LABELS[enneagram.dominant] : null;
  const mbtiInfo = mbti ? MBTI_INFO[mbti.type] : null;
  const dateStr = createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Contratai</Text>
            <Text style={styles.headerSub}>Avaliação Comportamental Completa · {dateStr}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, color: C.dark, fontFamily: "Helvetica-Bold" }}>{candidateName}</Text>
            <Text style={{ fontSize: 9, color: C.gray }}>{companyName}</Text>
          </View>
        </View>

        {/* DISC */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>ETAPA 1</Text></View>
            <Text style={styles.cardTitle}>Perfil DISC</Text>
          </View>

          <View style={styles.dominantRow}>
            <View>
              <Text style={styles.dominantType}>Perfil {discInfo.label} ({disc.dominant})</Text>
              <Text style={styles.dominantSub}>Perfil comportamental dominante</Text>
            </View>
          </View>

          <View style={{ marginBottom: 8 }}>
            {["D", "I", "S", "C"].map((t) => (
              <Bar key={t} label={`${t} — ${DISC_LABELS[t]?.label ?? t}`} pct={disc.percentages[t] ?? 0} color={t === disc.dominant ? C.lime : C.lightGray} />
            ))}
          </View>

          <View style={styles.descBox}>
            <Text style={styles.descText}>{discInfo.description}</Text>
          </View>
        </View>

        {/* Enneagram */}
        {enneagram && ennInfo && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>ETAPA 2</Text></View>
              <Text style={styles.cardTitle}>Eneagrama</Text>
            </View>

            <View style={styles.dominantRow}>
              <View>
                <Text style={styles.dominantType}>Tipo {enneagram.dominant} — {ennInfo.label}</Text>
                <Text style={styles.dominantSub}>{ennInfo.tagline} · Asa {enneagram.dominant}w{enneagram.wing}</Text>
              </View>
            </View>

            <View>
              {([1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map((t) => {
                const score = enneagram.scores[String(t)] ?? 0;
                const pct = Math.round((score / 20) * 100);
                return (
                  <Bar
                    key={t}
                    label={`Tipo ${t} — ${ENN_LABELS[t]?.label ?? ""}`}
                    pct={pct}
                    color={t === enneagram.dominant ? C.lime : C.lightGray}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* MBTI */}
        {mbti && mbtiInfo && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>ETAPA 3</Text></View>
              <Text style={styles.cardTitle}>16 Personalidades (MBTI)</Text>
            </View>

            <Text style={styles.mbtiType}>{mbti.type}</Text>
            <Text style={styles.mbtiName}>{mbtiInfo.name}</Text>
            <Text style={styles.mbtiTagline}>{mbtiInfo.tagline}</Text>

            <View style={{ marginTop: 12, marginBottom: 4 }}>
              {([
                ["E", "I", mbti.percentages.E],
                ["S", "N", mbti.percentages.S],
                ["T", "F", mbti.percentages.T],
                ["J", "P", mbti.percentages.J],
              ] as [string, string, number][]).map(([a, b, pct]) => (
                <View key={a} style={styles.dimRow}>
                  <Text style={styles.dimLabel}>{pct >= 50 ? a : b}</Text>
                  <View style={styles.dimBarBg}>
                    <View style={[styles.dimBarFill, { width: `${Math.max(pct, 100 - pct)}%` }]} />
                  </View>
                  <Text style={styles.dimPct}>{Math.max(pct, 100 - pct)}%</Text>
                </View>
              ))}
            </View>

            <View style={styles.descBox}>
              <Text style={styles.descText}>{mbtiInfo.description}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Os testes disponibilizados nesta plataforma são ferramentas de autoconhecimento e suporte a processos de RH,{"\n"}
            não constituindo avaliações psicológicas clínicas oficiais. Não substituem avaliações realizadas por{"\n"}
            psicólogos habilitados conforme normas do CFP/SATEPSI.
          </Text>
          <Text style={styles.pageNum}>Contratai · Resultado gerado em {dateStr}</Text>
        </View>
      </Page>
    </Document>
  );
}
