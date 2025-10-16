# Regras de negócio para `CustomerSession`

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
