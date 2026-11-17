import React, {useEffect, useRef, useState} from 'react';
import {ImageOff} from 'lucide-react';

export function ProductImage({sku, name, priority = false, sizes = '(max-width: 640px) 45vw, 260px'}) {
  const [state, setState] = useState('loading');
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current?.complete) setState(ref.current.naturalWidth ? 'ready' : 'error');
  }, [sku]);
  return <div className={`product-photo photo-${state}`}>
    {state === 'loading' && <span className="skeleton photo-placeholder" aria-hidden="true"/>}
    {state !== 'error' ? <img ref={ref} src={`/images/products/${sku}-320.webp`}
      srcSet={`/images/products/${sku}-320.webp 320w, /images/products/${sku}-640.webp 640w`}
      sizes={sizes} alt={name} width="640" height="640" loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'} decoding="async"
      onLoad={() => setState('ready')} onError={() => setState('error')}/>
      : <span className="photo-unavailable"><ImageOff size={28}/><small>Imagen no disponible</small></span>}
  </div>;
}

export function CatalogSkeleton() {
  return <div className="catalog-loading" role="status" aria-label="Cargando productos">
    <span className="sr-only">Cargando productos…</span>
    <div className="products-grid" aria-hidden="true">{Array.from({length: 8}, (_, i) =>
      <div className="product-card skeleton-card" key={i}><div className="skeleton skeleton-image"/>
        <div className="skeleton skeleton-line short"/><div className="skeleton skeleton-line"/>
        <div className="skeleton skeleton-line"/><div className="skeleton skeleton-price"/>
        <div className="skeleton skeleton-button"/></div>)}</div>
  </div>;
}

export function ContentSkeleton({label = 'Cargando información'}) {
  return <div role="status" aria-label={label} className="content-skeleton"><span className="sr-only">{label}</span>
    <div className="skeleton skeleton-title"/><div className="stats" aria-hidden="true">{[0,1,2,3].map(i => <div key={i} className="skeleton skeleton-stat"/>)}</div>
    <div className="skeleton skeleton-panel" aria-hidden="true"/>
  </div>;
}
