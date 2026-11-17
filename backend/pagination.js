export function pagination(query = {}) {
  const integer = (value, fallback) => value === undefined ? fallback :
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  const page = integer(query.page, 1);
  const pageSize = integer(query.pageSize, 10);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    const error = new Error('Paginación inválida: página positiva y tamaño entre 1 y 50');
    error.status = 400;
    throw error;
  }
  return {page, pageSize, offset: (page - 1) * pageSize};
}

export async function readPage(query, execute, {sql, countSql, params = [], order}) {
  const {page, pageSize, offset} = pagination(query);
  const [data, count] = await Promise.all([
    execute(`${sql} ORDER BY ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageSize, offset]),
    execute(countSql, params),
  ]);
  const {total: rawTotal, ...summary} = count.rows[0];
  const total = Number(rawTotal);
  return {items: data.rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), summary};
}
