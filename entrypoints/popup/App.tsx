import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import { AlertTriangle, ArrowLeftRight, ArrowUpDown, ArrowUpRight, Download, Maximize, Pause, Play, RefreshCw, RotateCw, RotateCcw, Video } from 'lucide-react';
import './App.css';

type VideoInfo = { index: number; title: string; src: string; currentTime: number; duration: number; paused: boolean };
type Filter = 'none' | 'grayscale(1)' | 'sepia(1)' | 'brightness(1.25) contrast(1.08)' | 'contrast(1.35)';
type Theme = 'light' | 'dark' | 'system';
type TransformState = { rotate: number; flipX: boolean; flipY: boolean; filter: Filter };

const filters: { label: string; value: Filter }[] = [
  { label: 'Original', value: 'none' }, { label: 'Grayscale', value: 'grayscale(1)' },
  { label: 'Sepia', value: 'sepia(1)' }, { label: 'Bright', value: 'brightness(1.25) contrast(1.08)' },
  { label: 'High contrast', value: 'contrast(1.35)' },
];

async function runOnPage<T>(func: (...args: any[]) => T, args: unknown[] = []): Promise<T | undefined> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const results = await browser.scripting.executeScript({ target: { tabId: tab.id }, func, args });
  return results[0]?.result as T | undefined;
}

