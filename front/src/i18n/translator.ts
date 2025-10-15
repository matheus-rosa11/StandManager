export type LanguageCode = 'pt-BR' | 'en-US' | 'es-ES';

export interface LanguageOption {
  code: LanguageCode;
  icon: string;
  labelKey: string;
}

export interface TranslateParams {
  count?: number;
  [key: string]: string | number | undefined;
}

type TranslationDictionary = Record<string, string>;

const STORAGE_KEY = 'stand-manager.language';
const DEFAULT_LANGUAGE: LanguageCode = 'pt-BR';

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'pt-BR', icon: '🇧🇷', labelKey: 'language.pt-BR' },
  { code: 'en-US', icon: '🇺🇸', labelKey: 'language.en-US' },
  { code: 'es-ES', icon: '🇪🇸', labelKey: 'language.es-ES' }
];

const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  'pt-BR': {
    'app.brand': 'Stand Manager',
    'footer.communityProject': 'Projeto comunitário - Gerenciador de pedidos de pastel',
    'nav.home': 'Início',
    'nav.volunteers': 'Pedidos Ativos',
    'nav.cashier': 'Caixa',
    'nav.selfService': 'Autoatendimento',
    'languageSelector.label': 'Selecionar idioma',
    'language.pt-BR': 'Português (Brasil)',
    'language.en-US': 'English (US)',
    'language.es-ES': 'Español',
    'volunteer.title': 'Painel dos voluntários',
    'volunteer.pendingItems': 'Itens pendentes',
    'volunteer.refresh': 'Atualizar agora',
    'volunteer.success': 'Pedido atualizado com sucesso.',
    'volunteer.genericError': 'Não foi possível atualizar o pedido.',
    'volunteer.loading': 'Carregando pedidos em andamento...',
    'volunteer.error': 'Erro ao carregar pedidos: {{message}}',
    'volunteer.empty': 'Não há pedidos pendentes no momento. 🎉',
    'volunteer.session': 'Sessão: {{sessionId}}',
    'volunteer.pendingPastels': '{{count}} pastel',
    'volunteer.pendingPastels_plural': '{{count}} pastéis',
    'volunteer.orderNumber': 'Pedido #{{order}}',
    'volunteer.receivedAt': 'Recebido em {{time}}',
    'volunteer.unitLabel': 'Unidade {{unit}} de {{total}}',
    'volunteer.advance': 'Avançar etapa',
    'volunteer.completed': 'Concluído',
    'orderStatus.pending': 'Aguardando',
    'orderStatus.frying': 'Fritando',
    'orderStatus.packaging': 'Embalando',
    'orderStatus.readyForPickup': 'Pronto',
    'orderStatus.completed': 'Entregue',
    'orderStatus.progress': 'Etapa {{step}} de {{total}}',
    'orderStatus.unknown': 'Etapa desconhecida',
    'customerOrder.title': 'Peça seu pastel',
    'customerOrder.subtitle':
      'Escolha os sabores disponíveis em tempo real e finalize seu pedido. Você será avisado quando estiver pronto! 😊',
    'customerOrder.nameLabel': 'Seu nome',
    'customerOrder.namePlaceholder': 'Como devemos chamar você?',
    'customerOrder.sessionMessage': 'Continuando pedidos para a sessão {{sessionId}}.',
    'customerOrder.availableFlavors': 'Sabores disponíveis',
    'customerOrder.refresh': 'Atualizar lista',
    'customerOrder.loading': 'Carregando sabores deliciosos...',
    'customerOrder.error': 'Não foi possível carregar os sabores: {{message}}',
    'customerOrder.inStock': 'Disponíveis: {{quantity}}',
    'customerOrder.itemsInCart': 'Itens no carrinho: {{count}}',
    'customerOrder.submit': 'Finalizar pedido',
    'customerOrder.submitting': 'Enviando...',
    'customerOrder.success': 'Pedido enviado! Você receberá uma notificação quando estiver pronto.',
    'customerOrder.validation': 'Escolha seus sabores e informe seu nome para finalizar.',
    'customerOrder.failure': 'Não foi possível registrar seu pedido. Tente novamente.',
    'cashier.title': 'Registro de pedidos - Caixa',
    'cashier.subtitle':
      'Consulte o estoque atualizado e selecione rapidamente os sabores solicitados pelos participantes.',
    'cashier.nameLabel': 'Nome do cliente',
    'cashier.namePlaceholder': 'Ex: Maria Silva',
    'cashier.availableFlavors': 'Sabores disponíveis',
    'cashier.refresh': 'Atualizar estoque',
    'cashier.loading': 'Carregando sabores disponíveis...',
    'cashier.error': 'Erro ao consultar sabores: {{message}}',
    'cashier.inStock': 'Em estoque: {{quantity}}',
    'cashier.totalPastels': 'Total de pastéis: {{count}}',
    'cashier.submit': 'Registrar pedido',
    'cashier.submitting': 'Registrando...',
    'cashier.successModal': 'Pedido registrado com sucesso!',
    'cashier.validation': 'Informe o nome do cliente e selecione pelo menos um pastel.',
    'cashier.failure': 'Não foi possível registrar o pedido. Tente novamente.',
    'home.welcome': 'Bem-vindo ao Stand Manager',
    'home.description':
      'Centralize o fluxo dos pedidos de pastel da igreja em um único lugar. Acompanhe o estoque, receba pedidos em tempo real e coordene cada etapa da produção.',
    'home.ctaSelfService': 'Fazer pedido pelo QR Code',
    'home.ctaCashier': 'Registrar pedido no caixa',
    'home.ctaVolunteers': 'Painel dos voluntários',
    'home.feature1': 'Pedidos agrupados por sessão do cliente para facilitar a entrega.',
    'home.feature2': 'Atualizações visuais de status para cada etapa da produção.',
    'home.feature3': 'Estoque atualizado automaticamente conforme os pedidos são registrados.',
    'api.errorDefault': 'Erro ao comunicar com a API ({{status}})'
  },
  'en-US': {
    'app.brand': 'Stand Manager',
    'footer.communityProject': 'Community project - Pastel order manager',
    'nav.home': 'Home',
    'nav.volunteers': 'Active Orders',
    'nav.cashier': 'Cashier',
    'nav.selfService': 'Self-service',
    'languageSelector.label': 'Select language',
    'language.pt-BR': 'Portuguese (Brazil)',
    'language.en-US': 'English (US)',
    'language.es-ES': 'Spanish',
    'volunteer.title': 'Volunteer board',
    'volunteer.pendingItems': 'Pending items',
    'volunteer.refresh': 'Refresh now',
    'volunteer.success': 'Order updated successfully.',
    'volunteer.genericError': 'Unable to update the order.',
    'volunteer.loading': 'Loading orders in progress...',
    'volunteer.error': 'Failed to load orders: {{message}}',
    'volunteer.empty': 'No pending orders right now. 🎉',
    'volunteer.session': 'Session: {{sessionId}}',
    'volunteer.pendingPastels': '{{count}} pastel',
    'volunteer.pendingPastels_plural': '{{count}} pastels',
    'volunteer.orderNumber': 'Order #{{order}}',
    'volunteer.receivedAt': 'Received at {{time}}',
    'volunteer.unitLabel': 'Unit {{unit}} of {{total}}',
    'volunteer.advance': 'Advance step',
    'volunteer.completed': 'Completed',
    'orderStatus.pending': 'Waiting',
    'orderStatus.frying': 'Frying',
    'orderStatus.packaging': 'Packing',
    'orderStatus.readyForPickup': 'Ready',
    'orderStatus.completed': 'Delivered',
    'orderStatus.progress': 'Step {{step}} of {{total}}',
    'orderStatus.unknown': 'Unknown step',
    'customerOrder.title': 'Order your pastel',
    'customerOrder.subtitle':
      'Choose the flavors available in real time and send your order. We will let you know when it is ready! 😊',
    'customerOrder.nameLabel': 'Your name',
    'customerOrder.namePlaceholder': 'How should we call you?',
    'customerOrder.sessionMessage': 'Continuing orders for session {{sessionId}}.',
    'customerOrder.availableFlavors': 'Available flavors',
    'customerOrder.refresh': 'Refresh list',
    'customerOrder.loading': 'Loading delicious flavors...',
    'customerOrder.error': 'Unable to load flavors: {{message}}',
    'customerOrder.inStock': 'Available: {{quantity}}',
    'customerOrder.itemsInCart': 'Items in cart: {{count}}',
    'customerOrder.submit': 'Place order',
    'customerOrder.submitting': 'Sending...',
    'customerOrder.success': 'Order sent! You will receive a notification when it is ready.',
    'customerOrder.validation': 'Choose your flavors and provide your name to finish.',
    'customerOrder.failure': 'We could not register your order. Please try again.',
    'cashier.title': 'Order registration - Cashier',
    'cashier.subtitle':
      'Check the live stock and quickly select the flavors requested by participants.',
    'cashier.nameLabel': 'Customer name',
    'cashier.namePlaceholder': 'E.g.: Mary Smith',
    'cashier.availableFlavors': 'Available flavors',
    'cashier.refresh': 'Refresh stock',
    'cashier.loading': 'Loading available flavors...',
    'cashier.error': 'Failed to fetch flavors: {{message}}',
    'cashier.inStock': 'In stock: {{quantity}}',
    'cashier.totalPastels': 'Total pastels: {{count}}',
    'cashier.submit': 'Register order',
    'cashier.submitting': 'Registering...',
    'cashier.successModal': 'Order registered successfully!',
    'cashier.validation': 'Provide the customer name and select at least one pastel.',
    'cashier.failure': 'Unable to register the order. Please try again.',
    'home.welcome': 'Welcome to Stand Manager',
    'home.description':
      'Centralize your church pastel orders in a single place. Track stock, receive orders in real time, and coordinate every production step.',
    'home.ctaSelfService': 'Order via QR Code',
    'home.ctaCashier': 'Register order at the cashier',
    'home.ctaVolunteers': 'Volunteer board',
    'home.feature1': 'Orders grouped by customer session to simplify delivery.',
    'home.feature2': 'Visual status updates for every production step.',
    'home.feature3': 'Stock automatically updated as orders are registered.',
    'api.errorDefault': 'Error communicating with the API ({{status}})'
  },
  'es-ES': {
    'app.brand': 'Stand Manager',
    'footer.communityProject': 'Proyecto comunitario - Gestor de pedidos de pastel',
    'nav.home': 'Inicio',
    'nav.volunteers': 'Pedidos activos',
    'nav.cashier': 'Caja',
    'nav.selfService': 'Autoservicio',
    'languageSelector.label': 'Seleccionar idioma',
    'language.pt-BR': 'Portugués (Brasil)',
    'language.en-US': 'Inglés (EE. UU.)',
    'language.es-ES': 'Español',
    'volunteer.title': 'Panel de voluntarios',
    'volunteer.pendingItems': 'Artículos pendientes',
    'volunteer.refresh': 'Actualizar ahora',
    'volunteer.success': 'Pedido actualizado correctamente.',
    'volunteer.genericError': 'No se pudo actualizar el pedido.',
    'volunteer.loading': 'Cargando pedidos en progreso...',
    'volunteer.error': 'Error al cargar los pedidos: {{message}}',
    'volunteer.empty': 'No hay pedidos pendientes en este momento. 🎉',
    'volunteer.session': 'Sesión: {{sessionId}}',
    'volunteer.pendingPastels': '{{count}} pastel',
    'volunteer.pendingPastels_plural': '{{count}} pasteles',
    'volunteer.orderNumber': 'Pedido #{{order}}',
    'volunteer.receivedAt': 'Recibido a las {{time}}',
    'volunteer.unitLabel': 'Unidad {{unit}} de {{total}}',
    'volunteer.advance': 'Avanzar etapa',
    'volunteer.completed': 'Completado',
    'orderStatus.pending': 'En espera',
    'orderStatus.frying': 'Friéndose',
    'orderStatus.packaging': 'Empaquetando',
    'orderStatus.readyForPickup': 'Listo',
    'orderStatus.completed': 'Entregado',
    'orderStatus.progress': 'Etapa {{step}} de {{total}}',
    'orderStatus.unknown': 'Etapa desconocida',
    'customerOrder.title': 'Pide tu pastel',
    'customerOrder.subtitle':
      'Elige los sabores disponibles en tiempo real y envía tu pedido. ¡Te avisaremos cuando esté listo! 😊',
    'customerOrder.nameLabel': 'Tu nombre',
    'customerOrder.namePlaceholder': '¿Cómo debemos llamarte?',
    'customerOrder.sessionMessage': 'Continuando pedidos para la sesión {{sessionId}}.',
    'customerOrder.availableFlavors': 'Sabores disponibles',
    'customerOrder.refresh': 'Actualizar lista',
    'customerOrder.loading': 'Cargando sabores deliciosos...',
    'customerOrder.error': 'No se pudieron cargar los sabores: {{message}}',
    'customerOrder.inStock': 'Disponibles: {{quantity}}',
    'customerOrder.itemsInCart': 'Artículos en el carrito: {{count}}',
    'customerOrder.submit': 'Finalizar pedido',
    'customerOrder.submitting': 'Enviando...',
    'customerOrder.success': '¡Pedido enviado! Recibirás una notificación cuando esté listo.',
    'customerOrder.validation': 'Elige tus sabores e informa tu nombre para finalizar.',
    'customerOrder.failure': 'No pudimos registrar tu pedido. Inténtalo de nuevo.',
    'cashier.title': 'Registro de pedidos - Caja',
    'cashier.subtitle':
      'Consulta el inventario actualizado y selecciona rápidamente los sabores solicitados por los participantes.',
    'cashier.nameLabel': 'Nombre del cliente',
    'cashier.namePlaceholder': 'Ej.: María López',
    'cashier.availableFlavors': 'Sabores disponibles',
    'cashier.refresh': 'Actualizar inventario',
    'cashier.loading': 'Cargando sabores disponibles...',
    'cashier.error': 'Error al consultar los sabores: {{message}}',
    'cashier.inStock': 'En inventario: {{quantity}}',
    'cashier.totalPastels': 'Total de pasteles: {{count}}',
    'cashier.submit': 'Registrar pedido',
    'cashier.submitting': 'Registrando...',
    'cashier.successModal': '¡Pedido registrado con éxito!',
    'cashier.validation': 'Informa el nombre del cliente y selecciona al menos un pastel.',
    'cashier.failure': 'No se pudo registrar el pedido. Inténtalo de nuevo.',
    'home.welcome': 'Bienvenido a Stand Manager',
    'home.description':
      'Centraliza el flujo de pedidos de pastel de la iglesia en un solo lugar. Controla el inventario, recibe pedidos en tiempo real y coordina cada etapa de la producción.',
    'home.ctaSelfService': 'Hacer pedido con el código QR',
    'home.ctaCashier': 'Registrar pedido en la caja',
    'home.ctaVolunteers': 'Panel de voluntarios',
    'home.feature1': 'Pedidos agrupados por sesión del cliente para facilitar la entrega.',
    'home.feature2': 'Actualizaciones visuales de estado para cada etapa de la producción.',
    'home.feature3': 'Inventario actualizado automáticamente a medida que se registran los pedidos.',
    'api.errorDefault': 'Error al comunicarse con la API ({{status}})'
  }
};

