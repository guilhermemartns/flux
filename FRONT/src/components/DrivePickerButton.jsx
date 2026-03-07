import { useEffect, useRef, useState } from 'react';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function appendScript(src, dataAttr) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[${dataAttr}]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.setAttribute(dataAttr, '1');
    s.onload = resolve;
    s.onerror = resolve; // não travar em erro
    document.head.appendChild(s);
  });
}

// Token compartilhado entre todas as instâncias na página
let cachedToken = null;
let tokenExpiry = 0;

export default function DrivePickerButton({ onPick, label = 'Google Drive', className = '', style }) {
  const tokenClientRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Carrega gapi
        await appendScript('https://apis.google.com/js/api.js', 'data-gapi');
        // 2. Carrega o módulo picker dentro do gapi
        await new Promise((resolve) => {
          if (window.google?.picker) { resolve(); return; }
          if (!window.gapi) { resolve(); return; }
          window.gapi.load('picker', resolve);
        });
        // 3. Carrega GIS
        await appendScript('https://accounts.google.com/gsi/client', 'data-gis');
        // 4. Aguarda google.accounts.oauth2 estar disponível
        await new Promise((resolve) => {
          if (window.google?.accounts?.oauth2) { resolve(); return; }
          const id = setInterval(() => {
            if (window.google?.accounts?.oauth2) { clearInterval(id); resolve(); }
          }, 50);
          setTimeout(() => { clearInterval(id); resolve(); }, 5000);
        });

        if (cancelled) return;

        if (window.google?.accounts?.oauth2) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: (response) => {
              if (response.error) { console.error('OAuth error:', response); return; }
              if (response.access_token) {
                cachedToken = response.access_token;
                tokenExpiry = Date.now() + (response.expires_in ?? 3600) * 1000 - 60000;
                showPicker(response.access_token);
              }
            },
          });
        }
      } catch (err) {
        console.error('DrivePickerButton init error:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  function showPicker(accessToken) {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setMimeTypes('application/pdf');
    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setOrigin(window.location.protocol + '//' + window.location.host)
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          onPick(`https://drive.google.com/file/d/${file.id}/view`, file.name);
        }
      })
      .build();
    picker.setVisible(true);
  }

  // handleClick deve ser síncrono para manter o contexto de gesto do usuário
  function handleClick() {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      alert('Configure VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_API_KEY no .env do frontend.');
      return;
    }
    if (!tokenClientRef.current) {
      alert('Google Drive ainda carregando, tente novamente em instantes.');
      return;
    }
    // Reutiliza token enquanto ainda válido
    if (cachedToken && Date.now() < tokenExpiry) {
      showPicker(cachedToken);
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: '' });
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={handleClick}
      title="Selecionar PDF do Google Drive"
      disabled={!ready}
    >
      {label}
    </button>
  );
}