function App() {
  const [videos, setVideos] = useState<VideoInfo[]>([]);
  const [selected, setSelected] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [filter, setFilter] = useState<Filter>('none');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<Theme>('system');

  const getStorageKey = async (index: number) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const page = tab?.url ? new URL(tab.url) : null;
    return `frame:video:${page ? `${page.origin}${page.pathname}` : 'current'}:${index}`;
  };

  const refresh = useCallback(async () => {
    try {
      const found = await runOnPage(() => Array.from(document.querySelectorAll('video')).map((v, index) => ({
        index, title: v.getAttribute('aria-label') || v.getAttribute('title') || v.currentSrc.split('/').pop()?.split('?')[0] || `Video ${index + 1}`,
        src: v.currentSrc || v.src || '', currentTime: v.currentTime || 0, duration: Number.isFinite(v.duration) ? v.duration : 0, paused: v.paused,
      })));
      setVideos(found || []);
      setSelected((n) => Math.min(n, Math.max(0, (found?.length || 1) - 1)));
    } catch { setMessage('This page does not allow video controls.'); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    void browser.storage.local.get('frame:theme').then((saved) => {
      const value = saved['frame:theme'];
      if (value === 'light' || value === 'dark' || value === 'system') setTheme(value);
    });
  }, []);

  useEffect(() => {
    if (!videos.length) return;
    let cancelled = false;
    void (async () => {
      try {
        const key = await getStorageKey(selected);
        const saved = (await browser.storage.local.get(key))[key] as TransformState | undefined;
        if (cancelled || !saved) return;
        setRotation(saved.rotate ?? 0);
        setFlipX(saved.flipX ?? false);
        setFlipY(saved.flipY ?? false);
        setFilter(saved.filter ?? 'none');
        await runOnPage((index: number, state: TransformState) => {
          const video = document.querySelectorAll('video')[index] as HTMLVideoElement | undefined;
          if (!video) return;
          video.style.setProperty('transform', `rotate(${state.rotate}deg) scaleX(${state.flipX ? -1 : 1}) scaleY(${state.flipY ? -1 : 1})`, 'important');
          video.style.setProperty('filter', state.filter, 'important');
          video.style.setProperty('transform-origin', 'center center', 'important');
          video.style.setProperty('will-change', 'transform, filter', 'important');
        }, [selected, saved]);
      } catch { /* storage may be unavailable on restricted pages */ }
    })();
    return () => { cancelled = true; };
  }, [videos, selected]);

  const updateVideo = async (action: string, value?: unknown) => {
    const next: TransformState = {
      rotate: action === 'rotate' ? (rotation + 90) % 360 : action === 'reset' ? 0 : rotation,
      flipX: action === 'flipX' ? !flipX : action === 'reset' ? false : flipX,
      flipY: action === 'flipY' ? !flipY : action === 'reset' ? false : flipY,
      filter: action === 'filter' ? value as Filter : action === 'reset' ? 'none' : filter,
    };
    try {
      await runOnPage((index: number, action: string, transform: TransformState) => {
        const video = document.querySelectorAll('video')[index] as HTMLVideoElement | undefined;
        if (!video) return;
        if (action === 'play') { void (video.paused ? video.play() : video.pause()); return; }
        if (action === 'fullscreen') { void (video.requestFullscreen?.()); return; }
        video.style.setProperty('transform', `rotate(${transform.rotate}deg) scaleX(${transform.flipX ? -1 : 1}) scaleY(${transform.flipY ? -1 : 1})`, 'important');
        video.style.setProperty('filter', transform.filter, 'important');
        video.style.setProperty('transform-origin', 'center center', 'important');
        video.style.setProperty('will-change', 'transform, filter', 'important');
      }, [selected, action, next]);
      setRotation(next.rotate);
      setFlipX(next.flipX);
      setFlipY(next.flipY);
      setFilter(next.filter);
      const key = await getStorageKey(selected);
      await browser.storage.local.set({ [key]: next });
      setMessage('');
    } catch { setMessage('Could not control this video on the current page.'); }
  };

  const download = async (video: VideoInfo) => {
    const url = video.src;
    if (!url) { setMessage('This video has no direct download URL.'); return; }
    if (url.startsWith('blob:')) { setMessage('This video uses a temporary stream URL. Try the player’s own download option.'); return; }
    try {
      await browser.downloads.download({ url, filename: video.title.replace(/[<>:"/\\|?*]+/g, '_').slice(0, 120) || 'video', saveAs: true });
      setMessage('Download started.');
    } catch { setMessage('The browser could not download this video URL.'); }
  };

  const current = videos[selected];
  return <main className={`app-shell theme-${theme}`}>
    <header className="topbar"><img className="brand-mark" src="/frameflip-logo.png" alt="FrameFlip logo" /><div><div className="brand-name">FRAMEFLIP</div><div className="brand-sub">VIDEO TOOLBOX</div></div><select className="theme-select" aria-label="Color theme" value={theme} onChange={(e) => { const next = e.target.value as Theme; setTheme(next); void browser.storage.local.set({ 'frame:theme': next }); }}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select><button className="icon-button refresh" title="Refresh videos" onClick={() => void refresh()}><RefreshCw size={15} /></button></header>
    <section className="page-summary"><span className="live-dot"/><span>{videos.length ? `${videos.length} VIDEO${videos.length === 1 ? '' : 'S'} FOUND` : 'CURRENT PAGE'}</span></section>
    {videos.length === 0 ? <section className="empty-state"><div className="empty-icon"><Video size={22} /></div><h2>No videos found</h2><p>Open a page with a video player, then refresh this panel.</p></section> : <>
      <section className="video-picker"><label htmlFor="video-select">ACTIVE VIDEO</label><select id="video-select" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>{videos.map((v) => <option key={v.index} value={v.index}>{v.title.slice(0, 48)}</option>)}</select><div className="video-meta"><span>{current?.paused ? 'PAUSED' : 'PLAYING'}</span><span>{current?.duration ? `${Math.floor(current.duration / 60)}:${String(Math.floor(current.duration % 60)).padStart(2, '0')}` : 'LIVE / STREAM'}</span></div></section>
      <section className="section-block"><div className="section-heading"><span>TRANSFORM</span><span className="section-line"/></div><div className="control-grid">
        <button className="control-tile" onClick={() => void updateVideo('flipX')}><span className="tile-icon"><ArrowLeftRight size={19} /></span><span>Flip horizontal</span><i className={flipX ? 'toggle on' : 'toggle'}/></button>
        <button className="control-tile" onClick={() => void updateVideo('flipY')}><span className="tile-icon"><ArrowUpDown size={19} /></span><span>Flip vertical</span><i className={flipY ? 'toggle on' : 'toggle'}/></button>
        <button className="control-tile" onClick={() => void updateVideo('rotate')}><span className="tile-icon"><RotateCw size={19} /></span><span>Rotate 90°</span><b className="value-tag">{rotation}°</b></button>
      </div></section>
      <section className="section-block filters-section"><div className="section-heading"><span>IMAGE</span><span className="section-line"/></div><div className="filter-list">{filters.map((f) => <button key={f.value} className={filter === f.value ? 'filter-chip active' : 'filter-chip'} onClick={() => void updateVideo('filter', f.value)}>{f.label}</button>)}</div></section>
      <section className="action-row"><button className="secondary-action" onClick={() => void updateVideo('play')}><span>{current?.paused ? <Play size={14} /> : <Pause size={14} />}</span> Play / pause</button><button className="secondary-action" onClick={() => void updateVideo('fullscreen')}><span><Maximize size={14} /></span> Fullscreen</button></section>
      <button className="download-button" onClick={() => current && void download(current)}><span className="download-icon"><Download size={16} /></span><span><strong>Download video</strong><small>Save the current video file</small></span><span className="arrow"><ArrowUpRight size={15} /></span></button>
      <button className="reset-button" onClick={() => void updateVideo('reset')}><RotateCcw size={12} /> Reset adjustments</button>
    </>}
    {message && <div className="notice"><AlertTriangle size={14} /><span>{message}</span></div>}
    <footer><span>FRAMEFLIP · VIDEO TOOLBOX</span><span>MADE FOR THE MOMENT</span></footer>
  </main>;
}

export default App;


