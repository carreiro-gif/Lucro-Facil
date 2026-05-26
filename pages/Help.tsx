import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, BookOpen, Printer, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, 
  HelpCircle, MessageCircleQuestion, AlertTriangle, Store, TrendingUp, 
  ShieldCheck, FileText, BarChart2, Tags, DollarSign, Check, Beef, 
  Calculator, ScrollText, ShoppingBag, Target, CloudUpload, Sparkles, Book, Settings,
  Gift, Download, Flame, Percent
} from 'lucide-react';

interface Chapter {
  id: string;
  chapterNum: string;
  title: string;
  shortDescription: string;
  icon: React.ComponentType<any>;
  color: string;
  content: string;
}

const Help: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'bonus' | 'faq'>('manual');
  const [printType, setPrintType] = useState<'full' | 'manual' | 'bonus'>('full');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState<number>(15); // Dynamic reading font size in px
  const [expandedFAQ, setExpandedFAQ] = useState<Record<string, boolean>>({});

  // Simulator for Offers (E-Book Bônus)
  const [promoType, setPromoType] = useState<'salva_margem' | 'bomba'>('salva_margem');
  const [costBase, setCostBase] = useState<number>(8.50);
  const [costTurbinado, setCostTurbinado] = useState<number>(3.00);
  const [reguaTarget, setReguaTarget] = useState<number>(25);
  const [cfiValue, setCfiValue] = useState<number>(15);

  const suggestedPriceCombo = useMemo(() => {
    const totalCost = costBase + costTurbinado;
    const denominator = 1 - ((cfiValue + reguaTarget) / 100);
    if (denominator <= 0.05) return 0;
    return totalCost / denominator;
  }, [costBase, costTurbinado, cfiValue, reguaTarget]);

  // E-book progress tracking (persisted locally)
  const [readChapters, setReadChapters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lucrofacil_read_chapters');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleChapterRead = (chapId: string) => {
    setReadChapters(prev => {
      const next = prev.includes(chapId) ? prev.filter(id => id !== chapId) : [...prev, chapId];
      try {
        localStorage.setItem('lucrofacil_read_chapters', JSON.stringify(next));
      } catch (err) {
        console.error('Error saving progress', err);
      }
      return next;
    });
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(prev => ({ ...prev, [id]: !prev[id] }));
  };
  const EBOOK_CHAPTERS: Chapter[] = useMemo(() => [
    {
      id: 'ch1',
      chapterNum: '1',
      title: 'Capítulo 1: O Inimigo Invisível e a Metodologia CFI',
      shortDescription: 'Descubra por que 60% dos restaurantes e negócios de alimentação quebram e como o Método CFI funciona como sua vacina financeira.',
      icon: Book,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Seja muito bem-vindo, parceiro! Aqui é o <strong>Xande</strong>, seu consultor financeiro. Se você abriu este manual, significa que cansou de passar noites em claro na cozinha, ver o seu negócio de alimentação cheio de clientes, mas no dia 30 sofrer para pagar os fornecedores.
          </p>
          <p class="text-base leading-relaxed">
            No mercado de alimentação, principalmente em bares e restaurantes, existe um <strong>Inimigo Invisível</strong>. Ele é o faturamento alto que esconde um prejuízo silencioso. O dono comemora porque faturou R$ 50 mil no mês, mas não percebe que gastou R$ 52 mil para entregar esses pedidos.
          </p>

          <div class="my-4 bg-red-500/5 dark:bg-red-500/10 p-5 rounded-2xl border-l-4 border-red-500 space-y-2">
            <h4 class="font-bold text-red-700 dark:text-red-400 text-sm uppercase flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> O Mito do Multiplicador de Preço (Preço x 3)
            </h4>
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              O maior erro é usar a antiga "regra de padaria": pegar o preço dos ingredientes (CMV), multiplicar por 3 e achar que o resto é lucro de graça. Quando você vende um lanche ou refeição que custou R$ 10,00 de insumos por R$ 30,00, você NÃO está lucrando R$ 20,00. Desse valor, uma parte vai para as taxas abusivas de delivery, outra para impostos, outra para o aluguel, luz, salários e embalagens. Sem precisão, você está pagando para o cliente comer!
            </p>
          </div>

          <h3 class="text-lg font-bold text-gray-950 dark:text-gray-50 border-b border-gray-100 dark:border-white/10 pb-2">A Solução: CFI (Custos Fixos Integrados)</h3>
          <p class="text-sm leading-relaxed">
            O método <strong>CFI (Custos Fixos Integrados)</strong> inverte a lógica tradicional de precificação. Em vez de torcer para sobrar dinheiro para o aluguel no fim do mês, nós integramos uma porcentagem específica de custo fixo diretamente em cada item vendido.
          </p>
          <p class="text-sm leading-relaxed">
            Isso divide o peso da estrutura da empresa de maneira racional e estratégica. O preço sugerido pelo <strong>Lucro Fácil</strong> garante que cada venda pague sua porção do aluguel, da equipe de cozinha, da luz e do marketing, blindando sua margem líquida real de lucro.
          </p>

          <div class="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <span class="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase block">💡 DICA DO XANDE</span>
            <p class="text-xs text-gray-600 dark:text-gray-300 mt-1">
              "Faturamento é ego, lucro é bolso e caixa é realidade. Entenda os conceitos deste manual passo a passo e o seu negócio nunca mais será o mesmo."
            </p>
          </div>
        </div>
      `
    },
    {
      id: 'ch2',
      chapterNum: '2',
      title: 'Capítulo 2: Configurando o CFI da Empresa (Seu Ponto de Partida)',
      shortDescription: 'Configure as engrenagens mestras: lucros desejados, impostos e custos fixos globais.',
      icon: Settings,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Antes de calcular qualquer prato ou produto, o sistema precisa entender a estrutura de custos e a ambição financeira de sua loja. É na tela <strong>CFI da Empresa</strong> que você insere os parâmetros básicos de precificação.
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 uppercase tracking-wider mb-2">Os Valores Mestre Que Você Deve Cadastrar:</h3>
          <ul class="space-y-3 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-emerald-500 font-bold mt-1">✓</span>
              <div>
                <strong>Meta de Lucro Líquido Desejada (%):</strong> É o quanto você quer que limpe de sobra no seu bolso por item vendido. Recomendo para negócios de alimentação uma margem alvo entre <strong>15% e 25%</strong>. Menos que isso é arriscado para manter o negócio em pé; mais que isso pode afastar clientes com preços absurdos.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-500 font-bold mt-1">✓</span>
              <div>
                <strong>Impostos (%):</strong> Se você for MEI, esse campo pode ser zero ou fixo. Se for Simples Nacional, use a taxa real de tributação da sua guia DAS (geralmente entre 4% e 8% para faturamentos iniciais no comércio).
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-500 font-bold mt-1">✓</span>
              <div>
                <strong>CFI Médio Calculado (%):</strong> A porcentagem do seu faturamento dedicada a pagar custos fixos estruturais (seu balanço global). Se você ainda não tem esse número consolidado, o sistema ajuda a simular usando o histórico.
              </div>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-emerald-500 font-bold mt-1">✓</span>
              <div>
                <strong>Taxa Operacional do iFood / Apps (%):</strong> A comissão básica que o delivery retém. Se usa entrega própria é menor (~12%), se usa logística parceira é maior (~23% a 27%). Isso garante que as simulações já incluam os custos corretos.
              </div>
            </li>
          </ul>

          <div class="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            <strong>⚠️ Atenção:</strong> Nunca tente pular essa tela! Preencher informações imprecisas ou vazias fará com que toda calculadora sugira preços baixos demais, gerando falsos resultados que corroem os lucros reais de seu painel.
          </div>
        </div>
      `
    },
    {
      id: 'ch3',
      chapterNum: '3',
      title: 'Capítulo 3: Despesas Fixas contra Variáveis (Estancando Vazamentos)',
      shortDescription: 'Onde lançar cada conta do negócio e como categorizar para entender os maiores drenos de caixa.',
      icon: DollarSign,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Para saber se o seu negócio é viável, precisamos organizar detalhadamente as contas. No <strong>Lucro Fácil</strong>, dividimos seus gastos em duas grandes frentes na aba <strong>Despesas Fixas</strong> e <strong>Categorias Financeiras</strong>.
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1">Despesas Fixas (Entram nesta aba)</h3>
          <p class="text-sm">
            São todos os valores que chegam independente de você vender 1 ou 1.000 pedidos/refeições. Exemplos clássicos:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div class="bg-gray-100 dark:bg-white/5 p-3 rounded-lg">
              <strong class="block text-gray-900 dark:text-white">Estrutural:</strong>
              Aluguel do imóvel, taxa de condomínio, contador, água, energia elétrica, internet, IPTU de forma proporcional, assinatura de sistema de automação.
            </div>
            <div class="bg-gray-100 dark:bg-white/5 p-3 rounded-lg">
              <strong class="block text-gray-900 dark:text-white">Pessoal & Recorrente:</strong>
              Salário fixo dos colaboradores fixos (motoboy contrato, chapeiros), retirada de PRO-LABORE mensal do dono, seguros e mensalidades administrativas.
            </div>
          </div>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1">Custos Variáveis (NÃO entram no menu Despesas)</h3>
          <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Estes oscilam de acordo com as vendas e entram de forma direta na <strong>Ficha técnica ou Taxas de Precificação</strong>: carne, pão, queijo, bacon, gás de chapa, caixa de entrega, taxas de delivery iFood, comissões percentuais ou impostos.
          </p>

          <div class="my-4 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 text-xs">
            <strong class="block text-emerald-700 dark:text-emerald-400 uppercase mb-1">💡 Regra Master de Organização</strong>
            Ao lançar contas na aba de Despesas, selecione uma <strong>Categoria Financeira</strong> (Pessoal, Infraestrutura, Marketing ou Manutenção) e um <strong>Fornecedor</strong> correspondente. Isso gera gráficos poderosos no seu Dashboard que explicam exatamente qual "torneira está aberta": se você está gastando demais com compras de infraestrutura ou se a folha do time está incompatível com seu faturamento atual.
          </div>
        </div>
      `
    },
    {
      id: 'ch4',
      chapterNum: '4',
      title: 'Capítulo 4: Insumos e Fator de Perda (O Desperdício Oculto)',
      shortDescription: 'O segredo da cebola, do queijo e da carne na chapa. Como calcular as perdas ocultas do ingrediente cru.',
      icon: Beef,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Se você compra 1kg de cebola branca por R$ 6,00 e serve 100g em cada prato ou porção, você acha que o custo da porção é de R$ 0,60? <strong>Se você pensou sim, perdeu dinheiro!</strong> 
          </p>
          <p class="text-sm leading-relaxed">
            A cebola tem casca, raízes e partes estragadas que são jogadas fora na preparação. Você joga fora cerca de 15% do peso bruto. O custo real daquilo que efetivamente vai para o prato do seu cliente é maior que R$ 6,00 por quilo útil!
          </p>

          <div class="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/20 space-y-3">
            <h4 class="font-bold text-amber-700 dark:text-amber-400 text-sm uppercase">📐 Conhecendo o Fator de Correção</h4>
            <div class="text-xs font-mono bg-white dark:bg-black/30 p-3 rounded border border-gray-100 dark:border-white/10 space-y-1">
              Fórmula: Peso Bruto (no pacote) ÷ Peso Líquido (limpo para uso)<br/>
              Exemplo: 1000g de Cebola Crua ÷ 850g de Cebola Cortada = Fator 1.18<br/>
              Custo Real Corrigido: R$ 6,00 × 1.18 = R$ 7,08 por Quilo Útil!
            </div>
            <p class="text-xs text-gray-500">
              O sistema <strong>Lucro Fácil</strong> faz essa matemática de forma 100% automatizada. Ao cadastrar um ingrediente na aba <strong>Insumos</strong>, você só precisa informar o Preço Total pago, a Quantidade total da embalagem e a % média de Perda Operacional estimada.
            </p>
          </div>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1">Exemplos Comuns de Perda de Insumos:</h3>
          <ul class="list-disc list-inside text-xs space-y-1">
            <li><strong>Bacon Fatiado:</strong> Sofre derretimento de gordura na chapa. Perda de 25% a 30%.</li>
            <li><strong>Carne Moída (Blend):</strong> Perda de água e sangue no descarte ou encolhimento na chapa (Bury weight). Perda de 10% a 15%.</li>
            <li><strong>Tomates e Folhas:</strong> Descarte de folhas murchas, pontas e sementes internas. Perda de 15% a 20%.</li>
            <li><strong>Catupiry / Maionese Caseira:</strong> Perdas que ficam agarradas em bisnagas e batedeiras. Perda de 5%.</li>
          </ul>

          <div class="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 text-xs">
            <h4 class="font-black text-blue-700 dark:text-blue-400 uppercase mb-1">🚀 Super Automação: Entrada XML</h4>
            Se você cansar de cadastrar cada insumo manualmente, use a aba <strong>Entrada de Compras (XML)</strong>. Arraste a Nota Fiscal eletrônica emitida pelo seu fornecedor que o sistema importará instantaneamente os valores, o fornecedor, o peso e atualizará seus preços de custo na hora, identificando flutuações e reajustando fichas técnicas vinculadas.
          </div>

          <div class="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10 text-xs mt-3">
            <h4 class="font-black text-purple-700 dark:text-purple-400 uppercase mb-1">👩‍🍳 Dica de Mestre: Sub-receitas</h4>
            As <strong>Sub-receitas</strong> são preparos feitos dentro da própria loja — como a fabricação do seu próprio Blend, molhos especiais ou de uma geleia artesanal. Na aba <strong>Insumos / Sub-receitas</strong>, você pode criar uma Sub-receita selecionando os insumos crus (comprados) que a compõem. O sistema vai rastrear automaticamente a perda percentual e calcular o custo real grama a grama de cada preparo!
          </div>
        </div>
      `
    },
    {
      id: 'ch5',
      chapterNum: '5',
      title: 'Capítulo 5: Ficha Técnica e Controle de CMV (O Coração da Receita)',
      shortDescription: 'Crie receitas financeiras padronizadas que controlam o percentual do CMV, pilar de todo negócio de alimentação.',
      icon: FileText,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            A <strong>Ficha Técnica</strong> é a receita financeira do seu produto. Sem ela, você não sabe quanto realmente custa produzir o seu prato ou lanche. Ela serve tanto para padronizar a porção (garantindo que o cliente receba o mesmo padrão hoje e daqui a seis meses) quanto para blindar a saúde financeira do negócio.
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 uppercase tracking-widest text-xs border-b pb-1">As Faixas Recomendadas de CMV (Custo da Mercadoria Vendida)</h3>
          <p class="text-xs">
            O CMV é a porcentagem do seu preço de venda que serve para pagar os ingredientes. De acordo com as diretrizes do Método CFI:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-xs font-bold leading-normal">
            <div class="p-3 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              28% a 35%<br/><span class="font-normal text-[10px]">Saudável e Sustentável</span>
            </div>
            <div class="p-3 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Menos de 25%<br/><span class="font-normal text-[10px]">Cuidado com a Qualidade</span>
            </div>
            <div class="p-3 rounded bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
              38% a 41%<br/><span class="font-normal text-[10px]">Alerta de Lucro Escasso</span>
            </div>
            <div class="p-3 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
              42% ou mais<br/><span class="font-normal text-[10px]">PERIGO! Prejuízo Iminente</span>
            </div>
          </div>

          <p class="text-sm">
            Para montar uma ficha técnica saudável na aba <strong>Produtos</strong>, você cria um item informando o nome e a categoria de cardápio e, em seguida, vincula todos os ingredientes necessários:
          </p>
          <ul class="list-disc list-inside text-xs space-y-1">
            <li><strong>Componentes do item/prato:</strong> Peso real dos ingredientes principais, proteínas, acompanhamentos e guarnições.</li>
            <li><strong>Embalagem & Descartáveis (O ERRO COMUM):</strong> O invólucro ou caixa de entrega, guardanapo, sachê de molho, sacola de papel Kraft do delivery e lacre de segurança. Tudo isso custa dinheiro e DEVE constar na ficha técnica como insumo!</li>
          </ul>

          <div class="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
            <strong>Dica do Xande:</strong> Se o seu CMV estiver ultrapassando os 38%, não tente economizar tirando a qualidade dos insumos principais. Renegocie preços com atacados, reduza o desperdício de insumos na cozinha ou recalcule seu preço de venda usando nossa ferramenta de Precificação!
          </div>
        </div>
      `
    },
    {
      id: 'ch6',
      chapterNum: '6',
      title: 'Capítulo 6: Precificação Multifuncional (Calculadora Canal a Canal)',
      shortDescription: 'Pare de chutar preços. Calcule automaticamente o valor do balcão, do iFood, do 99Food e da KeeTa.',
      icon: Calculator,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Vender um prato ou refeição na mesa física e vender o exato mesmo produto no iFood pelo mesmo preço é o caminho mais curto para falir o seu negócio. As taxas do delivery não são pequenos descontos invisíveis: elas atacam diretamente toda a sua margem de sobrevivência.
          </p>

          <h3 class="text-lg font-bold text-gray-950 dark:text-gray-50 border-b pb-1">A Armadilha Matemática do Delivery</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Quando você apenas "soma 20%" ao preço do prato para cobrir uma comissão de 20%, o iFood desconta a comissão dele sobre o preço FINAL (que ficou maior). O que morde sua conta de forma retroativa.
          </p>
          <p class="text-sm text-red-500 font-bold">
            Taxa cobrada pelo aplicativo incide sobre: Prato/Refeição + Embalagem + Taxa de Entrega!
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50">O Método da Fórmula Reversa (Mark-up por Denominador)</h3>
          <p class="text-xs">
            O <strong>Lucro Fácil</strong> integra em sua aba de <strong>Precificação</strong> uma fórmula matemática complexa baseada na Margem de Contribuição Desejada. Ela calcula a comissão, os impostos recolhidos no faturamento bruto, o CFI e o lucro configurados na aba de parâmetros para apontar o preço exato que você deve cobrar em cada app:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed mt-2">
            <div class="bg-gray-50 dark:bg-white/5 p-3 rounded">
              <strong class="text-emerald-600 dark:text-emerald-400 block mb-1">1. Canal Loja Física:</strong> Sugere o preço clássico considerando as taxas locais da maquininha de cartão (débito, crédito e cartões refeição).
            </div>
            <div class="bg-gray-50 dark:bg-white/5 p-3 rounded">
              <strong class="text-red-500 block mb-1">2. Canal iFood:</strong> Protege o preço contra as taxas de pagamento online (~3.2%) e as taxas do plano básico (~12%) ou plano de entrega parceira (~23%).
            </div>
            <div class="bg-gray-50 dark:bg-white/5 p-3 rounded">
              <strong class="text-orange-500 block mb-1">3. KeeTa e 99Food:</strong> Gera o valor certo contra as comissões acordadas nessas plataformas sem sacrificar seu lucro líquido em reais.
            </div>
          </div>
          
          <img src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop" class="w-full h-40 object-cover rounded-xl mt-2 opacity-85" referrer-policy="no-referrer" />
        </div>
      `
    },
    {
      id: 'ch7',
      chapterNum: '7',
      title: 'Capítulo 7: Diagnóstico Rápido Lucro Atual (Seu Raio-X Financeiro)',
      shortDescription: 'Digite o preço que você cobra hoje e veja o Semáforo de saúde financeira revelar a verdade.',
      icon: ScrollText,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Se você já tem um cardápio ativo e rodando e não sabe se está faturando ou apenas gerando prejuízo a cada clique de compra, o módulo <strong>Lucro Atual</strong> é a sua fita métrica de emergência.
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1">Confronto Direto com o Semáforo</h3>
          <p class="text-sm">
            Nessa tela, você seleciona um produto cadastrado e informa o preço exato que você cobra atualmente no seu balcão físico. O sistema une a ficha técnica dele ao CFI da empresa e mapeia sua saúde em tempo real:
          </p>

          <div class="space-y-2 text-xs">
            <div class="p-3 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
              <strong>🔴 Semáforo Vermelho (PREJUÍZO):</strong> Significa que o preço cobrado é menor do que a soma dos custos de embalagem/ingrediente, impostos e custos fixos proporcionais. Você perde dinheiro a cada venda e precisa corrigir o preço imediatamente.
            </div>
            <div class="p-3 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <strong>🟡 Semáforo Amarelo (ATENÇÃO):</strong> O preço cobre o custo total, mas o seu lucro líquido é menor do que a metade da meta desejada. Você trabalha demais para sobrar quase nada de dinheiro no caixa.
            </div>
            <div class="p-3 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <strong>🟢 Semáforo Verde (SAUDÁVEL):</strong> Suas margens estão protegidas, o preço é sustentável e você está batendo suas metas financeiras reais por pedido. Parabéns!
            </div>
          </div>

          <div class="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
            <strong>Dica do Xande:</strong> Ao preencher a tabela de Lucro Atual de todos os seus itens, o sistema gera de forma automática uma análise integrada para os canais do iFood e outros apps, mostrando se o produto se mantém saudável na internet ou se entra em colapso devido às comissões abusivas das plataformas.
          </div>
        </div>
      `
    },
    {
      id: 'ch8',
      chapterNum: '8',
      title: 'Capítulo 8: Engenharia de Cardápio (Os Heróis e Vilões do Menu)',
      shortDescription: 'Classifique automaticamente seus produtos em Estrelas, Cavalos de Batalha, Incógnitas e Abacaxis.',
      icon: BarChart2,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Nem todos os pratos ou lanches do seu menu foram criados de forma igualitária. Alguns vendem como água e te dão lucro excelente, outros dão trabalho, atrasam a cozinha e custam caro demais para a margem deixada.
          </p>
          <p class="text-sm">
            O painel de <strong>Engenharia de Cardápio</strong> do Lucro Fácil analisa de forma cruzada o volume vendido (giro de estoque) de cada item com a comissão de lucro líquido unitário extraída de suas fichas, gerando quatro classificações universais:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans mt-2">
            <div class="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
              <strong class="text-emerald-700 dark:text-emerald-400 block mb-1">🌟 ESTRELA (Alta Margem, Alto Volume):</strong>
              Estes são os reis do seu cardápio (ex: aquele prato especial carro-chefe que os clientes adoram). Dão lucro incrível e vendem sozinhos. Ação: Mantenha sempre em destaque, use ótimas fotos e promova constantemente.
            </div>
            <div class="bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
              <strong class="text-blue-700 dark:text-blue-400 block mb-1">🐎 CAVALO DE BATALHA (Alta Venda, Baixo Lucro):</strong>
              Geralmente é o clássico do seu cardápio com preço competitivo. Os clientes adoram pelo preço baixo, mas eles esgotam sua equipe de cozinha sem sobrar margem. Ação: Reduza o custo das embalagens desse item ou suba o preço de venda de forma sutil (Ex: R$ 0,50 ou R$ 1,00).
            </div>
            <div class="bg-purple-500/5 p-4 rounded-xl border border-purple-500/20">
              <strong class="text-purple-700 dark:text-purple-400 block mb-1">❓ INCÓGNITA (Alta Margem, Baixo Volume):</strong>
              Pratos e lanches mais refinados e caros que dão ótima sobra, mas quase ninguém pede. Ação: Ofereça como sugestão de venda cruzada no balcão, mude sua foto nos aplicativos ou faça promoções casadas com bebidas.
            </div>
            <div class="bg-red-500/5 p-4 rounded-xl border border-red-500/20">
              <strong class="text-red-700 dark:text-red-400 block mb-1">🍍 ABACAXI (Baixo Volume, Baixa Margem):</strong>
              Aqueles itens inventados que complicam o cardápio, exigem insumos exclusivos que vivem estragando na geladeira e dão prejuízo de margem. Ação: Retire-os imediatamente do cardápio ou reformule a receita do zero.
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'ch9',
      chapterNum: '9',
      title: 'Capítulo 9: Gestão de Combos (Eleve Seu Ticket Médio)',
      shortDescription: 'Una o Prato principal, Batata frita e Refrigerante e faça o cliente gastar mais no seu negócio.',
      icon: ShoppingBag,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Se um cliente entra na sua loja para comprar um prato ou lanche por R$ 25,00, o custo para trazer ele até o seu balcão (investimento de link de marketing ou espaço físico) já está pago pelo item principal.
          </p>
          <p class="text-sm border-l-4 border-rose-500 pl-3">
            O segredo de ouro para faturar muito mais sem aumentar custos é o <strong>Ticket Médio</strong>. Se esse mesmo cliente, em vez do item individual, comprar um <strong>Combo com Fritas e Refri por R$ 38,00</strong>, seu faturamento deu um salto extraordinário de fôlego operacional!
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 uppercase tracking-widest text-xs">Os Insumos Turbinados: Fritas e Bebidas</h3>
          <p class="text-xs text-gray-600 dark:text-gray-300">
            Batata frita congelada de saca em atacado e latas de refrigerante são os chamados "Produtos Turbinados" na metodologia financeira de Xande. Eles custam muito pouco de preparar e possuem margens altíssimas. Quando você cria combos, o lucro massivo do refrigerante e da batata absorve um leve desconto oferecido no item principal.
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1">Usando a aba Combos de Forma Simplificada</h3>
          <ol class="list-decimal list-inside text-xs space-y-1">
            <li>Vá até a aba de <strong>Combos</strong> de sua barra lateral.</li>
            <li>Insira um nome impactante (ex: "Combo Monstro da Casa").</li>
            <li>Selecione o Item base, a Batata Cadastrada e o Refrigerante correspondente.</li>
            <li>O sistema soma automaticamente o CMV integrado de todos os itens e oferece simulações de preços sugeridos para o salão da loja e para os marketplaces de delivery, garantindo a lucratividade do conjunto!</li>
          </ol>
        </div>
      `
    },
    {
      id: 'ch10',
      chapterNum: '10',
      title: 'Capítulo 10: Estratégias de Ofertas (Promoções Seguras por Xande)',
      shortDescription: 'Como criar Ofertas do Dia, Ofertas Salva-Margem e Bombas de Venda sem derreter seu faturamento.',
      icon: TrendingUp,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Donos de negócios de alimentação adoram dar descontos nos aplicativos achando que vão bombar as vendas, mas não percebem o risco de vender em massa com lucro zero. Para resolver isso com inteligência, o Método CFI de Xande divide as promoções de cardápio em 4 Ofertas Específicas:
          </p>

          <div class="space-y-4 text-xs font-sans">
            <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border-l-4 border-emerald-500">
              <strong class="text-emerald-800 dark:text-emerald-400 block mb-1">1. OFERTA DO DIA (Segurança Total):</strong>
              Une dois produtos gordos (alta margem e gordura de preço) ou um gordo e um turbinado. Exemplo: Item Premium + Sobremesa ou Milk Shake. Por não envolver produtos de CMV espremido, essa oferta pode rodar de forma diária no cardápio sem risco de prejuízo.
            </div>

            <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border-l-4 border-amber-500">
              <strong class="text-amber-800 dark:text-amber-400 block mb-1">2. OFERTA SALVA MARGEM (Seu Remédio Contra Prejuízo):</strong>
              Ideal para quando o item mais vendido do seu menu (Campeão) tem margem espremida pelo mercado. Para salvar a operação, combinamos esse prato com um item Turbinado (uma bebida gelada com excelente markup). O lucro acumulado na venda agregada compensa a margem estreita e eleva sua transação de caixa.
            </div>

            <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border-l-4 border-indigo-500">
              <strong class="text-indigo-800 dark:text-indigo-400 block mb-1">3. OFERTA BOMBA DE VENDAS (Explosão de Volume):</strong>
              Use nos dias mais frios do movimento do restaurante (geralmente terças ou quartas-feiras). Combinamos o maior campeão com fritas médias reduzindo a margem final de contribuição ao patamar mínimo tolerado pelo seu CFI global, visando faturamento por volume absoluto de pedidos.
            </div>

            <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border-l-4 border-red-500">
              <strong class="text-red-800 dark:text-red-400 block mb-1">4. OFERTA CHAMARIZ (Extrema Atenção):</strong>
              Descontos agressivos vendendo abaixo do custo fixo ideal para atrair clientes em massa. <strong>NUNCA use isso no dia a dia!</strong> Serve exclusivamente para 1) Inaugurações, 2) Lançamento de novos produtos ou 3) Queima pontual de estoque que corre o risco de estragar na geladeira.
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'ch11',
      chapterNum: '11',
      title: 'Capítulo 11: Ponto de Equilíbrio (O Dia Mágico do Lucro)',
      shortDescription: 'Descubra como calcular o dia em que seu negócio de alimentação paga os custos estruturais e passa a lucrar.',
      icon: Target,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            De cada real que entra no caixa de sua empresa no início do mês, nem um centavo pertence a você ainda. Uma parte é para pagar insumos e proteínas (CMV), outra para pagar taxas de pagamento de cartão e delivery. O restante é a chamada **Margem de Contribuição**, que serve para amortizar sua dívida das contas fixas.
          </p>
          <p class="text-sm">
            O <strong>Ponto de Equilíbrio</strong> é o divisor de águas: ele responde de forma precisa em reais o faturamento necessário para liquidar as despesas recorrentes mensais (aluguel, salários, contador, energia, impostos) e zerar o saldo negativo da operação.
          </p>

          <div class="my-4 bg-purple-500/5 p-5 rounded-2xl border border-purple-500/20">
            <h4 class="font-bold text-purple-700 dark:text-purple-400 text-sm uppercase mb-2">📊 Traçando Metas de Pedidos Diários</h4>
            <p class="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              Seu Ponto de Equilíbrio mensal é de R$ 30.000,00 e o seu Ticket Médio por pedido de cliente é de R$ 50,00. Dividindo um pelo outro, descobrimos que você precisa entregar exatamente 600 Pedidos no mês para pagar todas as despesas da empresa.
            </p>
            <div class="my-2 p-2 bg-white dark:bg-black/30 font-mono text-center text-xs border border-gray-100 dark:border-white/10 rounded">
              600 Pedidos Totais ÷ 24 dias de funcionamento = 25 Pedidos Diários Consecutivos!
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Sabendo disso, sua equipe tem uma meta visual clara. Cada pedido vendido acima do número 25 do dia é pura margem real de lucro líquido em seu bolso!
            </p>
          </div>

          <div class="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs">
            <strong>Dica do Xande:</strong> Acesse periodicamente a tela de de <strong>Ponto de Equilíbrio</strong> e utilize as simulações locais para acompanhar como o aumento ou a diminuição na comissão das despesas variáveis fariam você precisar de mais ou menos pedidos por noite para ter sucesso.
          </div>
        </div>
      `
    },
    {
      id: 'ch12',
      chapterNum: '12',
      title: 'Capítulo 12: Backup, Migrações e Replicação (O Escudo dos Dados)',
      shortDescription: 'Como garantir a blindagem técnica contra panes de computador, clonar dados para filiais e resgatar backups.',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Nós chegamos ao capítulo final, e ele trata de algo essencial para noites tranquilas de sono: **segurança de dados**. Imagine gastar dezenas de horas montando as fichas financeiras perfeitas da geladeira, e o computador pifar ou ser roubado na loja física. Perder tudo seria um pesadelo completo!
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1">Backup Semanal (O Semáforo de Segurança)</h3>
          <p class="text-sm">
            Observe o rodapé vermelho / amarelo / verde e o botão "FAZER BACKUP". Clicar nele baixa um arquivo criptografado com extensão <strong>.json</strong> contendo todo o seu ecossistema. Arraste esse arquivo baixado para seu Google Drive, OneDrive ou envie pelo e-mail a fim de garantir a segurança na nuvem.
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1 flex items-center gap-2">🔄 É Possível Carregar Backups de Outras Versões?</h3>
          <p class="text-sm leading-relaxed">
            <strong>Sim!</strong> Se você já possui uma versão preliminar desse sistema hospedada com dados cadastrados e quer portar seus cadastros, basta realizar o salvamento no dispositivo antigo, e nessa nova versão do sistema, utilizar a ferramenta de restauração clicando para anexar o mesmo arquivo da extensão do backup. O sistema atualizará os dados da nova loja mantendo a consistência.
          </p>

          <h3 class="text-md font-bold text-gray-950 dark:text-gray-50 border-b pb-1">Replicação Inteligente de Cadastro</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Se abriu uma filial nova e quer carregar os mesmos 40 itens cadastrados sem ter trabalho duplo de cadastramento, o painel central do <strong>Lucro Fácil</strong> possui o botão de replicar dados:
          </p>
          <ul class="list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-300">
            <li>Escolha a loja de origem (Ex: Matriz) e a de destino (Ex: Nova Filial).</li>
            <li>Marque de forma independente se quer exportar apenas as tabelas de <strong>Insumos</strong>, o seu <strong>Cardápio de Produtos</strong> ou as <strong>Taxas Globais configuradas</strong>. Pronto! Sua nova filial está precificada em 2 segundos!</li>
          </ul>

          <div class="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-center font-bold">
            "Sua jornada rumo ao Lucro Fácil começou! Com disciplina com os dados, planejamento certeiro e este manual à mão, o sucesso operacional de seu negócio é questão de tempo!"
          </div>
        </div>
      `
    },
    {
      id: 'ch13',
      chapterNum: '13',
      title: 'Capítulo 13: Guia de Abas do Sistema (O Mapa do Tesouro para Iniciantes)',
      shortDescription: 'Um passo-a-passo simples explicando para que serve cada recurso do painel, focado em quem entende de cozinha, mas não de administração.',
      icon: ScrollText,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Se você sabe fazer um prato incrível que deixa o cliente salivando, mas se perde na hora de abrir planilhas, organizar notas ou somar custos de aluguel e delivery: <strong>fique tranquilo!</strong> O Lucro Fácil foi desenhado exatamente para você.
          </p>
          <p class="text-sm font-bold my-2 text-gray-800 dark:text-white">
            Pense no nosso sistema como a <strong>cozinha financeira do seu negócio</strong>. Cada aba lateral é um processo ou um ingrediente administrativo. Vamos mapear o que cada uma faz e como você deve usar no dia a dia do seu negócio:
          </p>

          <div class="space-y-4 text-xs font-sans">
            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-emerald-500 space-y-2">
              <strong class="text-emerald-800 dark:text-emerald-400 block text-xs uppercase tracking-wider">📊 1. Dashboard (Painel de Saúde e Controle):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> É o painel de instrumentos do seu restaurante. Mostra de forma imediata o faturamento do mês, o total de custos fixos que você tem pendente, alertas de insumos que encareceram e o seu lucro estimado.
              </p>
              <p class="text-[10px] text-gray-400">
                <strong>Como usar:</strong> Entre aqui toda manhã. Se houver algum alerta em vermelho de "CMV quebrado" ou "Insumo encareceu", você sabe que precisa reajustar aquele preço.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-rose-500 space-y-2">
              <strong class="text-rose-800 dark:text-rose-400 block text-xs uppercase tracking-wider">🥩 2. Insumos e Sub-receitas (A Dispensa Eletrônica):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> Onde você cadastra os seus ingredientes crús comprados no atacado e ensina o sistema a calcular <strong>Sub-receitas</strong> (preparos da casa como maionese verde, blend de carnes e geleia de bacon).
              </p>
              <p class="text-[10px] text-gray-400">
                <strong>Como usar:</strong> Quando comprar bacon, queijo ou pão, lance aqui o preço do pacote fechado e informe se há perdas na preparação (descarte). Crie as sub-receitas para não ter que recalcular o custo da grama de maionese toda semana.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-indigo-500 space-y-2">
              <strong class="text-indigo-800 dark:text-indigo-400 block text-xs uppercase tracking-wider">📦 3. Fichas Técnicas / Produtos (Suas Receitas):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> Serve para montar a estrutura financeira exata de cada produto. Ele junta os insumos principais, guarnições, condimentos e até a embalagem para somar o custo básico (CMV).
              </p>
              <p class="text-[10px] text-gray-400">
                <strong>Como usar:</strong> Ao criar um novo lanche ou prato no cardápio, monte a ficha técnica dele grama por grama. O sistema calculará na hora o custo real de preparação dele.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-purple-500 space-y-2">
              <strong class="text-purple-800 dark:text-purple-400 block text-xs uppercase tracking-wider">🧮 4. Precificação por Canal (Sua Segurança Monetária):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> A calculadora mágica que faz o preço de forma reversa. Ela descobre o quanto você deve cobrar na mesa física, no iFood, na KeeTa ou no 99Food para sobrar o lucro que você deseja.
              </p>
              <p class="text-[10px] text-gray-400">
                <strong>Como usar:</strong> Nunca chute preço! Selecione o produto, selecione o canal de vendas e pegue o "Preço Sugerido" calculado para blindar seu bolso contra as garras das taxas.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-amber-500 space-y-2">
              <strong class="text-amber-800 dark:text-amber-400 block text-xs uppercase tracking-wider">🔌 5. Despesas Fixas (A Raiz das Contas):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> Onde você joga as contas que chegam todo mês de forma obrigatória (aluguel, telefone, internet, pro-labore, folha de pagamento, contador).
              </p>
              <p class="text-[10px] text-gray-400">
                <strong>Como usar:</strong> Sempre que pagar um boleto administrativo ou retirar seu salário da empresa, registre aqui escolhendo a categoria adequada para monitorar para onde o caixa está escorrendo.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-blue-500 space-y-2">
              <strong class="text-blue-800 dark:text-blue-400 block text-xs uppercase tracking-wider">🏁 6. Ponto de Equilíbrio (Seu Indicador de Paz):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> Um cálculo matemático que te diz em reais ou em número de pedidos o faturamento exato que seu negócio de alimentação precisa arrecadar para sair do prejuízo e começar a lucrar.
              </p>
              <p class="text-[10px] text-gray-400">
                <strong>Como usar:</strong> Descubra a sua meta de pedidos diários médios. Todo item vendido além do ponto de equilíbrio já é dinheiro limpo no seu bolso.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-orange-500 space-y-2">
              <strong class="text-orange-500 block text-xs uppercase tracking-wider">⚙️ 7. CFI da Empresa (As Engrenagens Mestras):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> Onde você cadastra os pilares básicos de precificação global: Pro-labore estimado, meta de lucro líquido, taxas de cartões e impostos.
              </p>
              <p class="text-[10px] text-gray-400">
                <strong>Como usar:</strong> Configure isso logo no primeiro dia de acesso com o suporte do Xande e não mexa mais, a não ser que os impostos ou custos gerais da loja subam muito.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-indigo-600 space-y-2">
              <strong class="text-indigo-400 block text-xs uppercase tracking-wider">🛒 8. Lista de Compras (Gestão de Insumos Automática):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> Calcula o quanto de carne, queijo, bacon e embalagens você precisa comprar no atacado para dar conta do movimento de vendas projetado para o período sem sobras que estragam na geladeira.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-emerald-600 space-y-2">
              <strong class="text-emerald-550 dark:text-emerald-400 block text-xs uppercase tracking-wider">💰 9. Relatório de Lucro (DRE Prático):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300">
                <strong>Para que serve:</strong> Revela de forma didática o resumo geral do mês. Se você faturou R$ 40 mil, mostra exatamente quantos mil reais foram para ingredientes, quantos para o iFood, impostos, aluguel e quanto sobrou de lucro líquido real de pro-labore.
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'ch14',
      chapterNum: '14',
      title: 'Capítulo 14: E-Book Bônus - O Livro de Ofertas Lucrativas (Método CFI e Combos Inteligentes)',
      shortDescription: 'O guia estratégico detalhado passo-a-passo ensinando como classificar seu cardápio em 4 listas e formular combos incríveis e promoções sem prejuízos.',
      icon: TrendingUp,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
      content: `
        <div class="space-y-6">
          <p class="text-base leading-relaxed">
            Seja muito bem-vindo ao seu bônus estratégico! Donos comuns olham para dias frios de movimento (segunda, terça, quarta) ou para a concorrência e o que fazem? <strong>Dão 20% de desconto geral e "rezam" para ter volume.</strong> Esse é o caminho clássico do prejuízo financeiro.
          </p>
          <p class="text-sm">
            Para criar promoções que vendem muito e, ao mesmo tempo, blindam e multiplicam seu lucro líquido real, você precisa dominar o <strong>Método do CFI de Xande e as engrenagens de cardápio</strong>. Tudo começa dividindo o seu cardápio em 4 Listas Inteligentes:
          </p>

          <h3 class="text-base font-bold text-gray-950 dark:text-gray-50 border-b border-gray-100 dark:border-white/10 pb-2">As 4 Listas Essenciais do Seu Cardápio</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans mt-2">
            <div class="bg-gray-100 dark:bg-white/5 p-4 rounded-xl">
              <strong class="text-emerald-600 dark:text-emerald-400 block mb-1">⭐ 1. Campeões de Vendas:</strong>
              São os 20% de pratos ou itens que geram 80% do faturamento da loja. Anote o CMV e o lucro líquido atual de cada um. A meta média de lucratividade líquida desses campeões é a chamada <strong>Régua da Casa</strong> (o número mestre para guiar descontos!).
            </div>
            <div class="bg-gray-100 dark:bg-white/5 p-4 rounded-xl">
              <strong class="text-amber-600 dark:text-amber-400 block mb-1">💤 2. Produtos Parados:</strong>
              Pratos, itens ou sobremesas que não saem do lugar. Antes de riscar do cardápio, investigamos: a foto está feia e escura? O preço está fora do mercado? Tem alguma concorrência interna errada com outro similar?
            </div>
            <div class="bg-gray-100 dark:bg-white/5 p-4 rounded-xl">
              <strong class="text-purple-600 dark:text-purple-400 block mb-1">🔥 3. Produtos Gordos (Turbinados):</strong>
              São os produtos com margem de lucro líquido acima da nossa média (Régua da Casa). Aqui moram os <strong>Produtos Turbinados</strong>! Itens com custo de produção baixíssimo e altíssima percepção de valor: porção de batata frita congelada, anéis de cebola, refrigerante em lata, milk shakes e maioneses caseiras extras. Um Produto Turbinado de sucesso precisa lucrar no mínimo <strong>10% mais</strong> que a Régua da Casa.
            </div>
            <div class="bg-gray-100 dark:bg-white/5 p-4 rounded-xl">
              <strong class="text-red-600 dark:text-red-400 block mb-1">💀 4. Produtos Magros (O Risco Máximo):</strong>
              São os produtos ou pratos cuja margem de contribuição é esmagada, geralmente abaixo da Régua da Casa. <strong>ALERTA CRÍTICO:</strong> Se um produto for um Campeão de Vendas E um Produto Magro ao mesmo tempo, sua empresa de alimentação está perdendo dinheiro em ritmo de trem-bala! Você trabalha demais, a cozinha vive cheia, mas o lucro seca por completo.
            </div>
          </div>

          <h3 class="text-base font-bold text-gray-950 dark:text-gray-50 border-b border-gray-100 dark:border-white/10 pb-2 mt-6">As 4 Receitas de Ofertas de Sucesso (O Passo-a-Passo)</h3>
          <p class="text-sm">
            Tendo as 4 Listas mapeadas, você tem o poder de criar quatro tipos específicos de promoções cirúrgicas de acordo com o seu objetivo diário. Veja como funcionam e como calcular cada uma delas:
          </p>

          <div class="space-y-4 text-xs font-sans">
            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-emerald-500 space-y-1">
              <strong class="text-emerald-800 dark:text-emerald-400 block mb-1 text-xs uppercase tracking-wider">🍟 Receita 1: Oferta do Dia (Combustível Operacional Diário):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300 font-medium text-xs">
                <strong>Para que serve:</strong> Estimular pedidos recorrentes de segunda a segunda sem corroer o caixa. É uma oferta de margem extremamente segura.
              </p>
              <p class="text-gray-650 dark:text-gray-300">
                <strong>Como formular:</strong> Combine um Produto Gordo (ex: prato gourmet de alta margem) com outro Produto Gordo ou Turbinado (ex: fritas médias + refrigerante lata). Como ambos já dão lucros ótimos isoladamente, mesmo oferecendo um pequeno desconto visual na soma dos itens, a transação acumulada do combo continua excelente. Pode rodar 24 horas por dia.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-amber-500 space-y-1">
              <strong class="text-amber-800 dark:text-amber-400 block mb-1 text-xs uppercase tracking-wider">💊 Receita 2: Oferta Salva-Margem (O Antídoto de Itens Magros):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300 font-medium text-xs">
                <strong>Para que serve:</strong> Salvar o faturamento de itens muito amados pelo público, mas de margem nula ou espremida (como pratos ou pratos básicos de almoço, que a concorrência de bairro joga o preço lá embaixo).
              </p>
              <div class="my-2 p-3 bg-white dark:bg-black/30 text-[11px] border border-gray-100 dark:border-white/10 rounded font-mono leading-relaxed text-gray-700 dark:text-gray-300">
                <strong>FÓRMULA DA MATEMÁTICA REAL DE XANDE:</strong><br/>
                Preço Sugerido do Combo = (CMV Item Principal Magro + CMV Insumo Turbinado) ÷ (1 - (CFI da Empresa + Régua da Casa desejada))
              </div>
              <p class="text-gray-655 dark:text-gray-300">
                <strong>Como apresentar ao cliente (O Formato Quebrado):</strong> O cliente compra o Item Magro pelo preço normal e, por <strong>"apenas R$ 4,90 adicionais"</strong>, ele adiciona a batata frita e o refrigerante em lata. Visualmente é irrecusável para o cliente. Mas nos bastidores do sistema, o lucro gigantesco do refrigerante lata e da porção de fritas cobre a insuficiência do item principal, elevando o rendimento final e o lucro total da venda!
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-indigo-500 space-y-1">
              <strong class="text-indigo-800 dark:text-indigo-400 block mb-1 text-xs uppercase tracking-wider">💣 Receita 3: Oferta Bomba de Vendas (Explosão de Volume em Dias Frios):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300 font-medium text-xs">
                <strong>Para que serve:</strong> Pagar o custo fixo (CFI) do negócio naqueles canais ou dias de movimento lento (geralmente terças ou quartas-feiras), quando a cozinha estaria ociosa e a equipe parada. Noites de "pista vazia" são pesadelos de lucro operacional.
              </p>
              <div class="my-2 p-3 bg-white dark:bg-black/30 text-[11px] border border-gray-100 dark:border-white/10 rounded font-mono leading-relaxed text-gray-700 dark:text-gray-300">
                <strong>FÓRMULA MATEMÁTICA:</strong><br/>
                Preço Sugerido da Bomba = (CMV Item Campeão + CMV Fritas Turbinada) ÷ (1 - (CFI da Empresa + Lucro Mínimo de Sobrevivência))
              </div>
              <p class="text-gray-655 dark:text-gray-300">
                <strong>Como planejar:</strong> Combinamos o maior Campeão do cardápio com um acompanhamento Turbinado. O lucro geral é espremido perto do mínimo (mas nunca abaixo de zero!), compensando a margem individual em troca de um volume maciço e estrondoso de clientes enviando mensagens de pedidos e fôlego de caixa.
              </p>
            </div>

            <div class="bg-gray-100 dark:bg-[#111827] border border-gray-200 dark:border-gray-800 p-4 rounded-xl border-l-4 border-l-red-500 space-y-1">
              <strong class="text-red-800 dark:text-red-400 block mb-1 text-xs uppercase tracking-wider">🚨 Receita 4: Oferta Chamariz (Extremo Alerta de Risco):</strong>
              <p class="leading-relaxed text-gray-600 dark:text-gray-300 font-medium text-xs">
                <strong>Para que serve:</strong> Ganhar novos clientes em ritmo acelerado, lançamentos estrondosos ou queima de estoque rápido que corre o risco de passar do ponto na dispensa.
              </p>
              <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                <strong>Como funciona:</strong> É um desconto hiper-agressivo, muitas vezes cortando o CFI ou vendendo produtos praticamente pelo preço de custo cru dos ingredientes (CMV). O perigo é evidente.
              </p>
              <div class="p-3 bg-red-50 dark:bg-red-950/20 text-brand-red rounded-lg font-bold border border-brand-red/20 text-[10px] leading-relaxed">
                ⚠️ REGRA DE OURO DE SEGURANÇA OPERACIONAL:<br/>
                Sendo uma oferta agressiva, ela NUNCA deve ser diária ou perpétua. Use apenas para: 1. Inaugurações ou aberturas de filiais, 2. Lançamento rápido de novos pratos/produtos, ou 3. Ações isoladas restritas ao máximo a 3 dias! Se virar rotina, os clientes só comprarão com cupom, quebrando a sustentabilidade do seu caixa no final do ciclo.
              </div>
            </div>
          </div>
        </div>
      `
    }
  ], []);

  const FAQ_ITEMS = useMemo(() => [
    {
      id: 'faq_1',
      question: 'O que significa cada cor no "Raio-X de Lucro Atual"?',
      answer: 'O sistema utiliza um semáforo de saúde financeira: o Vermelho indica que o preço praticado hoje está dando prejuízo (menor que o custo de insumo + despesas fixas); o Amarelo indica atenção, com margem líquida abaixo de 50% da sua meta mínima; e o Verde indica que o lucro desejado e os impostos estão totalmente assegurados.'
    },
    {
      id: 'faq_2',
      question: 'O que significa a sigla "CFI" e qual seu benefício prático?',
      answer: 'CFI significa Custos Fixos Integrados. Ela é a engrenagem mestre do sistema Lucro Fácil, que calcula de forma automática quanto cada item ou prato vendido precisa contribuir para pagar o aluguel, contador, funcionários e demais despesas físicas recorrentes, de forma simples e livre de jargões técnicos.'
    },
    {
      id: 'faq_3',
      question: 'Qual a diferença entre percentual do CMV e percentual do CFI?',
      answer: 'O CMV cuida de flutuações e descartes da cozinha de forma direta (insumos e ingredientes). O CFI faz a rateação do canhão de despesas invisíveis fixas (aluguel, salário administrativo, contabilidade) sobre o faturamento global bruto estimando o peso correto de cada prato para pagar o ambiente físico.'
    },
    {
      id: 'faq_4',
      question: 'Como funciona o fator de descarte para bacon e carne cortada?',
      answer: 'O fator de correção é alimentado pelo peso bruto inicial e o peso utilizável limpo. Se você perde gordura derretida ou sangramento, o sistema inflaciona de forma proporcional o valor da grama útil, garantindo que o desperdício comum da chapa seja cobrado no preço do cliente.'
    },
    {
      id: 'faq_5',
      question: 'Consigo gerenciar mais de uma loja no mesmo login?',
      answer: 'Sim! Logo no topo do painel principal você conta com uma área de gerenciamento Multi-Lojas. Você cria filiais independentes, lança faturamentos distintos e preserva a confidencialidade das contas separadas.'
    },
    {
      id: 'faq_6',
      question: 'Como a calculadora protege o preço contra as taxas do iFood?',
      answer: 'Ela utiliza o método do Markup Reversa por Denominador. Ou seja, ela calcula o imposto de forma recursiva de modo que, ao subtrair a fatia de 12% ou 23% do aplicativo acrescido do pagamento online, o valor líquido final em reais depositado em sua conta do banco seja idêntico ao do balcão de sua própria loja.'
    },
    {
      id: 'faq_7',
      question: 'O que é a "Régua da Casa" aplicada em promoções de combos?',
      answer: 'A Régua da Casa representa a meta média de rendimento e lucro extraída dos seus produtos Estrelas (Campeões de Vendas). Ela serve como guia e linha mestra para saber a taxa mínima viável de desconto ao planejar campanhas estratégicas.'
    }
  ], []);

  const MANUAL_CHAPTERS = useMemo(() => {
    return EBOOK_CHAPTERS.filter(ch => ch.id !== 'ch14');
  }, [EBOOK_CHAPTERS]);

  const BONUS_CHAPTER = useMemo(() => {
    return EBOOK_CHAPTERS.find(ch => ch.id === 'ch14') || EBOOK_CHAPTERS[EBOOK_CHAPTERS.length - 1];
  }, [EBOOK_CHAPTERS]);

  // Search filter implementation
  const filteredEbook = useMemo(() => {
    if (!searchTerm) return MANUAL_CHAPTERS;
    const lower = searchTerm.toLowerCase();
    return MANUAL_CHAPTERS.filter(ch => 
      ch.title.toLowerCase().includes(lower) || 
      ch.shortDescription.toLowerCase().includes(lower) ||
      ch.content.toLowerCase().includes(lower)
    );
  }, [searchTerm, MANUAL_CHAPTERS]);

  const matchesBonusSearch = useMemo(() => {
    if (!searchTerm) return false;
    const lower = searchTerm.toLowerCase();
    return (
      BONUS_CHAPTER.title.toLowerCase().includes(lower) ||
      BONUS_CHAPTER.shortDescription.toLowerCase().includes(lower) ||
      BONUS_CHAPTER.content.toLowerCase().includes(lower)
    );
  }, [searchTerm, BONUS_CHAPTER]);

  const filteredFAQ = useMemo(() => {
    if (!searchTerm) return FAQ_ITEMS;
    const lower = searchTerm.toLowerCase();
    return FAQ_ITEMS.filter(q => 
      q.question.toLowerCase().includes(lower) || 
      q.answer.toLowerCase().includes(lower)
    );
  }, [searchTerm, FAQ_ITEMS]);

  const isSearching = searchTerm.trim().length > 0;

  // Sync index to first search hit if typing
  useEffect(() => {
    if (isSearching && filteredEbook.length > 0) {
      const matchIndex = MANUAL_CHAPTERS.findIndex(c => c.id === filteredEbook[0].id);
      if (matchIndex !== -1) {
        setCurrentChapterIndex(matchIndex);
      }
    }
  }, [searchTerm, filteredEbook, MANUAL_CHAPTERS, isSearching]);

  const handleNextPage = () => {
    if (currentChapterIndex < MANUAL_CHAPTERS.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
    }
  };

  // Dynamically calculate reading progress bar for manual chapters
  const readingProgress = useMemo(() => {
    const readCount = readChapters.filter(id => id !== 'ch14').length;
    const totalCount = MANUAL_CHAPTERS.length;
    return Math.round((readCount / totalCount) * 100);
  }, [readChapters, MANUAL_CHAPTERS]);

  const handlePrintManual = () => {
    setPrintType('manual');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintBonus = () => {
    setPrintType('bonus');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintFull = () => {
    setPrintType('full');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const activeChapter = MANUAL_CHAPTERS[currentChapterIndex] || MANUAL_CHAPTERS[0];

  return (
    <div className="space-y-8 pb-20 relative z-10 font-sans print:p-0 print:space-y-0" id="main-help-view">
      
      {/* 1. HERO - GLASS CARD HEADER - HIDDEN ON PRINT */}
      <div className="glass-card border border-gray-200 dark:border-white/10 p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-xl print:hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none opacity-40"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                  <span className="bg-brand-red/10 text-brand-red px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest inline-block">
                    Manual Oficial & Presentes Estratégicos
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">
                    Ebook & Manual Lucro Fácil
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
                    Domine os segredos financeiros do seu negócio e multiplique seus lucros líquidos com a gente!
                  </p>
              </div>

              {/* XANDE CONSULTANT PROFILE */}
              <div className="flex items-center gap-4 bg-white/40 dark:bg-black/20 p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 backdrop-blur-md shrink-0 shadow-sm">
                 <div className="bg-brand-red text-white p-3 rounded-xl shadow-md border border-brand-red/35">
                    <BookOpen size={24} />
                 </div>
                 <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Autor</span>
                    <strong className="text-gray-950 dark:text-gray-50 text-base block">Xande</strong>
                    <span className="text-xs text-brand-red font-medium flex items-center gap-1">
                      <Sparkles size={11} /> Consultor do Lucro Fácil
                    </span>
                 </div>
              </div>
          </div>

          {/* SEARCH BAR */}
          <div className="relative group max-w-xl mx-auto mt-8">
              <div className="relative flex items-center bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 shadow-sm backdrop-blur-sm focus-within:border-brand-red transition">
                  <Search className="text-gray-400 mr-3" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar manual ou FAQ... (Ex: CFI, iFood, Perda, Combo)" 
                    className="w-full bg-transparent text-gray-900 dark:text-white text-sm outline-none placeholder-gray-400 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                     <button 
                       onClick={() => setSearchTerm('')} 
                       className="text-xs bg-gray-100 dark:bg-white/10 text-gray-400 px-2 py-1 rounded"
                     >
                       Limpar
                     </button>
                  )}
              </div>
          </div>
      </div>

      {/* 2. NAVIGATION SUBTABS - HIDDEN ON PRINT */}
      {!isSearching && (
          <div className="flex justify-center gap-4 md:gap-8 border-b border-gray-200 dark:border-white/10 pb-1 print:hidden overflow-x-auto scroller-hidden animate-fade-in">
              <button 
                onClick={() => setActiveTab('manual')}
                className={`pb-4 px-4 text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-4 shrink-0 ${activeTab === 'manual' ? 'border-brand-red text-gray-900 dark:text-white font-black' : 'border-transparent text-gray-400 hover:text-gray-650 dark:hover:text-white'}`}
              >
                  Manual do Sistema (13 Cap)
              </button>
              <button 
                onClick={() => setActiveTab('bonus')}
                className={`pb-4 px-4 text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-4 shrink-0 flex items-center gap-1.5 ${activeTab === 'bonus' ? 'border-amber-500 text-amber-500 font-black animate-pulse' : 'border-transparent text-gray-400 hover:text-amber-500/80'}`}
              >
                  <Gift size={14} /> 🎁 Ebook Bônus: Livro de Ofertas
              </button>
              <button 
                onClick={() => setActiveTab('faq')}
                className={`pb-4 px-4 text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-4 shrink-0 ${activeTab === 'faq' ? 'border-brand-red text-gray-900 dark:text-white font-black' : 'border-transparent text-gray-400 hover:text-gray-650 dark:hover:text-white'}`}
              >
                  Suporte & FAQ (Dúvidas)
              </button>
          </div>
      )}

      {/* 3. CORE CONTENT AREA */}
      <div className="max-w-6xl mx-auto px-1 print:p-0">
          
          {/* A. E-BOOK MANUAL VIEW */}
          {(activeTab === 'manual' || isSearching) && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block">
                  
                  {/* LEFT HAND - CHAPTERS INDEX COLUMN - HIDDEN ON PRINT */}
                  <div className="lg:col-span-4 space-y-6 print:hidden">
                      
                      {/* MINI EBOOK CARD COVERS */}
                      <div className="glass-card border border-gray-200 dark:border-white/10 p-6 rounded-2xl space-y-4 shadow-sm bg-gradient-to-br from-white/70 via-white/40 to-transparent dark:from-white/05 dark:via-white/02">
                          <div className="flex gap-4">
                             {/* COVER LOGO GRAPHIC */}
                             <div className="w-16 h-24 bg-gradient-to-tr from-brand-red to-orange-500 rounded-lg flex flex-col justify-between p-2 shadow-md relative overflow-hidden shrink-0">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <BookOpen className="text-white relative z-10" size={16} />
                                <span className="text-[8px] font-black tracking-tighter text-white uppercase relative z-10 break-words leading-tight">
                                   LUCRO FÁCIL
                                </span>
                             </div>
                             <div className="space-y-1">
                                <h3 className="text-sm font-bold text-gray-950 dark:text-gray-100 uppercase tracking-tight leading-tight">
                                   O Manual de Sucesso do Lucro Fácil
                                </h3>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                   Método CFI Descomplicado
                                </p>
                                <div className="flex items-center gap-2 pt-1 text-xs">
                                   <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold">
                                      {MANUAL_CHAPTERS.length} CAPÍTULOS
                                   </span>
                                </div>
                             </div>
                          </div>

                          {/* LEARNING PROGRESS TRACKER */}
                          <div className="space-y-1.5 border-t border-gray-100 dark:border-white/10 pt-4">
                             <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                                <span>Progresso de Leitura</span>
                                <span>{readingProgress}% concluído</span>
                             </div>
                             <div className="w-full bg-gray-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-brand-red h-full transition-all duration-500" style={{ width: `${readingProgress}%` }}></div>
                             </div>
                             <span className="text-[10px] italic text-gray-400 block text-right pt-0.5">
                                Lidos {readChapters.filter(id => id !== 'ch14').length} de {MANUAL_CHAPTERS.length} capítulos
                             </span>
                          </div>

                          {/* DOWNLOAD/PRINT BUTTON */}
                          <div className="pt-2">
                             <button
                               onClick={handlePrintManual}
                               className="w-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 p-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                             >
                               <Printer size={14} /> Imprimir Manual
                             </button>
                             <span className="text-[9px] text-gray-400 block text-center mt-1.5 leading-normal">
                               Gera um arquivo PDF completo do Manual (13 Cap) para ler offline ou imprimir de forma limpa.
                             </span>
                          </div>
                      </div>

                      {/* CHAPTER SELECTOR LIST */}
                      <div className="glass-card border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                          <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-gray-150 dark:border-white/10 flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                             <span>Sumário de Capítulos</span>
                             <span className="text-[10px] bg-brand-red/10 text-brand-red font-bold px-1.5 py-0.5 rounded">
                                {MANUAL_CHAPTERS.length} itens
                             </span>
                          </div>
                          <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-[460px] overflow-y-auto">
                             {filteredEbook.map((ch, idx) => {
                                const indexInMain = MANUAL_CHAPTERS.findIndex(c => c.id === ch.id);
                                const isSelected = currentChapterIndex === indexInMain;
                                const isRead = readChapters.includes(ch.id);
                                return (
                                   <button
                                     key={ch.id}
                                     onClick={() => {
                                       setCurrentChapterIndex(indexInMain);
                                       setActiveTab('manual');
                                     }}
                                     className={`w-full text-left p-4 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-between gap-3 text-xs ${isSelected ? 'bg-brand-red/5 dark:bg-brand-red/10 border-l-4 border-brand-red font-bold text-gray-950 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                   >
                                      <div className="space-y-0.5">
                                         <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest block font-bold">
                                            Capítulo {ch.chapterNum}
                                         </span>
                                         <span className={`block truncate max-w-[210px] font-sans ${isSelected ? 'text-gray-950 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                            {ch.title.substring(ch.title.indexOf(':') + 1).trim()}
                                         </span>
                                      </div>
                                      
                                      {/* PROGRESS MARK */}
                                      <div 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleChapterRead(ch.id);
                                        }}
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 ${isRead ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-white/20 hover:border-emerald-500'}`}
                                      >
                                         {isRead && <Check size={12} strokeWidth={3} />}
                                      </div>
                                   </button>
                                );
                             })}
                             {filteredEbook.length === 0 && (
                                <div className="p-6 text-center text-gray-400 text-xs italic">
                                   Nenhum capítulo atinge sua busca.
                                </div>
                             )}
                          </div>
                      </div>

                  </div>

                  {/* RIGHT HAND - MAIN ACTIVE READER PANEL */}
                  <div className="lg:col-span-8 space-y-6 print:block print:w-full">
                      
                      {/* ONLINE EBOOK READER - GLASS CONTAINER - HIDDEN ON PRINT */}
                      <div className="glass-card border border-gray-200 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-md min-h-[500px] flex flex-col justify-between static print:hidden">
                         
                         {/* READER ACTIONS / METADATA */}
                         <div className="border-b border-gray-150 dark:border-white/5 pb-4 mb-6 flex flex-wrap gap-4 justify-between items-center text-xs">
                             <div className="flex items-center gap-2">
                                <span className={`p-2 rounded-lg font-bold text-xs ${activeChapter.color}`}>
                                   Cap {activeChapter.chapterNum}
                                </span>
                                <div>
                                   <strong className="text-gray-400 uppercase tracking-widest block text-[9px] font-bold">Lendo como Ebook</strong>
                                   <span className="text-gray-900 dark:text-white font-medium">Instruções para Leigos do Lucro Fácil</span>
                                </div>
                             </div>

                             {/* FONT RESIZE ACTION CONTROLS */}
                             <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-gray-200/40 dark:border-white/10">
                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider mr-1">Fonte</span>
                                <button
                                  onClick={() => setFontSize(prev => Math.max(prev - 1, 12))}
                                  disabled={fontSize <= 12}
                                  className="w-5 h-5 flex items-center justify-center font-bold font-sans text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-35"
                                  title="Diminuir Fonte"
                                >
                                   A-
                                </button>
                                <span className="text-xs font-mono font-black text-gray-800 dark:text-gray-100 px-1">{fontSize}px</span>
                                <button
                                  onClick={() => setFontSize(prev => Math.min(prev + 1, 24))}
                                  disabled={fontSize >= 24}
                                  className="w-5 h-5 flex items-center justify-center font-bold font-sans text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-35"
                                  title="Aumentar Fonte"
                                >
                                   A+
                                </button>
                              </div>
                         </div>

                         {/* DYNAMIC SCROLL READING BODY CONTAINER */}
                         <div className="flex-1 space-y-6">
                            
                            {/* MARK CHAPTER AS CONCLUDED CHECK */}
                            <div className="flex justify-between items-start gap-4">
                                <h2 className="text-xl md:text-2xl font-black text-gray-950 dark:text-gray-50 uppercase tracking-tight font-sans">
                                   {activeChapter.title}
                                </h2>
                                <button
                                  onClick={() => toggleChapterRead(activeChapter.id)}
                                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border tracking-wider transition ${readChapters.includes(activeChapter.id) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-transparent border-gray-300 dark:border-white/15 text-gray-400 hover:text-gray-950 dark:hover:text-white'}`}
                                >
                                   {readChapters.includes(activeChapter.id) ? '✓ Concluído' : 'Marcar Lido'}
                                </button>
                            </div>

                            {/* CHAPTER HTML BODY */}
                            <div 
                              className="text-gray-700 dark:text-gray-200 leading-relaxed font-sans prose prose-indigo max-w-none prose-xs"
                              style={{ fontSize: `${fontSize}px` }}
                              dangerouslySetInnerHTML={{ __html: activeChapter.content }} 
                            />

                         </div>

                         {/* READER PAGINATION NAVIGATION ACTION BUTTONS */}
                         <div className="border-t border-gray-150 dark:border-white/5 pt-6 mt-8 flex justify-between items-center">
                            <button
                              onClick={handlePrevPage}
                              disabled={currentChapterIndex === 0}
                              className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-950 dark:hover:text-white transition disabled:opacity-30 disabled:pointer-events-none"
                            >
                               <ArrowLeft size={16} /> Capítulo Anterior
                            </button>

                            <span className="text-xs font-mono text-gray-400 font-bold">
                               {currentChapterIndex + 1} de {MANUAL_CHAPTERS.length}
                            </span>

                            {currentChapterIndex < MANUAL_CHAPTERS.length - 1 ? (
                              <button
                                onClick={handleNextPage}
                                className="flex items-center gap-2 text-xs font-bold text-brand-red hover:opacity-85 transition"
                              >
                                Próximo Capítulo <ArrowRight size={16} />
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                Manual Concluído! 🎉
                              </span>
                            )}
                         </div>

                      </div>

                  </div>

              </div>
          )}

          {/* B. DETACHED PRESENTATION FOR E-BOOK BONUS (🎁 SEU PRESENTE EXCLUSIVO) */}
          {(activeTab === 'bonus') && (
              <div className="space-y-8 animate-fade-in print:hidden">
                  
                  {/* PRESENT NOTIFICATION COVER STRIP */}
                  <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] pointer-events-none"></div>
                      <div className="space-y-2 relative z-10 text-center md:text-left">
                          <span className="bg-white/20 text-white font-extrabold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest inline-block border border-white/20">
                             Presente de Mentoria Financeira
                          </span>
                          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                             O Livro de Ofertas Lucrativas
                          </h2>
                          <p className="text-white/90 text-sm max-w-2xl font-medium">
                             O guia estratégico complementar oficial para classificar seu cardápio em 4 listas e formular combos matadores de margem blindada no Método CFI.
                          </p>
                      </div>

                      <div className="relative z-10 shrink-0 select-none">
                          <button
                            onClick={handlePrintBonus}
                            className="bg-white text-orange-600 font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                          >
                             <Download size={16} /> Baixar E-Book (PDF)
                          </button>
                      </div>
                  </div>

                  {/* PREMIUM SPLIT GRID: LEFT COVERS & INFO, RIGHT INTERACTIVE SIMULATOR */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* LEFT: BOOK OVERVIEW & SUMMARY SHEETS */}
                      <div className="lg:col-span-7 space-y-8">
                          
                          {/* EDITORTIAL INTRO CARD */}
                          <div className="glass-card border border-gray-200 dark:border-white/10 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center font-bold">
                                      <Gift size={20} />
                                  </div>
                                  <div>
                                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">A Metodologia do E-Book</h3>
                                      <p className="text-xs text-gray-400 font-medium">Por Xande - Seu Consultor financeiro pessoal de bolso</p>
                                  </div>
                              </div>

                              <p className="text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-sans">
                                Donos tradicionais olham para a concorrência e dão 20% de desconto geral. Esse é o cemitério de lucro! O segredo é ter <strong>inteligência cirúrgica</strong> combinando produtos de baixo custo e alta venda com o Método CFI da sua empresa. Todo o seu cardápio deve ser dividido meticulosamente em <strong>4 Listas Universais</strong>:
                              </p>

                              {/* THE 4 LISTS CARDS */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 space-y-1.5 transition-all hover:translate-y-[-2px]">
                                      <strong className="text-emerald-700 dark:text-emerald-400 text-xs uppercase flex items-center gap-1.5 font-bold">
                                          <span>⭐</span> 1. Campeões de Vendas
                                      </strong>
                                      <p className="text-[11px] leading-relaxed text-gray-650 dark:text-gray-300">
                                          Os 20% que fazem 80% do giro. O rendimento médio deles dita sua <strong>Régua da Casa</strong>, o número mestre para guiar descontos.
                                      </p>
                                  </div>

                                  <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-1.5 transition-all hover:translate-y-[-2px]">
                                      <strong className="text-amber-700 dark:text-amber-400 text-xs uppercase flex items-center gap-1.5 font-bold">
                                          <span>💤</span> 2. Produtos Parados
                                      </strong>
                                      <p className="text-[11px] leading-relaxed text-gray-650 dark:text-gray-300">
                                          Produtos sem saída. Investigamos foto, preço cobrado, ou se outro item similar o canibaliza antes de cortar.
                                      </p>
                                  </div>

                                  <div className="p-4 bg-purple-500/5 dark:bg-purple-500/10 rounded-2xl border border-purple-500/20 space-y-1.5 transition-all hover:translate-y-[-2px]">
                                      <strong className="text-purple-700 dark:text-purple-400 text-xs uppercase flex items-center gap-1.5 font-bold">
                                          <span>🔥</span> 3. Produtos Gordos/Turbinados
                                      </strong>
                                      <p className="text-[11px] leading-relaxed text-gray-650 dark:text-gray-300">
                                          Baixo custo e alto giro ou margem (Frituras, Milk Shake, Bebida Lata). Devem render 10% a mais que a Régua da Casa.
                                      </p>
                                  </div>

                                  <div className="p-4 bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-rose-500/20 space-y-1.5 transition-all hover:translate-y-[-2px]">
                                      <strong className="text-rose-700 dark:text-rose-400 text-xs uppercase flex items-center gap-1.5 font-bold">
                                          <span>💀</span> 4. Produtos Magros
                                      </strong>
                                      <p className="text-[11px] leading-relaxed text-gray-650 dark:text-gray-300">
                                          Margem líquida esmagada. Se um Campeão de Vendas também for Magro, <strong>você está sangrando dinheiro!</strong>
                                      </p>
                                  </div>
                              </div>
                          </div>

                          {/* THE 4 PROMOTIONAL RECIPES WITH IMAGES */}
                          <div className="space-y-6">
                              <h3 className="text-lg font-black text-gray-950 dark:text-gray-50 uppercase tracking-tight">
                                  As 4 Receitas de Ofertas de Xande (Formulação Cruzada)
                              </h3>

                              <div className="space-y-4">
                                  
                                  {/* RECIPE 1 */}
                                  <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                                      <div className="md:w-1/3 relative h-32 md:h-auto min-h-[140px]">
                                          <img 
                                            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop" 
                                            alt="Oferta do dia hamburguer bacon" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 md:hidden">
                                              <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Receita 1</span>
                                          </div>
                                      </div>
                                      <div className="p-5 md:w-2/3 space-y-1.5">
                                          <div className="hidden md:flex items-center gap-2">
                                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono">Receita 1</span>
                                              <strong className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Segurança Total</strong>
                                          </div>
                                          <h4 className="text-base font-bold text-gray-950 dark:text-gray-50 leading-tight">Oferta do Dia (Roda Sempre)</h4>
                                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                                              Combina um <strong>Produto Gordo</strong> (item premium de alta margem) com um <strong>Turbinado</strong> (Coke gelada ou fritas de saco). Como ambos têm custos excelentes, o desconto pequeno não afeta sua sobrevivência. Liberação diária garantida!
                                          </p>
                                      </div>
                                  </div>

                                  {/* RECIPE 2 */}
                                  <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                                      <div className="md:w-1/3 relative h-32 md:h-auto min-h-[140px]">
                                          <img 
                                            src="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=600&auto=format&fit=crop" 
                                            alt="Fritas crocantes douradas" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 md:hidden">
                                              <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Receita 2</span>
                                          </div>
                                      </div>
                                      <div className="p-5 md:w-2/3 space-y-1.5">
                                          <div className="hidden md:flex items-center gap-2">
                                              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono font-bold">Receita 2</span>
                                              <strong className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">Markup Reversa</strong>
                                          </div>
                                          <h4 className="text-base font-bold text-gray-950 dark:text-gray-50 leading-tight">Oferta Salva-Margem (Antídoto de Magros)</h4>
                                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                                              Desenvolvida para compensar lanches queridinhos com custos de carne/queijo pesados (Lanches Magros). Nós agregamos a Batata Frita e Refri cobrando um valor reduzido por eles. Na cabeça do cliente é um super desconto; mas nos bastidores, o markup gigante do refri e da fritas engole o prejuízo do hamburger, alavancando o caixa global!
                                          </p>
                                      </div>
                                  </div>

                                  {/* RECIPE 3 */}
                                  <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                                      <div className="md:w-1/3 relative h-32 md:h-auto min-h-[140px]">
                                          <img 
                                            src="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop" 
                                            alt="Refrigerante em lata gelado" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 md:hidden">
                                              <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Receita 3</span>
                                          </div>
                                      </div>
                                      <div className="p-5 md:w-2/3 space-y-1.5">
                                          <div className="hidden md:flex items-center gap-2">
                                              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono font-bold">Receita 3</span>
                                              <strong className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold">Volume no Frio</strong>
                                          </div>
                                          <h4 className="text-base font-bold text-gray-950 dark:text-gray-50 leading-tight">Bomba de Vendas (Volume em Dias Parados)</h4>
                                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                                              Arraste faturamento nas segundas ou terças-feiras de movimento nulo. Unimos o campeão com o turbinado reduzindo a margem final de lucro líquido ao patamar mínimo tolerado pelo seu CFI geral. Isso gera movimento absurdo e paga suas contas fixas no silêncio da noite ociosa!
                                          </p>
                                      </div>
                                  </div>

                                  {/* RECIPE 4 */}
                                  <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm space-y-2 border-l-4 border-l-red-500">
                                      <div className="flex items-center gap-2">
                                          <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black px-2 py-0.5 rounded uppercase font-mono font-bold">Receita 4</span>
                                          <strong className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Cuidado Crítico</strong>
                                      </div>
                                      <h4 className="text-base font-bold text-gray-950 dark:text-gray-50 leading-tight flex items-center gap-2">
                                          Oferta Chamariz (Apenas Inaugurações ou Alertas)
                                      </h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
                                          Corta as margens na carne vendendo quase pelo custo bruto da cozinha (CMV). <strong>NUNCA use no dia a dia.</strong> Serve apenas para inauguração de novas filiais, lançar sabores ou escoar estoque à beira do vencimento. Se virar rotina, sua loja quebra.
                                      </p>
                                  </div>

                              </div>
                          </div>

                      </div>

                      {/* RIGHT: INTERACTIVE CALCULATOR (SIMULADOR DE OFERTAS DE XANDE) */}
                      <div className="lg:col-span-5 space-y-6">
                          
                          {/* STYLISH GRADIENT MINI EMBEDDED PHONE SIMULATOR */}
                          <div className="bg-gray-950 text-white rounded-[2.5rem] border-8 border-gray-800 dark:border-gray-900 shadow-2xl overflow-hidden flex flex-col relative max-w-sm mx-auto">
                              
                              {/* STATUS BAR WITH XANDE LOGO BRAND */}
                              <div className="bg-gray-900 px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-800">
                                  <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Xande Inteligente Live</span>
                                  </div>
                                  <div className="text-xs font-bold text-gray-400">Método CFI</div>
                              </div>

                              {/* LIVE SCREEN CONTAINER */}
                              <div className="p-5 space-y-4">
                                  <div className="space-y-1 text-center">
                                      <div className="bg-amber-500 text-gray-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase inline-block mx-auto mb-1 tracking-wider">
                                          Simulador de Combos
                                      </div>
                                      <h3 className="text-sm font-black uppercase text-gray-150">Crie Sua Promoção Segura</h3>
                                      <p className="text-[10px] text-gray-400">Digite seu custo e descubra o preço com lucro blindado!</p>
                                  </div>

                                  {/* SELECT PROMO FORM TYPE */}
                                  <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
                                      <button
                                        onClick={() => {
                                          setPromoType('salva_margem');
                                          setReguaTarget(25); // Target normal
                                        }}
                                        className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase transition ${promoType === 'salva_margem' ? 'bg-amber-500 text-gray-950 font-black' : 'text-gray-400 hover:text-white'}`}
                                      >
                                          Salva-Margem
                                      </button>
                                      <button
                                        onClick={() => {
                                          setPromoType('bomba');
                                          setReguaTarget(12); // Low survival margin
                                        }}
                                        className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase transition ${promoType === 'bomba' ? 'bg-amber-500 text-gray-950 font-black' : 'text-gray-400 hover:text-white'}`}
                                      >
                                          Bomba Vendas
                                      </button>
                                  </div>

                                  {/* SIMULATOR INPUTS */}
                                  <div className="space-y-3 bg-gray-900/60 p-4 rounded-2xl border border-gray-800 text-xs">
                                      
                                      {/* HAMBURGER COST INPUT */}
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex justify-between">
                                              <span>🍔 Custo do Hamburger Principal (CMV)</span>
                                              <span className="text-white font-mono">R$ {costBase.toFixed(2)}</span>
                                          </label>
                                          <input 
                                            type="range" 
                                            min="3.00" 
                                            max="25.00" 
                                            step="0.50"
                                            value={costBase} 
                                            onChange={(e) => setCostBase(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                          />
                                      </div>

                                      {/* TURBINADO COST INPUT */}
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex justify-between">
                                              <span>🍟 Custo Combo Turbinado (Batata + Coca)</span>
                                              <span className="text-white font-mono">R$ {costTurbinado.toFixed(2)}</span>
                                          </label>
                                          <input 
                                            type="range" 
                                            min="1.00" 
                                            max="12.00" 
                                            step="0.20"
                                            value={costTurbinado} 
                                            onChange={(e) => setCostTurbinado(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                          />
                                      </div>

                                      {/* TARGET REGUA MARGIN SLIDER */}
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex justify-between">
                                              <span>🎯 Lucro Alvo Desejado (Margem %)</span>
                                              <span className="text-amber-400 font-mono font-bold">{reguaTarget}%</span>
                                          </label>
                                          <input 
                                            type="range" 
                                            min="8" 
                                            max="35" 
                                            step="1"
                                            value={reguaTarget} 
                                            onChange={(e) => setReguaTarget(parseInt(e.target.value))}
                                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                          />
                                      </div>

                                      {/* CFI GLOBAL SLIDER */}
                                      <div className="space-y-1">
                                          <label className="text-[10px] font-bold tracking-wider text-gray-400 uppercase flex justify-between">
                                              <span>⚙️ CFI da Empresa (Custos Fixos %)</span>
                                              <span className="text-white font-mono">{cfiValue}%</span>
                                          </label>
                                          <input 
                                            type="range" 
                                            min="5" 
                                            max="30" 
                                            step="1"
                                            value={cfiValue} 
                                            onChange={(e) => setCfiValue(parseInt(e.target.value))}
                                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                          />
                                      </div>

                                  </div>

                                  {/* DINAMIC RESULT MATH SPLIT BLOCKS */}
                                  <div className="space-y-2 bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl text-gray-950 font-sans shadow-lg text-center">
                                      <span className="text-[9px] uppercase font-black tracking-widest text-black/60 block">Preço Sugerido Reversa CFI</span>
                                      <strong className="text-3xl font-black text-black block tracking-tight">
                                          R$ {suggestedPriceCombo > 0 ? suggestedPriceCombo.toFixed(2) : "0.00"}
                                      </strong>
                                      <div className="border-t border-black/10 pt-2 text-[10px] font-bold flex justify-between text-black/85">
                                          <span>Soma de Custos: R$ {(costBase + costTurbinado).toFixed(2)}</span>
                                          <span>Margem + CFI: {cfiValue + reguaTarget}%</span>
                                      </div>
                                  </div>

                                  {/* XANDE ADVICE SPEECH BOX */}
                                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex gap-3 items-start">
                                      <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-bold text-xs shrink-0 border border-brand-red/30">
                                          L
                                      </div>
                                      <div className="space-y-1">
                                          <strong className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Conselho do Xande:</strong>
                                          <p className="text-[10px] text-gray-300 leading-relaxed font-sans">
                                              {promoType === 'salva_margem' ? (
                                                  `Parceiro, use o "Formato Quebrado"! Venda seu sanduíche principal magro de forma individual por R$ ${(costBase * 2.2).toFixed(0)}.90 e ofereça "adicionar fritas médias + refrigerante lata por apenas R$ ${(suggestedPriceCombo - (costBase * 2.2)).toFixed(2)}!". É irrecusável e sua margem sobe!`
                                              ) : (
                                                  `Para a "Bomba de Vendas", a margem de ${reguaTarget}% é apertada, mas é ideal para atrair clientes em massa nas terças-feiras frias. Não altere o preço do salão de sempre, divulgue essa oferta exclusiva para os apps nos horários das 18h às 21h!`
                                              )}
                                          </p>
                                      </div>
                                  </div>

                              </div>
                          </div>

                      </div>

                  </div>

              </div>
          )}



          {/* B. FAQ TAB VIEW - COLLAPSED ACCORDION LISTS - HIDDEN ON PRINT */}
          {(activeTab === 'faq' || isSearching) && filteredFAQ.length > 0 && (
              <div className="space-y-4 max-w-4xl mx-auto print:hidden">
                  {isSearching && <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-4 border-l-4 border-brand-red pl-2 mt-4">Resultados Rápidos em FAQ</h3>}
                  
                  {filteredFAQ.map((faq) => {
                      const isOpen = expandedFAQ[faq.id] || isSearching;
                      return (
                          <div key={faq.id} className="glass-card border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all">
                              <button 
                                onClick={() => toggleFAQ(faq.id)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-black/5 dark:hover:bg-white/5 transition"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/15 text-gray-600 dark:text-gray-300 shrink-0">
                                          <MessageCircleQuestion size={18} />
                                      </div>
                                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 pr-4 font-sans">{faq.question}</h3>
                                  </div>
                                  <div className="text-gray-400 shrink-0 p-2">
                                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </div>
                              </button>
                              
                              {isOpen && (
                                  <div className="px-8 pb-8 pt-2">
                                      <p className="text-gray-650 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4 font-sans">
                                          {faq.answer}
                                      </p>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          )}

          {/* NO FAQ SEARCH RESULTS FALLBACK */}
          {activeTab === 'faq' && filteredFAQ.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm italic print:hidden">
                  Nenhuma pergunta frequente encontrada para "{searchTerm}".
              </div>
          )}

      </div>

      {/* 4. PRINT-ONLY COMPLETE MASTER BOOK REPRESENTATION */}
      {/* This renders only on print, with strict white background, high contrast, styling for paper. */}
      <div className="hidden print:block text-black bg-white font-sans p-12 max-w-4xl mx-auto space-y-12" id="print-ebook-root">
          
          {/* A. MANUAL COVER AND CHAPTERS */}
          {(printType === 'manual' || printType === 'full') && (
              <div className="space-y-12">
                  <div className="text-center pb-16 border-b-4 border-black space-y-4">
                     <span className="font-bold text-xs uppercase tracking-widest bg-black text-white px-3 py-1 rounded">
                        Lucro Fácil Pro - Manual do Usuário
                     </span>
                     <h1 className="text-4xl font-extrabold uppercase tracking-tight mt-4">
                        O Manual Prático do Lucro Fácil
                     </h1>
                     <h2 className="text-xl font-medium text-gray-750 leading-relaxed max-w-2xl mx-auto">
                        Como Dominar o CMV, CFI e as Margens de Lucro do Seu Negócio de Alimentação sem Complicação ou Jargão
                     </h2>
                     <div className="py-8">
                        <p className="text-sm"><strong>Autor:</strong> Xande (Consultor Financeiro de Bolso)</p>
                        <p className="text-xs text-gray-500 mt-2">© {new Date().getFullYear()} Lucro Fácil. Todos os direitos reservados.</p>
                     </div>
                  </div>

                  <div className="page-break"></div>

                  {/* Loop and render Manual chapters consecutively with clean typography */}
                  {MANUAL_CHAPTERS.map((ch) => (
                     <div key={ch.id} className="py-8 space-y-4 page-break break-after-page border-b border-gray-200 pb-12 text-sm">
                        <h2 className="text-2xl font-black uppercase text-black border-l-4 border-black pl-3 mb-6">
                           Capítulo {ch.chapterNum}: {ch.title.substring(ch.title.indexOf(':') + 1).trim()}
                        </h2>
                        <div 
                          className="text-gray-900 leading-relaxed space-y-4 prose max-w-none text-justify"
                          dangerouslySetInnerHTML={{ __html: ch.content }}
                        />
                     </div>
                  ))}

                  {/* Simple Clean Printable FAQ */}
                  <div className="py-12 space-y-6 page-break break-before-page">
                     <h2 className="text-2xl font-black uppercase text-black border-l-4 border-black pl-3 mb-8">
                        Perguntas Frequentes (FAQ)
                     </h2>
                     <div className="space-y-8">
                        {FAQ_ITEMS.map((q, idx) => (
                           <div key={idx} className="space-y-2">
                               <strong className="text-sm font-extrabold block">Dúvida {idx + 1}: {q.question}</strong>
                               <p className="text-xs text-gray-700 font-sans leading-relaxed pl-4 border-l border-gray-300">
                                  {q.answer}
                               </p>
                           </div>
                        ))}
                     </div>
                  </div>
              </div>
          )}

          {/* PAGE BREAK BETWEEN MANUAL & BONUS IF PRINTING FULL */}
          {printType === 'full' && <div className="page-break"></div>}

          {/* B. BONUS COVER AND CHAPTERS */}
          {(printType === 'bonus' || printType === 'full') && (
              <div className="space-y-12">
                  <div className="text-center pb-16 border-b-4 border-amber-500 space-y-4">
                     <span className="font-bold text-xs uppercase tracking-widest bg-amber-500 text-black px-3 py-1 rounded">
                        🎁 Presente Especial - E-Book Bônus
                     </span>
                     <h1 className="text-4xl font-extrabold uppercase tracking-tight mt-4 text-amber-650">
                        O Livro de Ofertas Lucrativas
                     </h1>
                     <h2 className="text-xl font-medium text-gray-750 leading-relaxed max-w-2xl mx-auto">
                        A Engenharia de Cardápio em 4 Listas e 4 Fórmulas de Combos Blindados no Método CFI do Seu Negócio de Alimentação
                     </h2>
                     <div className="py-8">
                        <p className="text-sm"><strong>Autor:</strong> Xande (Consultor Financeiro de Bolso)</p>
                        <p className="text-xs text-gray-500 mt-2">© {new Date().getFullYear()} Lucro Fácil. Conteúdo Exclusivo.</p>
                     </div>
                  </div>

                  <div className="page-break"></div>

                  {/* Render the Bonus Chapter content cleanly */}
                  <div className="py-8 space-y-4 page-break text-sm">
                     <h2 className="text-3xl font-black uppercase text-black border-l-4 border-amber-500 pl-3 mb-6">
                        {BONUS_CHAPTER.title}
                     </h2>
                     <div 
                       className="text-gray-900 leading-relaxed space-y-4 prose max-w-none text-justify pb-12"
                       dangerouslySetInnerHTML={{ __html: BONUS_CHAPTER.content }}
                     />
                  </div>

                  <div className="p-8 bg-gray-100 rounded-2xl border-l-4 border-amber-500 text-xs space-y-2">
                     <strong className="block text-sm uppercase font-bold">Recado Final do Xande:</strong>
                     <p className="text-gray-700 leading-relaxed font-sans">
                        Parceiro, ter um negócio de sucesso na alimentação não é sobre cozinhar até cansar, é sobre gerenciar com os números no comando. Use estas formulas de Ofertas do Dia, Oferta Salva-Margem e Bomba de Vendas para guiar seus descontos com segurança. Nos vemos no topo!
                     </p>
                  </div>
              </div>
          )}

      </div>

      {/* Embedded print css overrides and responsive pagination details */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Force hide layout page container items */
          header, footer, nav, .print\\:hidden, #main-sidebar-navigator, #header-control-strip {
             display: none !important;
          }
          body {
             background: white !important;
             color: black !important;
             padding: 0 !important;
             margin: 0 !important;
          }
          #main-help-view {
             padding: 0 !important;
          }
          /* Show print content root exclusively */
          #print-ebook-root {
             display: block !important;
             visibility: visible !important;
          }
          /* Clean Break chapters neatly */
          .page-break {
             page-break-before: always !important;
             break-before: page !important;
          }
        }
      `}} />

    </div>
  );
};

export default Help;
