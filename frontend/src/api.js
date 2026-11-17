export const money = n => '$ ' + Number(n || 0).toLocaleString('es-CL');
export const errMsg = e => e?.message || 'No fue posible completar la operación';

export async function api(path, opts = {}) {
  const token = localStorage.getItem('pcf_token');
  const response = await fetch('/api' + path, {
    ...opts,
    headers: {'Content-Type': 'application/json', ...(token ? {Authorization: 'Bearer ' + token} : {}), ...opts.headers},
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('No se pudo leer la respuesta del servidor'); }
  if (!response.ok) {
    const error = new Error(data.error || `Error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}
export const post = (path, data) => api(path, {method: 'POST', body: JSON.stringify(data)});
export const patch = (path, data) => api(path, {method: 'PATCH', body: JSON.stringify(data)});
