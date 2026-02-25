# ZENT A.I. - Plataforma de Atendimento e CRM

![ZENT A.I. Banner](assets/banner-social.png)

A **ZENT A.I.** é uma plataforma SaaS white-label construída sobre a infraestrutura da GoHighLevel (GHL), focada em escritórios de advocacia e empresas que buscam automatizar o atendimento inicial (SDR) e organizar o fluxo comercial com inteligência artificial.

## 🚀 Tecnologias Core

- **Frontend**: Vanilla JS, CSS moderno (Glassmorphism), Vite.
- **Backend/DB**: Supabase (PostgreSQL, Auth, Edge Functions, Storage).
- **Integrações**: GoHighLevel, Asaas (Pagamentos), Google Calendar.
- **Analytics**: GA4 + Meta Pixel.

## 📁 Estrutura do Projeto

```text
zent-plataforma-agencia/
├── admin/                  # Painel Administrativo
├── assets/                 # Recursos estáticos (Imagens, SVGs)
├── css/                    # Estilos globais e componentes
├── docs/                   # Documentação técnica e briefs
├── js/                     # Lógica principal (Auth, Checkout, Members)
├── supabase/               # Backend (Functions, Migrations)
├── index.html              # Landing Page
├── auth.html               # Login / Cadastro
├── checkout.html           # Pagamento
├── members.html            # Área de Membros
└── package.json            # Configurações Node/Vite
```

## 🛠️ Configuração Local

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/Frigheto/zentia.git
    cd zent-plataforma-agencia
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure o `.env`**:
    Copie o `.env.example` para `.env` e preencha as chaves do Supabase e GHL.

4.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

## 🔐 Matriz de Planos & Acesso

| Plano | Valor | Foco |
| :--- | :--- | :--- |
| **Starter** | R$ 197/mês | CRM, Leads e Suporte básico. |
| **Básico** | R$ 397/mês | + IA de Atendimento e Redes Sociais. |
| **Profissional**| R$ 697/mês | + Agente SDR, Disparo em Massa e Integrações. |
| **Premium** | R$ 997/mês | Fluxo completo + Suporte VIP. |

## 📄 Documentação Adicional

- [Guia de Configuração Admin](file:///Users/mateus/Documents/zentplataformaagência/ADMIN_SETUP_GUIDE.md)
- [Implementação de Onboarding](file:///Users/mateus/Documents/zentplataformaagência/ONBOARDING_IMPLEMENTATION.md)
- [Integração Google Calendar](file:///Users/mateus/Documents/zentplataformaagência/GOOGLE_CALENDAR_INTEGRATION.md)

---
© 2025 ZENT A.I. - Transformando o atendimento jurídico com tecnologia.
