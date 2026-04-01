export interface QuizOption {
  text: string;
  emoji?: string;
  discount: number;
  correct?: boolean;
  image?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  emoji?: string;
  label?: string;
  type: "text-list" | "image-grid" | "text-grid";
  options: QuizOption[];
}

export const questions: QuizQuestion[] = [
  {
    id: 0,
    question:
      "Quantas vezes você já quis comprar um pacote exclusivo, mas não tinha diamantes suficientes?",
    emoji: "💎",
    type: "text-list",
    options: [
      {
        text: "Muitas vezes! Sempre perco os melhores eventos...",
        emoji: "😭",
        discount: 15,
      },
      {
        text: "Às vezes, mas consigo juntar um pouco.",
        emoji: "🥺",
        discount: 10,
      },
      {
        text: "Nunca, sempre consigo comprar tudo que quero.",
        emoji: "😎",
        discount: 5,
      },
    ],
  },
  {
    id: 1,
    label: "Pergunta 1: (Fácil)",
    question: "Qual modo foi lançado primeiro no Free Fire?",
    emoji: "🎮",
    type: "image-grid",
    options: [
      {
        text: "Contra Squad",
        discount: 5,
        image: "quiz-contra-squad",
      },
      {
        text: "Battle Royale",
        discount: 15,
        correct: true,
        image: "quiz-battle-royale",
      },
      {
        text: "Mata-Mata em Equipe",
        discount: 5,
        image: "quiz-mata-mata",
      },
      {
        text: "Sobrevivência",
        discount: 5,
        image: "quiz-sobrevivencia",
      },
    ],
  },
  {
    id: 2,
    label: "Pergunta 2: (Fácil)",
    question: "Qual é o nome do primeiro mapa lançado no Free Fire?",
    type: "image-grid",
    options: [
      { text: "Kalahari", discount: 5, image: "quiz-kalahari" },
      { text: "Purgatorio", discount: 5, image: "quiz-purgatorio" },
      { text: "Alpine", discount: 5, image: "quiz-alpine" },
      {
        text: "Bermuda",
        discount: 15,
        correct: true,
        image: "quiz-bermuda",
      },
    ],
  },
  {
    id: 3,
    label: "Pergunta 3: (Fácil)",
    question:
      "Quantos jogadores entram em uma partida de Battle Royale no Free Fire?",
    emoji: "🎯",
    type: "text-grid",
    options: [
      { text: "50", discount: 15, correct: true },
      { text: "75", discount: 5 },
      { text: "100", discount: 5 },
      { text: "150", discount: 5 },
    ],
  },
  {
    id: 4,
    label: "Pergunta 4: (Fácil)",
    question: "Qual o nome do criador do Free Fire?",
    emoji: "🏢",
    type: "image-grid",
    options: [
      {
        text: "Garena",
        discount: 15,
        correct: true,
        image: "quiz-garena",
      },
      { text: "Tencent", discount: 5, image: "quiz-tencent" },
      { text: "Supercell", discount: 5, image: "quiz-supercell" },
      { text: "Ubisoft", discount: 5, image: "quiz-ubisoft" },
    ],
  },
  {
    id: 5,
    label: "Pergunta 5: (Médio)",
    question: "Qual destes personagens tem a habilidade de curar aliados?",
    emoji: "💊",
    type: "image-grid",
    options: [
      {
        text: "Kapella",
        discount: 15,
        correct: true,
        image: "quiz-kapella",
      },
      { text: "Moco", discount: 5, image: "quiz-moco" },
      { text: "Hayato", discount: 5, image: "quiz-hayato" },
      { text: "Laura", discount: 5, image: "quiz-laura" },
    ],
  },
  {
    id: 6,
    label: "Pergunta FINAL:",
    question:
      "Se você tivesse um cupom de desconto HOJE para comprar diamantes e não perder mais nenhum evento, você usaria?",
    emoji: "🎁",
    type: "text-list",
    options: [
      {
        text: "Com certeza! Sempre preciso de diamantes!",
        emoji: "🔥",
        discount: 5,
      },
      {
        text: "Talvez, dependendo do desconto.",
        emoji: "🤔",
        discount: 3,
      },
      { text: "Não sei...", emoji: "🤢", discount: 1 },
    ],
  },
];

