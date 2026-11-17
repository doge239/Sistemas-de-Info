import React, {useEffect, useState} from 'react';
import {ShoppingCart, Plus, Minus, Search, Store, Truck, ChevronRight, RefreshCw, Package, X, ShieldCheck, SlidersHorizontal} from 'lucide-react';
import {api, post, money, errMsg} from './api';
import {ProductImage, CatalogSkeleton} from './loading';
import {useDebounced, usePagedResource, Pagination} from './pagination';

function ProductQuantity({product, quantity, disabled, onChange}) {
  const [draft, setDraft] = useState(String(quantity));
  const maximum = Number(product.disponible);
  useEffect(() => setDraft(String(quantity)), [quantity]);
  function edit(value) {
    setDraft(value);
    if (value === '') return;
    const next = Number(value);
    if (Number.isSafeInteger(next) && next >= 1) {
      const limited = Math.min(maximum, next);
      setDraft(String(limited));
      onChange(limited);
    }
  }
  return <div className="product-quantity">
    <span>En tu carrito</span>
    <div className="product-quantity-controls">
      <button type="button" disabled={disabled} aria-label={`Reducir cantidad de ${product.nombre}`} onClick={() => onChange(quantity - 1)}><Minus size={18}/></button>
      <input type="number" min="1" max={maximum} step="1" inputMode="numeric" aria-label={`Cantidad de ${product.nombre}`} value={draft} disabled={disabled} onChange={e => edit(e.target.value)} onBlur={() => setDraft(String(quantity))} onKeyDown={e => {if (e.key === 'Enter') {e.preventDefault(); e.currentTarget.blur();}}}/>
      <button type="button" disabled={disabled || quantity >= maximum} aria-label={`Aumentar cantidad de ${product.nombre}`} onClick={() => onChange(quantity + 1)}><Plus size={18}/></button>
    </div>
  </div>;
}

