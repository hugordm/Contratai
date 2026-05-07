export type MBTIDimensao = "EI" | "SN" | "TF" | "JP";
export type MBTIDirecao = "positivo" | "negativo";

export interface MBTIQuestion {
  id: number;
  text: string;
  dimensao: MBTIDimensao;
  direcao: MBTIDirecao; // positivo = E/S/T/J, negativo = I/N/F/P
}

export const mbtiQuestions: MBTIQuestion[] = [
  // ── E/I (1–15) ──────────────────────────────────────────────
  { id: 1,  text: "Me sinto energizado depois de estar com muitas pessoas ao meu redor.", dimensao: "EI", direcao: "positivo" },
  { id: 2,  text: "Gosto de ser o centro das atenções em eventos e reuniões sociais.", dimensao: "EI", direcao: "positivo" },
  { id: 3,  text: "Prefiro resolver problemas discutindo com outras pessoas do que sozinho.", dimensao: "EI", direcao: "positivo" },
  { id: 4,  text: "Inicio conversas com facilidade, mesmo com quem não conheço.", dimensao: "EI", direcao: "positivo" },
  { id: 5,  text: "Tendo a pensar em voz alta e processar minhas ideias falando com outros.", dimensao: "EI", direcao: "positivo" },
  { id: 6,  text: "Trabalho melhor em ambientes movimentados e com pessoas ao redor.", dimensao: "EI", direcao: "positivo" },
  { id: 7,  text: "Tenho um círculo amplo de amigos e conhecidos.", dimensao: "EI", direcao: "positivo" },
  { id: 8,  text: "Me sinto animado antes de eventos sociais, festas e networking.", dimensao: "EI", direcao: "positivo" },
  { id: 9,  text: "Preciso de tempo sozinho para recuperar minha energia após eventos sociais.", dimensao: "EI", direcao: "negativo" },
  { id: 10, text: "Prefiro comunicações escritas a longas conversas presenciais.", dimensao: "EI", direcao: "negativo" },
  { id: 11, text: "Sinto-me esgotado quando preciso socializar por muito tempo seguido.", dimensao: "EI", direcao: "negativo" },
  { id: 12, text: "Prefiro trabalhar em silêncio, sem interrupções frequentes.", dimensao: "EI", direcao: "negativo" },
  { id: 13, text: "Costumo observar atentamente antes de participar ativamente em grupos novos.", dimensao: "EI", direcao: "negativo" },
  { id: 14, text: "Tenho poucos amigos próximos, mas com relacionamentos muito profundos.", dimensao: "EI", direcao: "negativo" },
  { id: 15, text: "Prefiro refletir internamente antes de compartilhar minhas ideias com outros.", dimensao: "EI", direcao: "negativo" },

  // ── S/N (16–30) ──────────────────────────────────────────────
  { id: 16, text: "Presto muita atenção aos detalhes e fatos concretos.", dimensao: "SN", direcao: "positivo" },
  { id: 17, text: "Confio mais na experiência prática do que em teorias abstratas.", dimensao: "SN", direcao: "positivo" },
  { id: 18, text: "Prefiro lidar com problemas reais e tangíveis do que com especulações.", dimensao: "SN", direcao: "positivo" },
  { id: 19, text: "Gosto de seguir procedimentos e métodos estabelecidos que já funcionam.", dimensao: "SN", direcao: "positivo" },
  { id: 20, text: "Tenho boa memória para detalhes específicos e dados precisos.", dimensao: "SN", direcao: "positivo" },
  { id: 21, text: "Prefiro aprender fazendo, com exemplos práticos e concretos.", dimensao: "SN", direcao: "positivo" },
  { id: 22, text: "Me sinto mais confortável com rotinas e padrões previsíveis.", dimensao: "SN", direcao: "positivo" },
  { id: 23, text: "Valorizo evidências concretas antes de tomar qualquer decisão importante.", dimensao: "SN", direcao: "positivo" },
  { id: 24, text: "Com frequência fico pensando em cenários futuros e possibilidades.", dimensao: "SN", direcao: "negativo" },
  { id: 25, text: "Me interessa mais o significado por trás dos fatos do que os fatos em si.", dimensao: "SN", direcao: "negativo" },
  { id: 26, text: "Tenho facilidade em enxergar padrões e conexões não óbvias.", dimensao: "SN", direcao: "negativo" },
  { id: 27, text: "Me sinto energizado ao trabalhar com conceitos abstratos e inovadores.", dimensao: "SN", direcao: "negativo" },
  { id: 28, text: "Frequentemente tenho insights e ideias que surgem de forma intuitiva.", dimensao: "SN", direcao: "negativo" },
  { id: 29, text: "Prefiro o trabalho criativo e exploratório ao trabalho rotineiro.", dimensao: "SN", direcao: "negativo" },
  { id: 30, text: "Fico entediado facilmente com tarefas repetitivas e sem novidades.", dimensao: "SN", direcao: "negativo" },

  // ── T/F (31–45) ──────────────────────────────────────────────
  { id: 31, text: "Tomo decisões baseadas principalmente em lógica e análise objetiva.", dimensao: "TF", direcao: "positivo" },
  { id: 32, text: "Em conflitos, priorizo a verdade e o que é correto, mesmo que incomode.", dimensao: "TF", direcao: "positivo" },
  { id: 33, text: "Valorizo mais a competência e eficiência do que a harmonia social.", dimensao: "TF", direcao: "positivo" },
  { id: 34, text: "Me sinto confortável debatendo e questionando ideias com os outros.", dimensao: "TF", direcao: "positivo" },
  { id: 35, text: "Acredito que regras devem ser aplicadas de forma consistente e imparcial.", dimensao: "TF", direcao: "positivo" },
  { id: 36, text: "Mantenho a cabeça fria mesmo em situações emocionalmente carregadas.", dimensao: "TF", direcao: "positivo" },
  { id: 37, text: "Prefiro análises objetivas e racionais a decisões baseadas em sentimentos.", dimensao: "TF", direcao: "positivo" },
  { id: 38, text: "Critico ideias sem hesitar quando acredito que estão erradas.", dimensao: "TF", direcao: "positivo" },
  { id: 39, text: "Ao tomar decisões, considero profundamente como elas afetarão as pessoas.", dimensao: "TF", direcao: "negativo" },
  { id: 40, text: "Me preocupo com o impacto emocional das minhas palavras antes de falar.", dimensao: "TF", direcao: "negativo" },
  { id: 41, text: "Busco harmonia e acordo nas situações de conflito.", dimensao: "TF", direcao: "negativo" },
  { id: 42, text: "Me sinto mal quando preciso dar notícias difíceis para alguém.", dimensao: "TF", direcao: "negativo" },
  { id: 43, text: "Valorizo o bem-estar emocional da equipe tanto quanto a eficiência.", dimensao: "TF", direcao: "negativo" },
  { id: 44, text: "Percebo facilmente quando alguém está emocionalmente perturbado.", dimensao: "TF", direcao: "negativo" },
  { id: 45, text: "Prefiro elogiar contribuições das pessoas antes de apontar melhorias.", dimensao: "TF", direcao: "negativo" },

  // ── J/P (46–60) ──────────────────────────────────────────────
  { id: 46, text: "Prefiro ter um plano claro e definido antes de iniciar qualquer projeto.", dimensao: "JP", direcao: "positivo" },
  { id: 47, text: "Me sinto desconfortável com muita ambiguidade ou falta de definição.", dimensao: "JP", direcao: "positivo" },
  { id: 48, text: "Organizo meu espaço de trabalho e agenda de forma estruturada.", dimensao: "JP", direcao: "positivo" },
  { id: 49, text: "Prefiro tomar decisões cedo e seguir em frente do que deixá-las em aberto.", dimensao: "JP", direcao: "positivo" },
  { id: 50, text: "Cumpro prazos e compromissos com rigor e, geralmente, com antecedência.", dimensao: "JP", direcao: "positivo" },
  { id: 51, text: "Gosto de listas de tarefas, cronogramas e planejamento detalhado.", dimensao: "JP", direcao: "positivo" },
  { id: 52, text: "Prefiro que reuniões tenham agenda definida e comecem pontualmente.", dimensao: "JP", direcao: "positivo" },
  { id: 53, text: "Costumo concluir uma tarefa completamente antes de começar outra.", dimensao: "JP", direcao: "positivo" },
  { id: 54, text: "Prefiro manter minhas opções em aberto ao invés de decidir logo.", dimensao: "JP", direcao: "negativo" },
  { id: 55, text: "Me adapto bem a mudanças de planos de última hora.", dimensao: "JP", direcao: "negativo" },
  { id: 56, text: "Trabalho bem sob pressão e frequentemente finalizo tarefas perto do prazo.", dimensao: "JP", direcao: "negativo" },
  { id: 57, text: "Gosto de explorar várias opções antes de me comprometer com uma decisão.", dimensao: "JP", direcao: "negativo" },
  { id: 58, text: "Mudo de direção com facilidade quando surgem novas informações relevantes.", dimensao: "JP", direcao: "negativo" },
  { id: 59, text: "Prefiro trabalhar de forma flexível e espontânea a seguir cronogramas rígidos.", dimensao: "JP", direcao: "negativo" },
  { id: 60, text: "Regras e processos muito rígidos me fazem sentir limitado.", dimensao: "JP", direcao: "negativo" },
];
