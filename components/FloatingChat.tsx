import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, ChevronDown, User, Bot, Sparkles } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useApp } from '../context/AppContext';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface FloatingChatProps {
  activeTab: string;
}

const SYSTEM_INSTRUCTION = "Você é o **Xande**, o consultor financeiro do Lucro Fácil. Você é uma inteligência artificial especialista em gestão financeira de negócios de alimentação. Você foi treinado na metodologia focada no *CFI (Custos Fixos Integrados)* e opera dentro do sistema Lucro Fácil, um software de precificação e gestão financeira desenvolvido para donos de restaurantes, lanchonetes e negócios de alimentação.\n\n" +
"REGRAS ESTRITAS: Você NUNCA deve mencionar os termos 'DNA do Lucro' ou o nome 'Magno' em nenhuma circunstância. Todas as referências à metodologia devem usar exclusivamente o termo CFI (Custos Fixos Integrados).\n\n" +
"Personalidade: Prático, confiante, direto e focado em fazer o negócio do usuário crescer. Acessível e encorajador.\n" +
"Tone & Style: \"Consultora de bolso\" do usuário. Funciona como uma conversa de WhatsApp com um consultor experiente.\n" +
"Linguagem: Brasileiro, acessível, direto, prático, sem enrolação. Use linguagem simples, evite jargões (ou explique-os imediatamente se precisar usar). Trate o usuário por \"você\" e fale da \"sua loja\". Respostas concisas, máximo de 4 parágrafos. Use emojis com moderação.\n\n" +
"OFERTAS LUCRATIVAS E AS 4 LISTAS:\n" +
"1. Campeões de Venda: Os 20% mais vendidos. A média de lucro deles é a Régua da Casa.\n" +
"2. Produtos Parados: Baixa saída. Investigar motivos.\n" +
"3. Produtos Gordos: Lucro acima da Régua. Inclui os 'Produtos Turbinados' (+10% de lucro que a Régua, usados para escalar margem, ex: bebidas/fritas). Alerte se a loja não tiver.\n" +
"4. Produtos Magros: Lucro abaixo da Régua. Se for Campeão e Magro, alerte o dono do perigo à loja.\n\n" +
"Tipos de Ofertas:\n" +
"- Oferta do Dia: Gordo + Gordo/Turbinado. Pode usar sempre.\n" +
"- Oferta Salva Margem: Campeão Magro + Turbinado. Fórmula: (CMV + CMV) / (1 - (CFI + Régua da Casa)). Salva o lucro de campeões que vendem muito mas lucram pouco. Não inclua lucro individual do turbinado no cálculo. Ofereça direta ou 'quebrada'.\n" +
"- Oferta Bomba de Vendas: Campeão Top + Turbinado. Foco em volume. O lucro total da oferta deve superar o lucro do produto estrela sozinho. Faça oferta quebrada.\n" +
"- Oferta Chamariz: Sacrifício de lucro agressivo para fisgar novos clientes. Use SÓ em inaugurações, lançamentos ou marcos esporádicos. NUNCA no dia a dia.\n\n" +
"Atue proativamente sugerindo ofertas conforme as necessidades reveladas no chat, as telas ou configurações da loja.\n\n" +
"Protocolo ao analisar dados da loja:\n" +
"1. Identifique o problema principal.\n" +
"2. Quantifique o impacto (R$ ou %).\n" +
"3. Dê de 1 a 3 recomendações práticas e específicas.\n" +
"4. Ofereça um próximo passo claro para ação.\n\n" +
"SEMPRE baseie-se nos dados reais que o usuário fornecer. Nunca invente dados.";

const getWelcomeData = (tab: string) => {
  switch (tab) {
    case 'dashboard':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Vejo que você está no painel geral da sua loja. Quer que eu analise seus números e te diga o que está indo bem e o que precisa de atenção?",
        suggestions: ["Resumo do mês", "Onde estou perdendo dinheiro?", "Qual a meta de faturamento?"]
      };
    case 'pricing':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Você está precificando um produto? Me passa o custo dos ingredientes e o canal de venda que eu te ajudo a chegar no preço ideal sem perder margem.",
        suggestions: ["Calcular preço iFood", "Como calcular margem?", "Tabela de taxas"]
      };
    case 'ingredients':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Cadastrando insumos? Posso te ajudar a calcular o fator de perda e garantir que sua ficha técnica fique certinha.",
        suggestions: ["Calcular fator de perda", "Custo médio de insumos", "Lista de compras"]
      };
    case 'expenses':
    case 'categories':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Você está lançando despesas? Depois que terminar me fala o total e o faturamento do mês que eu calculo seu ponto de equilíbrio na hora.",
        suggestions: ["Calcular ponto de equilíbrio", "O que são Custos Indiretos?", "Reduzir despesas"]
      };
    case 'cfi':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Você está configurando os parâmetros mais importantes do sistema. Me fala se tiver dúvida sobre qual margem colocar ou como calcular o CFI da sua loja.",
        suggestions: ["O que é CFI?", "Margem ideal de CMV", "Configurar taxas"]
      };
    case 'break-even':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Quer saber se sua loja já pagou as contas esse mês? Me passa o faturamento atual que eu comparo com seu ponto de equilíbrio na hora.",
        suggestions: ["Já paguei as contas?", "Fórmula do PI", "Como aumentar faturamento?"]
      };
    case 'products':
    case 'profit':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Vamos descobrir quais produtos estão te dando lucro de verdade e quais estão pesando no resultado. Quer que eu explique como funciona a classificação?",
        suggestions: ["O que é Estrela?", "Como analisar vendas?", "Reduzir custo Cavalo de Batalha"]
      };
    case 'xande-report':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Preparei um relatório completo de engenharia de cardápio e evolução de custos para a sua loja. Quer que eu te guie pelas recomendações para transformar seus Cavalos de Batalha em Estrelas?",
        suggestions: ["Melhorar Cavalos de Batalha", "Análise do meu CMV", "Evolução do CMV vs CFI"]
      };
    case 'buffet-simulator':
      return {
        message: "Oi! Sou o Xande, seu consultor de Buffet e À Vontade do Lucro Fácil. Aqui nós blindamos seu preço contra o 'Cliente Ogro' e o desperdício oculto na pista! Deseja simular um cardápio de buffet ou de cachorro-quente monte seu prato?",
        suggestions: ["Blindar contra Cliente Ogro", "Fórmula da taxa de desperdício", "Posicionamento das Proteínas"]
      };
    case 'sales-import':
      return {
        message: "Oi! Sou o Xande, seu consultor do Lucro Fácil. Vamos integrar suas vendas! Cole relatórios do iFood/Saipos ou adicione pedidos. Vou calcular seu lucro líquido real por pedido descontando o CMV e o CFI da Empresa!",
        suggestions: ["Como importar relatórios?", "O que é Campanha Inteligente iFood?", "Como resolve duplicados?"]
      };
    case 'combos':
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Montar combos com margem positiva tem um segredo. Me fala os produtos que você quer combinar que eu te ajudo a calcular o preço certo.",
        suggestions: ["Preço de combo iFood", "Margem de combo", "Exemplo de combo"]
      };
    default:
      return {
        message: "Oi! Sou o Xande, seu consultor financeiro do Lucro Fácil. Estou aqui para te ajudar a aumentar o lucro do seu negócio de alimentação, controlar o CMV, montar fichas técnicas e muito mais. Me conta o que você quer analisar hoje?",
        suggestions: ["Como calcular CMV?", "O que é Ponto de Equilíbrio?", "Como usar o sistema?"]
      };
  }
};

