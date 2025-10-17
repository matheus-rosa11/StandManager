# Fluxo de identificação de clientes

## Por que adotamos números sequenciais
- Cada pessoa que participa do evento recebe um identificador numérico simples registrado na entidade `Customer`. Isso evita GUIDs difíceis de memorizar e garante que os pedidos possam ser vinculados de forma consistente ao mesmo participante durante todo o dia.
- O registro guarda nome, data de criação, vínculo com pedidos e se a pessoa atua como voluntária, permitindo separar as telas liberadas para cada perfil.

## Como o identificador é criado ou confirmado
1. Assim que alguém acessa a plataforma, a interface pergunta se ela é voluntária. Voluntários não passam pelo cadastro de cliente e recebem acesso direto aos painéis internos.
2. Quem não é voluntário informa se já possui número. Caso tenha, digita o identificador e confirma o nome exatamente como está na base; divergências bloqueiam o acesso e orientam a buscar ajuda.
3. Se ainda não possuir número, o sistema solicita o nome completo, registra o cliente e mostra a mensagem “Beleza, você é o cliente número X” junto com o aviso de que o crachá ficará no cabeçalho.
4. O cabeçalho da aplicação exibe continuamente o nome e o identificador, para que o cliente possa informar esse dado na retirada dos pedidos ou ao conversar com voluntários.

## Regras aplicadas pelo backend
- A API de clientes valida nomes durante confirmações e cria registros sequenciais, persistindo o mesmo identificador para cada pessoa.
- Os pedidos agora exigem o `customerId` inteiro ao serem criados, garantindo que cada compra fique associada a um cliente válido. Isso vale tanto para o autoatendimento quanto para lançamentos feitos pelos voluntários no caixa.
- Cancelamentos, históricos e agrupamentos em painéis utilizam o `customerId` como chave, permitindo buscas combinadas por nome ou número.

## Como voluntários utilizam o identificador
- As telas de Pedidos Ativos e Histórico apresentam um filtro único que aceita nome ou número e atualiza os resultados em tempo real enquanto o texto é digitado.
- O módulo de caixa solicita o número do cliente antes de registrar um novo pedido. A orientação mostrada no formulário reforça que o voluntário deve confirmar o número exibido no cabeçalho do participante.
- O novo painel de Relatórios usa os identificadores para agrupar métricas, apontando volume de pedidos, faturamento, horários de pico e médias de duração por etapa, facilitando o diagnóstico de gargalos.

Essas regras mantêm o identificador sempre sincronizado entre frontend e backend e simplificam o suporte a participantes que têm pouca familiaridade com tecnologia.
