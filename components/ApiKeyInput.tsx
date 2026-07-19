import React from 'react';
import { Key, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'brutal_gemini_api_key';

/** Read the persisted Gemini key from localStorage (safe if storage is blocked). */
export const loadStoredApiKey = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

interface ApiKeyInputProps {
  value: string;
  onChange: (key: string) => void;
  invalid?: boolean;
}

/**
 * BYO-key input. The key lives only in this browser (React state + localStorage)
 * and is sent directly to Google's Gemini API — it is never baked into the build
 * and never leaves the client for any other server.
 */
export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ value, onChange, invalid }) => {
  const handleChange = (next: string) => {
    onChange(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (e.g. private mode): the key still works for
      // this session, it just won't persist across reloads.
    }
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-mono text-gray-400 mb-2">
        <Key className="w-4 h-4" /> GOOGLE GEMINI API KEY
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="AIza..."
        autoComplete="off"
        spellCheck={false}
        className={`w-full bg-black border rounded-lg py-3 px-4 text-white font-mono focus:outline-none focus:ring-1 transition-colors ${
          invalid
            ? 'border-terminal-red ring-1 ring-terminal-red'
            : 'border-gray-700 focus:border-terminal-green focus:ring-terminal-green'
        }`}
      />
      <p className="text-xs text-gray-500 font-mono mt-2 leading-relaxed">
        Stored only in this browser (localStorage) and sent straight to Google — never to our
        servers, never baked into the build.{' '}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-terminal-green transition-colors inline-flex items-center gap-1"
        >
          Get a free key <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </div>
  );
};
