# Regras de negócio para `CustomerSession`

## Qual é a finalidade da `CustomerSession`
- Cada sessão representa uma visita ativa de um cliente ao balcão. O registro guarda o nome exibido e a data de criação, além de manter a relação com todos os pedidos feitos naquela visita.【F:api/StandManager/Entities/CustomerSession.cs†L5-L15】
- O backend usa a sessão como chave para agrupar pedidos ativos exibidos no painel da cozinha e no autoatendimento, garantindo que todos os itens daquele cliente apareçam juntos mesmo que ele faça pedidos em momentos diferentes.【F:api/StandManager/Application/Orders/Services/OrderService.cs†L200-L231】
- Consultas de histórico e cancelamento também dependem da sessão para assegurar que apenas o próprio cliente consiga acompanhar ou desfazer pedidos vinculados à sua visita.【F:api/StandManager/Application/Orders/Services/OrderService.cs†L317-L376】【F:api/StandManager/Application/Orders/Services/OrderService.cs†L446-L485】

## Como o `customerSessionId` chega à API
- O frontend de Autoatendimento grava o identificador da sessão do cliente em cache local (por exemplo, `localStorage`).
- A cada tentativa de criação de pedido, esse identificador é enviado de volta para o backend, permitindo que pedidos subsequentes sejam vinculados à mesma sessão quando ela já existe.

## Por que o identificador pode não existir no banco de dados
- Sessões são persistidas no banco apenas após a criação do primeiro pedido. Antes disso, o frontend ainda pode armazenar um identificador emitido em uma resposta anterior.
- O identificador também pode ficar "obsoleto" quando a sessão correspondente foi removida (limpeza administrativa, reset de base, expiração manual, etc.). Nesse caso, o cliente continua enviando o valor em cache, mas o registro já não existe mais no banco.

## Validação antes de persistir dados
- Quando um `customerSessionId` é enviado, o serviço de pedidos faz uma consulta para garantir que o registro de sessão existe. Se não existir, ele retorna o erro `errors.order.customer_session_not_found` em vez de criar automaticamente uma nova sessão com o mesmo identificador.
- Essa validação evita inconsistências como pedidos vinculados a sessões inexistentes e protege contra valores forjados vindos do cliente.
- Somente quando nenhum `customerSessionId` é informado (ou seja, quando o cliente não possui uma sessão válida) é que o backend cria um novo registro `CustomerSession` e o associa ao pedido recém-criado.

## Fluxo esperado após uma falha de sessão
1. O frontend recebe o erro `customer_session_not_found`.
2. Ele remove o identificador armazenado em cache.
3. O próximo pedido é enviado sem o `customerSessionId`, permitindo que o backend crie uma nova sessão e retorne o identificador atualizado ao cliente.

Essa abordagem garante integridade referencial entre pedidos e sessões de clientes, ao mesmo tempo em que permite que a experiência de autoatendimento se recupere automaticamente de identificadores desatualizados.
