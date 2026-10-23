import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import type { ScanImage } from './features/scan/scanModel';
import { scanImageSet, scanReset } from './features/scan/scanSlice';
import { analyzeImage } from './features/scan/scanThunk';
import {
  clearHistoryError,
  deleteHistoryItem,
  loadHistory,
  saveHistoryItem,
} from './features/history/historySlice';
import { clearProfileError, loadProfile, updateProfile } from './features/profile/profileSlice';

const API_KEY_STORAGE_KEY = 'riceguard_gemini_api_key';

function readImage(file: File): Promise<ScanImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('The selected image could not be read.'));
        return;
      }
      const separator = reader.result.indexOf(',');
      if (separator < 0) {
        reject(new Error('The selected image could not be read.'));
        return;
      }
      resolve({
        dataUrl: reader.result,
        base64: reader.result.slice(separator + 1),
        mimeType: file.type || 'image/jpeg',
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const dispatch = useAppDispatch();
  const { image, result, status, error } = useAppSelector((state) => state.scanReducer);
  const history = useAppSelector((state) => state.history);
  const profile = useAppSelector((state) => state.profile);
  const [page, setPage] = useState<'home' | 'history' | 'profile'>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE_KEY) ?? '');
  const [keyError, setKeyError] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileFormError, setProfileFormError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    dispatch(loadHistory());
    dispatch(loadProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile.profile) {
      setProfileName(profile.profile.name);
      setProfileLocation(profile.profile.location);
    }
  }, [profile.profile]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSelectionError('Please select a valid image file.');
      event.target.value = '';
      return;
    }
    try {
      dispatch(scanImageSet(await readImage(file)));
      setSelectionError('');
    } catch (readError) {
      setSelectionError(
        readError instanceof Error ? readError.message : 'The selected image could not be read.',
      );
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!image) return;
    if (!apiKey.trim()) {
      setSettingsOpen(true);
      setKeyError('Enter your Gemini API key to analyze an image.');
      return;
    }
    dispatch(clearHistoryError());
    void dispatch(analyzeImage({ image, apiKey: apiKey.trim() })).unwrap().then(
      (scanResult) => {
        void dispatch(saveHistoryItem({ imageName: image.name, result: scanResult }));
      },
      () => undefined,
    );
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileName.trim()) {
      setProfileFormError('Please enter your name.');
      return;
    }
    setProfileFormError('');
    setProfileMessage('');
    dispatch(clearProfileError());
    void dispatch(updateProfile({ name: profileName, location: profileLocation })).unwrap().then(
      () => setProfileMessage('Profile saved on this device.'),
      () => setProfileMessage(''),
    );
  };

  const saveApiKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setKeyError('Please enter a valid API key.');
      return;
    }
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmedKey);
    setApiKey(trimmedKey);
    setKeyError('');
    setSettingsOpen(false);
  };

  const clearApiKey = () => {
    if (!window.confirm('Are you sure you want to clear the API key?')) return;
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey('');
    setKeyError('');
  };

  const reset = () => {
    dispatch(scanReset());
    setSelectionError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 font-sans sm:p-4">
      <div className="relative flex min-h-screen w-full max-w-md flex-col justify-between bg-white p-6 shadow-xl sm:min-h-[720px] sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 py-2">
          <span className="flex items-center gap-1 text-xl font-bold text-emerald-700">
            🌱 RiceGuard
          </span>
          <button
            aria-label="Open settings"
            className="text-xl font-bold text-slate-600 transition hover:text-emerald-700"
            onClick={() => {
              setKeyError('');
              setSettingsOpen(true);
            }}
            title="Settings / API Key"
            type="button"
          >
            ⚙️
          </button>
        </header>

        {page === 'history' ? (
          <main className="my-2 flex flex-1 flex-col overflow-hidden">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-slate-800">Scan History</h1>
              <p className="mt-1 text-xs text-slate-500">Your saved rice plant analyses</p>
            </div>
            {history.error && (
              <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
                {history.error}
              </p>
            )}
            {history.status === 'loading' ? (
              <p aria-live="polite" className="py-8 text-center text-sm text-slate-500">
                Loading your scans...
              </p>
            ) : history.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span aria-hidden="true" className="text-4xl">🌾</span>
                <h2 className="mt-3 font-semibold text-slate-700">No scans yet</h2>
                <p className="mt-1 text-sm text-slate-500">Completed analyses will appear here.</p>
                <button
                  className="mt-5 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
                  onClick={() => setPage('home')}
                  type="button"
                >
                  Start a Scan
                </button>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {history.items.map((item) => (
                  <article className="rounded-xl border border-slate-200 p-4" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.imageName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.result.isHealthy
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.result.isHealthy ? 'Healthy' : item.result.diseaseName || 'Disease detected'}
                      </span>
                    </div>
                    {!item.result.isHealthy && item.result.scientificName && (
                      <p className="mt-2 text-xs italic text-slate-500">{item.result.scientificName}</p>
                    )}
                    {item.result.symptoms.length > 0 && (
                      <p className="mt-3 text-xs text-slate-600">
                        <span className="font-semibold">Symptoms: </span>
                        {item.result.symptoms.join(', ')}
                      </p>
                    )}
                    {item.result.recommendations.length > 0 && (
                      <p className="mt-2 text-xs text-slate-600">
                        <span className="font-semibold">Recommendations: </span>
                        {item.result.recommendations.join(' ')}
                      </p>
                    )}
                    <button
                      aria-label={`Delete scan ${item.imageName}`}
                      className="mt-3 text-xs font-semibold text-rose-700 hover:text-rose-900"
                      onClick={() => dispatch(deleteHistoryItem(item.id))}
                      type="button"
                    >
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            )}
          </main>
        ) : page === 'profile' ? (
          <main className="my-auto flex flex-1 flex-col py-6">
            <div className="mb-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
                👩‍🌾
              </div>
              <h1 className="mt-3 text-xl font-bold text-slate-800">Your Profile</h1>
              <p className="mt-1 text-sm text-slate-500">Personalize your RiceGuard experience</p>
            </div>
            {profile.status === 'loading' ? (
              <p aria-live="polite" className="py-5 text-center text-sm text-slate-500">
                Loading your profile...
              </p>
            ) : (
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="profile-name">
                    Name
                  </label>
                  <input
                    autoComplete="name"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    id="profile-name"
                    onChange={(event) => {
                      setProfileName(event.target.value);
                      setProfileMessage('');
                    }}
                    placeholder="Your name"
                    value={profileName}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="profile-location">
                    Location
                  </label>
                  <input
                    autoComplete="address-level2"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    id="profile-location"
                    onChange={(event) => {
                      setProfileLocation(event.target.value);
                      setProfileMessage('');
                    }}
                    placeholder="Your farm or area"
                    value={profileLocation}
                  />
                </div>
                {(profile.error || profileFormError) && (
                  <p className="text-sm text-rose-700" role="alert">
                    {profileFormError || profile.error}
                  </p>
                )}
                {profileMessage && <p className="text-sm text-emerald-700" role="status">{profileMessage}</p>}
                <button
                  className="w-full rounded-xl bg-emerald-800 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60"
                  disabled={profile.saving}
                  type="submit"
                >
                  {profile.saving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            )}
          </main>
        ) : status === 'loading' ? (
          <main
            aria-live="polite"
            className="my-auto flex flex-1 flex-col items-center justify-center py-12 text-center"
          >
            <div className="relative mb-6 flex items-center justify-center">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
              <span className="absolute text-2xl">🌱</span>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Analyzing your photo...</h2>
            <p className="mt-1 text-xs text-slate-500">Powered by Gemini Vision</p>
          </main>
        ) : status === 'succeeded' && result && image ? (
          <main className="my-2 flex flex-1 flex-col">
            <div
              className={`mb-4 flex items-start space-x-3 rounded-xl border p-4 ${
                result.isHealthy
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              <span className="mt-0.5 text-2xl">{result.isHealthy ? '✅' : '⚠️'}</span>
              <div>
                <h2 className="text-base font-bold">
                  {result.isHealthy ? 'Healthy Plant' : result.diseaseName || 'Possible Disease Detected'}
                </h2>
                <p className="mt-0.5 text-xs italic opacity-90">
                  {result.isHealthy
                    ? 'No signs of disease detected in your rice plant.'
                    : result.scientificName}
                </p>
              </div>
            </div>

            <img
              alt={`Analyzed rice plant: ${image.name}`}
              className="mb-4 h-40 w-full rounded-xl border border-slate-100 object-cover shadow-sm"
              src={image.dataUrl}
            />

            <div className="max-h-56 flex-1 space-y-4 overflow-y-auto pr-1 text-left">
              {!result.isHealthy && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Common Symptoms
                  </h3>
                  {result.symptoms.length > 0 ? (
                    <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-slate-700">
                      {result.symptoms.map((symptom: string, index: number) => (
                        <li key={`${index}-${symptom}`}>{symptom}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-500">No symptoms were provided.</p>
                  )}
                </section>
              )}

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommendation
                </h3>
                {result.recommendations.length > 0 ? (
                  <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-slate-700">
                    {result.recommendations.map((recommendation: string, index: number) => (
                      <li key={`${index}-${recommendation}`}>{recommendation}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-xs text-slate-500">No recommendations were provided.</p>
                )}
              </section>
            </div>

            <button
              className="mt-4 w-full rounded-xl bg-emerald-800 py-3.5 font-semibold text-white shadow-md transition hover:bg-emerald-900"
              onClick={reset}
              type="button"
            >
              Scan Another Plant
            </button>
          </main>
        ) : (
          <main className="my-auto flex flex-1 flex-col items-center justify-center py-4 text-center">
            <h1 className="text-xl font-bold text-slate-800">Detect Rice Disease</h1>
            <p className="mb-6 mt-1 max-w-xs text-xs text-slate-500">
              Upload or take a photo of your rice plant and let RiceGuard check for diseases.
            </p>

            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              <label className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl border-2 border-emerald-600 px-4 py-3.5 font-semibold text-emerald-700 transition hover:bg-emerald-50">
                <span aria-hidden="true">📷</span>
                <span>Take Photo</span>
                <input
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                  type="file"
                />
              </label>

              <div className="my-2 flex items-center">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-3 text-xs font-medium text-slate-400">OR</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              <label className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-xl border border-slate-300 px-4 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50">
                <span aria-hidden="true">🖼️</span>
                <span>Upload Image</span>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  type="file"
                />
              </label>

              {image && (
                <div className="mt-4">
                  <p className="mb-2 text-left text-xs font-medium text-slate-500">
                    Selected Photo: {image.name}
                  </p>
                  <img
                    alt="Selected rice plant preview"
                    className="h-44 w-full rounded-xl border border-slate-200 object-cover shadow-sm"
                    src={image.dataUrl}
                  />
                </div>
              )}

              {selectionError && (
                <p className="text-left text-sm text-rose-700" role="alert">
                  {selectionError}
                </p>
              )}
              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-left text-sm text-rose-800" role="alert">
                  <p>Failed to analyze image: {error}</p>
                  <p className="mt-1 text-xs">
                    Try again in a moment. If the error continues, check your API key and network connection.
                  </p>
                </div>
              )}

              <button
                className="w-full rounded-xl bg-emerald-800 py-3.5 font-semibold text-white shadow-md transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-800"
                disabled={!image}
                type="submit"
              >
                {error ? 'Try Again' : 'Detect Disease'}
              </button>
            </form>
          </main>
        )}

        <footer className="flex items-center justify-around border-t border-slate-100 pt-3 text-xs text-slate-400">
          <button
            aria-current={page === 'home' ? 'page' : undefined}
            className={`flex flex-col items-center transition hover:text-emerald-700 ${page === 'home' ? 'font-semibold text-emerald-700' : ''}`}
            onClick={() => setPage('home')}
            type="button"
          >
            <span className="text-lg">⌂</span>
            <span>Home</span>
          </button>
          <button
            aria-current={page === 'history' ? 'page' : undefined}
            className={`flex flex-col items-center transition hover:text-emerald-700 ${page === 'history' ? 'font-semibold text-emerald-700' : ''}`}
            onClick={() => setPage('history')}
            type="button"
          >
            <span className="text-lg">↻</span>
            <span>History</span>
          </button>
          <button
            aria-current={page === 'profile' ? 'page' : undefined}
            className={`flex flex-col items-center transition hover:text-emerald-700 ${page === 'profile' ? 'font-semibold text-emerald-700' : ''}`}
            onClick={() => setPage('profile')}
            type="button"
          >
            <span className="text-lg">♙</span>
            <span>Profile</span>
          </button>
        </footer>

        {settingsOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSettingsOpen(false);
            }}
          >
            <section
              aria-labelledby="settings-title"
              aria-modal="true"
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
              role="dialog"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800" id="settings-title">
                  Settings
                </h2>
                <button
                  aria-label="Close settings"
                  className="text-xl text-slate-400 hover:text-slate-600"
                  onClick={() => setSettingsOpen(false)}
                  type="button"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4" onSubmit={saveApiKey}>
                <div>
                  <label
                    className="mb-2 block text-xs font-semibold text-slate-600"
                    htmlFor="api-key"
                  >
                    Gemini API Key
                  </label>
                  <input
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    id="api-key"
                    onChange={(event) => {
                      setApiKey(event.target.value);
                      setKeyError('');
                    }}
                    placeholder="Enter your Gemini API key"
                    type="password"
                    value={apiKey}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Get your API key from{' '}
                    <a
                      className="text-emerald-600 hover:underline"
                      href="https://aistudio.google.com/app/apikey"
                      rel="noreferrer"
                      target="_blank"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <span className="text-lg">ℹ️</span>
                  <p className="text-xs text-blue-900">
                    Your API key is stored only in your browser&apos;s local storage.
                  </p>
                </div>

                {keyError && (
                  <p className="text-sm text-rose-700" role="alert">
                    {keyError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                    onClick={clearApiKey}
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    type="submit"
                  >
                    Save
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
