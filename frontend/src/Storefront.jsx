import React, {useState} from 'react';
import {Search, Menu, Users, ShoppingBag, ShoppingCart, LogOut, MapPin, ArrowUpRight, ArrowRight, PackageCheck, ShieldCheck, ChevronRight, X, Laptop, Gamepad2, Monitor, Cpu} from 'lucide-react';
import Commerce from './Commerce';
import {ProductImage} from './loading';

const featuredCategories = [
  {name: 'Notebooks', icon: Laptop, detail: 'Trabaja desde donde quieras'},
  {name: 'Gaming', icon: Gamepad2, detail: 'Lleva tu juego más lejos'},
  {name: 'Monitores', icon: Monitor, detail: 'Una nueva perspectiva'},
  {name: 'Componentes', icon: Cpu, detail: 'Potencia a tu medida'},
];
const heroSlides = [
  {tag: 'TRABAJA. CREA. CONECTA.', title: 'Dale un upgrade\na tu día.', copy: 'Encuentra el equipo que va contigo. Tecnología para tus ideas, tus proyectos y todo lo que viene.', category: 'Notebooks', sku: 'PFA001', name: 'Notebook Lenovo IdeaPad', label: 'Tu oficina, donde tú estés', action: 'Explorar notebooks'},
  {tag: 'TU SETUP, AL SIGUIENTE NIVEL.', title: 'Más potencia.\nMás posibilidades.', copy: 'Componentes para construir ese equipo que tienes en mente. Tú eliges hasta dónde llegar.', category: 'Componentes', sku: 'PFA017', name: 'Tarjeta gráfica ASUS RTX 4060', label: 'Rendimiento para ir más allá', action: 'Ver componentes'},
  {tag: 'CADA DETALLE CUENTA.', title: 'Amplía tu\npunto de vista.', copy: 'Dale más espacio a tus ideas con una pantalla que transforme tu forma de trabajar y disfrutar.', category: 'Monitores', sku: 'PFA045', name: 'Monitor Samsung', label: 'Un nuevo espacio para tus ideas', action: 'Descubrir monitores'},
];

