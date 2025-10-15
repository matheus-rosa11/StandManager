# StandManager

StandManager é uma API ASP.NET Core pensada para organizar os pedidos da barraca de pastel da igreja. Ela controla o estoque dos sabores disponíveis, permite que voluntários ou visitantes registrem pedidos e oferece uma visualização agrupada por pessoa para acompanhar cada etapa da preparação.

## Recursos principais

- Cadastro e gerenciamento de sabores de pastel, incluindo quantidade disponível e foto.
- Registro de pedidos com múltiplos itens, descontando automaticamente o estoque.
- Agrupamento dos pedidos por pessoa para facilitar a atuação dos voluntários.
- Fluxo completo de status para cada item (Pendente → Fritando → Embalando → Pronto → Finalizado) com validação das transições.
- Migrações e banco SQLite para armazenamento persistente.
- Mensagens de erro totalmente localizadas (pt-BR e en-US) prontas para consumo pelo front-end.

## Arquitetura

- **Application Layer**: concentra regras de negócio em serviços orientados a casos de uso, retornando resultados ricos em códigos de erro para facilitar o tratamento no front-end.
- **Controllers**: finos, apenas orquestram requisições, convertem DTOs e traduzem os erros usando `IStringLocalizer`.
- **Infraestrutura**: Entity Framework Core com SQLite, migrations automáticas e `DbContext` compartilhado via DI.
- **Globalização**: pipeline configurado com culturas `en-US` e `pt-BR`, permitindo que o cliente defina o idioma através do cabeçalho `Accept-Language`.

## Endpoints

| Método | Endpoint | Descrição |
| ------ | -------- | --------- |
| `GET` | `/api/pastelflavors` | Lista todos os sabores cadastrados. |
| `POST` | `/api/pastelflavors` | Cadastra um novo sabor. |
| `PUT` | `/api/pastelflavors/{id}` | Atualiza um sabor existente. |
| `PATCH` | `/api/pastelflavors/{id}/inventory` | Atualiza apenas o estoque disponível. |
| `POST` | `/api/orders` | Cria um pedido associado a uma pessoa ou sessão existente. |
| `GET` | `/api/orders/active` | Retorna os pedidos ativos agrupados por pessoa. |
| `POST` | `/api/orders/{orderId}/items/{itemId}/advance` | Avança o status de um item do pedido. |

## Como executar

1. Certifique-se de ter o .NET 8 SDK instalado.
2. Na primeira execução a aplicação cria o banco `standmanager.db` com base nas migrações existentes.
3. Execute a API com:
   ```bash
   dotnet run --project StandManager/StandManager/StandManager.csproj
   ```
4. A documentação Swagger estará disponível em `https://localhost:5001/swagger` durante o desenvolvimento.

## Próximos passos sugeridos

- Implementar autenticação/autorização para separar o acesso de voluntários e clientes.
- Integrar notificações push ou e-mail quando um item estiver pronto.
- Criar o front-end em React/TypeScript consumindo os endpoints acima.
