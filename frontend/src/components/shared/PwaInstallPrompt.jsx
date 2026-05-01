import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const isStandaloneMode = () =>
  window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return undefined;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;
    setVisible(false);
    setInstallPrompt(null);
  };

  if (!visible || !installPrompt) return null;

  return (
    <div className="pwa-install-toast" role="status" aria-live="polite">
      <div className="pwa-install-toast__icon" aria-hidden="true">
        <Download size={18} strokeWidth={2.3} />
      </div>
      <div className="pwa-install-toast__content">
        <strong>Instalar app</strong>
        <span>Aceda ao sistema mais rapido no seu dispositivo.</span>
      </div>
      <button className="pwa-install-toast__action" type="button" onClick={handleInstall}>
        Instalar
      </button>
      <button
        className="pwa-install-toast__close"
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Fechar aviso de instalacao"
        title="Fechar"
      >
        <X size={16} strokeWidth={2.3} />
      </button>
    </div>
  );
}