const listeners = new Set<(language: LanguageCode) => void>();

function detectInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  if (stored && TRANSLATIONS[stored]) {
    return stored;
  }

  const browserLanguages = window.navigator.languages ?? [window.navigator.language];
  const availableCodes = new Set<LanguageCode>(Object.keys(TRANSLATIONS) as LanguageCode[]);
  for (const language of browserLanguages) {
    const normalized = language.toLowerCase();
    for (const option of availableCodes) {
      if (option.toLowerCase() === normalized) {
        return option;
      }

      if (normalized.startsWith(option.split('-')[0].toLowerCase())) {
        return option;
      }
    }
  }

  return DEFAULT_LANGUAGE;
}

let currentLanguage: LanguageCode = detectInitialLanguage();

export function getCurrentLanguage(): LanguageCode {
  return currentLanguage;
}

export function setCurrentLanguage(language: LanguageCode): void {
  if (!TRANSLATIONS[language] || language === currentLanguage) {
    return;
  }

  currentLanguage = language;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, language);
  }

  listeners.forEach((listener) => listener(language));
}

export function subscribeLanguage(listener: (language: LanguageCode) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLanguageOptions(): LanguageOption[] {
  return LANGUAGE_OPTIONS;
}

function resolveDictionary(language: LanguageCode): TranslationDictionary {
  return TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
}

function formatTemplate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? '' : String(value);
  });
}

export function translate(key: string, params?: TranslateParams, language: LanguageCode = currentLanguage): string {
  const dictionary = resolveDictionary(language);
  let resolvedKey = key;

  if (params?.count !== undefined) {
    const pluralKey = `${key}_plural`;
    if (params.count !== 1 && (dictionary[pluralKey] || resolveDictionary(DEFAULT_LANGUAGE)[pluralKey])) {
      resolvedKey = pluralKey;
    }
  }

  const template =
    dictionary[resolvedKey] ??
    resolveDictionary(DEFAULT_LANGUAGE)[resolvedKey] ??
    dictionary[key] ??
    resolveDictionary(DEFAULT_LANGUAGE)[key] ??
    key;

  return formatTemplate(template, params);
}

