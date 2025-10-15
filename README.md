# StandManager

StandManager agora é um monorepo que reúne a API ASP.NET Core e o portal em React/TypeScript responsável por orquestrar o fluxo completo da barraca de pastel da igreja. A plataforma permite registrar pedidos presencialmente (caixa), autoatendimento via QR Code e acompanhamento em tempo real das etapas pelos voluntários.

## Estrutura do repositório

```
.
├── api/                # Solução ASP.NET Core (camadas, migrations, localization)
│   └── StandManager    # Projeto Web API
└── front/              # Portal React + Vite + TypeScript
```

## Destaques da solução

- **Fluxo de produção completo**: status Pendente → Fritando → Embalando → Pronto → Entregue, com transições validadas no backend.
- **Voluntários em tempo real**: painel agrupa pedidos por sessão temporária do cliente e permite avançar cada item com um clique.
- **Autoatendimento via QR Code**: clientes escolhem sabores com fotos, acompanham estoque disponível e mantêm a mesma sessão em pedidos futuros.
- **Caixa otimizado**: painel rápido para registrar pedidos presenciais com atualização de estoque em tempo real.
- **Tratamento de erros aprimorado**: controllers encapsulam as chamadas de serviço com `try/catch`, retornando `ProblemDetails` legíveis (mensagens localizadas) inclusive quando o banco de dados está indisponível.

## Executando a API

1. Instale o **.NET 8 SDK**.
2. Suba uma instância do PostgreSQL (o repositório já traz um serviço pronto via Docker Compose):
   ```bash
   docker compose pull postgres
   docker compose up -d postgres
   ```
   > O banco é exposto em `localhost:5432` com credenciais padrão `postgres`/`postgres`. Ajuste-as conforme necessário ou
   > exporte variáveis de ambiente antes de subir o container.
   >
   > **Solução de problemas**: se o Docker Desktop acusar erro 500 ao baixar a imagem, reinicie o serviço do Docker e repita o
   > `docker compose pull postgres`. Esse passo força o download pelo canal padrão antes de iniciar o container e costuma
   > contornar instabilidades no daemon do Windows.
3. Acesse a pasta da API:
   ```bash
   cd api
   ```
4. Opcional: aplique as migrações manualmente antes de executar a API.
   ```bash
   dotnet ef database update --project StandManager/StandManager.csproj
   ```
   > Se preferir, a API também aplica as migrações automaticamente na primeira execução.
5. Restaure e execute:
   ```bash
   dotnet run --project StandManager/StandManager.csproj
   ```
6. Durante o desenvolvimento o Swagger fica exposto em `https://localhost:5001/swagger` (ou `http://localhost:5000/swagger` se HTTPS estiver desabilitado).

## Executando o front-end

1. Instale as dependências do portal:
   ```bash
   cd front
   npm install
   ```
2. Configure o endpoint da API caso necessário copiando o arquivo `.env.example` para `.env` e ajustando `VITE_API_BASE_URL`.
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:5173` para visualizar o painel (build baseado em Vite + React Router).

## Endpoints principais da API

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| `GET` | `/api/pastelflavors` | Lista todos os sabores cadastrados. |
| `POST` | `/api/pastelflavors` | Cadastra um novo sabor. |
| `PUT` | `/api/pastelflavors/{id}` | Atualiza um sabor existente. |
| `PATCH` | `/api/pastelflavors/{id}/inventory` | Atualiza apenas o estoque disponível. |
| `POST` | `/api/orders` | Cria um pedido associado a um cliente/sessão. |
| `GET` | `/api/orders/active` | Retorna os pedidos ativos agrupados pela sessão temporária. |
| `POST` | `/api/orders/{orderId}/items/{itemId}/advance` | Avança o status de um item do pedido. |

## Próximos passos sugeridos

- Implementar autenticação/autorização para separar perfis (voluntário, caixa, visitante).
- Integrar notificações push/SMS para avisar quando o pedido estiver pronto.
- Adicionar dashboards administrativos (relatórios de estoque, tempo médio de preparo, etc.).
