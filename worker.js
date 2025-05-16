export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/pages/')) {
        return env.ASSETS.fetch(request)
      }
      return env.hello.fetch(request)
    } catch (error) {
      return new Response(String(error?.stack), { status: 500 })
    }
  }
}
