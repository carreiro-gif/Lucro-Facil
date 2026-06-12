import React, { useState, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronUp, BookOpen, 
  Sparkles, DollarSign, TrendingUp, Info
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Section {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  articles: Article[];
}

const Help: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    'loja-primeira-vez': true // Open the first article by default to welcome users
  });

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenXandeChat = () => {
    // Open the floating chat window of Xande
    window.dispatchEvent(new CustomEvent('open-floating-chat'));
  };

  const sections: Section[] = useMemo(() => [
    {
      id: 'primeiros-passos',
      title: 'Primeiros Passos',
      description: 'Aprenda como configurar o sistema no sentido correto e prepare-se para lucrar.',
      icon: BookOpen,
      articles: [
        {
          id: 'loja-primeira-vez',
          title: 'Como configurar sua loja pela primeira vez',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                Configurar seu sistema do zero de forma correta garante que os relatórios e os preços sugeridos de venda sejam <strong>100% corretos</strong>. Se você preencher em ordem aleatória, pode haver distorções. 
              </p>
              <p className="text-amber-400 font-semibold">
                Siga rigorosamente esta ordem estratégica de configuração:
              </p>
              <div className="space-y-4 mt-3">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">1</span>
                  <div>
                    <h4 className="font-bold text-gray-200 text-sm">Registrar as Despesas Fixas</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Acesse a tela de <strong>Despesas</strong> e cadastre todos os boletos recorrentes do mês: aluguel, luz, internet, pro-labore (retirada mensal do dono), folha de salários do time fixo e ferramentas de software.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">2</span>
                  <div>
                    <h4 className="font-bold text-gray-200 text-sm">Configurar o CFI (Custos Fixos Integrados)</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Vá em <strong>CFI da Empresa</strong> para parametrizar suas margens metas, impostos médios e a taxa base das maquininhas de cartão da loja física.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">3</span>
                  <div>
                    <h4 className="font-bold text-gray-200 text-sm">Registrar seu Faturamento</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Fale ao sistema na seção de faturamento quanto a loja de alimentação costuma vender ou vendeu no mês. Isso nos permite achar o peso exato do CFI.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">4</span>
                  <div>
                    <h4 className="font-bold text-gray-200 text-sm">Cadastrar os Ingredientes (Insumos)</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Insira suas matérias-primas como carnes crus, queijos, pães, condimentos e até descartáveis ou caixas de embalagens (fundamental). Informe a respectiva perda percentual.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">5</span>
                  <div>
                    <h4 className="font-bold text-gray-200 text-sm">Criar as Fichas Técnicas</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Na aba de <strong>Produtos</strong>, monte a receita grama a grama de cada item em seu cardápio, associando os ingredientes cadastrados. O sistema descobrirá na hora o custo base de produção.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">6</span>
                  <div>
                    <h4 className="font-bold text-gray-200 text-sm">Configurar os Preços de Venda</h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Finalmente, com os passos anteriores calculados, utilize a calculadora de precificação por canal para sugerir preços ideais para loja física, iFood, 99Food ou Keeta que blindem suas finanças.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'o-que-e-cfi',
          title: 'O que é CFI e como calcular',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                O método <strong>CFI (Custos Fixos Integrados)</strong> é o coração matemático do nosso sistema. Ele inverte totalmente a lógica tradicional de precificação de comida (que apenas multiplica o custo dos ingredientes por 3).
              </p>
              <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-xl space-y-2">
                <span className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">Como Calculamos Seu CFI?</span>
                <span className="block text-xs font-mono text-gray-300">
                  Fórmula: CFI (%) = (Total de Despesas Fixas Mensais / Faturamento Mensal) * 100
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Se você possui R$ 12.000 em custos operacionais recorrentes e realiza faturamentos de R$ 48.000 no mês, seu CFI corporativo é de <strong>25%</strong>.
                </p>
              </div>
              <div className="space-y-2">
                <strong className="block text-gray-200 text-xs">Quais despesas entram no cálculo do CFI?</strong>
                <ul className="list-disc pl-5 text-gray-400 text-xs space-y-1">
                  <li>Aluguel do ponto físico comercial, IPTU e taxa de condomínio.</li>
                  <li>Contas de água, luz de cozinha, gás encanado, telefone e internet de atendimento.</li>
                  <li>Remuneração de <strong>Pró-labore oficial do dono</strong> (crucial para não misturar finanças).</li>
                  <li>Vencimentos fixos mensais do pessoal de cozinha, copeiros e entregadores próprios.</li>
                  <li>Despesas de assessoria contábil e softwares gerenciais de gestão de PDV.</li>
                </ul>
              </div>
              <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded text-xs text-amber-200">
                <strong>Por que o CFI é vital?</strong> Sem integrá-lo em percentual, você não sabe que fatia de cada hambúrguer vendido serve para quitar contas estruturais da empresa. O Markup Inverso inclui de forma balanceada o CFI em cada lanche, garantindo que suas contas físicas se autodividam equilibradamente por pedido.
              </div>
            </div>
          )
        },
        {
          id: 'cadastrar-ingredientes',
          title: 'Como cadastrar ingredientes corretamente',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                Cadastrar seus ingredientes na seção de <strong>Insumos</strong> de forma correta impede distorções de CMV. O maior perigo para o dono de restaurante é ignorar o desperdício ou descarte natural dos alimentos nas receitas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-gray-800 space-y-2">
                  <strong className="block text-amber-400 text-xs font-mono uppercase">📐 O Fator de Perda (Fator de Correção)</strong>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Você compra 1kg de tomate italiano cru por R$ 8,00. Após lavar, tirar cascas, folhas ruins e sementes, restam 800g para consumo útil. A perda foi de 20%.
                  </p>
                  <span className="block text-[11px] font-mono text-gray-200 bg-slate-950 p-2 rounded">
                    Fórmula: Peso Bruto / Peso Líquido<br/>
                    Exemplo: 1000g / 800g = Fator 1.25 (25% de markup de compra)
                  </span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-gray-800 space-y-2">
                  <strong className="block text-amber-400 text-xs font-mono uppercase">⚡ Como calcular o Custo Real Útil</strong>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Bacon fatiado reduz em peso (-30% encolhimento de gordura na chapa). Informe a perda estimada em "Perda Operacional (%)" no cadastro de insumos.
                  </p>
                  <span className="block text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded">
                    Custo Real Corregido = Custo do Pacote * Fator de Correção
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <strong className="block text-gray-200">Exemplos práticos de descarte na sua hamburgueria:</strong>
                <ul className="list-decimal pl-5 text-gray-400 space-y-1">
                  <li><strong>Blend Moído:</strong> Perde gordura derretida e pontas na grelha: cerca de 10% a 15% de perda média.</li>
                  <li><strong>Cebola Roxa:</strong> Cascas externas e descarte de pontas: cerca de 15% de perda média.</li>
                  <li><strong>Alface Americana:</strong> Folhas murchas e talos descartados: cerca de 20% de descarte.</li>
                  <li><strong>Sub-receitas de Maioneses:</strong> Perda residual nas batedeiras e bisnagas: cerca de 5% de descarte.</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'criar-ficha-tecnica',
          title: 'Como criar uma ficha técnica',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                A <strong>Ficha Técnica</strong> é a receita financeira do seu prato. Sem ela, você calcula preços no escuro, o CMV estoura e o faturamento dissolve sem explicação.
              </p>
              <div className="bg-slate-900 p-4 rounded-xl border border-gray-800">
                <strong className="block text-gray-200 mb-2 text-xs">A Montagem Perfeita Passo a Passo:</strong>
                <ol className="list-decimal pl-5 text-gray-400 text-xs space-y-2 font-sans">
                  <li>Vá até o menu <strong>Produtos</strong> e cadastre um novo item.</li>
                  <li>Aponte o nome (ex: "Burguer Queijo Cremoso") e selecione a categoria de cardápio.</li>
                  <li>Comece a associar os insumos, indicando as medidas exatas da receita (ex: 150g de carne, 1 pão brioche, 30g cheddar fatiado).</li>
                  <li><strong>O ERRO CLÁSSICO:</strong> Nunca esqueça as embalagens! O papel acoplado, saco kraft do delivery, guardanapos, sachês e o lacre plástico devem constar como insumo na sua receita financeira de cada prato.</li>
                </ol>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-gray-800 space-y-2">
                <strong className="block text-amber-400 text-xs uppercase font-mono">O Que Significa o CMV Calculado de um Produto?</strong>
                <p className="text-xs text-gray-400">
                  O <strong>CMV (%)</strong> (Custo da Mercadoria Vendida) projeta qual porção de cada real recebido serve apenas para pagar os ingredientes e embalagens.
                </p>
                <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs text-gray-400">
                  <span className="block text-gray-200 font-bold">Diretrizes de Auditoria de CMV por Xande:</span>
                  <p>🟢 <strong>28% a 35%: Saudável.</strong> Faixa comercial de ouro para hamburguerias artesanais.</p>
                  <p>🟡 <strong>36% a 38%: Alerta.</strong> Margem espremida se você vender muito em marketplaces.</p>
                  <p>🔴 <strong>41% ou mais: Crítico.</strong> Provável prejuízo operacional devido a desperdícios ou subprecificação.</p>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'precificacao-margem',
      title: 'Precificação e Margem',
      description: 'Entenda os segredos da matemática da Margem Inversa, taxas do delivery e CMV.',
      icon: DollarSign,
      articles: [
        {
          id: 'calculo-preco-sugerido',
          title: 'Como o sistema calcula o preço sugerido',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                Esqueça a regra antiga de multiplicar por 3. No Lucro Fácil aplicamos o método confiável da <strong>Margem Inversa (Markup Inverso por Denominador)</strong>. Ela impede que as porcentagens de impostos e taxas de marketplaces mutilem suas margens limpas.
              </p>
              <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-xl space-y-3 font-sans">
                <span className="block text-amber-400 text-xs uppercase tracking-wider font-mono font-bold">Fórmula do Markup Inverso</span>
                <span className="block text-xs font-mono text-gray-300">
                  Preço de Venda = Custo Direto (Ingredientes + Embalagem) / (1 - % CMV Alvo - % CFI da Empresa - % Margem Desejada - % Plataforma)
                </span>
                <div className="border-t border-gray-800 pt-3 text-xs space-y-2 text-gray-400 leading-relaxed font-sans">
                  <strong>Simulação de um Lanche no iFood:</strong>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Custo de produção de seu hambúrguer + saco kraft: <strong>R$ 10,00</strong></li>
                    <li>Sua Meta de Lucro Líquido no bolso: <strong>20%</strong></li>
                    <li>Seu CFI (contas operacionais, aluguel, pro-labore): <strong>15%</strong></li>
                    <li>Sua taxa contratual do iFood (Plano Básico): <strong>12%</strong></li>
                    <li>Impostos e taxas de cartão físico: <strong>5%</strong></li>
                  </ul>
                  <div className="bg-slate-950 p-2.5 rounded font-mono text-emerald-400 text-xs mt-2">
                    Denominador = 1 - 0.20(lucro) - 0.15(CFI) - 0.12(iFood) - 0.05(taxas) = 0.48<br/>
                    Preço Final Sugerido = R$ 10,00 / 0.48 = <strong>R$ 20,83</strong>
                  </div>
                  <p className="text-[11.5px] mt-1 text-gray-300 leading-normal">
                    Se você apenas somasse as taxas (R$ 10,00 + 52% = R$ 15,20), estaria vendendo abaixo do custo real de existência da loja física. Cobrando R$ 20,83, seu lucro de 20% líquidos (R$ 4,16) fica totalmente blindado!
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'ifood-vs-loja',
          title: 'Por que meu preço no iFood é diferente da loja física',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                Cobrar o mesmo preço física e comercialmente nos aplicativos de entrega é falência garantida. As plataformas de delivery operam com comissões muito altas, que murcham sua rentabilidade de forma brusca se não forem repassadas de maneira científica.
              </p>
              <div className="space-y-3 text-xs font-sans">
                <div className="p-3 bg-slate-900 rounded-xl border border-gray-800">
                  <strong className="text-red-400 block mb-1">Taxas contratuais nominais elevadas</strong>
                  <p className="text-gray-400 leading-relaxed">
                    No iFood, o Plano Comercial Básico (entrega própria) retém 12% + 3,2% de transição online (15,2%). Se utilizar a Logística iFood, a comissão morde 23% + 3,2% (26,2% total). Ativando o repasse semanal automático de caixa, acrescentam-se +2% fixos (total de até 28,2%). Na 99Food as comissões chegam a 17,1% ao passo que a Keeta morde margem de pratos de baixo ticket devido a custos extras de frete.
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-gray-800">
                  <strong className="text-amber-400 block mb-1">A armadilha da incidência do frete</strong>
                  <p className="text-gray-400 leading-relaxed">
                    Comissão de delivery incide sobre o <strong>Faturamento Bruto Total do Pedido</strong> (Prato + Embalagens + Frete de Entrega). O lojista paga a comissão inclusive sobre o valor de transporte dos motoboys parceiros.
                  </p>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-gray-800">
                  <strong className="text-amber-400 block mb-1">A pegadinha das Campanhas Inteligentes (CI)</strong>
                  <p className="text-gray-400 leading-relaxed">
                    Cupons e descontos promocionais que o iFood aplica na conta do restaurante cobram a comissão percentual baseada no <strong>Valor Original Cheio</strong> do prato, não no valor líquido promocional do desconto.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 border-l-4 border-amber-500 rounded text-xs text-amber-200 inline-block w-full">
                <strong>Recomendação de Ouro do Xande:</strong> Cadastre taxas corretas do app na seção <strong>Precificação</strong> do Lucro Fácil. O software fará o cálculo do preço ideal iFood contra balcão matutino de forma imediata!
              </div>
            </div>
          )
        },
        {
          id: 'cmv-ideal-Hamburguerias',
          title: 'O que é CMV e qual deveria ser o meu',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                O <strong>CMV</strong> é o Custo da Mercadoria Vendida. É a porcentagem de cada real faturado na loja de alimentação que serve apenas para repor seu estoque de carnes, pães, queijos e insumos básicos de cozinha.
              </p>
              <div className="bg-slate-900 border border-gray-800 p-4 rounded-xl space-y-3 text-xs leading-relaxed font-sans">
                <span className="block text-amber-400 font-mono font-bold text-xs">A Faixa Saudável do CMV para Hamburguerias:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    <strong className="text-emerald-400 block">28% a 35% (Saudável):</strong>
                    <p className="text-gray-400 text-[11px] mt-1">Margem saudável. Garante reservas suficientes para cobrir custos de infraestrutura e reter excedente líquido de caixa.</p>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded">
                    <strong className="text-amber-400 block">36% a 40% (Alerta):</strong>
                    <p className="text-gray-400 text-[11px] mt-1">A margem líquida é incômoda. Exige excelência em desperdício para manter a hamburgueria produtiva.</p>
                  </div>
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded">
                    <strong className="text-red-400 block">41% ou mais (Perigo):</strong>
                    <p className="text-gray-400 text-[11px] mt-1">Quase certamente em prejuízo real. O restaurante trabalha muito mas não consegue liquidar as faturas mensais.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <strong className="block text-gray-200">O que você deve fazer se o seu CMV estiver muito alto:</strong>
                <ul className="list-disc pl-5 text-gray-400 space-y-1">
                  <li><strong>Evite racionar qualidade:</strong> Trocar fornecedores tradicionais de carnes premium ou queijo por marcas baratas diminui CMV temporariamente, mas afugenta o cliente definitivo de sua loja.</li>
                  <li><strong>Compre em atacados:</strong> Negocie baldes e sacagens fechadas para reduzir preço por kg ou litro de óleos, bacon ou laticínios.</li>
                  <li><strong>Monitore desperdícios na cozinha:</strong> Utilize balanças na linha de montagem de hamburgers. Um chapeiro que despeja 80g de bacon onde a ficha dita 40g está destruindo seus lucros semanais.</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          id: 'ajuste-massa-precos',
          title: 'Como usar o Ajuste em Massa de preços',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                Quando o mercado de carnes e laticínios sofre uma alta geral, ajustar manualmente o preço de 50 lanches diferentes, um por um, cansa e faz você perder tempo estratégico. No Lucro Fácil, resolvemos isso com a ferramenta de <strong>Ajuste em Massa</strong>.
              </p>
              <div className="bg-slate-900 border border-gray-800 p-4 rounded-xl text-xs space-y-2 font-sans leading-relaxed">
                <strong className="text-amber-400 block text-xs font-mono uppercase">Como aplicar as atualizações coletivas:</strong>
                <p className="text-gray-300">Acesse a seção de cardápios e execute a alteração em lote de forma simplificada:</p>
                <ol className="list-decimal pl-5 text-gray-400 space-y-1.5">
                  <li>Selecione a categoria em lote que quer movimentar (ex: somente Bebidas ou somente Hambúrgueres de Carne).</li>
                  <li>Aponte o canal comercial que quer afetar (ex: somente os preços iFood ou os valores exibidos no balcão).</li>
                  <li>Insira o modelo de ajuste: <strong>Porcentagem (%)</strong> (ex: subir todos os lanches em +5%) ou por <strong>Valor Fixo (R$)</strong> (ex: acrescentar exatamente R$ 2,00 nos burguers).</li>
                  <li>Clique em sincronizar margens. O sistema atualiza todas as tabelas em 2 segundos!</li>
                </ol>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ferramentas-avancadas',
      title: 'Ferramentas Avançadas',
      description: 'Eleve o nível do seu negócio usando o ponto de equilíbrio diário e o consultor Xande.',
      icon: TrendingUp,
      articles: [
        {
          id: 'ponto-equilibrio-medidor',
          title: 'Como funciona o Ponto de Equilíbrio',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                O <strong>Ponto de Equilíbrio</strong> (Break-Even) representa o faturamento exato em Reais (R$) que a sua hamburgueria precisa arrecadar para que a margem acumulada das vendas liquide todas as obrigações e despesas fixas recorrentes do mês. Nesse ponto de cruzamento de linhas, as contas estão zeradas (Zero Lucro, Zero Prejuízo).
              </p>
              <div className="bg-slate-900 border border-gray-800 p-4 rounded-xl font-mono text-xs space-y-2">
                <span className="block text-amber-400 uppercase font-bold tracking-wider">A Matemática do Break-Even:</span>
                <span className="block text-gray-200">
                  PE (R$) = Total Despesas Fixas / Margem de Contribuição Média (%)
                </span>
                <p className="text-[11px] text-gray-400 mt-1 font-sans">
                  Se suas contas fixas somam R$ 12.000 mensais e de cada R$ 1,00 recebido o sistema aponta que R$ 0,50 sobram limpos depois de tirar CMV e taxas locais (ou seja, Margem de Contribuição de 50%):
                </p>
                <span className="block text-center text-emerald-400 border border-emerald-500/20 bg-slate-950 p-2 rounded">
                  Ponto de Equilíbrio = R$ 12.000 / 0.50 = R$ 24.000 de Faturamento
                </span>
              </div>
              <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded text-xs text-amber-200 space-y-1.5 leading-relaxed font-sans">
                <strong className="text-sm font-bold uppercase block text-amber-400">O Segredo Clínico dos 10 Primeiros Dias do Mês</strong>
                <p>
                  O segredo número um de sobrevivência das hamburguerias de alta performance é: <strong>bater e liquidar o faturamento correspondente ao Ponto de Equilíbrio nos primeiros 10 dias do mês</strong>.
                </p>
                <p className="text-[11px] text-gray-300">
                  Na aba de Ponto de Equilíbrio do Lucro Fácil, acompanhe o termômetro gráfico de vendas do mês. Se você bater o faturamento correspondente ao Break-Even antes do dia 10, sua operação passa a lucrar livre de obrigações estruturais. A partir do dia 11 ao final do mês, todas as vendas colocam o lucro da Margem de Contribuição integralmente no seu bolso real!
                </p>
              </div>
            </div>
          )
        },
        {
          id: 'como-usar-ofertas',
          title: 'Como usar as Ofertas Inteligentes',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                Dar descontos aleatórios no iFood detona faturamentos. No Método CFI de Xande, estruturamos ofertas altamente lucrativas baseadas nas <strong>Porções e 4 Listas do Cardápio</strong>:
              </p>
              <div className="bg-slate-900 border border-gray-800 p-4 rounded-xl space-y-3 text-xs leading-relaxed font-sans">
                <strong className="text-amber-400 block font-mono">As 4 Listas Inteligentes:</strong>
                <ul className="list-disc pl-5 text-gray-450 space-y-1 bg-slate-950 p-3 rounded">
                  <li><strong>Campeões:</strong> Os 20% que mais faturam. Sua média de lucro líquido é a <strong>Régua da Casa</strong> (nossa margem alvo para guiar ofertas).</li>
                  <li><strong>Parados:</strong> Pouco giro. Exige reajuste de preço ou foto atraente para sair do freezer.</li>
                  <li><strong>Gordos (Turbinados):</strong> Lucro maior que a média da Régua. É aqui que moram os <strong>Produtos Turbinados</strong> (Custo baixo, alto valor percebido. Ex: batata frita, bebida em lata, refrigerante, sobremesas). Devem render no mínimo 10% a mais do que a Régua da Casa!</li>
                  <li><strong>Magros:</strong> Lucros esmagados. Se um Campeão é Magro ao mesmo tempo, gera prejuízo massivo silencioso!</li>
                </ul>
              </div>
              <div className="space-y-2 text-xs leading-relaxed">
                <strong className="block text-gray-200">As 4 Ofertas Inteligentes criadas por Xande:</strong>
                <p>
                  🔥 <strong>1. Oferta do Dia (Segurança Total):</strong> Combina lanche gordo com bebida turbinada. Pequeno desconto visual atrai público sem perigo às finanças.
                </p>
                <p>
                  💡 <strong>2. Oferta Salva-Margem:</strong> Combina o hambúrguer mais vendido (Campeão Magro) com anéis de cebola ou refrigerantes (Produto Turbinado). O markup gigante do produto turbinado cobre o CMV apertado do prato base, salvando o saldo.
                </p>
                <p>
                  💥 <strong>3. Oferta Bomba de Vendas:</strong> Combina o seu maior campeão com batata-frita farta no "formato quebrado" (cliente paga preço cheio no acompanhamento e leva o burguer com desconto pequeno). Indicado para salvar segundas e terças ociosas.
                </p>
                <p>
                  🚨 <strong>4. Oferta Chamariz (Margem Extrema):</strong> Desconto bruto cortado na carne para inaugurar marcas, fazer queima de estoque gelado ou novos sabores. <strong>Nunca use no cotidiano residencial!</strong>
                </p>
              </div>
            </div>
          )
        },
        {
          id: 'importar-vendas-excel-csv',
          title: 'Como importar vendas e o que os números significam',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                Para não ter que lançar cada pedido do seu dia a dia de forma manual, utilize a aba de <strong>Painel de Faturamento</strong> e use nossa ferramenta de importação em lote de vendas.
              </p>
              <div className="bg-slate-900 border border-gray-800 p-4 rounded-xl text-xs space-y-2 font-sans">
                <strong className="text-amber-400 block text-xs">Acelere seu Lançamento Diário:</strong>
                <ol className="list-decimal pl-5 text-gray-450 space-y-1">
                  <li>Exporte as planilhas de pedidos terminados de seus painéis iFood, terminal de PDV ou ERP Saipos (formato .xlsx ou .csv).</li>
                  <li>Cole as colunas solicitadas ou realize o upload do arquivo na aba correspondente do sistema.</li>
                  <li>O importador cruza os pedidos com suas respectivas Fichas Técnicas cadastradas para computar os resultados reais automáticos.</li>
                </ol>
              </div>
              <div className="border border-gray-800 p-3 rounded bg-slate-950 font-sans text-xs text-gray-400 space-y-1.5 leading-relaxed">
                <strong className="block text-amber-400 uppercase font-mono">Significado Técnico de cada Número Mapeado:</strong>
                <p><strong>• Faturamento Bruto:</strong> O total nominal comercializado incluindo fretes cobrados das plataformas.</p>
                <p><strong>• CMV de Margem:</strong> O montante gasto na despensa para suprir o preparo de cada disco de carne e ingrediente no mês.</p>
                <p><strong>• Margem Operacional Líquida (Lucro Real):</strong> O dinheiro purificado que sobra em seu caixa físico após deduzir CMV correspondente, taxas bancárias, operacionais de delivery e o CFI proporcional das suas despesas.</p>
              </div>
            </div>
          )
        },
        {
          id: 'como-usar-consultor-xande',
          title: 'Como usar o consultor Xande',
          content: (
            <div className="space-y-4 text-gray-350 text-sm leading-relaxed">
              <p>
                O <strong>Xande</strong> é o seu consultor financeiro com inteligência artificial, treinado especificamente na metodologia de Custos Fixos Integrados da hamburgueria comercial. Pense nele como seu mentor de bolso pronto 24h por dia para alavancar lucros.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl border border-gray-800 text-xs text-gray-450 space-y-2">
                <strong className="text-amber-400 block">Onde encontrar o Xande:</strong>
                <p>Você pode interagir e realizar diagnósticos financeiros com ele em dois locais:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>No Chat Flutuante (Floating Chat):</strong> Localizado no balão do canto inferior direito de qualquer tela para tirar dúvidas financeiras imediatas.</li>
                  <li><strong>Nas Abas de Relatório Inteligente:</strong> Onde ele audita o seu CMV e as classificações de engenharia de cardápio de forma proativa.</li>
                </ul>
              </div>
              <div className="space-y-2 text-xs font-sans">
                <strong className="block text-gray-200">Como redigir as melhores perguntas para respostas precisas:</strong>
                <p className="text-gray-450">Como consultor matemático, Chef Xande gera respostas cirúrgicas se você lhe fornecer números e dados específicos de sua realidade. Exemplos do que perguntar:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-950 rounded border border-gray-800 font-mono text-[11px] text-emerald-400">
                    "Xande, meu lanche custou R$ 12,50 na cozinha comercial e desejo rentabilizar 22% líquidos vendendo por iFood parceiro com taxa base de 23%. Que preço final devo cobrar no aplicativo?"
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-gray-800 font-mono text-[11px] text-amber-400">
                    "Xande, como mudo meu lanche campeão de venda que é Produto Magro para se tornar uma Oferta Salva Margem com Refrigerante?"
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    }
  ], []);

  // Filter sections and articles in real-time based on search input
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return sections;

    const query = searchTerm.toLowerCase();
    return sections.map(section => {
      const matchingArticles = section.articles.filter(
        art => art.title.toLowerCase().includes(query) || 
               art.id.toLowerCase().includes(query)
      );

      if (matchingArticles.length > 0 || section.title.toLowerCase().includes(query)) {
        return {
          ...section,
          articles: matchingArticles.length > 0 ? matchingArticles : section.articles
        };
      }
      return null;
    }).filter(Boolean) as Section[];
  }, [sections, searchTerm]);

  // Keep track of total matched articles count
  const totalMatchesCount = useMemo(() => {
    return filteredSections.reduce((acc, curr) => acc + curr.articles.length, 0);
  }, [filteredSections]);

  return (
    <div id="main-help-view" className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-8 bg-transparent text-gray-100 font-sans">
      
      {/* HEADER SECTION */}
      <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase text-white flex items-center justify-center md:justify-start gap-2.5">
            Central de Ajuda <span className="text-amber-500 font-black">Xande</span>
          </h1>
          <p className="text-gray-450 text-xs md:text-sm font-medium mt-1">
            Manual prático e didático para proprietários de comida e bebida dominarem o CMV, CFI e precificação.
          </p>
        </div>
        <button 
          onClick={handleOpenXandeChat}
          className="mx-auto md:mx-0 shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black tracking-wider uppercase px-5 py-3 rounded-xl flex items-center gap-2 transition duration-300 hover:scale-[1.03] active:scale-95 shadow-md shadow-amber-500/10"
        >
          <Sparkles size={16} /> Falar com o Xande
        </button>
      </div>

      {/* SEARCH AND CONTROL BAR */}
      <div className="relative w-full max-w-2xl mx-auto bg-slate-900 border border-gray-800 p-1.5 rounded-2xl flex items-center shadow-lg">
        <div className="pl-3.5 pr-2.5 text-gray-500">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Busque ajuda por assunto, CFI, CMV, iFood, engrenagem..."
          className="w-full bg-transparent text-sm text-gray-100 focus:outline-none placeholder-gray-500 py-2.5 pr-4"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1 font-bold font-mono transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* RENDER DYNAMIC SECTIONS */}
      {filteredSections.length > 0 ? (
        <div className="space-y-10">
          {filteredSections.map((section) => {
            const SectionIcon = section.icon;
            
            return (
              <div key={section.id} className="space-y-4">
                {/* SECTION HEADER */}
                <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                    <SectionIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase text-white tracking-wide">
                      {section.title}
                    </h2>
                    <p className="text-gray-450 text-[11px] font-sans">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* ARTICLES EXPANDABLE ACCORDIONS */}
                <div className="space-y-3 mt-4">
                  {section.articles.map((article) => {
                    const isOpen = openAccordions[article.id] || searchTerm.trim().length > 0;
                    
                    return (
                      <div 
                        key={article.id}
                        className="bg-slate-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:border-gray-700 transition duration-300"
                      >
                        {/* ACCORDION HOVER BAR TRIGGER */}
                        <button
                          onClick={() => toggleAccordion(article.id)}
                          className="w-full flex items-center justify-between p-5 text-left focus:outline-none hover:bg-slate-800/40 transition duration-300"
                        >
                          <span className="text-sm font-bold text-gray-100 hover:text-white pr-4">
                            {article.title}
                          </span>
                          <div className={`p-1.5 rounded-full bg-slate-800 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : 'rotate-0'}`}>
                            <ChevronDown size={16} />
                          </div>
                        </button>

                        {/* ACCORDION EXPANSION WITH CSS GRID FOR SMOOTH ANIMATION */}
                        <div 
                          className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                        >
                          <div className="overflow-hidden">
                            <div className="px-6 pb-6 pt-1 border-t border-gray-800/60 mt-1 space-y-6">
                              {/* ARTICLE WRAPPED TEXT */}
                              <div className="article-body leading-relaxed">
                                {article.content}
                              </div>

                              {/* STYLISH CTAs BOX */}
                              <div className="p-4 rounded-xl bg-slate-950 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                                    <Info size={16} className="animate-pulse" />
                                  </div>
                                  <span className="text-xs text-gray-300 font-semibold text-center sm:text-left">
                                    Ainda tem dúvidas? Pergunte ao Xande
                                  </span>
                                </div>
                                <button
                                  onClick={handleOpenXandeChat}
                                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-black uppercase hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
                                >
                                  <Sparkles size={14} /> Abrir Chat do Xande
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-900 border border-gray-800 rounded-3xl space-y-4">
          <p className="text-gray-400 text-sm italic">
            Nenhum artigo ou ajuda encontrada para "{searchTerm}".
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-amber-500 underline font-bold"
          >
            Ver todos os capítulos de ajuda
          </button>
        </div>
      )}

    </div>
  );
};

export default Help;