const FloatingChat: React.FC<FloatingChatProps> = ({ activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const appState = useApp();

  // Handle first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const { message } = getWelcomeData(activeTab);
      setMessages([{ role: 'model', text: message }]);
    }
  }, [isOpen, messages.length, activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION + '\n\nDados atuais do sistema (para contexto): ' + JSON.stringify(appState).substring(0, 2000) + '...',
          temperature: 0.7,
        }
      });

      // Pass previous history minus the new message to recreate conversation context
      const historyMsg = messages.map(m => (m.role === 'model' ? 'Xande' : 'Usuário') + ': ' + m.text).join('\n');
      
      const fullPrompt = '\nHistórico da conversa:\n' + historyMsg + '\n\nUsuário: ' + textToSend + '\n';

      const response = await chat.sendMessageStream({ message: fullPrompt });
      
      let aiResponseText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of response) {
         if (chunk.text) {
             aiResponseText += chunk.text;
             setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].text = aiResponseText;
                return newMsgs;
             });
         }
      }

    } catch (error) {
      console.error("Erro ao chamar o Gemini:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Desculpe, tive um probleminha técnico por aqui. Poderia tentar novamente?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const currentWelcomeData = getWelcomeData(activeTab);
  const showSuggestions = messages.length === 1 && messages[0].role === 'model';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={'fixed bottom-6 right-6 w-16 h-16 bg-brand-yellow rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300 z-50 ' + (isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}
      >
        {/* Placeholder for Xande Avatar - Users should add xande-avatar.png to public folder */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/20">
            <img 
              src="/xande-avatar.png" 
              alt="Xande" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('bg-brand-yellow', 'flex', 'items-center', 'justify-center');
                const fallback = document.createElement('div');
                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-900"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
                e.currentTarget.parentElement?.appendChild(fallback.firstChild as Node);
              }}
            />
        </div>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white dark:border-gray-900"></span>
        </span>
      </button>

      {/* Chat Window */}
      <div 
        className={'fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 transform origin-bottom-right z-50 border border-gray-100 dark:border-gray-800 overflow-hidden ' + (isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none')}
      >
        {/* Header */}
        <div className="bg-brand-yellow text-slate-900 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/30 border border-white/40">
               <img src="/xande-avatar.png" alt="Xande" className="w-full h-full object-cover" 
                 onError={(e) => { e.currentTarget.style.display = 'none'; }}
               />
            </div>
            <div>
              <h3 className="font-bold text-[15px] flex items-center gap-1.5">
                Xande <Sparkles size={14} className="text-amber-600" />
              </h3>
              <p className="text-[11px] text-slate-800 opacity-90">Consultor Lucro Fácil</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/30 transition-colors text-slate-900"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC] dark:bg-[#111827]">
          {messages.map((msg, idx) => (
            <div key={idx} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={'max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ' + (
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-sm'
              )}>
                {msg.text || (
                  <span className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Suggestions (only show after initial welcome) */}
          {showSuggestions && (
            <div className="flex flex-col gap-2 mt-4 ml-2 animate-fade-in">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {currentWelcomeData.suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(sug)}
                    className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-red dark:hover:border-brand-red text-gray-700 dark:text-gray-300 hover:text-brand-red text-[12px] px-3 py-1.5 rounded-full transition-all shadow-sm"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-end gap-2 relative"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Pergunte ao Xande..."
              className="flex-1 max-h-32 min-h-[44px] bg-gray-50 dark:bg-[#111827] border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-[14px] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none custom-scrollbar"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-[44px] h-[44px] shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              <Send size={18} className={input.trim() && !isLoading ? 'transform translate-x-0.5 -translate-y-0.5' : ''} />
            </button>
          </form>
          <div className="text-center mt-2">
             <span className="text-[10px] text-gray-400">Xande pode cometer erros. Verifique os cálculos importantes.</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default FloatingChat;
