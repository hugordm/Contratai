export interface EnneagramQuestion {
  id: number;
  text: string;
  tipo: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export const enneagramQuestions: EnneagramQuestion[] = [
  // Tipo 1 — Perfeccionista
  { id: 1, text: "Tenho altos padrões e fico incomodado quando as coisas não são feitas corretamente.", tipo: 1 },
  { id: 2, text: "Costumo me criticar quando cometo erros, mesmo que sejam pequenos.", tipo: 1 },
  { id: 3, text: "Sinto uma necessidade interna de corrigir o que está errado ao meu redor.", tipo: 1 },
  { id: 4, text: "Acredito que há sempre uma maneira certa de fazer as coisas.", tipo: 1 },

  // Tipo 2 — Prestativo
  { id: 5, text: "Fico genuinamente satisfeito em ajudar os outros, mesmo que isso me custe tempo.", tipo: 2 },
  { id: 6, text: "Percebo as necessidades das pessoas ao meu redor antes que elas as expressem.", tipo: 2 },
  { id: 7, text: "Tenho dificuldade em dizer não quando alguém precisa de ajuda.", tipo: 2 },
  { id: 8, text: "Sinto que meu valor está ligado a quanto sou útil para as pessoas.", tipo: 2 },

  // Tipo 3 — Realizador
  { id: 9, text: "Sou altamente motivado por conquistas e pelo reconhecimento dos meus resultados.", tipo: 3 },
  { id: 10, text: "Adapto minha postura de acordo com o ambiente para causar boa impressão.", tipo: 3 },
  { id: 11, text: "Trabalho de forma intensa para alcançar metas e superar expectativas.", tipo: 3 },
  { id: 12, text: "Me preocupo com a imagem que projeto aos outros no ambiente profissional.", tipo: 3 },

  // Tipo 4 — Individualista
  { id: 13, text: "Sinto que tenho uma perspectiva única que me diferencia da maioria das pessoas.", tipo: 4 },
  { id: 14, text: "Busco profundidade emocional e autenticidade em tudo que faço.", tipo: 4 },
  { id: 15, text: "Às vezes me perco em sentimentos de melancolia ou saudade de algo que não tenho.", tipo: 4 },
  { id: 16, text: "A autoexpressão e a criatividade são fundamentais para mim.", tipo: 4 },

  // Tipo 5 — Investigador
  { id: 17, text: "Prefiro observar e analisar situações antes de agir ou me envolver.", tipo: 5 },
  { id: 18, text: "Preciso de tempo e espaço pessoal para recarregar minhas energias.", tipo: 5 },
  { id: 19, text: "Busco acumular conhecimento e me tornar especialista antes de me sentir competente.", tipo: 5 },
  { id: 20, text: "Interações sociais longas me deixam esgotado e preciso de solidão para me recuperar.", tipo: 5 },

  // Tipo 6 — Leal
  { id: 21, text: "Costumo antecipar problemas e planejar como lidar com possíveis dificuldades.", tipo: 6 },
  { id: 22, text: "Valorizo muito a lealdade e a confiança nas minhas relações.", tipo: 6 },
  { id: 23, text: "Questiono autoridades ou sistemas antes de confiar plenamente neles.", tipo: 6 },
  { id: 24, text: "Minha mente frequentemente imagina cenários de risco que podem acontecer.", tipo: 6 },

  // Tipo 7 — Entusiasta
  { id: 25, text: "Adoro explorar novas ideias, projetos e experiências variadas.", tipo: 7 },
  { id: 26, text: "Tenho dificuldade em manter o foco quando algo começa a perder meu interesse.", tipo: 7 },
  { id: 27, text: "Evito situações de dor ou desconforto buscando alternativas mais positivas.", tipo: 7 },
  { id: 28, text: "Minha mente está sempre gerando novas possibilidades e opções para explorar.", tipo: 7 },

  // Tipo 8 — Desafiador
  { id: 29, text: "Prefiro ser direto e frontal, mesmo que possa parecer confrontador.", tipo: 8 },
  { id: 30, text: "Fico indignado com injustiças e sinto vontade de agir imediatamente.", tipo: 8 },
  { id: 31, text: "Não tenho medo de conflitos e os enfrento de frente quando necessário.", tipo: 8 },
  { id: 32, text: "Valorizo muito minha autonomia e resistir a ser controlado ou manipulado.", tipo: 8 },

  // Tipo 9 — Pacificador
  { id: 33, text: "Evito conflitos ativamente e busco manter a harmonia no meu ambiente.", tipo: 9 },
  { id: 34, text: "Consigo ver facilmente o ponto de vista de todos os lados em uma discussão.", tipo: 9 },
  { id: 35, text: "Às vezes me adapto tanto aos outros que perco contato com meus próprios desejos.", tipo: 9 },
  { id: 36, text: "Prefiro ceder em pequenas coisas a gerar conflitos desnecessários.", tipo: 9 },
];
