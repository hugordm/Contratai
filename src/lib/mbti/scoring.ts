import { mbtiQuestions } from "./questions";

export type MBTIType =
  | "ISTJ" | "ISFJ" | "INFJ" | "INTJ"
  | "ISTP" | "ISFP" | "INFP" | "INTP"
  | "ESTP" | "ESFP" | "ENFP" | "ENTP"
  | "ESTJ" | "ESFJ" | "ENFJ" | "ENTJ";

export interface MBTIResult {
  type: MBTIType;
  scores: {
    EI: number; // higher = more E (range 15–75)
    SN: number; // higher = more S
    TF: number; // higher = more T
    JP: number; // higher = more J
  };
  percentages: {
    E: number; I: number;
    S: number; N: number;
    T: number; F: number;
    J: number; P: number;
  };
  answers: Record<number, number>;
}

const MIDPOINT = 45; // 15 questions × 3 (neutral)

export function calculateMBTI(answers: Record<number, number>): MBTIResult {
  const sums = { EI: 0, SN: 0, TF: 0, JP: 0 };

  mbtiQuestions.forEach((q) => {
    const raw = answers[q.id] ?? 3;
    const normalized = q.direcao === "positivo" ? raw : 6 - raw;
    sums[q.dimensao] += normalized;
  });

  // Letter resolution: above midpoint = first letter (E/S/T/J)
  const E = sums.EI > MIDPOINT ? "E" : "I";
  const S = sums.SN > MIDPOINT ? "S" : "N";
  const T = sums.TF > MIDPOINT ? "T" : "F";
  const J = sums.JP > MIDPOINT ? "J" : "P";

  // Percentages: how strongly each side scores (0–100)
  const ePct = Math.round(((sums.EI - 15) / 60) * 100);
  const sPct = Math.round(((sums.SN - 15) / 60) * 100);
  const tPct = Math.round(((sums.TF - 15) / 60) * 100);
  const jPct = Math.round(((sums.JP - 15) / 60) * 100);

  return {
    type: `${E}${S}${T}${J}` as MBTIType,
    scores: sums,
    percentages: {
      E: ePct, I: 100 - ePct,
      S: sPct, N: 100 - sPct,
      T: tPct, F: 100 - tPct,
      J: jPct, P: 100 - jPct,
    },
    answers,
  };
}
