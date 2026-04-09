// Minimal i18n dictionary. Loaded client-side by LangProvider; synced with user.language on server.
// Add new keys here and translations for each supported language.

export type LangCode =
  | "en" | "es" | "fr" | "de" | "pt" | "it"
  | "hi" | "ar" | "ja" | "zh" | "sw" | "yo";

export const LANGUAGES: { code: LangCode; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.dashboard": "Dashboard",
  "nav.createAd": "Create Ad",
  "nav.myAds": "My Ads",
  "nav.campaigns": "Campaigns",
  "nav.schedule": "Schedule",
  "nav.analytics": "Analytics",
  "nav.templates": "Templates",
  "nav.marketplace": "Marketplace",
  "nav.connect": "Connect",
  "nav.referrals": "Referrals",
  "nav.settings": "Settings",
  "nav.newAd": "New Ad",
  "topbar.welcome": "Welcome back",
  "topbar.credits": "Credits",
  "topbar.upgrade": "Upgrade",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.back": "Back",
  "common.loading": "Loading...",
  "common.saving": "Saving...",
  "common.continue": "Continue",
  "settings.account": "Account",
  "settings.billing": "Billing",
  "settings.brandKit": "Brand Kit",
  "settings.language": "Language",
  "settings.country": "Country",
  "settings.currency": "Currency",
  "settings.name": "Name",
  "settings.email": "Email",
};

const es: Dict = {
  "nav.dashboard": "Panel",
  "nav.createAd": "Crear anuncio",
  "nav.myAds": "Mis anuncios",
  "nav.campaigns": "Campañas",
  "nav.schedule": "Programar",
  "nav.analytics": "Analíticas",
  "nav.templates": "Plantillas",
  "nav.marketplace": "Mercado",
  "nav.connect": "Conectar",
  "nav.referrals": "Referidos",
  "nav.settings": "Ajustes",
  "nav.newAd": "Nuevo anuncio",
  "topbar.welcome": "Bienvenido",
  "topbar.credits": "Créditos",
  "topbar.upgrade": "Mejorar",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Eliminar",
  "common.back": "Atrás",
  "common.loading": "Cargando...",
  "common.saving": "Guardando...",
  "common.continue": "Continuar",
  "settings.account": "Cuenta",
  "settings.billing": "Facturación",
  "settings.brandKit": "Kit de marca",
  "settings.language": "Idioma",
  "settings.country": "País",
  "settings.currency": "Moneda",
  "settings.name": "Nombre",
  "settings.email": "Correo",
};

const fr: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.createAd": "Créer une annonce",
  "nav.myAds": "Mes annonces",
  "nav.campaigns": "Campagnes",
  "nav.schedule": "Planifier",
  "nav.analytics": "Analytique",
  "nav.templates": "Modèles",
  "nav.marketplace": "Marché",
  "nav.connect": "Connecter",
  "nav.referrals": "Parrainages",
  "nav.settings": "Paramètres",
  "nav.newAd": "Nouvelle annonce",
  "topbar.welcome": "Bon retour",
  "topbar.credits": "Crédits",
  "topbar.upgrade": "Mettre à niveau",
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.edit": "Modifier",
  "common.delete": "Supprimer",
  "common.back": "Retour",
  "common.loading": "Chargement...",
  "common.saving": "Enregistrement...",
  "common.continue": "Continuer",
  "settings.account": "Compte",
  "settings.billing": "Facturation",
  "settings.brandKit": "Kit de marque",
  "settings.language": "Langue",
  "settings.country": "Pays",
  "settings.currency": "Devise",
  "settings.name": "Nom",
  "settings.email": "Email",
};

const pt: Dict = {
  "nav.dashboard": "Painel",
  "nav.createAd": "Criar anúncio",
  "nav.myAds": "Meus anúncios",
  "nav.campaigns": "Campanhas",
  "nav.schedule": "Agendar",
  "nav.analytics": "Análises",
  "nav.templates": "Modelos",
  "nav.marketplace": "Mercado",
  "nav.connect": "Conectar",
  "nav.referrals": "Indicações",
  "nav.settings": "Configurações",
  "nav.newAd": "Novo anúncio",
  "topbar.welcome": "Bem-vindo de volta",
  "topbar.credits": "Créditos",
  "topbar.upgrade": "Upgrade",
  "common.save": "Salvar",
  "common.cancel": "Cancelar",
  "common.edit": "Editar",
  "common.delete": "Excluir",
  "common.back": "Voltar",
  "common.loading": "Carregando...",
  "common.saving": "Salvando...",
  "common.continue": "Continuar",
  "settings.account": "Conta",
  "settings.billing": "Faturamento",
  "settings.brandKit": "Kit de marca",
  "settings.language": "Idioma",
  "settings.country": "País",
  "settings.currency": "Moeda",
  "settings.name": "Nome",
  "settings.email": "Email",
};

const DICTIONARIES: Partial<Record<LangCode, Dict>> = { en, es, fr, pt };

export function t(lang: LangCode, key: string): string {
  const dict = DICTIONARIES[lang] ?? en;
  return dict[key] ?? en[key] ?? key;
}

export const RTL_LANGS: LangCode[] = ["ar"];
export function isRTL(lang: LangCode): boolean {
  return RTL_LANGS.includes(lang);
}
