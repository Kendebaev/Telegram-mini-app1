import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type {
  TelegramWebApp,
  TelegramWebAppUser,
  TelegramThemeParams,
} from '../types/telegram';

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  user: TelegramWebAppUser;
  isInsideTelegram: boolean;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  haptic: {
    impact: (style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notification: (type?: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
  mainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    state: {
      text: string;
      isVisible: boolean;
      isActive: boolean;
      isLoading: boolean;
    };
  };
  backButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    isVisible: boolean;
  };
  toggleTheme: () => void;
  closeApp: () => void;
}

const DEFAULT_MOCK_USER: TelegramWebAppUser = {
  id: 987654321,
  first_name: 'Alex',
  last_name: 'Tracker',
  username: 'alex_tg_user',
};

const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({});
  const [user, setUser] = useState<TelegramWebAppUser>(DEFAULT_MOCK_USER);

  // Simulated button states for browser dev mode
  const [simulatedMainButton, setSimulatedMainButton] = useState({
    text: 'Save Expense',
    isVisible: false,
    isActive: true,
    isLoading: false,
  });
  const [mainButtonClickHandlers, setMainButtonClickHandlers] = useState<Array<() => void>>([]);

  const [simulatedBackButtonVisible, setSimulatedBackButtonVisible] = useState(false);
  const [backButtonClickHandlers, setBackButtonClickHandlers] = useState<Array<() => void>>([]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg && tg.initData !== undefined) {
      // Detected real Telegram WebApp environment
      setIsInsideTelegram(true);

      // Expand to full viewport
      try {
        tg.expand();
        tg.ready();
      } catch (e) {
        console.warn('Telegram expand error:', e);
      }

      // Initialize theme and user
      if (tg.colorScheme) {
        setColorScheme(tg.colorScheme);
      }
      if (tg.themeParams) {
        setThemeParams(tg.themeParams);
      }
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Listen to theme change events from Telegram client
      const handleThemeChange = () => {
        if (tg.colorScheme) {
          setColorScheme(tg.colorScheme);
        }
        if (tg.themeParams) {
          setThemeParams(tg.themeParams);
        }
      };

      tg.onEvent('themeChanged', handleThemeChange);
      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    } else {
      // Running in standard web browser
      // Default to dark for Vault fintech aesthetic
      const stored = localStorage.getItem('vault_theme');
      setColorScheme(stored === 'light' ? 'light' : 'dark');
    }
  }, []);

  // Sync dark class on document element
  useEffect(() => {
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [colorScheme]);

  const toggleTheme = () => {
    setColorScheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const closeApp = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      console.log('Telegram WebApp close() called');
    }
  };

  // Haptic feedback bridge
  const haptic = useMemo(
    () => ({
      impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
        } else if ('vibrate' in navigator) {
          try {
            navigator.vibrate(style === 'heavy' ? 40 : 20);
          } catch {
            // Ignore if vibration fails
          }
        }
      },
      notification: (type: 'error' | 'success' | 'warning' = 'success') => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
        } else if ('vibrate' in navigator) {
          try {
            if (type === 'error') navigator.vibrate([30, 40, 30]);
            else navigator.vibrate(25);
          } catch {
            // Ignore
          }
        }
      },
      selection: () => {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.selectionChanged();
        } else if ('vibrate' in navigator) {
          try {
            navigator.vibrate(10);
          } catch {
            // Ignore
          }
        }
      },
    }),
    []
  );

  // MainButton controls
  const mainButton = useMemo(() => {
    const tg = window.Telegram?.WebApp;

    return {
      setText: (text: string) => {
        if (tg?.MainButton) {
          tg.MainButton.setText(text);
        }
        setSimulatedMainButton((prev) => ({ ...prev, text }));
      },
      show: () => {
        if (tg?.MainButton) {
          tg.MainButton.show();
        }
        setSimulatedMainButton((prev) => ({ ...prev, isVisible: true }));
      },
      hide: () => {
        if (tg?.MainButton) {
          tg.MainButton.hide();
        }
        setSimulatedMainButton((prev) => ({ ...prev, isVisible: false }));
      },
      enable: () => {
        if (tg?.MainButton) {
          tg.MainButton.enable();
        }
        setSimulatedMainButton((prev) => ({ ...prev, isActive: true }));
      },
      disable: () => {
        if (tg?.MainButton) {
          tg.MainButton.disable();
        }
        setSimulatedMainButton((prev) => ({ ...prev, isActive: false }));
      },
      showProgress: (leaveActive = false) => {
        if (tg?.MainButton) {
          tg.MainButton.showProgress(leaveActive);
        }
        setSimulatedMainButton((prev) => ({ ...prev, isLoading: true }));
      },
      hideProgress: () => {
        if (tg?.MainButton) {
          tg.MainButton.hideProgress();
        }
        setSimulatedMainButton((prev) => ({ ...prev, isLoading: false }));
      },
      onClick: (cb: () => void) => {
        if (tg?.MainButton) {
          tg.MainButton.onClick(cb);
        }
        setMainButtonClickHandlers((prev) => [...prev, cb]);
      },
      offClick: (cb: () => void) => {
        if (tg?.MainButton) {
          tg.MainButton.offClick(cb);
        }
        setMainButtonClickHandlers((prev) => prev.filter((fn) => fn !== cb));
      },
      state: simulatedMainButton,
    };
  }, [simulatedMainButton]);

  // BackButton controls
  const backButton = useMemo(() => {
    const tg = window.Telegram?.WebApp;

    return {
      show: () => {
        if (tg?.BackButton) {
          tg.BackButton.show();
        }
        setSimulatedBackButtonVisible(true);
      },
      hide: () => {
        if (tg?.BackButton) {
          tg.BackButton.hide();
        }
        setSimulatedBackButtonVisible(false);
      },
      onClick: (cb: () => void) => {
        if (tg?.BackButton) {
          tg.BackButton.onClick(cb);
        }
        setBackButtonClickHandlers((prev) => [...prev, cb]);
      },
      offClick: (cb: () => void) => {
        if (tg?.BackButton) {
          tg.BackButton.offClick(cb);
        }
        setBackButtonClickHandlers((prev) => prev.filter((fn) => fn !== cb));
      },
      isVisible: simulatedBackButtonVisible,
    };
  }, [simulatedBackButtonVisible]);

  return (
    <TelegramContext.Provider
      value={{
        webApp: window.Telegram?.WebApp || null,
        user,
        isInsideTelegram,
        colorScheme,
        themeParams,
        haptic,
        mainButton,
        backButton,
        toggleTheme,
        closeApp,
      }}
    >
      {children}

      {/* Simulated Telegram Native Main Button for browser testing when outside Telegram */}
      {!isInsideTelegram && simulatedMainButton.isVisible && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-tg-bg via-tg-bg/95 to-transparent z-40 max-w-lg mx-auto">
          <button
            type="button"
            disabled={!simulatedMainButton.isActive || simulatedMainButton.isLoading}
            onClick={() => {
              haptic.impact('medium');
              mainButtonClickHandlers.forEach((handler) => handler());
            }}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold text-[16px] text-tg-button-text bg-tg-button shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2 ${
              !simulatedMainButton.isActive ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-105'
            }`}
          >
            {simulatedMainButton.isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{simulatedMainButton.text}</span>
            )}
          </button>
        </div>
      )}

      {/* Simulated Telegram Native Back Button */}
      {!isInsideTelegram && simulatedBackButtonVisible && (
        <button
          type="button"
          onClick={() => {
            haptic.impact('light');
            backButtonClickHandlers.forEach((handler) => handler());
          }}
          className="fixed top-12 left-4 z-50 p-2 rounded-full bg-tg-secondary-bg/95 backdrop-blur-md shadow-md text-tg-text border border-tg-secondary-bg active:scale-95 transition-all"
          title="Simulated Telegram Back Button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};