export default function Commerce({online, guest = false, onRequestLogin, search: externalSearch,
  onSearch, category = '', onCategory, onCartCount}) {
  const [localSearch, setLocalSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]), [payment, setPayment] = useState('EFECTIVO');
  const [delivery, setDelivery] = useState('RETIRO_SUCURSAL');
  const [message, setMessage] = useState(''), [actionError, setError] = useState('');
  const [busy, setBusy] = useState(false), [sort, setSort] = useState('recommended');
  const search = externalSearch ?? localSearch;
  const debouncedSearch = useDebounced(search);
  const resource = usePagedResource('/productos', {buscar: debouncedSearch, categoria: category, sort});
  const visible = resource.items;
  const loading = resource.loading || search !== debouncedSearch;
  const error = actionError || resource.error;
  const load = resource.reload;
  useEffect(() => {
    const controller = new AbortController();
    if (onCategory) api('/categorias', {signal: controller.signal}).then(rows => setCategories(rows.map(c => c.nombre))).catch(() => {});
    return () => controller.abort();
  }, [onCategory]);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  useEffect(() => { onCartCount?.(count); }, [count, onCartCount]);
  function add(p) {
    setCart(items => {
      const old = items.find(x => x.id === p.id);
      return old ? items.map(x => x.id === p.id ? {...x, qty: Math.min(Number(x.disponible), x.qty + 1)} : x) : [...items, {...p, qty: 1}];
    });
  }
  function change(id, delta) { setCart(items => items.map(x => x.id === id ? {...x, qty: Math.max(0, Math.min(Number(x.disponible), x.qty + delta))} : x).filter(x => x.qty > 0)); }
  function setProductQuantity(product, value) {
    const quantity = Math.max(0, Math.min(Number(product.disponible), value));
    setCart(items => items.map(item => item.id === product.id ? {...item, disponible:product.disponible, qty:quantity} : item).filter(item => item.qty > 0));
  }
  const total = cart.reduce((sum, item) => sum + item.qty * Number(item.precio), 0);
  async function checkout(event) {
    event.preventDefault();
    if (guest) { onRequestLogin(); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const data = {items: cart.map(x => ({producto_id: x.id, cantidad: x.qty})), ...(online ? {tipo_entrega:delivery} : {metodo_pago: payment})};
      const result = await post(online ? '/pedidos/online' : '/ventas/presencial', data);
      setCart([]); setMessage(`${online ? (delivery==='DOMICILIO'?'Pedido con retiro a domicilio confirmado':'Pedido para retiro confirmado') : 'Venta confirmada'} #${result.id} · ${money(result.total)}`); await load();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  }
  return <section className="catalog-section" id="productos" aria-labelledby="catalog-title">
    <div className="catalog-heading"><div><span className="eyebrow">TU PRÓXIMO UPGRADE</span><h2 id="catalog-title">{online ? 'Encuentra tu favorito' : 'Venta presencial'}</h2></div><span className="catalog-results" aria-live="polite">{loading ? 'Cargando catálogo…' : `${resource.total} productos`}</span></div>
    {message && <div className="message ok" role="status">{message}</div>}
    {resource.error && <div className="message error" role="alert">{resource.error}<button className="retry-button" onClick={() => {setError('');load();}}><RefreshCw size={15}/> Reintentar</button></div>}
    <div className="catalog-toolbar">
      {onSearch ? null : <div className="searchbar"><Search size={18}/><input aria-label="Buscar productos" placeholder="Busca por producto o SKU" value={search} onChange={e => setLocalSearch(e.target.value)}/></div>}
      {onCategory && <div className="category-chips" aria-label="Filtrar por categoría"><button aria-pressed={!category} className={!category ? 'selected' : ''} onClick={() => onCategory('')}>Todos</button>{categories.map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'selected' : ''} onClick={() => onCategory(c)}>{c}</button>)}</div>}
      <label className="sort-control"><SlidersHorizontal size={16}/><span className="sr-only">Ordenar productos</span><select aria-label="Ordenar productos" value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">Recomendados</option><option value="price-up">Menor precio</option><option value="price-down">Mayor precio</option><option value="name">Nombre A–Z</option></select></label>
    </div>
    <Pagination resource={{...resource, loading}} label="productos"/>
    <div className="commerce-grid"><div aria-busy={loading}>
      {loading ? <CatalogSkeleton/> : visible.length ? <div className="products-grid">{visible.map((p, index) => <article className="product-card" key={p.id}>
        <div className="product-label">{p.categoria}</div><ProductImage sku={p.sku} name={p.nombre} priority={index < 4}/>
        <small className="product-sku">SKU {p.sku}</small><h3 className="p-card-title">{p.nombre}</h3>
        <span className={'product-availability ' + (p.disponible > 0 ? 'available' : 'unavailable')}><i/>{p.disponible > 0 ? `${p.disponible} disponibles` : 'Sin stock por el momento'}</span>
        <strong className="product-price">{money(p.precio)}</strong><small>Precio de demostración · IVA incluido</small>
        {cart.some(item => item.id === p.id) ? <ProductQuantity product={p} quantity={cart.find(item => item.id === p.id).qty} disabled={busy} onChange={value => setProductQuantity(p, value)}/> : <button className="btn full add-button" onClick={() => add(p)} disabled={p.disponible <= 0 || busy} aria-label={`Agregar ${p.nombre}`}><Plus size={17}/> Agregar al carrito</button>}
      </article>)}</div> : <div className="catalog-empty"><Search size={34}/><h3>{error ? 'El catálogo no está disponible' : 'No encontramos productos'}</h3><p>{error ? 'Vuelve a intentar cargar los productos.' : 'Prueba otra búsqueda o explora una categoría diferente.'}</p>{!error && <button className="btn" onClick={() => { (onSearch || setLocalSearch)(''); onCategory?.(''); }}>Ver todos los productos</button>}</div>}
      <Pagination resource={{...resource, loading}} label="productos"/>
    </div><aside className="card sticky-cart" id="carrito" aria-label="Carrito de compras"><h3><ShoppingCart size={20}/>{online ? 'Tu carrito' : 'Carrito de venta'}<span className="count" aria-live="polite">{count}</span></h3>
      {cart.length === 0 ? <div className="cart-empty"><ShoppingCart size={36}/><b>Tu próximo equipo te espera</b><p>Agrega tus favoritos y arma tu pedido.</p></div> : cart.map(x => <div className="cart-row" key={x.id}><div><b>{x.nombre}</b><small>{money(x.precio)}</small><div className="qty"><button disabled={busy} aria-label={`Quitar una unidad de ${x.nombre}`} onClick={() => change(x.id, -1)}><Minus size={13}/></button><b>{x.qty}</b><button disabled={busy} aria-label={`Agregar una unidad de ${x.nombre}`} onClick={() => change(x.id, 1)}><Plus size={13}/></button></div></div><button className="remove-item" disabled={busy} aria-label={`Eliminar ${x.nombre} del carrito`} onClick={() => setCart(items => items.filter(i => i.id !== x.id))}><X size={16}/></button></div>)}
      <div className="total"><span>Total</span><b>{money(total)}</b></div>
      <form className="checkout-form" onSubmit={checkout}>
        {online ? <><fieldset className="delivery-options" disabled={busy}><legend>¿Cómo quieres recibir tu pedido?</legend>
          <label className={delivery==='RETIRO_SUCURSAL'?'selected':''}><input type="radio" name="tipo_entrega" value="RETIRO_SUCURSAL" checked={delivery==='RETIRO_SUCURSAL'} onChange={e=>setDelivery(e.target.value)}/><Store size={20}/><span><b>Retiro en sucursal</b><small>Antofagasta · Sin costo de retiro</small></span></label>
          <label className={delivery==='DOMICILIO'?'selected':''}><input type="radio" name="tipo_entrega" value="DOMICILIO" checked={delivery==='DOMICILIO'} onChange={e=>setDelivery(e.target.value)}/><Truck size={20}/><span><b>Retiro a domicilio</b></span></label>
        </fieldset>
        </> : <label>Método de pago<select value={payment} onChange={e => setPayment(e.target.value)}>{['EFECTIVO','TARJETA','TRANSFERENCIA','OTRO'].map(x => <option key={x}>{x}</option>)}</select></label>}
        {actionError&&<p className="checkout-error" role="alert">{actionError}</p>}
        <button type="submit" className="btn full checkout-button" disabled={!cart.length || busy || loading}>{busy ? 'Procesando…' : online ? 'Confirmar pedido' : 'Confirmar venta'}<ChevronRight size={17}/></button>
      </form>
      <div className="cart-note"><ShieldCheck size={15}/> {online ? 'Tu pedido, con la entrega que prefieras' : 'Stock actualizado al confirmar'}</div>
    </aside></div>
  </section>;
}