export default function Storefront({user, page, setPage, onLogout, onRequestLogin, orders, authDialog}) {
  const [search, setSearch] = useState(''), [category, setCategory] = useState('');
  const [menuOpen, setMenuOpen] = useState(false), [count, setCount] = useState(0), [slide, setSlide] = useState(0);
  const hero = heroSlides[slide];
  function browse(nextCategory = '') {
    setCategory(nextCategory); setSearch(''); setPage('catalogo'); setMenuOpen(false);
    requestAnimationFrame(() => document.getElementById('productos')?.scrollIntoView({behavior: 'smooth', block: 'start'}));
  }
  function viewCart() {
    setPage('catalogo'); requestAnimationFrame(() => document.getElementById('carrito')?.scrollIntoView({behavior: 'smooth', block: 'center'}));
  }
  return <div className="storefront" data-role="CLIENTE">
    <div className="store-utility"><span>Tu próxima idea empieza aquí.</span><a href="#store-location"><MapPin size={13}/> Sucursal Antofagasta</a><span className="utility-demo">Tienda de demostración</span></div>
    <header className="store-header"><div className="store-header-inner">
      <button className="brand store-brand" onClick={() => {setPage('catalogo');setSearch('');setCategory('');window.scrollTo({top: 0, behavior: 'smooth'});}} aria-label="PC Factory, inicio"><span className="mark">P₂</span> Factory<span className="brand-dot">.</span></button>
      <div className="category-menu-wrap"><button className="store-nav categories-toggle" onClick={() => setMenuOpen(v => !v)} aria-expanded={menuOpen} aria-controls="category-menu">{menuOpen ? <X size={21}/> : <Menu size={21}/>}<span>Categorías</span></button>
        {menuOpen && <nav id="category-menu" className="category-menu" aria-label="Categorías">{['Todos los productos','Notebooks','Computadores','Componentes','Gaming','Periféricos','Monitores','Redes','Almacenamiento','Impresoras','Software'].map((name, i) => <button key={name} onClick={() => browse(i === 0 ? '' : name)}>{name}<ChevronRight size={15}/></button>)}</nav>}
      </div>
      <form className="store-search" role="search" onSubmit={e => {e.preventDefault();setPage('catalogo');requestAnimationFrame(() => document.getElementById('productos')?.scrollIntoView({behavior:'smooth'}));}}><input aria-label="Buscar en la tienda" placeholder="Busca aquí la tecnología para ti" value={search} onChange={e => {setSearch(e.target.value);setPage('catalogo');}}/><button aria-label="Buscar" type="submit"><Search size={21}/></button></form>
      <nav className="store-actions" aria-label="Mi cuenta">{user ? <><button className="store-nav account-button" onClick={() => setPage('pedidos')}><Users size={22}/><span>Hola, {user.nombre.split(' ')[0]}<small>Mis pedidos</small></span></button><button className="store-nav logout-button" onClick={onLogout} aria-label="Cerrar sesión"><LogOut size={19}/></button></> : <button className="store-nav account-button" onClick={onRequestLogin}><Users size={22}/><span>Hola, ingresa<small>Iniciar sesión / Registrarme</small></span></button>}
        <button className="header-cart" onClick={viewCart} aria-label={`Ver carrito, ${count} productos`}><ShoppingCart size={24}/><span>{count}</span></button>
      </nav>
    </div></header>
    <div className="store-notice"><PackageCheck size={18}/><strong>Compra online, recibe a tu manera.</strong><span>Retiro en sucursal o retiro a domicilio.</span><ArrowUpRight size={17}/></div>
    <main className="store-main">
      {page === 'catalogo' && !search && !category && <>
        <section className={`store-hero hero-slide-${slide}`} aria-label="Productos destacados"><div className="hero-copy"><span className="hero-eyebrow"><i/>{hero.tag}</span><h1>{hero.title}</h1><p>{hero.copy}</p><button className="hero-cta" onClick={() => browse(hero.category)}>{hero.action}<ArrowRight size={18}/></button><div className="hero-pagination" aria-label="Elegir destacado">{heroSlides.map((item, i) => <button key={item.sku} aria-label={`Ver destacado ${i + 1}: ${item.category}`} aria-pressed={i === slide} className={i === slide ? 'active' : ''} onClick={() => setSlide(i)}/>)}</div></div>
          <div className="hero-visual"><div className="hero-orbit"/><span className="hero-feature-tag"><ShieldCheck size={15}/> Tecnología para tu día a día</span><div className="hero-product" key={hero.sku}><ProductImage sku={hero.sku} name={hero.name} priority sizes="(max-width: 640px) 75vw, 480px"/></div><div className="hero-caption"><span>DESCUBRE LO QUE SIGUE</span><strong>{hero.label}</strong><ArrowUpRight size={25}/></div></div>
        </section>
        <section className="featured-categories" aria-label="Explora nuestras categorías">{featuredCategories.map(({name, icon: Icon, detail}) => <button onClick={() => browse(name)} key={name}><span className="category-icon"><Icon size={25}/></span><span><b>{name}</b><small>{detail}</small></span><ArrowUpRight size={19}/></button>)}</section>
      </>}
      <div hidden={page !== 'catalogo'}><Commerce online guest={!user} onRequestLogin={onRequestLogin} search={search} onSearch={setSearch} category={category} onCategory={setCategory} onCartCount={setCount}/></div>
      {page === 'pedidos' && orders}
      <section className="store-benefits"><div><PackageCheck/><span><b>Opciones de retiro</b><small>Elige cómo recibir tu pedido</small></span></div><div><ShieldCheck/><span><b>Compra a tu ritmo</b><small>Explora y arma tu carrito sin registrarte</small></span></div><div><ShoppingBag/><span><b>Todo en tu cuenta</b><small>Consulta el estado de tus pedidos</small></span></div></section>
    </main>
    <footer className="store-footer" id="store-location"><div><span className="footer-brand">P₂ Factory<span>.</span></span><p>Tecnología para tu próximo paso.</p></div><div><b>Encuéntranos en Antofagasta</b><p>Retiro en Antofagasta y retiros a domicilio.</p></div><small>Prototipo académico · Datos y precios ficticios · Imágenes referenciales</small></footer>
    {authDialog}
  </div>;
}
