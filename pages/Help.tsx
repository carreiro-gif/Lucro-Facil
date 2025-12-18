
import React, { useState, useMemo } from 'react';
import { Search, HelpCircle, ChevronDown, ChevronUp, Lightbulb, ExternalLink, LayoutDashboard, Receipt, Tags, DollarSign, Dna, Beef, UtensilsCrossed, Calculator, ScrollText, ShoppingBag, X, Store, AlertTriangle, FileText, Percent, Settings, Palette, Download, Upload, LogOut, Copy, Trash2, Edit, Cloud, ShieldCheck } from 'lucide-react';

const Help: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'faq'>('manual');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- DADOS DO CONTEÚDO (MANUAL E BASE DE CONHECIMENTO) ---

  const MANUAL_STEPS = [
    // --- GUIA PASSO A PASSO (Abas) ---
    {
      id: 'step_store_management',
      title: '1. Tela Inicial: Gestão de Lojas',
      icon: Store,
      color: 'text-blue-700 dark:text-blue-300',
      keywords: 'lojas filiais criar editar excluir replicar clonar copiar dados matriz franquia logo endereço',
      content: `
        <h4 class="font-bold text-brand-red mb-2">O Comando Central do Seu Negócio</h4>
        <p>Ao abrir o sistema, você cai na <strong>Tela Inicial</strong>. É aqui que você gerencia sua expansão, seja você dono de uma única hamburgueria ou de uma rede de franquias.</p>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200 flex items-center gap-2"><span class="bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 text-xs">A</span> Adicionar Novas Lojas</strong>
        <p class="mt-1">Quer abrir uma filial? Não misture as contas!</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Clique no botão grande com o símbolo de <strong>"+" (Adicionar Loja)</strong>.</li>
            <li>Dê um nome (Ex: "Filial Shopping") e o endereço.</li>
            <li>Pronto! Você terá um painel financeiro totalmente separado para ela.</li>
        </ul>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200 flex items-center gap-2"><span class="bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 text-xs">B</span> Editar e Personalizar (Logo e Endereço)</strong>
        <p class="mt-1">No cartão de cada loja, você verá ícones no canto superior direito:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Ícone de Lápis (Editar):</strong> Clique aqui para alterar o <strong>Nome da Loja</strong>, atualizar o <strong>Endereço</strong> ou mudar a <strong>Logo</strong> (imagem de capa). Manter a logo atualizada ajuda a identificar visualmente cada unidade rapidamente.</li>
        </ul>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200 flex items-center gap-2"><span class="bg-blue-100 text-blue-800 rounded px-1.5 py-0.5 text-xs">C</span> Excluir uma Loja</strong>
        <p class="mt-1 text-sm">Precisa remover uma loja fechada ou criada por engano?</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Clique no <strong>Ícone de Lixeira</strong> no cartão da loja.</li>
            <li><strong>Cuidado:</strong> O sistema pedirá uma confirmação. Ao confirmar, <strong>todos os dados</strong> (cardápios, custos, fichas técnicas) daquela loja específica serão apagados permanentemente.</li>
        </ul>
        <br/>

        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-700">
            <strong class="text-brand-red block mb-2 flex items-center gap-2"><Copy size={16}/> Função Poderosa: Replicar Dados</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Imagine que você abriu uma filial nova. Você não precisa cadastrar os 50 hambúrgueres e 100 insumos tudo de novo!</p>
            <br/>
            <strong class="text-gray-800 dark:text-gray-200 text-sm">Como usar a Replicação:</strong>
            <ol class="list-decimal list-inside ml-2 mt-1 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Clique no botão <strong>"Replicar Dados"</strong> no topo da tela inicial.</li>
                <li><strong>De (Origem):</strong> Selecione sua loja principal (Ex: Matriz).</li>
                <li><strong>Para (Destino):</strong> Selecione a loja nova (Ex: Filial Shopping).</li>
                <li><strong>O que copiar?:</strong> Escolha se quer copiar TUDO (Clonar Loja) ou apenas partes específicas (Só o Cardápio, Só os Insumos, Só as Configurações de Taxas).</li>
            </ol>
            <p class="text-xs mt-2 italic text-blue-600 dark:text-blue-400">Dica: Use isso para padronizar suas franquias em segundos!</p>
        </div>
      `
    },
    {
      id: 'step_config',
      title: '2. Backup & Segurança (Novo!)',
      icon: ShieldCheck,
      color: 'text-emerald-700 dark:text-emerald-300',
      keywords: 'backup salvar nuvem download restaurar formatar pc google drive onedrive segurança',
      content: `
        <h4 class="font-bold text-brand-red mb-2">A Segurança dos seus Dados é Prioridade</h4>
        <p>Este sistema utiliza tecnologia moderna que salva tudo instantaneamente no seu navegador (Auto-Save). Porém, se o seu computador quebrar ou for formatado, você precisa de um Backup externo.</p>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200 flex items-center gap-2"><span class="bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5 text-xs">1</span> O Semáforo de Segurança (Menu Lateral)</strong>
        <p class="mt-1">No final do menu esquerdo, adicionamos um monitor de backup:</p>
        <ul class="list-none mt-2 space-y-2 text-sm">
            <li class="flex items-center gap-2"><span class="text-emerald-500 font-bold">Verde:</span> Backup feito recentemente (menos de 3 dias).</li>
            <li class="flex items-center gap-2"><span class="text-amber-500 font-bold">Amarelo:</span> Atenção, faz alguns dias que você não salva.</li>
            <li class="flex items-center gap-2"><span class="text-red-500 font-bold">Vermelho:</span> PERIGO! Você corre risco de perder dados se o PC der problema.</li>
        </ul>
        <p class="text-sm mt-2 text-gray-500">Para resolver, basta clicar no botão <strong>"FAZER BACKUP"</strong> que fica dentro desse quadro colorido.</p>
        <br/>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-xl border border-yellow-200 dark:border-yellow-700 shadow-md">
            <strong class="text-brand-red text-lg block mb-3 flex items-center gap-2"><Lightbulb size={20} className="fill-yellow-400 text-yellow-600" /> DICA DE OURO (LEIA ISSO!)</strong>
            
            <p class="text-sm text-gray-800 dark:text-gray-200 font-bold mb-2">Para onde vai o arquivo?</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Quando você clica em "FAZER BACKUP", o arquivo é salvo automaticamente na sua pasta de <strong>DOWNLOADS</strong> do computador.
            </p>

            <strong class="text-gray-800 dark:text-gray-200 text-sm block mb-2">O Segredo da Segurança Total (Nuvem):</strong>
            <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400 mb-2">
                Ter o arquivo no PC não adianta se o PC queimar! Crie o hábito de, toda sexta-feira:
            </p>
            <ol class="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <li>Clicar em "FAZER BACKUP".</li>
                <li>Abrir seu <strong>Google Drive</strong>, <strong>OneDrive</strong> ou enviar para si mesmo no <strong>WhatsApp/E-mail</strong>.</li>
                <li>Arrastar o arquivo baixado para lá.</li>
            </ol>
            <p class="text-xs mt-3 italic text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-black/20 p-2 rounded inline-block">
                Fazendo isso, você pode abrir este sistema em QUALQUER computador do mundo e restaurar seus dados em segundos!
            </p>
        </div>
      `
    },
    {
      id: 'step_dashboard',
      title: '3. Dashboard',
      icon: LayoutDashboard,
      color: 'text-indigo-600 dark:text-indigo-500',
      keywords: 'dashboard painel graficos indicadores kpi visao geral',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Para que serve?</h4>
        <p>O painel de controle do piloto. Uma visão gráfica e resumida da saúde do negócio.</p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Por que é importante?</h4>
        <p>Para não perder tempo calculando. Em segundos você vê: Seu faturamento médio, se seu Custo Fixo está alto demais (Alerta de perigo) e a distribuição dos seus custos.</p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Como fazer?</h4>
        <p>Apenas observe. Ele é alimentado automaticamente por todas as outras abas. Se algo estiver vermelho aqui, corra para corrigir nas abas de Despesas ou Precificação.</p>
      `
    },
    {
      id: 'step_expenses',
      title: '4. Despesas Fixas',
      icon: Receipt,
      color: 'text-red-600 dark:text-red-500',
      keywords: 'despesas fixas contas pagar aluguel luz internet salario pro-labore custo fixo mensal variavel diferenca',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Despesas Fixas: A Base da Sua Operação</h4>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">O que são Despesas Fixas?</strong>
        <p>São todos os gastos que o seu negócio tem independentemente de você vender um único produto ou não. Se a sua loja abrir as portas no dia 1º e fechar no dia 30 sem um único pedido, essas contas chegarão no final do mês do mesmo jeito. Elas são a estrutura que permite que sua operação exista.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">Por que é importante lançar corretamente?</strong>
        <p>O lançamento correto das despesas fixas é crucial para o cálculo do seu CFI (Custo Fixo Integrado) e para determinar o Ponto de Equilíbrio do seu negócio (quantos reais você precisa faturar só para cobrir os custos).</p>
        <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded border-l-4 border-gray-500 my-2 text-sm italic text-gray-700 dark:text-gray-300">
            Exemplo: Se sua loja custa R$ 10.000,00 para ficar aberta (aluguel, salários, etc.) e você fatura R$ 30.000,00, significa que 33% do seu faturamento bruto serve apenas para pagar a estrutura. O sistema precisa desse número exato para precificar cada item e garantir que cada venda contribua para pagar essa conta.
        </div>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">Diferença Fundamental: Fixas vs. Variáveis</strong>
        <p>Entender a diferença é o que separa um gestor amador de um profissional:</p>
        <div class="overflow-x-auto my-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th class="p-2">Tipo de Despesa</th>
                        <th class="p-2 text-center">Depende da Venda?</th>
                        <th class="p-2">Exemplos</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr>
                        <td class="p-2 font-bold text-red-600">Fixas</td>
                        <td class="p-2 font-bold text-center">NÃO</td>
                        <td class="p-2 text-gray-600 dark:text-gray-300">Aluguel, Salários (parte fixa), Energia, Água, Contabilidade, Software, IPTU.</td>
                    </tr>
                    <tr>
                        <td class="p-2 font-bold text-blue-600">Variáveis</td>
                        <td class="p-2 font-bold text-center">SIM</td>
                        <td class="p-2 text-gray-600 dark:text-gray-300">Insumos (carne, pão), Embalagens, Comissões de Apps, Taxas de Cartão, Frete.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">Exemplos Detalhados de Custos Fixos:</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Aluguel e Contas:</strong> Aluguel do espaço, IPTU, Energia, Água, Gás (valor mínimo), Internet e Telefone.</li>
            <li><strong>Pessoal:</strong> Salários fixos (CLT), Vale Transporte, Vale Alimentação, INSS e FGTS (encargos trabalhistas), Pró-labore dos sócios.</li>
            <li><strong>Serviços:</strong> Honorários do contador, Taxas de licenças e alvarás, Assinaturas de softwares e sistemas (como o nosso!).</li>
        </ul>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Como fazer no sistema?</h4>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Clique em "Nova Despesa Fixa".</li>
            <li>Lance o valor mensal exato de cada conta (Ex: "Aluguel", R$ 2.500,00).</li>
            <li>Use a função de Parcelamento para lançar compras de equipamentos ou empréstimos que chegam todo mês.</li>
        </ul>
        <br/>
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-700">
            <strong class="text-brand-red block mb-1">Atenção Crítica:</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">NÃO lance compras de insumos (carne, pão, legumes) aqui. Insumos são custos variáveis (CMV) e entram no cadastro de insumos e na Ficha Técnica.</p>
        </div>
        <br/>
        <p class="text-sm italic text-gray-500"><strong>Lembre-se:</strong> A precisão aqui é a garantia de que o seu CFI (Custo Fixo Integrado) será calculado corretamente, blindando seu preço de venda contra surpresas no fechamento do caixa.</p>
      `
    },
    {
      id: 'step_categories',
      title: '5. Categorias & Fornecedores',
      icon: Tags,
      color: 'text-gray-600 dark:text-gray-400',
      keywords: 'categorias fornecedores organização contatos telefone cadastro centros de custo',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Categorias e Fornecedores: A Organização que Gera Lucro</h4>
        
        <strong class="text-gray-800 dark:text-gray-200">1. Categorias de Gastos (As "Caixinhas" do seu Dinheiro)</strong>
        <br/>
        <strong class="text-brand-red text-sm mt-2 block">Para que serve?</strong>
        <p>As categorias são grupos que organizam todas as saídas de dinheiro da sua empresa. Em vez de ver apenas um monte de boletos pagos, você enxerga "centros de custo".</p>
        
        <strong class="text-brand-red text-sm mt-2 block">Por que é vital para o seu negócio?</strong>
        <p>Sem categorias, você não tem gestão. No final do mês, o sistema gera relatórios que respondem perguntas estratégicas como:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm italic text-gray-600 dark:text-gray-400">
            <li>"Eu gastei mais com Marketing ou com Manutenção de Equipamentos este mês?"</li>
            <li>"O valor que gasto com Embalagens está acima do planejado para o meu faturamento?"</li>
            <li>"Quanto do meu dinheiro está indo para Impostos?"</li>
        </ul>
        
        <strong class="text-brand-red text-sm mt-2 block">Como fazer?</strong>
        <p>O sistema já traz as principais categorias do mercado de alimentação, mas você pode personalizá-las:</p>
        <div class="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs mt-1 border border-gray-200 dark:border-gray-700">
            <strong>Exemplos:</strong> Pessoal (salários/benefícios), Infraestrutura (aluguel/luz), Marketing (anúncios/panfletos), Impostos e Taxas, e Manutenção.
        </div>
        <p class="text-xs mt-1 text-gray-500"><em>Dica: Ao lançar uma conta, sempre a coloque na "caixinha" correta para que o seu gráfico de gastos no final do mês seja fiel à realidade.</em></p>
        
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">2. Fornecedores (Seus Parceiros de Negócio)</strong>
        <br/>
        <strong class="text-brand-red text-sm mt-2 block">Para que serve?</strong>
        <p>É o cadastro de todas as empresas ou pessoas de quem você compra insumos (carne, pão, embalagens) ou contrata serviços (contador, técnico de refrigeração).</p>
        
        <strong class="text-brand-red text-sm mt-2 block">Por que é importante?</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Histórico de Compras:</strong> Você consegue rastrear quanto comprou de cada parceiro ao longo do ano.</li>
            <li><strong>Agilidade de Contato:</strong> Tenha o telefone e o e-mail de quem te atende sempre à mão dentro do sistema.</li>
            <li><strong>Controle Financeiro:</strong> Ao lançar uma conta a pagar, você vincula a um fornecedor. Assim, você sabe exatamente quanto deve para o "Açougue do Zé" ou para o "Atacadão" na próxima semana.</li>
        </ul>
        
        <strong class="text-brand-red text-sm mt-2 block">Como fazer?</strong>
        <p>Cadastre o nome da empresa, o contato e, se desejar, o CNPJ.</p>
        <p class="text-sm mt-1">Exemplos: Frigoríficos, Distribuidoras de Bebidas, Empresas de Embalagens, Prestadores de Serviço de Limpeza.</p>
        
        <br/>
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-700">
            <strong class="text-brand-red block mb-1">O Poder da Visão Estratégica</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Quando você une Categorias + Fornecedores, o sistema deixa de ser apenas uma calculadora de preços e se torna um Painel de Controle. Você para de "achar" que gasta muito e passa a "ter certeza" de onde cada centavo está sendo aplicado. É essa clareza que permite cortar gastos desnecessários e aumentar o seu lucro líquido!</p>
        </div>
      `
    },
    {
      id: 'step_billing',
      title: '6. Faturamento',
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-500',
      keywords: 'faturamento receita venda bruta entradas dinheiro mes mensal historico',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Para que serve?</h4>
        <p>Histórico de quanto dinheiro entrou no caixa da empresa (Venda Bruta) mês a mês.</p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Por que é importante?</h4>
        <p>Para calcular a porcentagem do Custo Fixo, precisamos de uma referência de receita. <br/>
        <em>Fórmula: Total Despesas Fixas ÷ Faturamento Médio = % de Custo Fixo.</em><br/>
        Sem preencher o faturamento, o sistema não consegue calcular o CFI.</p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Como fazer?</h4>
        <p>Selecione o ano e insira o valor total vendido em cada mês. Mantenha sempre atualizado para que o preço sugerido reflita a realidade atual da loja.</p>
      `
    },
    {
      id: 'step_cfi',
      title: '7. CFI da Empresa',
      icon: Dna,
      color: 'text-purple-600 dark:text-purple-500',
      keywords: 'cfi custo fixo integrado taxas cartao imposto simples nacional royalties marketing voucher vr',
      content: `
        <h4 class="font-bold text-brand-red mb-2">O que é o CFI (Custo Fixo Integrado)?</h4>
        <p>O CFI é a alma da sua precificação. Ele não olha apenas para o custo do ingrediente (carne, pão, queijo), mas integra todos os seus custos fixos invisíveis diretamente no preço de cada produto vendido.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">1. Por que o CFI é fundamental?</strong>
        <p>Muitos donos de restaurantes quebram porque precificam usando a "conta de padaria": multiplicam o custo do ingrediente por 2 ou 3.</p>
        <p>O problema é que essa conta ignora que, para aquele prato chegar ao cliente, você pagou:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Aluguel e IPTU.</li>
            <li>Energia, Água e Gás.</li>
            <li>Salários e encargos da equipe.</li>
            <li>Internet e softwares.</li>
        </ul>
        <p class="mt-2">O CFI pega esse "bolo" de contas fixas mensais e o divide estrategicamente pela sua capacidade de venda, integrando uma pequena parcela desse custo em cada item do cardápio.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">2. Como o CFI funciona na prática?</strong>
        <p>Imagine que seus custos fixos mensais somam R$ 10.000,00.</p>
        <p>Se você não usa o CFI, você vende muito e, no fim do mês, descobre que o faturamento mal pagou os fornecedores e sobrou nada para o aluguel.</p>
        <p>Com o CFI Integrado, o nosso sistema identifica qual a porcentagem exata (ou valor fixo) que cada hambúrguer ou marmita precisa carregar para "quitar" sua parte desses R$ 10.000,00.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">3. A Importância de Configurar o CFI no Sistema</strong>
        <p>O risco de ignorar o CFI é a falsa sensação de lucro. Você vê o dinheiro entrando, mas o lucro real é corroído pelos custos fixos que não foram previstos no preço.</p>
        <p class="mt-1">No nosso sistema, você elimina essa falha:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Mapeamento Total:</strong> Você insere o valor total dos seus custos fixos mensais.</li>
            <li><strong>Distribuição Inteligente:</strong> O sistema calcula o impacto desses custos em cada venda.</li>
            <li><strong>Segurança Financeira:</strong> O preço de venda gerado já garante que, ao vender aquela unidade, você está pagando um pedacinho da luz, um pedacinho do aluguel e garantindo a sua margem de lucro líquida.</li>
        </ul>
        <br/>
        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded border border-purple-200 dark:border-purple-700">
            <strong class="text-brand-red block mb-1">Resumo para o seu Sucesso</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">O CFI transforma custos fixos (que são o maior pesadelo da gestão) em uma variável controlada. Quando você alimenta o sistema corretamente com o seu Custo Fixo Integrado, você para de "torcer" para sobrar dinheiro no fim do mês e passa a ter a certeza de que cada venda está construindo a saúde financeira do seu negócio.</p>
        </div>
      `
    },
    {
      id: 'step_ingredients',
      title: '8. Insumos',
      icon: Beef,
      color: 'text-amber-700 dark:text-amber-600',
      keywords: 'insumos ingredientes materia prima perda cadastro pacote kg gramas litros',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Insumos: Onde o Lucro é Calculado nos Mínimos Detalhes</h4>
        
        <strong class="text-gray-800 dark:text-gray-200">O que são Insumos?</strong>
        <p>Insumos são todas as matérias-primas brutas que você compra para transformar em produtos. É a base de tudo: desde a carne e o pão até o papel acoplado e o saquinho de sal.</p>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200">Por que esta etapa é a mais importante?</strong>
        <p>No dia a dia, existe uma diferença enorme entre o que você paga e o que você realmente usa. O sistema resolve dois problemas críticos aqui:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Conversão Inteligente de Unidades:</strong> Você compra o queijo em Peças (KG), mas no seu sanduíche você usa Fatias (Gramas). O sistema faz essa conversão matemática para você, garantindo que o custo da fatia esteja exato.</li>
            <li><strong>Fator de Correção (O Custo da Perda):</strong> Nem tudo que você compra vai para o prato do cliente.</li>
        </ul>

        <div class="bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-700 my-2 text-sm">
            <strong>Exemplo:</strong> Você compra 1kg de tomate, mas após lavar e retirar os talos e sementes, restam apenas 800g de tomate aproveitável.
            <br/>
            <span class="text-xs mt-1 block"><strong>O Risco:</strong> Se você ignorar esses 200g de perda, seu prato custará mais caro do que você imagina, e esse prejuízo vai acumulando silenciosamente. O sistema calcula o preço da grama útil, para que o cliente pague pelo desperdício natural da operação, e não você.</span>
        </div>
        <br/>

        <h4 class="font-bold text-brand-red mb-2">Como fazer no sistema (Regra de Ouro)</h4>
        <p>Para que o cálculo seja perfeito, siga sempre este padrão: <strong>Cadastre pelo PACOTE FECHADO conforme você compra do fornecedor.</strong></p>
        
        <div class="bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 border border-gray-200 dark:border-gray-700 text-sm">
            <strong class="block mb-1 text-gray-700 dark:text-gray-300">Exemplo Prático: Ketchup Galão</strong>
            <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li><strong>Unidade de Compra:</strong> Unidade (ou Galão).</li>
                <li><strong>Preço Pago:</strong> R$ 40,00.</li>
                <li><strong>Quantidade no Pacote:</strong> 3.500 (sempre em gramas ou ml para facilitar).</li>
                <li><strong>Índice de Perda:</strong> 2% (aquilo que fica grudado no fundo do galão e ninguém usa).</li>
            </ul>
        </div>
        <p class="text-sm mt-2"><strong>O resultado:</strong> O sistema dirá instantaneamente quanto custa cada 1 grama de ketchup já considerando a perda. Quando você for montar sua Ficha Técnica, basta dizer que usa 20g, e o valor será exato.</p>
        <br/>

        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-700">
            <strong class="text-brand-red block mb-1">Dica para o Sucesso:</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Sempre que o preço do fornecedor mudar, atualize o valor aqui no Insumo. Automaticamente, o sistema atualizará o custo de todas as suas Fichas Técnicas e Combos que usam esse item. Isso evita que você continue vendendo pelo preço antigo enquanto sua matéria-prima subiu.</p>
            <p class="text-xs mt-2 italic text-green-700 dark:text-green-400 font-bold">Não ignore os centavos: Em uma escala de mil vendas, uma diferença de R$ 0,10 por insumo mal cadastrado significa R$ 100,00 de lucro perdido. Cadastre com atenção e domine seus números!</p>
        </div>
      `
    },
    {
      id: 'step_products',
      title: '9. Ficha Técnica (CMV)',
      icon: UtensilsCrossed,
      color: 'text-orange-600 dark:text-orange-500',
      keywords: 'cardapio ficha tecnica receita produto cmv custo mercadoria composicao',
      content: `
        <h4 class="font-bold text-brand-red mb-2">O que é?</h4>
        <p>A Ficha Técnica é o DNA do seu produto. Não é apenas uma receita; é o documento que traduz ingredientes em valores financeiros. Aqui você diz ao sistema exatamente o que compõe seu prato: "O X-Burger leva 1 pão brioche, 160g de blend de carne, 2 fatias de queijo cheddar e 1 embalagem premium".</p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Por que ela é o coração do seu negócio?</h4>
        <p>Sem uma Ficha Técnica precisa, seu restaurante está navegando no escuro. Veja por que ela é indispensável:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Cálculo Real do CMV (Custo de Mercadoria Vendida):</strong> Ela soma, de centavo em centavo, o custo de cada insumo. Isso permite que o sistema saiba exatamente quanto você gasta para produzir uma unidade.</li>
            <li><strong>Padronização e Qualidade:</strong> Garante que o cliente receba sempre o mesmo produto, não importa quem esteja na cozinha. Se a quantidade de queijo variar "no olho", seu lucro vai embora junto com a fatia extra.</li>
            <li><strong>Controle de Estoque:</strong> Ao vender um prato, o sistema dá baixa automática nas quantidades exatas de cada ingrediente. Sem ficha técnica, seu estoque nunca baterá com a realidade.</li>
            <li><strong>Identificação de Desperdícios:</strong> Quando você sabe que um prato deve usar 100g de frango, mas seu estoque está acabando mais rápido, você identifica imediatamente falhas de produção ou desperdícios.</li>
        </ul>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">O Risco de "Chutar" o Preço</h4>
        <p>Precificar sem Ficha Técnica é como tentar construir uma casa sem planta. Um erro de apenas <strong>R$ 0,50</strong> por prato, em uma operação que vende 1.000 pedidos por mês, significa <strong>R$ 500,00</strong> de lucro que sumiram do seu bolso sem você perceber.</p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Como fazer no sistema?</h4>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Cadastre os Insumos:</strong> Primeiro, insira os itens que você compra (Ex: Saco de 5kg de Arroz, Peça de 3kg de Carne).</li>
            <li><strong>Crie o Produto Final:</strong> (Ex: "Marmita de Frango G").</li>
            <li><strong>Monte a Composição:</strong> Abra a Ficha Técnica do produto e adicione os insumos e as quantidades exatas usadas (Ex: 0,200kg de Arroz, 0,150kg de Frango).</li>
            <li><strong>Inclua a Embalagem:</strong> Não esqueça de adicionar o custo da caixa, guardanapo e sacola. Eles também fazem parte do custo de produção!</li>
        </ul>
        <br/>
        <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded border border-orange-200 dark:border-orange-700">
            <strong class="text-brand-red block mb-1">Lembre-se:</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">No nosso sistema, a Ficha Técnica é o primeiro passo para a liberdade financeira. Com ela bem feita, o sistema calcula o preço de venda ideal para você nunca mais perder dinheiro.</p>
        </div>
      `
    },
    {
      id: 'step_pricing',
      title: '10. Preço de Venda (Precificação)',
      icon: Calculator,
      color: 'text-blue-600 dark:text-blue-500',
      keywords: 'preco venda precificacao ifood 99food keeta taxas marketplace delivery lucro margem',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Preço de Venda: A Sua Calculadora de Lucro Real</h4>
        
        <strong class="text-gray-800 dark:text-gray-200">O que é?</strong>
        <p>É a ferramenta que une tudo o que você cadastrou até aqui: seu CMV (insumos), seu CFI (custo fixo) e as Taxas de Marketplace. Ela calcula automaticamente por quanto você deve vender seu produto para que, após pagar todas as taxas e custos, sobre exatamente a Meta de Lucro que você definiu.</p>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200">Por que ela é essencial (O fim do prejuízo no Delivery)</strong>
        <p>O maior erro de um dono de restaurante é vender no Delivery pelo mesmo preço da Loja Física. No Delivery, as taxas (iFood, 99Food, KeeTa) incidem sobre o valor total da venda, incluindo a própria taxa! Se você apenas somar 20% ao preço, você ainda perderá dinheiro.</p>
        <p class="mt-2">Nossa calculadora usa o cálculo de "Mark-up por Denominador". Isso garante que o valor que sobra no seu bolso (lucro líquido) seja exatamente o mesmo, não importa se você vendeu no balcão ou no aplicativo.</p>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200">Como funciona a Integração Automática:</strong>
        <p>Basta você preencher as porcentagens de acordo com o seu contrato em cada plataforma e o sistema fará o resto:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Loja Física:</strong> O preço base com sua margem de lucro real.</li>
            <li><strong>iFood e iFood CI (Campanha Inteligente):</strong> O sistema já calcula o preço considerando a comissão do app e os custos fixos por pedido (como os R$ 5,00 da Campanha Inteligente).</li>
            <li><strong>99Food e KeeTa:</strong> Você insere as taxas específicas (comissões e subsídios) e o sistema gera o preço de venda corrigido para essas plataformas.</li>
        </ul>
        <p class="mt-2 text-sm">O resultado? Você verá uma tabela com os preços sugeridos para cada canal. Se você seguir esses valores, o lucro que você planejou na loja será o mesmo que cairá na sua conta vindo dos marketplaces. Tudo automático, sem precisar de planilhas complexas.</p>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200">Como fazer:</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Defina sua Margem de Lucro Desejada (Ex: 25%).</li>
            <li>Confira se as taxas de cada Marketplace (iFood, 99, KeeTa) e as taxas de cartão/antecipação estão corretas.</li>
            <li>O sistema mostrará o Preço Sugerido em verde. Se você decidir arredondar o preço para cima ou para baixo, o sistema mostrará em tempo real qual será sua nova margem de lucro.</li>
        </ul>
        <br/>

        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-700">
            <strong class="text-brand-red block mb-1 flex items-center gap-2"><Lightbulb size={16} /> Dica de Ouro:</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Não tenha medo de cobrar o preço certo no Delivery. O cliente do iFood ou da KeeTa está pagando pela conveniência de receber em casa. Se você tentar "absorver" as taxas das plataformas para manter o preço baixo, você estará, na verdade, pagando para o cliente comer.</p>
            <p class="text-sm mt-2 font-medium text-gray-800 dark:text-gray-200">Use a nossa calculadora para ter a segurança de que cada pedido que sai da sua cozinha — seja para a mesa 4 ou para o motoboy — está colocando o lucro exato que você merece no seu bolso. Preço correto é o que mantém sua porta aberta!</p>
        </div>
      `
    },
    {
      id: 'step_profit',
      title: '11. Lucro Atual (Prova Real)',
      icon: ScrollText,
      color: 'text-teal-600 dark:text-teal-500',
      keywords: 'lucro atual prova real prejuizo analise margem real',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Lucro Atual: O Diagnóstico Real da Sua Precificação</h4>
    
        <strong class="text-gray-800 dark:text-gray-200">Para que serve?</strong>
        <p>Esta ferramenta funciona como um "Raio-X" da sua situação presente. Enquanto a aba anterior (Preço de Venda) mostra o preço ideal calculado para você, esta aba analisa o seu preço real de hoje na loja física. Você informa ao sistema o valor que está no seu cardápio agora, e ele revela a verdade nua e crua sobre a sua sobra de caixa.</p>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200">Por que ela é importante?</strong>
        <p>Muitos lojistas sentem que o preço sugerido na calculadora é "alto demais". Aqui é o momento de testar a sua realidade: "Estou tendo 5% de lucro com meu preço atual?" ou "Estou pagando R$ 2,00 para vender esse lanche?". É o choque de realidade necessário.</p>
        <br/>

        <h4 class="font-bold text-brand-red mb-2">Como funciona (O Semáforo do Lucro e a Integração Automática)</h4>
        <p>Ao preencher a coluna "Preço de Venda Atual" (apenas o da loja física), o sistema faz um cruzamento instantâneo com todos os seus custos (Insumos + CFI + Taxas de Apps) e pinta a sua situação com cores de alerta:</p>
        <ul class="list-none mt-2 space-y-2 text-sm">
            <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-red-500 block"></span> <strong>Vermelho (Prejuízo):</strong> Você está perdendo dinheiro em cada venda desse item.</li>
            <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-yellow-500 block"></span> <strong>Amarelo (Atenção):</strong> O seu lucro está abaixo da margem de segurança.</li>
            <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500 block"></span> <strong>Verde (Saudável):</strong> Seu preço está correto e alinhado com a estratégia de lucro.</li>
        </ul>
        <br/>

        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded border border-purple-200 dark:border-purple-700">
            <strong class="text-purple-700 dark:text-purple-300 block mb-1">A Mágica do Seu Sistema:</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">O grande diferencial é que, a partir desse único preço da loja que você inseriu, o sistema projetará automaticamente como ficaria sua margem de lucro se você aplicasse esse mesmo valor em todos os marketplaces configurados (iFood, 99Food, KeeTa).</p>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mt-2">Como usamos o cálculo de "denominador" na outra tela, a ideia é que, se o seu preço na loja está verde, ele também estará verde em todos os aplicativos, garantindo que o lucro (em reais) seja o mesmo em todos os canais.</p>
        </div>
        <br/>

        <strong class="text-gray-800 dark:text-gray-200">Como fazer:</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Vá na coluna <strong>"Preço de Venda Atual"</strong> e digite o valor que você cobra hoje apenas na sua loja física.</li>
            <li>Analise a coluna de "Margem %" e "Lucro em R$" para a loja física.</li>
            <li>Observe como esse lucro se replica para os canais de Delivery nas colunas ao lado.</li>
        </ul>
        <br/>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-700">
            <strong class="text-brand-red block mb-1 flex items-center gap-2">💡 Dica de Ouro:</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">O mercado não paga suas contas, o seu lucro sim. Se o seu preço atual ficou no Vermelho, não adianta vender nos marketplaces. Você estará apenas replicando o prejuízo em escala. A função desta tela é te dar clareza: se o seu preço atual não cobre seus custos, você tem apenas dois caminhos: ou aumenta o preço gradualmente, ou reduz o custo (trocando fornecedores ou diminuindo desperdícios na ficha técnica).</p>
            <p class="text-sm mt-2 font-bold text-gray-800 dark:text-gray-200">Não tenha medo do diagnóstico. É melhor descobrir que está perdendo dinheiro agora, enquanto há tempo de corrigir, do que fechar o mês com as contas no negativo sem entender o porquê. Conhecimento é poder, mas lucro é sobrevivência!</p>
        </div>
      `
    },
    {
      id: 'step_combos',
      title: '12. Combos Estratégicos',
      icon: ShoppingBag,
      color: 'text-pink-600 dark:text-pink-500',
      keywords: 'combos promocao pacote conjunto itens precificacao ticket medio estrategia faturamento',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Combos Estratégicos: O Poder de Elevar seu Faturamento</h4>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">O que é um Combo?</strong>
        <p>É a criação de pacotes promocionais onde você agrupa itens que se complementam (Ex: Burger + Batata + Refrigerante). Em vez de vender cada item separado, você oferece uma solução completa para o cliente com um preço especial para o conjunto.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">O que é Ticket Médio?</strong>
        <p>O Ticket Médio é o valor médio que cada cliente gasta na sua loja por pedido.</p>
        <div class="bg-gray-100 dark:bg-gray-800 p-2 rounded border-l-4 border-gray-500 my-2 text-sm italic text-gray-700 dark:text-gray-300">
            Exemplo: Se em um dia você faz 10 vendas e fatura R$ 400,00, seu Ticket Médio é de R$ 40,00.
        </div>
        <p><strong>Por que isso importa?</strong> É muito mais barato e fácil convencer um cliente que já está comprando a gastar R$ 10,00 a mais (adicionando uma batata e refri) do que gastar marketing e tempo para atrair um cliente novo do zero. Aumentar o Ticket Médio é o caminho mais rápido para aumentar o lucro sem aumentar o número de clientes.</p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Por que os Combos são Vitais?</h4>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Aumento Real do Faturamento:</strong> O combo "empurra" itens de alta margem (como batata e bebidas) para o cliente, elevando o valor final da nota.</li>
            <li><strong>Psicologia de Compra:</strong> O cliente sente que está levando vantagem ao ganhar um desconto no conjunto, o que facilita a decisão de compra.</li>
            <li><strong>Giro de Estoque:</strong> Você pode usar combos para fazer girar produtos que estão parados no estoque, combinando-os com seus itens "carro-chefe".</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">O Cuidado com a Margem no Combo</strong>
        <p>Ao criar um combo, a soma dos custos muda. Geralmente, para o combo ser atrativo, você oferece uma margem de lucro um pouco menor do que se vendesse os itens separados.</p>
        <p><em>O segredo é: Você ganha menos em cada item individualmente, mas ganha muito mais no volume total da venda.</em></p>
        <br/>
        <h4 class="font-bold text-brand-red mb-2">Como fazer no sistema?</h4>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Crie o Combo:</strong> Dê um nome atrativo (Ex: "Combo Casal" ou "Mega Oferta").</li>
            <li><strong>Agrupe os Produtos:</strong> Selecione os itens que já possuem ficha técnica cadastrada.</li>
            <li><strong>Defina a Estratégia:</strong> O sistema somará o custo de todos os itens e permitirá que você defina a margem desejada para aquele pacote.</li>
            <li><strong>Diferencie Canais:</strong> Nosso sistema permite que você defina preços diferentes para o Combo na Loja Física e no Delivery (considerando as taxas de apps).</li>
        </ul>
        <br/>
        <div class="bg-pink-50 dark:bg-pink-900/20 p-4 rounded border border-pink-200 dark:border-pink-700">
            <strong class="text-brand-red block mb-1">Dica de Mestre</strong>
            <p class="text-sm leading-relaxed text-gray-700 dark:text-gray-300">Use nosso sistema para simular o combo. Se o lucro do combo (em reais) for maior do que o lucro de vender apenas o item principal sozinho, você está no caminho certo para o sucesso financeiro!</p>
        </div>
      `
    },
    // --- TÓPICOS AVANÇADOS (Base de Conhecimento) ---
    {
      id: 'adv1',
      title: 'Gestão de Múltiplas Lojas (Filiais)',
      icon: Store,
      color: 'text-gray-700 dark:text-gray-300',
      keywords: 'lojas filiais matriz replicar copiar dados franquia multi',
      content: `
        <p>O sistema permite gerenciar várias unidades (Matriz e Filiais) no mesmo painel.</p>
        <br/>
        <strong>Como criar:</strong> Na tela inicial "Minhas Lojas", clique em "Adicionar Loja".
        <br/><br/>
        <strong>Como trocar:</strong> Use o botão "Trocar Loja" no final do menu lateral esquerdo para voltar à listagem.
        <br/><br/>
        <strong>Função Replicar (Clonar):</strong> Se você abrir uma filial com o mesmo cardápio, use o botão "Replicar Dados" na tela de listagem. Você pode copiar todo o cardápio, insumos e configurações de uma loja para outra em segundos.
      `
    },
    {
      id: 'adv2',
      title: 'Campanha Inteligente (CI) do iFood',
      icon: AlertTriangle,
      color: 'text-purple-600 dark:text-purple-400',
      keywords: 'ci campanha inteligente ifood desconto custo marketing investimento',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Use a Campanha Inteligente do iFood Sem Perder Dinheiro!</h4>
        <p>Nosso sistema de precificação ajuda você a lucrar em todas as vendas, mas é fundamental entender os Custos de Marketing ao ativar ferramentas externas como a Campanha Inteligente do iFood.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">O que é a Campanha Inteligente?</strong>
        <p>É uma ferramenta do iFood que oferece descontos para atrair novos clientes para sua loja, dividindo o custo do cupom entre você e eles. Funciona como um ímã: só paga se vender, e o cliente só recebe o benefício se comprar.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">O Ponto de ALERTA para Você: O Custo Fixo</strong>
        <p>O principal ponto de atenção é o valor do seu investimento:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Você concorda em pagar um valor fixo por cada pedido originado dessa campanha (geralmente até R$ 5,00).</li>
            <li>Esse valor, somado às taxas de comissão e entrega do iFood, pode corroer sua margem de lucro se seu cardápio não estiver corretamente precificado.</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">A Importância da Precificação Correta</strong>
        <p>É aqui que nosso sistema entra:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Cálculo de Margem:</strong> Antes de ativar a campanha, use nosso sistema para garantir que seus produtos tenham uma margem de lucro saudável, mesmo após descontar o custo do cupom (R$ 5,00) e as taxas habituais.</li>
            <li><strong>Lucro Real vs. Venda Bruta:</strong> Uma venda a mais é ótima, mas só vale a pena se gerar lucro no seu bolso. Não troque volume de pedidos por prejuízo.</li>
        </ul>
        <br/>
        <p class="font-bold text-brand-red border-l-4 border-brand-red pl-3 py-1">Em resumo: A Campanha Inteligente é uma ótima estratégia de atração, mas o lucro depende 100% da sua precificação. Ative a campanha com segurança, sabendo exatamente quanto está investindo por pedido!</p>
      `
    },
    {
      id: 'adv3',
      title: 'Entendendo a "Perda" nos Insumos',
      icon: FileText,
      color: 'text-amber-600 dark:text-amber-500',
      keywords: 'perda limpeza quebra fator correcao',
      content: `
        <p>Quase todo alimento tem perda. Se você ignorar isso, estará pagando para trabalhar.</p>
        <br/>
        <strong>Exemplo Prático:</strong>
        <p>Você compra 1kg de cebola por R$ 5,00. Descasca e joga fora 150g de casca. Sobra 850g.</p>
        <p>Se você calcular o custo dividindo por 1000g, dará R$ 0,005/g. ERRADO!</p>
        <p>Você pagou R$ 5,00 mas só tem 850g úteis. O custo real é R$ 5,00 ÷ 850 = R$ 0,0058/g.</p>
        <br/>
        <strong>No Sistema:</strong> Basta colocar a % de perda no cadastro do insumo e ele faz essa conta (Fator de Correção) automaticamente para você.
      `
    },
    {
      id: 'adv4',
      title: 'Entenda as Taxas do iFood',
      icon: Percent,
      color: 'text-green-600 dark:text-green-500',
      keywords: 'ifood taxas entrega propria parceira pagamento online antecipacao',
      content: `
        <h4 class="font-bold text-brand-red mb-2">Entenda as Taxas do iFood e Proteja seu Lucro</h4>
        <p>Vender no iFood envolve diferentes custos que variam de acordo com o seu modelo de contrato. O segredo para não ter prejuízo é cadastrar cada taxa corretamente em nosso sistema.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">1. Entrega Própria vs. Entrega Parceira</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Entrega Própria (Plano Básico):</strong> Você usa seus próprios entregadores. A taxa sobre o valor do pedido é menor (geralmente em torno de 12%), mas você assume os custos logísticos.</li>
            <li><strong>Entrega Parceira (Plano Entrega):</strong> O iFood cuida da logística. A taxa é maior (geralmente em torno de 23% a 27%), porém você não precisa gerir entregadores.</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">2. Taxas de Transação e Recebimento</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Pagamento Online:</strong> Sempre que o cliente paga pelo app (Cartão, Pix, VR), o iFood cobra uma taxa adicional (em média 3,2%) para processar esse pagamento.</li>
            <li><strong>Antecipação de Recebíveis:</strong> Se você opta por receber o dinheiro das vendas em 7 dias em vez de 30, o iFood cobra uma taxa extra por isso. Atenção: Muitas lojas esquecem de somar essa porcentagem no custo final!</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">3. O Risco de Ignorar as Taxas</strong>
        <p>O maior erro de um dono de restaurante é precificar pensando apenas no custo do ingrediente (CMV). Se você não incluir as taxas citadas acima, você pode estar pagando para trabalhar sem perceber. Cada pedido vendido com a precificação errada aumenta o seu prejuízo acumulado.</p>
        <br/>
        <strong class="text-brand-red">Como nosso sistema te protege:</strong>
        <p class="mt-1">No nosso sistema, você não corre esse risco. Basta alimentar os campos com as taxas reais da sua loja:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Insira a porcentagem do seu plano (Básico ou Entrega).</li>
            <li>Adicione a taxa de pagamento online e de antecipação, se houver.</li>
            <li><strong>Nós fazemos o cálculo automático:</strong> O sistema processa esses custos e entrega para você o Preço de Venda Ideal, garantindo que o lucro desejado caia de fato na sua conta.</li>
        </ul>
        <br/>
        <p class="font-bold text-brand-red border-l-4 border-brand-red pl-3 py-1">Mantenha seus dados atualizados e venda com a tranquilidade de quem sabe exatamente quanto está ganhando!</p>
      `
    },
    {
      id: 'adv5',
      title: '99Food: Planos e Taxas (Atualizado 2025)',
      icon: Percent,
      color: 'text-yellow-600 dark:text-yellow-500',
      keywords: '99food taxas plano fixo flex comissao entrega gratis',
      content: `
        <h4 class="font-bold text-brand-red mb-2">99Food: Planos e Taxas (Atualizado 2025)</h4>
        <p>A 99Food voltou com modelos que dão mais "liberdade" ao lojista, mas é preciso cuidado: taxas menores não significam lucro garantido se o preço final estiver errado.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">1. Tipos de Planos Atuais</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Plano Fixo (Taxa Zero de Lançamento):</strong> Muitos novos parceiros estão entrando com uma condição especial de comissão 0% por um período determinado (geralmente focado em quem já possui entrega própria).</li>
            <li><strong>Plano Flex (Comissão Reduzida):</strong> Voltado para quem busca visibilidade, este plano tem uma comissão que gira em torno de 8,9% a 12%. É uma taxa bem menor que a do iFood, mas que ainda deve ser calculada no custo do prato.</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">2. Taxas de Operação e Pagamento</strong>
        <p>Diferente do iFood, a 99Food foca muito na integração com a carteira digital 99Pay.</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Pagamento Online:</strong> Taxas de processamento para cartões e pagamentos via app (geralmente inclusas na comissão ou cobradas separadamente em torno de 3,2%).</li>
            <li><strong>Entrega:</strong> Se você optar pela logística da 99Food (entregadores parceiros), haverá uma taxa de serviço por pedido ou uma porcentagem maior na comissão, dependendo da sua região e contrato.</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">3. O Perigo de "Achar" que é Grátis</strong>
        <p>O maior risco na 99Food é o lojista acreditar que a "Taxa Zero" significa lucro livre. Mesmo com comissão zero, você ainda tem:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Custos de embalagem e insumos.</li>
            <li>Custo logístico (se a entrega for sua).</li>
            <li>Investimento em promoções e cupons para aparecer nas primeiras posições.</li>
        </ul>
        <br/>
        <strong class="text-brand-red">Como nosso sistema te protege:</strong>
        <p class="mt-1">A 99Food muda as regras com frequência (recentemente alterando de taxa zero para 8,9% para alguns lojistas). No nosso sistema, você tem agilidade:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Sempre que a 99Food mudar sua porcentagem, você altera o campo "Comissão Marketplace" aqui.</li>
            <li>O sistema recalcula seu Preço de Venda na hora.</li>
            <li>Você garante que, mesmo com a entrada de novos apps ou mudanças de taxas, o seu lucro líquido permaneça protegido.</li>
        </ul>
        <br/>
        <p class="font-bold text-brand-red border-l-4 border-brand-red pl-3 py-1">Não deixe que as "taxas baixas" escondam prejuízos. Use nosso simulador para validar se o preço da 99Food está realmente trazendo dinheiro para o seu caixa!</p>
      `
    },
    {
      id: 'adv6',
      title: 'KeeTa: Planos e Taxas (Atualizado Dezembro/2025)',
      icon: Percent,
      color: 'text-orange-600 dark:text-orange-500',
      keywords: 'keeta taxas comissao logistica subsidio desconto obrigatorio',
      content: `
        <h4 class="font-bold text-brand-red mb-2">KeeTa: Planos e Taxas (Atualizado Dezembro/2025)</h4>
        <p>A KeeTa chegou com a promessa de ser a "opção mais justa", mas sua estrutura de custos inclui variáveis que podem passar despercebidas.</p>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">1. Modelos de Comissão e Mensalidade</strong>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Comissão Padrão:</strong> A taxa de comissão gira em torno de 12%, mas para atrair novos parceiros em 2025, muitas lojas operam com uma taxa promocional de 9,9% no primeiro ano.</li>
            <li><strong>Mensalidade:</strong> Durante o primeiro ano, não há cobrança de mensalidade. Após esse período, a taxa prevista é de <strong>R$ 150,00</strong>, mas apenas para lojas que faturam acima de R$ 4.000,00 por mês.</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">2. Taxas de Logística e Pedido Mínimo</strong>
        <p>Diferente de outros apps, a KeeTa detalha os custos logísticos que o restaurante ajuda a compor:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Taxa Mínima por Pedido:</strong> Existe uma taxa fixa de R$ 2,00 por pedido realizado.</li>
            <li><strong>Custos de Entrega (por distância):</strong> Os restaurantes podem arcar com valores fixos dependendo do raio de entrega, como R$ 3,50 para até 2 km, subindo conforme a distância aumenta.</li>
        </ul>
        <br/>
        <strong class="text-gray-800 dark:text-gray-200">3. O Alerta: Subsídios e Descontos Obrigatórios</strong>
        <p>Este é o ponto onde nosso sistema é vital. A KeeTa utiliza um modelo de descontos progressivos financiados pelo restaurante para atrair clientes:</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li>Pedidos entre R$ 25 e R$ 40 podem ter descontos obrigatórios de R$ 4,99.</li>
            <li>Pedidos acima de R$ 60 podem chegar a descontos de 15% a 25% bancados pela loja.</li>
        </ul>
        <br/>
        <strong class="text-brand-red">Como nosso sistema te protege:</strong>
        <p class="mt-1">Se você não considerar esses R$ 4,99 ou os 25% de desconto na hora de precificar, sua margem de lucro pode simplesmente sumir em pedidos da KeeTa.</p>
        <ul class="list-disc list-inside ml-2 mt-1 space-y-1 text-sm">
            <li><strong>Configure os Subsídios:</strong> Informe no sistema quais faixas de desconto você está oferecendo na KeeTa.</li>
            <li><strong>Custo Logístico Real:</strong> Adicione a taxa de R$ 2,00 e os custos de KM no campo de "Despesas Variáveis".</li>
            <li><strong>Preço de Venda Blindado:</strong> Nosso sistema calculará o preço necessário para que, mesmo após o desconto agressivo da KeeTa, o lucro desejado continue garantido no seu bolso.</li>
        </ul>
        <br/>
        <p class="font-bold text-brand-red border-l-4 border-brand-red pl-3 py-1">Ao considerar a parceria com a KeeTa, é fundamental analisar cuidadosamente todos os custos envolvidos, incluindo comissões, taxas logísticas e os descontos obrigatórios, para garantir a sustentabilidade do seu negócio na plataforma.</p>
      `
    }
  ];

  const FAQ_ITEMS = [
    {
      id: 'faq_cfi_def',
      question: 'O que é o CFI e por que ele é diferente de outros custos?',
      answer: 'O <strong>CFI (Custo Fixo Integrado)</strong> é o que paga suas contas de aluguel, luz e salários. Enquanto o CMV foca no ingrediente, o CFI garante que cada venda "limpe" uma parte das suas contas fixas. Sem ele, você vende muito e continua devendo o aluguel.'
    },
    {
      id: 'faq_apps_calc',
      question: 'Como o sistema calcula o preço para o iFood e outros apps?',
      answer: 'Usamos uma fórmula de <strong>"denominador"</strong>. Ela não apenas soma a taxa, mas recalcula o preço para que, depois que o aplicativo descontar a parte dele, o valor que sobra na sua mão seja exatamente o mesmo lucro que você tem na loja física.'
    },
    {
      id: 'faq_waste',
      question: 'Por que devo cadastrar a "perda" nos insumos?',
      answer: 'Porque você paga pelo quilo do tomate, mas joga o talo fora. Se você não cadastrar a perda, seu custo fica errado e você perde dinheiro. O sistema calcula o valor da <strong>"grama útil"</strong> para que seu lucro seja real.'
    },
    {
      id: 'faq_smart_campaign',
      question: 'Ativar a Campanha Inteligente do iFood dá prejuízo?',
      answer: 'Só dá prejuízo se você não precificar! Nossa calculadora já tem um campo para você colocar o custo da Campanha (ex: R$ 5,00). O sistema ajusta seu preço para que o iFood traga clientes novos sem "comer" a sua margem de lucro.'
    },
    {
      id: 'faq_fixed_vs_variable',
      question: 'Qual a diferença entre Despesa Fixa e Insumo?',
      answer: '<strong>Despesa Fixa</strong> é o que você paga mesmo se não vender nada (Aluguel, Internet). <strong>Insumo</strong> é o que você só gasta se vender (Carne, Pão, Embalagem). <br/><br/><em>Dica: Nunca misture os dois para não bagunçar seu CFI.</em>'
    },
    {
      id: 'faq_combos',
      question: 'Como os Combos ajudam no meu faturamento?',
      answer: 'Eles aumentam o seu <strong>"Ticket Médio"</strong> (o quanto o cliente gasta em cada compra). É mais fácil vender uma batata e um refri para quem já ia comprar um burger do que achar um cliente novo do zero.'
    },
    {
      id: 'faq_red_alert',
      question: 'O que significa a cor Vermelha na aba Lucro Atual?',
      answer: 'É um <strong>alerta de emergência</strong>. Significa que o seu preço de venda atual é menor do que o custo de produção + custos fixos. Você está pagando para trabalhar. Você precisa ou subir o preço ou baixar seus custos urgentemente.'
    },
    {
      id: 'faq_diff_prices',
      question: 'Preciso cadastrar preços diferentes para iFood, 99Food e KeeTa?',
      answer: '<strong>Não!</strong> Você cadastra o preço da sua Loja Física e as taxas de cada plataforma. O sistema gera automaticamente os preços sugeridos para cada app, garantindo o mesmo lucro em todos eles de forma automática.'
    },
    {
      id: 'faq_units',
      question: 'Por que usar "Gramas" ou "ML" na Ficha Técnica em vez de "Unidade"?',
      answer: 'Para ter precisão. Um "punhado" de queijo pode variar o custo. Usando gramas, o sistema baixa o estoque corretamente e dá o custo exato de centavo em centavo.'
    },
    {
      id: 'faq_profit_feasibility',
      question: 'Como sei se meu lucro desejado é possível?',
      answer: 'Na aba "Preço de Venda", você define sua meta (ex: 20%). O sistema mostrará o preço necessário. Se o preço ficar muito acima do mercado, use a aba "Lucro Atual" para ajustar sua realidade e encontrar o equilíbrio.'
    }
  ];

  // --- LÓGICA DE BUSCA ---
  const filteredManual = useMemo(() => {
    if (!searchTerm) return MANUAL_STEPS;
    const lower = searchTerm.toLowerCase();
    // Busca no título, conteúdo e nas palavras-chave ocultas
    return MANUAL_STEPS.filter(s => 
        s.title.toLowerCase().includes(lower) || 
        s.content.toLowerCase().includes(lower) ||
        (s.keywords && s.keywords.includes(lower))
    );
  }, [searchTerm]);

  const filteredFaq = useMemo(() => {
    if (!searchTerm) return FAQ_ITEMS;
    const lower = searchTerm.toLowerCase();
    return FAQ_ITEMS.filter(f => 
        f.question.toLowerCase().includes(lower) || 
        f.answer.toLowerCase().includes(lower)
    );
  }, [searchTerm]);

  // Se estiver buscando, mostra ambas as abas se tiver resultados
  const isSearching = searchTerm.length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER & SEARCH - GLASSMORPHISM TO SHOW DYNAMIC THEME BEHIND */}
      <div className="bg-white/80 dark:bg-black/30 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-8 rounded-2xl relative overflow-hidden shadow-xl">
          {/* Subtle decoration for light mode */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Como podemos ajudar você hoje?</h1>
              <p className="text-gray-500 dark:text-gray-300 text-lg">Digite sua dúvida ou navegue pelo manual completo.</p>
              
              <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-purple-600 rounded-xl blur opacity-10 dark:opacity-25 group-hover:opacity-30 dark:group-hover:opacity-50 transition duration-200"></div>
                  <div className="relative flex items-center bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 shadow-sm dark:shadow-xl">
                      <Search className="text-gray-400 mr-3" size={24} />
                      <input 
                        type="text" 
                        placeholder="Ex: iFood, Perda, Custo Fixo, Gás, Lucro..." 
                        className="w-full bg-transparent text-gray-900 dark:text-white text-lg outline-none placeholder-gray-400 dark:placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                          <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">Limpar</button>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* TABS (Only show if not searching) */}
      {!isSearching && (
          <div className="flex justify-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-1">
              <button 
                onClick={() => setActiveTab('manual')}
                className={`pb-3 px-6 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'manual' ? 'border-brand-red text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                  Manual Completo
              </button>
              <button 
                onClick={() => setActiveTab('faq')}
                className={`pb-3 px-6 text-sm font-bold uppercase tracking-wider transition border-b-2 ${activeTab === 'faq' ? 'border-brand-red text-gray-900 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                  Perguntas Frequentes
              </button>
          </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
          
          {/* MANUAL SECTION */}
          {(activeTab === 'manual' || isSearching) && filteredManual.length > 0 && (
              <div className="space-y-4">
                  {isSearching && <h3 className="text-gray-500 font-bold uppercase text-xs mb-2 pl-2">Resultados no Manual</h3>}
                  {filteredManual.map((step) => {
                      const Icon = step.icon;
                      const isOpen = expandedItems[step.id] || isSearching; // Auto expand on search
                      return (
                          <div key={step.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm">
                              <button 
                                onClick={() => toggleItem(step.id)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${step.color}`}>
                                          <Icon size={24} />
                                      </div>
                                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{step.title}</h3>
                                  </div>
                                  <div className="text-gray-400">
                                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                  </div>
                              </button>
                              
                              {isOpen && (
                                  <div className="px-6 pb-6 pt-0 ml-0 md:ml-20">
                                      <div 
                                        className="text-gray-600 dark:text-gray-300 text-base leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4"
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
          {(activeTab === 'faq' || isSearching) && filteredFaq.length > 0 && (
              <div className="space-y-4">
                  {isSearching && <h3 className="text-gray-500 font-bold uppercase text-xs mb-2 pl-2 mt-8">Resultados nas Perguntas (FAQ)</h3>}
                  {filteredFaq.map((faq) => {
                      const isOpen = expandedItems[faq.id];
                      return (
                          <div key={faq.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden transition-all">
                              <button 
                                onClick={() => toggleItem(faq.id)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition focus:outline-none"
                              >
                                  <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                                      <HelpCircle size={18} className="text-brand-red shrink-0" />
                                      {faq.question}
                                  </span>
                                  <span className="text-gray-400 shrink-0 ml-4">
                                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </span>
                              </button>
                              {isOpen && (
                                  <div className="px-5 pb-5 pt-2 pl-12">
                                      <div 
                                        className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed bg-gray-50 dark:bg-black/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50"
                                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                                      />
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          )}

          {/* EMPTY STATE */}
          {isSearching && filteredManual.length === 0 && filteredFaq.length === 0 && (
              <div className="text-center py-20">
                  <div className="bg-gray-200 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                      <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-gray-500">Tente buscar por palavras-chave como "custo", "ifood" ou "lucro".</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-6 text-brand-red font-bold hover:underline"
                  >
                      Limpar busca
                  </button>
              </div>
          )}

      </div>
    </div>
  );
};

export default Help;
