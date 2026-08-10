export default {
  '/': { page: 'index' },
  '/plano': { page: 'plano' },
  '/admin': { page: 'admin', middleware: ['auth'] }
}
