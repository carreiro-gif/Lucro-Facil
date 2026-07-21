# Arquitetura do Sistema - Cardápio Blindado

Este documento reúne todas as especificações técnicas, parâmetros e fluxos operacionais que compõem o ecossistema do **Cardápio Blindado** (antigo Lucro Fácil). Seu objetivo é guiar novos desenvolvedores ou ferramentas de IA em futuras manutenções, garantindo a integridade dos dados e da metodologia financeira aplicada.

---

## 📌 Informações Gerais do Projeto

*   **Nome Atual do Produto:** Cardápio Blindado (anteriormente conhecido como Lucro Fácil)
*   **Projeto Firebase:** `lucro-facil-28aaf`
*   **Domínio Atual de Produção:** [app-cardapioblindado.vercel.app](https://app-cardapioblindado.vercel.app)
*   **Provedor de Pagamento:** Stone / Pagar.me V5
*   **Hospedagem / Deploy:** Vercel (Frontend & Serverless API Routes)
*   **Gerenciamento de Código:** GitHub
*   **Banco de Dados:** Cloud Firestore (Instância Padrão / `(default)`)

---

## 🚨 Regra de Ouro (CRÍTICO)

> ⚠️ **NUNCA UTILIZAR databaseId CUSTOMIZADO NO FIRESTORE SEM AUTORIZAÇÃO EXPLÍCITA!**
> 
> O projeto utiliza exclusivamente o banco Firestore **padrão** (`(default)`). A criação de referências para IDs de banco adicionais (como `ai-studio-57d6581a-bc6f-4824-aac4-a33546056122`) causa falhas de conexão no navegador com o erro `Database not found`. Toda e qualquer inicialização de banco via `initializeFirestore` ou `getFirestore` deve omitir o parâmetro `databaseId`, mantendo a configuração limpa.

---

## 📦 Principais Módulos do Sistema

O **Cardápio Blindado** é um software modular de inteligência financeira desenvolvido sob medida para donos de negócios de alimentação (com foco especial em hamburguerias e deliveries). Suas principais seções de interface são:

1.  **Dashboard Financeiro:** Painel consolidado com a saúde financeira da loja, resumo de receitas/despesas, CMV médio ponderado e alertas imediatos de perigo de margem.
2.  **Insumos e Sub-receitas:** Cadastro detalhado de matérias-primas e embalagens, com suporte a fator de perda (Fator de Correção). Permite criar preparos da casa (como molhos artesanais ou blends de carne) agregando outros insumos pré-cadastrados, calculando automaticamente o custo em cascata.
3.  **Fichas Técnicas (Controle de CMV):** Criação de receitas completas para os produtos de venda, associando ingredientes e pesos líquidos para encontrar o custo exato de insumos do prato.
4.  **Precificação Inteligente por Canal:** Calculadora automatizada que aplica a fórmula do **Markup Inverso** para sugerir o preço de venda ideal em múltiplos canais simultâneos (iFood Plano Entrega, iFood Básico, Keeta, 99Food, Balcão/Mesa e Canal Próprio/WhatsApp).
5.  **CFI da Empresa (Custos Fixos Integrados):** Centralização das despesas fixas (tudo o que o negócio gasta para existir, independentemente do volume de vendas), calculando a incidência do CFI percentual sobre o faturamento médio.
6.  **Ponto de Equilíbrio (Break-Even):** Acompanhamento visual de faturamento em relação ao Ponto de Equilíbrio Mensal e a meta de faturamento diário para pagar as contas do negócio nos primeiros 10 dias.
7.  **Combos e Engenharia de Cardápio:** Ferramenta para precificação de promoções e combos (agrupando produtos com margem garantida) e classificação da engenharia (Estrela, Cavalo de Batalha, Incógnita, Abacaxi).
8.  **E-book Bônus - Livro de Ofertas:** Aba guiada pela inteligência do consultor financeiro **Xande**, detalhando as taxas reais das plataformas e as 4 regras para criação de ofertas seguras (Oferta do Dia, Oferta Salva Margem, Oferta Bomba de Vendas e Oferta Chamariz).

---

## 🔄 Fluxos de Arquitetura

### 1. Fluxo de Autenticação e Perfis (Auth Flow)

```
[ Usuário ] ──► Login / Registro (Firebase Auth)
                     │
                     ▼
          [ AuthContext Provider ]
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   Se perfil existe:       Se perfil novo:
   Carrega /users/{uid}    Cria doc em /users/{uid}
         │                       │
         ▼                       ▼
  Aplica Roles (admin/client) e Seta status (trial/active)
```

*   **Identificação de Administrador:** A conta `espacocarreiro@gmail.com` é definida de forma nativa e segura no `AuthContext.tsx` como administrador master. Contas administradoras recebem o plano `admin` e status `active` com cota ilimitada de lojas (`maxStores: 999`), além de habilitarem o menu exclusivo de **Backup do Sistema** na barra lateral.

---

### 2. Fluxo de Assinaturas e Planos (Billing Flow)

O sistema opera com um controle de acessos dinâmico no cliente e no servidor:

1.  **Status do Usuário:** Armazenado no documento de usuário (`/users/{uid}`) como `trial`, `active`, `expired` ou `cancelled`.
2.  **Validação Automática:** A cada inicialização, o `AuthContext` confere o campo `trialEnd` ou `planExpiry`. Se a data atual for maior que a validade do plano, o status é alterado para `expired` no banco e no estado da aplicação.
3.  **Bloqueio de Funcionalidades:** Se o usuário estiver `expired`, o sistema exibe a `SubscriptionBlockScreen` impedindo a manipulação de dados operacionais até a regularização do pagamento via Stone/Pagar.me V5.

---

### 3. Fluxo do Consultor Financeiro Virtual (Xande IA)

O **Xande** é a Inteligência Artificial embarcada do Cardápio Blindado, agindo como um consultor sênior de bolso. Ele responde contextualmente em tempo real com foco absoluto em engenharia financeira de alimentos e bebidas (A&B).

```
[ Usuário digita no Chat ]
            │
            ▼
[ API Proxy Route (/api/chat) ] ──► Seta API Key do Gemini (Server-side)
            │
            ▼
[ SDK @google/genai ] ──► System Instructions (Definido nas regras do Xande no AGENTS.md)
            │
            ▼
[ Resposta em texto ] ──► Formatação amigável, direta e matemática
```

*   **Segurança de Segredos:** A API Key do Gemini é gerenciada **exclusivamente no lado do servidor** na rota de proxy `/api/*` e configurada via variáveis de ambiente. Isso impede a exposição de segredos comerciais e chaves privadas no código client-side enviado ao navegador.
*   **Fórmulas Utilizadas:** O Xande aplica obrigatoriamente a fórmula do **Markup Inverso** em suas interações de precificação:
    $$\text{Preço de Venda} = \frac{\text{Custo Direto (Insumo + Embalagem)}}{1 - (\% \text{CMV Alvo} + \% \text{CFI} + \% \text{Margem Lucro} + \% \text{Taxa Marketplace} + \% \text{Antecipação})}$$

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide React (Ícones), Motion/React (Animações).
*   **Servidor Backend:** Node.js, Express (API e Proxy de Serviços localizados em `/api`).
*   **Banco de Dados & Autenticação:** Firebase Cloud Firestore SDK, Firebase Client Authentication SDK.
