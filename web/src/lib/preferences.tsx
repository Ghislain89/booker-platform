import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Language, LOCALES, makeTranslator } from "./i18n";
import { setDateLocale } from "./format";

// Language and colour scheme. Defaults: the browser language (`locale` in Playwright)
// and the system colour scheme (`colorScheme`); the profile page can override both.

export type ColorScheme = "light" | "dark" | "system";

export interface Preferences {
  language: Language;
  colorScheme: ColorScheme;
}

const KEY = "booker.preferences";

const browserLanguage = (): Language =>
  navigator.language.toLowerCase().startsWith("nl") ? "nl" : "en";

function load(): Preferences {
  let stored: Partial<Preferences> = {};
  try {
    stored = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    // Ignore malformed preferences.
  }
  return {
    language:
      stored.language === "nl" || stored.language === "en"
        ? stored.language
        : browserLanguage(),
    colorScheme:
      stored.colorScheme === "light" || stored.colorScheme === "dark"
        ? stored.colorScheme
        : "system",
  };
}

function apply({ language, colorScheme }: Preferences) {
  const root = document.documentElement;
  root.lang = language;
  setDateLocale(LOCALES[language]);
  if (colorScheme === "system") delete root.dataset.theme;
  else root.dataset.theme = colorScheme;
}

// Apply before the first render, so screenshots never show a flash of the wrong theme.
const initial = load();
apply(initial);

interface PreferencesContextValue extends Preferences {
  update: (changes: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(initial);

  const update = useCallback((changes: Partial<Preferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...changes };
      localStorage.setItem(KEY, JSON.stringify(next));
      apply(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ...preferences, update }),
    [preferences, update],
  );
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context)
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return context;
}

/** Translation function for the current language: t("nav.rooms"), t("room.title", { number }). */
export function useT() {
  const { language } = usePreferences();
  return useMemo(() => makeTranslator(language), [language]);
}
