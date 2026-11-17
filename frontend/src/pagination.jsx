import React, {useCallback, useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, Search} from 'lucide-react';
import {api, errMsg} from './api';

export function useDebounced(value, delay = 400) {
  const [settled, setSettled] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setSettled(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return settled;
}

export function usePagedResource(path, filters = {}) {
  const filterKey = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== '' && value != null)).toString();
  const [navigation, setNavigation] = useState({key: filterKey, page: 1});
  const page = navigation.key === filterKey ? navigation.page : 1;
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({key: '', items: [], total: 0, totalPages: 1, pageSize: 10, summary: {}, error: '', pending: true});
  const url = `${path}?${filterKey ? filterKey + '&' : ''}page=${page}&pageSize=10`;
  useEffect(() => {
    const controller = new AbortController();
    setState(prev => ({...prev, pending: true, error: ''}));
    api(url, {signal: controller.signal}).then(result => {
      if (controller.signal.aborted) return;
      if (page > result.totalPages) { setNavigation({key: filterKey, page: result.totalPages}); return; }
      setState({...result, key: url, error: '', pending: false});
    }).catch(error => {
      if (!controller.signal.aborted) setState(prev => ({...prev, key: url, items: [], error: errMsg(error), pending: false}));
    });
    return () => controller.abort();
  }, [url, version]);
  const reload = useCallback(() => setVersion(v => v + 1), []);
  const setItems = useCallback(update => setState(prev => ({...prev, items: typeof update === 'function' ? update(prev.items) : update})), []);
  const setPage = next => setNavigation({key: filterKey, page: Math.max(1, next)});
  return {...state, page, setPage, loading: state.pending || state.key !== url, reload, setItems};
}

export function Pagination({resource, label = 'registros'}) {
  const {page, pageSize, total, totalPages, loading, setPage} = resource;
  const start = total ? (page - 1) * pageSize + 1 : 0;
  return <nav className="pagination" aria-label={`Paginación de ${label}`}>
    <span className="pagination-range" aria-live="polite">{start}–{Math.min(page * pageSize, total)} de {total} {label}</span>
    <div className="pagination-controls"><button type="button" disabled={loading || page <= 1} onClick={() => setPage(page - 1)} aria-label={`Página anterior de ${label}`}><ChevronLeft size={17}/><span>Anterior</span></button>
      <span className="pagination-current">Página <b>{page}</b> de {totalPages}</span>
      <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage(page + 1)} aria-label={`Página siguiente de ${label}`}><span>Siguiente</span><ChevronRight size={17}/></button></div>
  </nav>;
}

export function ListSearch({value, onChange, label = 'Buscar registros'}) {
  return <div className="list-search"><Search size={18}/><input type="search" aria-label={label} placeholder={label} value={value} onChange={e => onChange(e.target.value)}/></div>;
}

export function EntityPicker({type = 'productos', value, onChange, supplier, label = 'Producto'}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const settled = useDebounced(search);
  const resource = usePagedResource('/' + type, {buscar: settled, proveedor_id: supplier});
  const items = selected && String(selected.id) === String(value) && !resource.items.some(item => String(item.id) === String(value)) ? [selected, ...resource.items] : resource.items;
  return <div className="entity-picker">
    <label>{label}<input type="search" value={search} aria-label={`Buscar ${label.toLowerCase()}`} placeholder={`Buscar ${label.toLowerCase()} por nombre${type === 'productos' ? ' o SKU' : ''}`} onChange={e => setSearch(e.target.value)}/></label>
    <select aria-label={`Seleccionar ${label.toLowerCase()}`} value={value} required disabled={resource.loading} onChange={e => { const item = items.find(item => String(item.id) === e.target.value); setSelected(item || null); onChange(e.target.value); }}>
      <option value="">{resource.loading ? 'Cargando opciones…' : 'Seleccionar…'}</option>
      {items.map(item => <option value={item.id} key={item.id}>{item.sku ? item.sku + ' · ' : ''}{item.nombre}</option>)}
    </select>
    {resource.error ? <span className="picker-error" role="alert">{resource.error}<button type="button" onClick={resource.reload}>Reintentar</button></span> : <Pagination resource={resource} label={type}/>}
  </div>;
}
