# Laguna News Hub

Quero construir uma aplicação web chamada provisoriamente "Projeto Notícias Laguna".

IMPORTANTE:

- Eu não sou programador.

- Quero que você construa a aplicação de forma simples de manter.

- Não use recursos desnecessários.

- Não invente integrações ou APIs que não existem.

- Não implemente ainda publicação real no Instagram.

- Nesta primeira etapa, quero construir apenas a interface e a arquitetura do frontend, usando dados simulados.

- O projeto deve ser preparado para posteriormente integrar Supabase e APIs externas.

- A aplicação será usada inicialmente por apenas um administrador.

- A cidade alvo é Laguna, Santa Catarina, Brasil.

- O nome final do Instagram ainda não foi escolhido. Use a variável/configuração NOME_DO_PERFIL para que o nome possa ser alterado facilmente depois.

OBJETIVO DO PRODUTO:

Criar um painel administrativo para operar um perfil de Instagram de notícias locais de Laguna.

O sistema futuramente deverá:

1. Encontrar notícias em fontes cadastradas.

2. Classificar as notícias com IA.

3. Detectar notícias duplicadas.

4. Resumir notícias.

5. Gerar título, legenda e conteúdo para Instagram.

6. Gerar ou montar artes usando templates.

7. Aprovar ou rejeitar publicações.

8. Agendar publicações.

9. Publicar no Instagram por integração oficial.

10. Coletar métricas das publicações.

Nesta primeira etapa, NÃO implemente essas integrações reais. Crie a interface e os fluxos usando dados simulados.

TECNOLOGIA:

- React

- TypeScript

- Tailwind CSS

- componentes reutilizáveis

- estrutura preparada para Supabase

- layout totalmente responsivo

- desktop e mobile

ESTILO VISUAL:

Quero um dashboard moderno, profissional e parecido com um SaaS real.

Paleta:

- Azul escuro como cor principal

- Branco

- Cinza muito claro para fundos

- Amarelo/laranja apenas para alertas

- Vermelho para notícias urgentes

Use:

- cards modernos

- bordas suaves

- sombras discretas

- ícones simples

- tipografia limpa

- bastante espaço visual

- navegação lateral no desktop

- navegação adaptada para mobile

NÃO faça uma landing page neste momento.

Crie apenas a aplicação administrativa.

ROTAS:

/login

/dashboard

/news

/news/:id

/publications

/sources

/instagram

/analytics

/settings

TELA LOGIN:

Criar:

- logo textual "Projeto Notícias Laguna"

- email

- senha

- botão Entrar

- lembrar acesso

- recuperar senha

Não implemente autenticação real ainda.

DASHBOARD:

Mostrar:

- Notícias encontradas hoje

- Notícias aguardando aprovação

- Notícias publicadas hoje

- Notícias urgentes

- Alcance do Instagram

- Seguidores

- Crescimento de seguidores

Adicionar seção:

"Últimas notícias"

Cada notícia deve mostrar:

- título

- fonte

- horário

- categoria

- nível de importância

- status

Adicionar seção:

"Publicações de hoje"

Mostrar:

- horário

- título

- categoria

- status

- visualização

Adicionar gráfico simples de publicações e alcance.

SIDEBAR:

Dashboard

Notícias

Publicações

Fontes

Instagram

Analytics

Configurações

Adicionar botão "Sair".

Use dados simulados realistas de Laguna/SC.

EXEMPLOS:

"Acidente causa lentidão em trecho da BR-101"

"Prefeitura de Laguna anuncia nova ação"

"Evento movimenta o centro histórico de Laguna"

"Defesa Civil emite alerta para a região"

"Alteração no trânsito nesta região de Laguna"

CATEGORIAS:

- Urgente

- Trânsito

- Segurança

- Prefeitura

- Cidade

- Eventos

- Turismo

- Clima

- Esportes

- Economia

- Educação

- Saúde

IMPORTANTE:

Crie componentes reutilizáveis para:

- NewsCard

- StatusBadge

- CategoryBadge

- MetricCard

- PublicationCard

- Sidebar

- Header

- EmptyState

- LoadingState

- Modal

- ConfirmationDialog

Crie uma estrutura limpa de pastas.

Não implemente backend ainda.

Antes de executar mudanças grandes, explique brevemente o que será alterado.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9bb65492-0507-43cf-aa02-8590a68d2ed7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