export const testimonials = [
  {
    name: "Ana P.",
    location: "São Paulo, SP",
    text: 'Fiz o quiz e consegui <strong>5.200 diamantes</strong> com <strong>90% de desconto</strong>! Super fácil e rápido!',
    stars: 5,
    avatar: "avatar-ana.png",
  },
  {
    name: "Lucas M.",
    location: "Santos, SP",
    text: 'Achei que era fake, mas realmente funciona! Peguei meus <strong>5.200 + 1.120 diamantes bônus</strong> em minutos!',
    stars: 4,
    avatar: "avatar-lucas.png",
  },
  {
    name: "Gustavo R.",
    location: "Rio de Janeiro, RJ",
    text: 'Não acreditei no começo, mas fiz o quiz e consegui o desconto. <strong>Comprei 5.000 diamantes</strong> pagando muito pouco!',
    stars: 5,
    avatar: "avatar-gustavo.png",
  },
  {
    name: "Bruna S.",
    location: "Belo Horizonte, MG",
    text: 'Minha amiga me indicou e eu testei. Resultado: <strong>3.500 diamantes</strong> por um preço absurdo! Recomendo demais!',
    stars: 5,
    avatar: "avatar-bruna.png",
  },
  {
    name: "Felipe C.",
    location: "Curitiba, PR",
    text: 'Já tentei vários sites e esse foi o único que realmente entregou. <strong>4.800 diamantes</strong> na hora!',
    stars: 5,
    avatar: "avatar-felipe.png",
  },
  {
    name: "Juliana F.",
    location: "Recife, PE",
    text: 'Fiz o quiz em 2 minutos e já recebi meu cupom. <strong>Economizei mais de R$150</strong> nos diamantes!',
    stars: 4,
    avatar: "avatar-juliana.png",
  },
  {
    name: "Rafael T.",
    location: "Fortaleza, CE",
    text: 'Pensei que era golpe mas arrisquei. Melhor decisão! <strong>5.200 diamantes com 90% off</strong>, surreal!',
    stars: 5,
    avatar: "avatar-rafael.png",
  },
  {
    name: "Camila O.",
    location: "Salvador, BA",
    text: 'Simplesmente incrível! Nunca vi promoção assim no Free Fire. <strong>Peguei 6.000 diamantes</strong> gastando quase nada!',
    stars: 5,
    avatar: "avatar-camila.png",
  },
];

export const offers = [
  {
    name: "Assinatura Semanal",
    img: "offer-ass-semanal.png",
    oldPrice: "R$12,99",
    newPrice: "R$8,99",
    price: 899,
  },
  {
    name: "Assinatura Mensal",
    img: "offer-ass-mensal.png",
    oldPrice: "R$29,99",
    newPrice: "R$19,99",
    price: 1999,
  },
  {
    name: "Trilha da Evolução - 3 dias",
    img: "offer-evolucao-3.png",
    oldPrice: "R$14,99",
    newPrice: "R$9,99",
    price: 999,
  },
  {
    name: "Trilha da Evolução - 7 dias",
    img: "offer-evolucao-7.png",
    oldPrice: "R$19,99",
    newPrice: "R$12,99",
    price: 1299,
  },
  {
    name: "Trilha da Evolução - 30 dias",
    img: "offer-evolucao-30.png",
    oldPrice: "R$39,99",
    newPrice: "R$24,99",
    price: 2499,
  },
  {
    name: "Semanal Econômica",
    img: "offer-semanal-econo.png",
    oldPrice: "R$9,99",
    newPrice: "R$6,99",
    price: 699,
  },
];

export const midpoints = [
  {
    id: 1,
    title: "Você Sabia?",
    facts: [
      {
        emoji: "💣",
        bold: "87% dos jogadores já perderam",
        text: "skins lendárias por não terem diamantes suficientes na hora certa!",
      },
      {
        emoji: "🔥",
        bold: "Mas hoje você tem a chance de mudar isso",
        text: "e garantir seus itens na",
      },
    ],
    extra: "SEMANA DO NOSSO 8º ANIVERSÁRIO!",
    cta: "Continue o quiz para desbloquear seu CUPOM EXCLUSIVO!",
  },
];
