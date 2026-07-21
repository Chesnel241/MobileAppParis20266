import { useState, useEffect, useRef } from 'react';
import { API_ENABLED, fetchPhotos, uploadPhoto, mediaUrl } from '../data/api';

// Pellicule : mur photo commun de l'événement. Chaque photo est automatiquement
// marquée du logo (filigrane public/uploads/watermark.png) avant l'envoi.

const MAX_DIM = 1600;          // redimensionnement avant upload
const WATERMARK_RATIO = 0.32;  // largeur du filigrane vs largeur photo
const WATERMARK_MARGIN = 0.03;

async function watermarkFile(file) {
  const img = await loadImage(URL.createObjectURL(file));
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  // Filigrane logo en bas à droite
  const wm = await loadImage('/uploads/watermark.png');
  const wmW = Math.round(w * WATERMARK_RATIO);
  const wmH = Math.round(wmW * (wm.height / wm.width));
  const margin = Math.round(w * WATERMARK_MARGIN);
  ctx.drawImage(wm, w - wmW - margin, h - wmH - margin, wmW, wmH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas_to_blob'))),
      'image/jpeg',
      0.85
    );
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function PelliculeTab({ t, showToast }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!API_ENABLED) return;
    let alive = true;
    const load = () => fetchPhotos()
      .then((rows) => { if (alive && Array.isArray(rows)) setPhotos(rows); })
      .catch(() => {});
    load();
    const id = setInterval(load, 20000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    showToast(t('pellicule_uploading'));
    try {
      const blob = await watermarkFile(file);
      const created = await uploadPhoto(blob);
      showToast(t('pellicule_sent'));
      const rows = await fetchPhotos();
      if (Array.isArray(rows)) setPhotos(rows);
      else if (created) setPhotos((p) => [created, ...p]);
    } catch {
      showToast(t('pellicule_error'));
    } finally {
      setUploading(false);
    }
  };

  if (!API_ENABLED) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 24px',
        color: 'rgba(18,23,42,0.5)',
        fontSize: '13.5px',
        lineHeight: 1.5
      }}>{t('pellicule_offline')}</div>
    );
  }

  return (
    <>
      {/* Caméra arrière par défaut ; l'utilisateur peut basculer en selfie dans l'appareil photo */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        style={{ display: 'none' }}
      />

      <div
        onClick={() => !uploading && inputRef.current && inputRef.current.click()}
        style={{
          background: uploading ? 'rgba(18,23,42,0.15)' : '#EA4630',
          color: uploading ? 'rgba(18,23,42,0.4)' : '#fff',
          fontWeight: 700,
          textAlign: 'center',
          padding: '14px',
          borderRadius: '100px',
          cursor: uploading ? 'wait' : 'pointer',
          marginBottom: '16px'
        }}
      >{uploading ? t('pellicule_uploading') : t('pellicule_take')}</div>

      {photos.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '50px 24px',
          color: 'rgba(18,23,42,0.45)',
          fontSize: '13.5px',
          lineHeight: 1.5
        }}>{t('pellicule_empty')}</div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '6px'
      }}>
        {photos.map((p) => (
          <div
            key={p.id}
            onClick={() => setViewer(p)}
            style={{
              position: 'relative',
              paddingTop: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'rgba(18,23,42,0.06)'
            }}
          >
            <img
              src={mediaUrl(p.url)}
              alt=""
              loading="lazy"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        ))}
      </div>

      {/* Visionneuse plein écran */}
      {viewer && (
        <div
          onClick={() => setViewer(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,15,30,0.94)',
            zIndex: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <img
            src={mediaUrl(viewer.url)}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '80%',
              borderRadius: '12px',
              objectFit: 'contain'
            }}
          />
          <div style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '13px',
            fontWeight: 600,
            marginTop: '14px'
          }}>
            {t('pellicule_by')} {viewer.author}
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: '12px',
            marginTop: '4px'
          }}>
            {new Date(viewer.createdAt).toLocaleString()}
          </div>
        </div>
      )}
    </>
  );
}
