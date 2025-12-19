
import React, { useState, useMemo } from 'react';
import { 
  Search, HelpCircle, ChevronDown, ChevronUp, LayoutDashboard, 
  Receipt, Tags, DollarSign, Dna, Beef, UtensilsCrossed, Calculator, 
  ScrollText, ShoppingBag, X, Store, AlertTriangle, ShieldCheck, 
  Copy, Zap, TrendingUp, Info, Truck, MessageCircleQuestion, ShoppingCart, Target
} from 'lucide-react';

const Help: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'faq'>('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const MANUAL_STEPS = [
    {
      id: 'step1',
      title: '1. Tela Inicial: Gestão de Lojas',
      icon: Store,
      color: 'text-blue-600 dark:text-blue-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">O Comando Central do Seu Negócio</p>
          <p class="text-sm leading-relaxed">Ao abrir o sistema, você cai na Tela Inicial. É aqui que você gerencia sua expansão, seja você dono de uma única hamburgueria ou de uma rede de franquias.</p>
          
          <div class="grid grid-cols-1 gap-4 mt-2">
             <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border-l-4 border-blue-500">
                <strong class="text-gray-900 dark:text-white block mb-1">A. Adicionar Novas Lojas</strong>
                <p class="text-xs mb-2">Quer abrir uma filial? Não misture as contas!</p>
                <ul class="list-disc list-inside text-xs space-y-1">
                    <li>Clique no botão grande com o símbolo de "+" (Adicionar Loja).</li>
                    <li>Dê um nome (Ex: "Filial Shopping") e o endereço.</li>
                    <li>Pronto! Você terá um painel financeiro totalmente separado para ela.</li>
                </ul>
             </div>
             
             <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border-l-4 border-amber-500">
                <strong class="text-gray-900 dark:text-white block mb-1">B. Editar e Personalizar (Logo e Endereço)</strong>
                <p class="text-xs mb-2">No cartão de cada loja, você verá ícones no canto superior direito:</p>
                <p class="text-xs"><strong>Ícone de Lápis (Editar):</strong> Clique aqui para alterar o Nome da Loja, atualizar o Endereço ou mudar a Logo (imagem de capa). Manter a logo atualizada ajuda a identificar visualmente cada unidade rapidamente.</p>
             </div>

             <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border-l-4 border-red-500">
                <strong class="text-gray-900 dark:text-white block mb-1">C. Excluir uma Loja</strong>
                <p class="text-xs mb-2">Precisa remover uma loja fechada ou criada por engano?</p>
                <ul class="list-disc list-inside text-xs space-y-1">
                    <li>Clique no Ícone de Lixeira no cartão da loja.</li>
                    <li><strong>Cuidado:</strong> O sistema pedirá uma confirmação. Ao confirmar, todos os dados (cardápios, custos, fichas técnicas) daquela loja específica serão apagados permanentemente.</li>
                </ul>
             </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
             <strong class="text-brand-red uppercase text-xs block mb-2">Função Poderosa: Replicar Dados</strong>
             <p class="text-sm leading-relaxed mb-2">Imagine que você abriu uma filial nova. Você não precisa cadastrar os 50 hambúrgueres e 100 insumos tudo de novo!</p>
             <div class="bg-brand-red/5 dark:bg-brand-red/10 p-3 rounded-lg border border-brand-red/20">
                <p class="text-xs font-bold mb-1">Como usar a Replicação:</p>
                <ol class="list-decimal list-inside text-xs space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Clique no botão "Replicar Dados" no topo da tela inicial.</li>
                    <li><strong>De (Origem):</strong> Selecione sua loja principal (Ex: Matriz).</li>
                    <li><strong>Para (Destino):</strong> Selecione a loja nova (Ex: Filial Shopping).</li>
                    <li><strong>O que copiar?:</strong> Escolha se quer copiar TUDO (Clonar Loja) ou apenas partes específicas (Só o Cardápio, Só os Insumos, Só as Configurações de Taxas).</li>
                </ol>
                <p class="text-xs mt-2 italic text-brand-red font-bold">Dica: Use isso para padronizar suas franquias em segundos!</p>
             </div>
          </div>
        </div>
      `
    },
    {
      id: 'step2',
      title: '2. Backup & Segurança (Novo!)',
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">A Segurança dos seus Dados é Prioridade</p>
          <p class="text-sm leading-relaxed">Este sistema utiliza tecnologia moderna que salva tudo instantaneamente no seu navegador (Auto-Save). Porém, se o seu computador quebrar ou for formatado, você precisa de um Backup externo.</p>
          
          <div class="bg-gray-100 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <h4 class="font-bold text-gray-900 dark:text-white text-xs uppercase mb-2">1. O Semáforo de Segurança (Menu Lateral)</h4>
             <p class="text-xs mb-2">No final do menu esquerdo, adicionamos um monitor de backup:</p>
             <ul class="space-y-2 text-xs">
                <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> <strong>Verde:</strong> Backup feito recentemente (menos de 3 dias).</li>
                <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-amber-500"></span> <strong>Amarelo:</strong> Atenção, faz alguns dias que você não salva.</li>
                <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-600"></span> <strong>Vermelho:</strong> PERIGO! Você corre risco de perder dados se o PC der problema.</li>
             </ul>
             <p class="text-xs mt-2">Para resolver, basta clicar no botão <strong>"FAZER BACKUP"</strong> que fica dentro desse quadro colorido.</p>
          </div>

          <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30">
             <strong class="text-amber-800 dark:text-amber-400 uppercase text-sm block mb-2 flex items-center gap-2"><AlertTriangle size={16}/> DICA DE OURO (LEIA ISSO!)</strong>
             
             <p class="text-xs font-bold mb-1">Para onde vai o arquivo?</p>
             <p class="text-xs mb-3">Quando você clica em "FAZER BACKUP", o arquivo é salvo automaticamente na sua pasta de DOWNLOADS do computador.</p>

             <p class="text-xs font-bold mb-1">O Segredo da Segurança Total (Nuvem):</p>
             <p class="text-xs mb-2">Ter o arquivo no PC não adianta se o PC queimar! Crie o hábito de, toda sexta-feira:</p>
             <ol class="list-decimal list-inside text-xs space-y-1">
                <li>Clicar em "FAZER BACKUP".</li>
                <li>Abrir seu Google Drive, OneDrive ou enviar para si mesmo no WhatsApp/E-mail.</li>
                <li>Arrastar o arquivo baixado para lá.</li>
             </ol>
             <p class="text-xs mt-2 font-bold">Fazendo isso, você pode abrir este sistema em QUALQUER computador do mundo e restaurar seus dados em segundos!</p>
          </div>
        </div>
      `
    },
    {
      id: 'step3',
      title: '3. Dashboard',
      icon: LayoutDashboard,
      color: 'text-indigo-600 dark:text-indigo-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">O painel de controle do piloto.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div class="p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="block text-gray-900 dark:text-white text-xs uppercase mb-1">Para que serve?</strong>
                <p class="text-xs">Uma visão gráfica e resumida da saúde do negócio.</p>
             </div>
             <div class="p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="block text-gray-900 dark:text-white text-xs uppercase mb-1">Por que é importante?</strong>
                <p class="text-xs">Para não perder tempo calculando. Em segundos você vê: Seu faturamento médio, se seu Custo Fixo está alto demais (Alerta de perigo) e a distribuição dos seus custos.</p>
             </div>
             <div class="p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="block text-gray-900 dark:text-white text-xs uppercase mb-1">Como fazer?</strong>
                <p class="text-xs">Apenas observe. Ele é alimentado automaticamente por todas as outras abas. Se algo estiver vermelho aqui, corra para corrigir nas abas de Despesas ou Precificação.</p>
             </div>
          </div>
        </div>
      `
    },
    {
      id: 'step4',
      title: '4. Despesas Fixas',
      icon: Receipt,
      color: 'text-red-600 dark:text-red-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">A Base da Sua Operação</p>
          
          <div class="space-y-2">
              <strong class="text-gray-800 dark:text-white text-sm">O que são Despesas Fixas?</strong>
              <p class="text-sm leading-relaxed">São todos os gastos que o seu negócio tem independentemente de você vender um único produto ou não. Se a sua loja abrir as portas no dia 1º e fechar no dia 30 sem um único pedido, essas contas chegarão no final do mês do mesmo jeito.</p>
          </div>

          <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-800 dark:text-white text-sm block mb-2">Por que é importante lançar corretamente?</strong>
             <p class="text-xs leading-relaxed mb-2">O lançamento correto é crucial para o cálculo do seu CFI (Custo Fixo Integrado) e para determinar o Ponto de Equilíbrio.</p>
             <p class="text-xs italic bg-gray-200 dark:bg-white/10 p-2 rounded">Exemplo: Se sua loja custa R$ 10.000,00 para ficar aberta e você fatura R$ 30.000,00, significa que 33% do seu faturamento bruto serve apenas para pagar a estrutura.</p>
          </div>

          <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
             <table class="w-full text-xs">
                <thead class="bg-gray-100 dark:bg-black/20 font-bold uppercase">
                    <tr>
                        <th class="p-3 text-left">Tipo de Despesa</th>
                        <th class="p-3 text-center">Depende da Venda?</th>
                        <th class="p-3 text-left">Exemplos</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-white/5">
                    <tr>
                        <td class="p-3 font-bold text-brand-red">Fixas (Aqui)</td>
                        <td class="p-3 text-center font-bold">NÃO</td>
                        <td class="p-3">Aluguel, Salários (fixo), Energia, Internet, Contador, IPTU.</td>
                    </tr>
                    <tr>
                        <td class="p-3 font-bold text-gray-500">Variáveis (Não aqui)</td>
                        <td class="p-3 text-center font-bold">SIM</td>
                        <td class="p-3">Insumos (carne, pão), Embalagens, Comissões de Apps, Taxas de Cartão.</td>
                    </tr>
                </tbody>
             </table>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <strong class="text-gray-800 dark:text-white text-xs uppercase block mb-1">Como fazer no sistema?</strong>
                <ul class="list-disc list-inside text-xs space-y-1">
                    <li>Clique em "Nova Despesa Fixa".</li>
                    <li>Lance o valor mensal exato de cada conta (Ex: "Aluguel", R$ 2.500,00).</li>
                    <li>Use a função de Parcelamento para compras recorrentes.</li>
                </ul>
             </div>
             <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-500/30">
                <strong class="text-red-800 dark:text-red-400 uppercase text-xs block mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Atenção Crítica</strong>
                <p class="text-xs">NÃO lance compras de insumos (carne, pão, legumes) aqui. Insumos são custos variáveis e entram no cadastro de insumos e na Ficha Técnica.</p>
             </div>
          </div>
          
          <p class="text-xs text-center font-bold opacity-70">Lembre-se: A precisão aqui é a garantia de que o seu CFI será calculado corretamente.</p>
        </div>
      `
    },
    {
      id: 'step5',
      title: '5. Categorias & Fornecedores',
      icon: Tags,
      color: 'text-amber-600 dark:text-amber-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">A Organização que Gera Lucro</p>
          
          <div class="space-y-4">
             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">1. Categorias de Gastos (As "Caixinhas" do seu Dinheiro)</strong>
                <p class="text-xs mb-2"><strong>Para que serve?</strong> Organizar todas as saídas. Em vez de ver um monte de boletos, você enxerga "centros de custo".</p>
                <p class="text-xs mb-2"><strong>Por que é vital?</strong> Sem categorias, você não tem gestão. O sistema gera relatórios que respondem:</p>
                <ul class="list-disc list-inside text-xs italic mb-2">
                    <li>"Gastei mais com Marketing ou Manutenção?"</li>
                    <li>"O valor de Embalagens está acima do planejado?"</li>
                </ul>
                <p class="text-xs"><strong>Como fazer?</strong> O sistema já traz as principais, mas você pode criar: Pessoal, Infraestrutura, Marketing, Impostos.</p>
             </div>

             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">2. Fornecedores (Seus Parceiros de Negócio)</strong>
                <p class="text-xs mb-2"><strong>Para que serve?</strong> Cadastro de quem você compra insumos ou contrata serviços.</p>
                <ul class="list-disc list-inside text-xs space-y-1">
                    <li><strong>Histórico:</strong> Rastreie quanto comprou de cada um.</li>
                    <li><strong>Agilidade:</strong> Tenha telefone e e-mail sempre à mão.</li>
                    <li><strong>Controle:</strong> Ao lançar uma conta, vincule ao fornecedor para saber quanto deve ao "Açougue do Zé".</li>
                </ul>
             </div>
          </div>
          
          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-center">
             <strong class="text-emerald-800 dark:text-emerald-400 text-xs uppercase block mb-1">O Poder da Visão Estratégica</strong>
             <p class="text-xs">Quando você une Categorias + Fornecedores, você para de "achar" que gasta muito e passa a "ter certeza" de onde cada centavo está indo.</p>
          </div>
        </div>
      `
    },
    {
      id: 'step6',
      title: '6. Faturamento',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div class="p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="block text-gray-900 dark:text-white text-xs uppercase mb-1">Para que serve?</strong>
                <p class="text-xs">Histórico de quanto dinheiro entrou no caixa da empresa (Venda Bruta) mês a mês.</p>
             </div>
             <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                <strong class="block text-emerald-800 dark:text-emerald-400 text-xs uppercase mb-1">Por que é importante?</strong>
                <p class="text-xs">Para calcular a porcentagem do Custo Fixo. Sem faturamento, não há CFI.</p>
                <p class="text-xs font-mono bg-white/50 dark:bg-black/20 p-1 rounded mt-1 text-center">Total Despesas ÷ Faturamento = % CFI</p>
             </div>
             <div class="p-4 bg-white/50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="block text-gray-900 dark:text-white text-xs uppercase mb-1">Como fazer?</strong>
                <p class="text-xs">Selecione o ano e insira o valor total vendido em cada mês. Mantenha atualizado para a precificação refletir a realidade.</p>
             </div>
          </div>
        </div>
      `
    },
    {
      id: 'step7',
      title: '7. CFI da Empresa',
      icon: Dna,
      color: 'text-purple-600 dark:text-purple-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">O coração do sistema</p>
          <p class="text-sm leading-relaxed">O CFI (Custo Fixo Integrado) integra todos os custos fixos invisíveis (Aluguel, Luz, Salários) diretamente no preço de cada produto vendido.</p>
          
          <div class="space-y-3">
             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">1. Por que o CFI é fundamental?</strong>
                <p class="text-xs">Muitos quebram usando a "conta de padaria" (custo x 2). Isso ignora que, para o prato chegar ao cliente, você pagou Aluguel, IPTU, Energia, Salários. O CFI pega esse "bolo" de contas e divide estrategicamente pela sua venda.</p>
             </div>

             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">2. Como funciona na prática?</strong>
                <p class="text-xs">Imagine que seus custos fixos são R$ 10.000. Com o CFI Integrado, o sistema identifica qual a porcentagem exata que cada hambúrguer precisa carregar para "quitar" sua parte desses R$ 10.000.</p>
             </div>

             <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-500/30">
                <strong class="text-purple-800 dark:text-purple-300 text-sm uppercase mb-1 block">3. Importância no Sistema</strong>
                <ul class="list-disc list-inside text-xs space-y-1">
                    <li><strong>Mapeamento Total:</strong> Você insere o valor total dos custos fixos.</li>
                    <li><strong>Distribuição Inteligente:</strong> O sistema calcula o impacto em cada venda.</li>
                    <li><strong>Segurança:</strong> O preço gerado garante que você está pagando a luz e o aluguel e garantindo seu lucro líquido.</li>
                </ul>
             </div>
          </div>
          
          <p class="text-xs text-center italic">"O CFI transforma custos fixos em uma variável controlada. Você para de 'torcer' para sobrar dinheiro e passa a ter certeza."</p>
        </div>
      `
    },
    {
      id: 'step8',
      title: '8. Insumos & Perda Operacional',
      icon: Beef,
      color: 'text-rose-600 dark:text-rose-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Onde o Lucro é Calculado nos Mínimos Detalhes</p>
          <p class="text-sm leading-relaxed">Insumos são todas as matérias-primas brutas (carne, pão, embalagem). É a base de tudo.</p>
          
          <div class="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-900 dark:text-white text-sm uppercase mb-2 block">Por que esta etapa é a mais importante?</strong>
             <ul class="space-y-2 text-xs">
                <li><strong>Conversão Inteligente:</strong> Compra em KG (Peça de Queijo) e usa em Gramas (Fatia). O sistema faz a matemática.</li>
                <li><strong>Fator de Correção (Perda):</strong> O sistema calcula o preço da grama útil para que o cliente pague pelo desperdício natural (cascas, aparas), e não você.</li>
             </ul>
          </div>

          <div class="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-200 dark:border-rose-500/30">
             <strong class="text-rose-800 dark:text-rose-300 text-xs uppercase block mb-2 flex items-center gap-1"><AlertTriangle size={14}/> Entendendo a "Perda" (Exemplo Prático)</strong>
             <p class="text-xs mb-2">Quase todo alimento tem perda. Se você ignorar isso, estará pagando para trabalhar.</p>
             <div class="bg-white/60 dark:bg-black/20 p-2 rounded text-xs font-mono mb-2">
                Compra: 1kg de cebola por R$ 5,00.<br/>
                Descarte: 150g de casca.<br/>
                Sobra Útil: 850g.<br/>
                <span class="text-red-500 line-through">Errado: R$ 5,00 ÷ 1000g = R$ 0,005/g</span><br/>
                <span class="text-emerald-600 font-bold">Correto: R$ 5,00 ÷ 850g = R$ 0,0058/g</span>
             </div>
             <p class="text-xs">No Sistema: Basta colocar a % de perda e ele faz essa conta automaticamente.</p>
          </div>

          <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">Como fazer (Regra de Ouro)</strong>
             <p class="text-xs mb-1">Cadastre pelo PACOTE FECHADO conforme compra do fornecedor.</p>
             <p class="text-xs italic text-gray-500">Ex: Ketchup Galão -> Preço R$ 40,00 -> Qtd 3.500g -> Perda 2%.</p>
             <p class="text-xs mt-2 text-brand-red font-bold">Não ignore os centavos: Em 1000 vendas, R$ 0,10 de erro vira R$ 100,00 de prejuízo.</p>
          </div>
        </div>
      `
    },
    {
      id: 'step9',
      title: '9. Ficha Técnica (CMV)',
      icon: UtensilsCrossed,
      color: 'text-orange-600 dark:text-orange-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">O DNA do seu Produto</p>
          <p class="text-sm leading-relaxed">Não é apenas uma receita; é o documento que traduz ingredientes em valores financeiros.</p>
          
          <div class="space-y-3">
             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">Por que é o coração do negócio?</strong>
                <ul class="list-disc list-inside text-xs space-y-1">
                    <li><strong>Cálculo Real do CMV:</strong> Soma centavo por centavo o custo de produção.</li>
                    <li><strong>Padronização:</strong> Garante que o cliente receba sempre o mesmo produto.</li>
                    <li><strong>Controle de Estoque:</strong> Dá baixa automática nas quantidades exatas.</li>
                    <li><strong>Identificação de Desperdícios:</strong> Mostra se o estoque está acabando mais rápido do que deveria.</li>
                </ul>
             </div>

             <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-500/30">
                <strong class="text-orange-800 dark:text-orange-300 text-xs uppercase block mb-1">O Risco de "Chutar" o Preço</strong>
                <p class="text-xs">Precificar sem Ficha Técnica é como construir sem planta. Um erro de R$ 0,50 por prato x 1.000 vendas = R$ 500,00 de lucro perdido.</p>
             </div>

             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">Como fazer no sistema?</strong>
                <ol class="list-decimal list-inside text-xs space-y-1">
                    <li><strong>Cadastre Insumos:</strong> Primeiro a matéria-prima.</li>
                    <li><strong>Crie o Produto:</strong> Ex: "Marmita de Frango G".</li>
                    <li><strong>Monte a Composição:</strong> Adicione os insumos e as quantidades exatas (Ex: 0,200kg Arroz).</li>
                    <li><strong>Inclua Embalagem:</strong> Caixa, guardanapo e sacola também custam dinheiro!</li>
                </ol>
             </div>
          </div>
        </div>
      `
    },
    {
      id: 'step10',
      title: '10. Preço de Venda (Precificação)',
      icon: Calculator,
      color: 'text-blue-600 dark:text-blue-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">Sua Calculadora de Lucro Real</p>
          <p class="text-sm leading-relaxed">Une CMV + CFI + Taxas para calcular o preço que garante sua Meta de Lucro.</p>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30">
             <strong class="text-blue-800 dark:text-blue-300 text-sm uppercase block mb-2">Por que ela é essencial (O fim do prejuízo no Delivery)</strong>
             <p class="text-xs mb-2">O maior erro é vender no Delivery pelo preço da Loja. As taxas incidem sobre o valor TOTAL. Se você só somar 20%, ainda perde dinheiro.</p>
             <p class="text-xs font-bold">Nossa calculadora usa "Mark-up por Denominador". Isso garante que o lucro líquido (em reais) seja EXATAMENTE o mesmo na Loja Física e no iFood.</p>
          </div>

          <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">Integração Automática</strong>
             <ul class="list-disc list-inside text-xs space-y-1">
                <li><strong>Loja Física:</strong> Preço base com margem real.</li>
                <li><strong>iFood e CI:</strong> Calcula preço considerando comissão e custos fixos por pedido (CI).</li>
                <li><strong>99Food e KeeTa:</strong> Insira as taxas específicas e o sistema gera o preço corrigido.</li>
             </ul>
             <p class="text-xs mt-2 italic text-gray-500">Tudo automático, sem planilhas complexas.</p>
          </div>

          <div class="p-3 bg-gray-100 dark:bg-white/5 rounded-lg text-center">
             <strong class="text-brand-red text-xs uppercase block mb-1">Dica de Ouro</strong>
             <p class="text-xs">Não tenha medo de cobrar o preço certo. O cliente paga pela conveniência. Se você absorver as taxas, você está pagando para o cliente comer.</p>
          </div>
        </div>
      `
    },
    {
      id: 'step11',
      title: '11. Lucro Atual (Prova Real)',
      icon: ScrollText,
      color: 'text-teal-600 dark:text-teal-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">O Diagnóstico Real da Sua Precificação</p>
          <p class="text-sm leading-relaxed">Esta ferramenta é um "Raio-X". Você informa o preço que pratica HOJE, e o sistema revela a verdade nua e crua sobre sua sobra de caixa.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-bold text-center mt-2">
             <div class="p-3 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                VERMELHO<br/><span class="font-normal opacity-80 text-[10px]">Prejuízo (Perdendo dinheiro)</span>
             </div>
             <div class="p-3 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                AMARELO<br/><span class="font-normal opacity-80 text-[10px]">Atenção (Margem baixa)</span>
             </div>
             <div class="p-3 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                VERDE<br/><span class="font-normal opacity-80 text-[10px]">Saudável (Preço correto)</span>
             </div>
          </div>

          <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 mt-2">
             <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">A Mágica do Sistema</strong>
             <p class="text-xs">A partir do preço da loja, o sistema projeta como ficaria seu lucro nos marketplaces. Se o preço da loja está "Verde", ele deve estar verde em todos os apps para garantir o mesmo lucro em reais.</p>
          </div>

          <div class="bg-gray-100 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10">
             <strong class="text-gray-800 dark:text-white text-xs uppercase block mb-1">Dica de Ouro</strong>
             <p class="text-xs">Se o seu preço atual ficou no Vermelho, não adianta vender nos apps. Você estará apenas replicando o prejuízo em escala. Corrija o preço ou reduza custos (fornecedores/desperdício).</p>
          </div>
        </div>
      `
    },
    {
      id: 'step12',
      title: '12. Combos Estratégicos',
      icon: ShoppingBag,
      color: 'text-pink-600 dark:text-pink-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-gray-900 dark:text-white uppercase tracking-wide text-xs">O Poder de Elevar seu Faturamento</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-xs uppercase mb-1 block">O que é um Combo?</strong>
                <p class="text-xs">Pacotes promocionais (Burger + Batata + Refri). Oferece solução completa com preço especial.</p>
             </div>
             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-xs uppercase mb-1 block">Ticket Médio</strong>
                <p class="text-xs">É mais fácil fazer quem já compra gastar R$ 10 a mais (adicionando batata/refri) do que atrair um cliente novo.</p>
             </div>
          </div>

          <div class="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-200 dark:border-pink-500/30">
             <strong class="text-pink-800 dark:text-pink-300 text-xs uppercase block mb-1">Cuidado com a Margem</strong>
             <p class="text-xs">Para o combo ser atrativo, a margem de lucro é menor. O segredo é ganhar no VOLUME total e no giro de estoque.</p>
          </div>

          <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-900 dark:text-white text-xs uppercase mb-1 block">Como fazer no sistema?</strong>
             <ol class="list-decimal list-inside text-xs space-y-1">
                <li>Crie o Combo e dê um nome.</li>
                <li>Selecione os itens cadastrados.</li>
                <li>Defina a estratégia (margem).</li>
                <li>Diferencie canais: O sistema calcula preços diferentes para Loja e Delivery automaticamente.</li>
             </ol>
          </div>
          
          <p class="text-xs text-center font-bold text-brand-red">Se o lucro do combo (em R$) for maior que o item avulso, você venceu!</p>
        </div>
      `
    },
    {
      id: 'step13',
      title: '13. Estratégias de Marketing (CI iFood)',
      icon: TrendingUp,
      color: 'text-red-500',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-red-500 uppercase tracking-wide text-xs">Use a Campanha Inteligente Sem Perder Dinheiro!</p>
          <p class="text-sm leading-relaxed">Ferramenta do iFood que oferece descontos para atrair novos clientes, dividindo o custo entre você e eles.</p>
          
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-500/30">
             <strong class="text-red-800 dark:text-red-300 text-xs uppercase block mb-1 flex items-center gap-1"><AlertTriangle size={14}/> O Ponto de ALERTA: Custo Fixo</strong>
             <p class="text-xs mb-1">Você paga um valor fixo por pedido (geralmente até R$ 5,00).</p>
             <p class="text-xs">Esse valor, somado às taxas de comissão, pode corroer sua margem se o cardápio não estiver precificado corretamente.</p>
          </div>

          <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">A Importância da Precificação</strong>
             <ul class="list-disc list-inside text-xs space-y-1">
                <li><strong>Cálculo de Margem:</strong> Antes de ativar, use o sistema para garantir lucro mesmo descontando os R$ 5,00.</li>
                <li><strong>Lucro Real vs Venda Bruta:</strong> Não troque volume de pedidos por prejuízo.</li>
             </ul>
          </div>
          <p class="text-xs text-center opacity-70">Ative a campanha com segurança, sabendo exatamente quanto está investindo por pedido!</p>
        </div>
      `
    },
    {
      id: 'step14',
      title: '14. Guia de Taxas: iFood',
      icon: Truck,
      color: 'text-red-600',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-red-600 uppercase tracking-wide text-xs">Entenda as Taxas e Proteja seu Lucro</p>
          
          <div class="space-y-2">
             <div class="bg-white/50 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-white/10">
                <strong class="text-xs block mb-1">1. Entrega Própria vs Parceira</strong>
                <ul class="list-disc list-inside text-xs">
                    <li><strong>Própria (Básico):</strong> Taxa menor (~12%), você assume logística.</li>
                    <li><strong>Parceira (Entrega):</strong> Taxa maior (~23-27%), iFood cuida da logística.</li>
                </ul>
             </div>
             
             <div class="bg-white/50 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-white/10">
                <strong class="text-xs block mb-1">2. Taxas Extras</strong>
                <ul class="list-disc list-inside text-xs">
                    <li><strong>Pagamento Online:</strong> ~3.2% para processar pagamentos no app.</li>
                    <li><strong>Antecipação:</strong> Taxa extra se receber em 7 dias. Muitas lojas esquecem de somar isso!</li>
                </ul>
             </div>
          </div>

          <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-900/30">
             <strong class="text-red-800 dark:text-red-300 text-xs uppercase block mb-1">O Risco de Ignorar</strong>
             <p class="text-xs">Se você precificar só pelo CMV, paga para trabalhar. No sistema, alimente os campos with the taxas reais e nós fazemos o cálculo reverso.</p>
          </div>
        </div>
      `
    },
    {
      id: 'step15',
      title: '15. Guia de Taxas: 99Food (2025)',
      icon: Truck,
      color: 'text-yellow-600 dark:text-yellow-500',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wide text-xs">Taxas menores não significam lucro livre</p>
          
          <div class="space-y-2">
             <div class="bg-white/50 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-white/10">
                <strong class="text-xs block mb-1">1. Tipos de Planos Atuais</strong>
                <ul class="list-disc list-inside text-xs">
                    <li><strong>Plano Fixo:</strong> Taxa Zero de Lançamento (focado em entrega própria).</li>
                    <li><strong>Plano Flex:</strong> Comissão reduzida (~8.9% a 12%).</li>
                </ul>
             </div>
             
             <div class="bg-white/50 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-white/10">
                <strong class="text-xs block mb-1">2. Taxas de Operação</strong>
                <p class="text-xs">Pagamento Online e Entrega (se for parceira) também incidem.</p>
             </div>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-500/30">
             <strong class="text-yellow-800 dark:text-yellow-500 text-xs uppercase block mb-1">O Perigo de "Achar" que é Grátis</strong>
             <p class="text-xs">Mesmo com comissão zero, você tem Embalagem, Insumos e Logística. Use nosso simulador para validar se o preço está trazendo dinheiro.</p>
          </div>
        </div>
      `
    },
    {
      id: 'step16',
      title: '16. Guia de Taxas: KeeTa (2025)',
      icon: Truck,
      color: 'text-orange-600 dark:text-orange-500',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-orange-600 dark:text-orange-500 uppercase tracking-wide text-xs">KeeTa: A promessa "justa" com detalhes vitais</p>
          
          <div class="space-y-2">
             <div class="bg-white/50 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-white/10">
                <strong class="text-xs block mb-1">1. Modelos de Comissão</strong>
                <p class="text-xs">Geralmente ~12% (ou 9.9% promocional no 1º ano). Mensalidade pode ocorrer após o período grátis.</p>
             </div>
             
             <div class="bg-white/50 dark:bg-white/5 p-3 rounded border border-gray-200 dark:border-white/10">
                <strong class="text-xs block mb-1">2. Logística e Pedido Mínimo</strong>
                <p class="text-xs">Taxa Mínima por Pedido (R$ 2,00) + Custos de entrega por distância.</p>
             </div>
          </div>

          <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-500/30">
             <strong class="text-orange-800 dark:text-orange-400 text-xs uppercase block mb-1 flex items-center gap-1"><AlertTriangle size={14}/> O Alerta: Subsídios e Descontos</strong>
             <p class="text-xs mb-1">A KeeTa usa descontos progressivos (R$ 4,99 ou até 25%) financiados pela loja.</p>
             <p class="text-xs font-bold">Como o sistema protege:</p>
             <ul class="list-disc list-inside text-xs mt-1">
                <li>Configure os Subsídios.</li>
                <li>Adicione o custo logístico real (R$ 2,00 + KM) em Despesas Variáveis.</li>
                <li>O sistema calcula o preço blindado contra esses descontos agressivos.</li>
             </ul>
          </div>
        </div>
      `
    },
    {
      id: 'step17',
      title: '17. Lista de Compras',
      icon: ShoppingCart,
      color: 'text-emerald-600 dark:text-emerald-400',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide text-xs">Organize suas Compras com Precisão</p>
          <p class="text-sm leading-relaxed">A funcionalidade <strong>Lista de Compras</strong> agora está disponível diretamente na barra lateral esquerda.</p>
          
          <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">Como acessar:</strong>
             <ol class="list-decimal list-inside text-xs space-y-1">
                <li>Clique em <strong>Lista de Compras</strong> na barra lateral esquerda.</li>
                <li>A tela abrirá em modo completo, igual às demais abas (Dashboard, Despesas Fixas, etc.).</li>
             </ol>
          </div>

          <div class="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
             <strong class="text-emerald-800 dark:text-emerald-300 text-xs uppercase block mb-1">Como funciona (Sem mudanças):</strong>
             <ul class="list-disc list-inside text-xs space-y-1">
                <li>Use o campo de busca para localizar insumos digitando parte do nome.</li>
                <li>Clique no insumo desejado e informe a quantidade de <strong>embalagens</strong> (caixas/pacotes).</li>
                <li>O sistema calcula automaticamente o <strong>Subtotal</strong> e o <strong>Conteúdo Total</strong> (unidades, gramas ou ml).</li>
             </ul>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <strong class="text-gray-900 dark:text-white text-xs uppercase mb-1 block">Visualização & Ações</strong>
                <p class="text-xs mb-2">A lista exibe: Nome, Qtd Embalagens, Conteúdo Total, Preço do Pacote e Subtotal.</p>
                <p class="text-xs font-bold text-gray-900 dark:text-white mb-2">Total Geral (R$) disponível no rodapé.</p>
                <div class="flex gap-2">
                    <span class="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-bold">Imprimir Lista</span>
                    <span class="bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-bold">Salvar PDF</span>
                </div>
             </div>

             <div class="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30">
                <strong class="text-amber-800 dark:text-amber-300 text-xs uppercase block mb-1 flex items-center gap-1"><AlertTriangle size={14}/> Observações Importantes</strong>
                <ul class="list-disc list-inside text-xs space-y-1">
                    <li>Insumos sem preço ou quantidade cadastrada não podem ser adicionados.</li>
                    <li>Esta funcionalidade não altera cálculos globais; serve apenas para estimar gastos de compras.</li>
                </ul>
             </div>
          </div>
        </div>
      `
    },
    {
      id: 'step18',
      title: '18. Ponto de Equilíbrio',
      icon: Target,
      color: 'text-brand-red',
      content: `
        <div class="space-y-4 text-gray-600 dark:text-gray-300 font-sans">
          <p class="font-bold text-brand-red uppercase tracking-wide text-xs">A Meta que Salva seu Negócio</p>
          <p class="text-sm leading-relaxed">O painel "Ponto de Equilíbrio" ajuda você a entender exatamente quanto precisa vender para cobrir todos os custos fixos e variáveis.</p>
          
          <div class="bg-white/50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
             <strong class="text-gray-900 dark:text-white text-sm uppercase mb-1 block">Como funciona:</strong>
             <ol class="list-decimal list-inside text-xs space-y-1">
                <li>Selecione o mês desejado.</li>
                <li>O sistema preenche automaticamente os valores de Faturamento, Custos Fixos e Taxas Base (DNA).</li>
                <li>Informe o <strong>Ticket Médio</strong> ou use o calculador via número de pedidos.</li>
                <li>Lance eventuais custos variáveis extras (compras avulsas, taxas de entrega reais) na tabela local.</li>
             </ol>
          </div>

          <div class="bg-brand-red/5 dark:bg-brand-red/10 p-4 rounded-xl border border-brand-red/20">
             <strong class="text-brand-red text-xs uppercase block mb-1">Principais Resultados:</strong>
             <ul class="list-disc list-inside text-xs space-y-1">
                <li><strong>Receita de Equilíbrio:</strong> O valor em reais (R$) necessário para "zerar" as contas.</li>
                <li><strong>Equilíbrio em Pedidos:</strong> A quantidade física de itens vendidos baseada no seu ticket.</li>
                <li><strong>MC% (Margem de Contribuição):</strong> Quanto sobra de cada real vendido após pagar os custos variáveis.</li>
             </ul>
          </div>
          
          <p class="text-xs text-center italic mt-2 opacity-70">"Este painel é uma ferramenta de simulação estratégica e não altera seus dados permanentes no banco."</p>
        </div>
      `
    }
  ];

  const FAQ_ITEMS = [
    {
      id: 'faq1',
      question: 'O que é o CFI e por que ele é diferente de outros custos?',
      answer: 'O CFI (Custo Fixo Integrado) é o que paga suas contas de aluguel, luz e salários. Enquanto o CMV foca no ingrediente, o CFI garante que cada venda "limpe" uma parte das suas contas fixas. Sem ele, você vende muito e continua devendo o aluguel.'
    },
    {
      id: 'faq2',
      question: 'Como o sistema calcula o preço para o iFood e outros apps?',
      answer: 'Usamos uma fórmula de "denominador". Ela não apenas soma a taxa, mas recalcula o preço para que, depois que o aplicativo descontar a parte dele, o valor que sobra na sua mão seja exatamente o mesmo lucro que você tem na loja física.'
    },
    {
      id: 'faq3',
      question: 'Por que devo cadastrar a "perda" nos insumos?',
      answer: 'Porque você paga pelo quilo do tomate, mas joga o talo fora. Se você não cadastrar a perda, seu custo fica errado e você perde dinheiro. O sistema calcula o valor da "grama útil" para que seu lucro seja real.'
    },
    {
      id: 'faq4',
      question: 'Ativar a Campanha Inteligente do iFood dá prejuízo?',
      answer: 'Só dá prejuízo se você não precificar! Nossa calculadora já tem um campo para você colocar o custo da Campanha (ex: R$ 5,00). O sistema ajusta seu preço para que o iFood traga clientes novos sem "comer" a sua margem de lucro.'
    },
    {
      id: 'faq5',
      question: 'Qual a diferença entre Despesa Fixa e Insumo?',
      answer: 'Despesa Fixa é o que você paga mesmo se não vender nada (Aluguel, Internet). Insumo é o que você só gasta se vender (Carne, Pão, Embalagem). Dica: Nunca misture os dois para não bagunçar seu CFI.'
    },
    {
      id: 'faq6',
      question: 'Como os Combos ajudam no meu faturamento?',
      answer: 'Eles aumentam o seu "Ticket Médio" (o quanto o cliente gasta em cada compra). É mais fácil vender uma batata e um refri para quem já ia comprar um burger do que achar um cliente novo do zero.'
    },
    {
      id: 'faq7',
      question: 'O que significa a cor Vermelha na aba Lucro Atual?',
      answer: 'É um alerta de emergência. Significa que o seu preço de venda atual é menor do que o custo de produção + custos fixos. Você está pagando para trabalhar. Você precisa ou subir o preço ou baixar seus custos urgentemente.'
    },
    {
      id: 'faq8',
      question: 'Preciso cadastrar preços diferentes para iFood, 99Food e KeeTa?',
      answer: 'Não! Você cadastra o preço da sua Loja Física e as taxas de cada plataforma. O sistema gera automaticamente os preços sugeridos para cada app, garantindo o mesmo lucro em todos eles de forma automática.'
    },
    {
      id: 'faq9',
      question: 'Por que usar "Gramas" ou "ML" na Ficha Técnica em vez de "Unidade"?',
      answer: 'Para ter precisão. Um "punhado" de queijo pode variar o custo. Usando gramas, o sistema baixa o estoque corretamente e dá o custo exato de centavo em centavo.'
    },
    {
      id: 'faq10',
      question: 'Como sei se meu lucro desejado é possível?',
      answer: 'Na aba "Preço de Venda", você define sua meta (ex: 20%). O sistema mostrará o preço necessário. Se o preço ficar muito acima do mercado, use a aba "Lucro Atual" para ajustar sua realidade e encontrar o equilíbrio.'
    }
  ];

  const filteredManual = useMemo(() => {
    if (!searchTerm) return MANUAL_STEPS;
    const lower = searchTerm.toLowerCase();
    return MANUAL_STEPS.filter(s => 
        s.title.toLowerCase().includes(lower) || 
        s.content.toLowerCase().includes(lower)
    );
  }, [searchTerm, MANUAL_STEPS]);

  const filteredFAQ = useMemo(() => {
    if (!searchTerm) return FAQ_ITEMS;
    const lower = searchTerm.toLowerCase();
    return FAQ_ITEMS.filter(q => 
        q.question.toLowerCase().includes(lower) || 
        q.answer.toLowerCase().includes(lower)
    );
  }, [searchTerm, FAQ_ITEMS]);

  const isSearching = searchTerm.length > 0;

  return (
    <div className="space-y-8 pb-20 relative z-10 font-sans">
      
      {/* HEADER & SEARCH - GLASS DESIGN */}
      <div className="glass-card border border-gray-200 dark:border-white/10 p-10 rounded-3xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none opacity-40"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-5">
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight uppercase">Central de Ajuda</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium leading-relaxed">Inteligência estratégica para o seu restaurante.</p>
              
              <div className="relative group max-w-lg mx-auto pt-4">
                  <div className="relative flex items-center bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                      <Search className="text-gray-400 mr-3" size={20} />
                      <input 
                        type="text" 
                        placeholder="Busque dúvidas: CFI, iFood, Perda..." 
                        className="w-full bg-transparent text-gray-900 dark:text-white text-base outline-none placeholder-gray-400 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* TABS */}
      {!isSearching && (
          <div className="flex justify-center gap-8 border-b border-gray-200 dark:border-white/10 pb-1">
              <button 
                onClick={() => setActiveTab('manual')}
                className={`pb-4 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-4 ${activeTab === 'manual' ? 'border-brand-red text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                  Manual Completo
              </button>
              <button 
                onClick={() => setActiveTab('faq')}
                className={`pb-4 px-4 text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-4 ${activeTab === 'faq' ? 'border-brand-red text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                  Perguntas Frequentes
              </button>
          </div>
      )}

      <div className="max-w-4xl mx-auto space-y-4 px-4">
          
          {/* MANUAL SECTION */}
          {(activeTab === 'manual' || isSearching) && filteredManual.length > 0 && (
              <div className="space-y-4">
                  {isSearching && <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-4 border-l-4 border-brand-red pl-2">Resultados no Manual</h3>}
                  {filteredManual.map((step) => {
                      const Icon = step.icon;
                      const isOpen = expandedItems[step.id] || isSearching;
                      return (
                          <div key={step.id} className="glass-card border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all">
                              <button 
                                onClick={() => toggleItem(step.id)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-black/5 dark:hover:bg-white/5 transition"
                              >
                                  <div className="flex items-center gap-5">
                                      <div className={`p-3 rounded-xl bg-gray-50 dark:bg-white/5 shadow-inner ${step.color}`}>
                                          <Icon size={22} strokeWidth={2}/>
                                      </div>
                                      <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight uppercase text-sm">{step.title}</h3>
                                  </div>
                                  <div className="text-gray-400 p-2">
                                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                  </div>
                              </button>
                              
                              {isOpen && (
                                  <div className="px-8 pb-8 pt-2">
                                      <div 
                                        className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-white/5 pt-6"
                                        dangerouslySetInnerHTML={{ __html: step.content }} 
                                      />
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          )}

          {/* FAQ SECTION */}
          {(activeTab === 'faq' || isSearching) && filteredFAQ.length > 0 && (
              <div className="space-y-4">
                  {isSearching && <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-4 border-l-4 border-brand-red pl-2 mt-8">Resultados em FAQ</h3>}
                  {filteredFAQ.map((faq) => {
                      const isOpen = expandedItems[faq.id] || isSearching;
                      return (
                          <div key={faq.id} className="glass-card border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all">
                              <button 
                                onClick={() => toggleItem(faq.id)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-black/5 dark:hover:bg-white/5 transition"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300">
                                          <MessageCircleQuestion size={20} />
                                      </div>
                                      <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 pr-4">{faq.question}</h3>
                                  </div>
                                  <div className="text-gray-400 shrink-0">
                                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </div>
                              </button>
                              
                              {isOpen && (
                                  <div className="px-8 pb-8 pt-2">
                                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4">
                                          {faq.answer}
                                      </p>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          )}

          {(activeTab === 'faq' || isSearching) && filteredFAQ.length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm italic">
                  Nenhuma pergunta frequente encontrada para sua busca.
              </div>
          )}

      </div>
    </div>
  );
};

export default Help;
