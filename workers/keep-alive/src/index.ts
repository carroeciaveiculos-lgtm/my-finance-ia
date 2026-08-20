/**
 * Cloudflare Worker — Keep-Alive Supabase
 *
 * Executa uma requisição periódica (Cron a cada 48h) diretamente na Edge Function do Supabase
 * para gerar atividade real no banco de dados e evitar a hibernação (pausa de 7 dias) do plano Free.
 */

export interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

export default {
  /**
   * Cron Trigger executado automaticamente a cada 48 horas
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(
      `[${timestamp}] [KEEP-ALIVE WORKER] Disparando Edge Function keep-alive do Supabase...`,
    )

    try {
      const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/keep-alive`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Cloudflare-Worker-KeepAlive/1.0',
        },
      })

      const data = await response.text()
      const endTimestamp = new Date().toISOString()

      if (response.ok) {
        console.log(
          `[${endTimestamp}] [KEEP-ALIVE SUCESSO] Status HTTP: ${response.status}. Resposta: ${data}`,
        )
      } else {
        console.error(
          `[${endTimestamp}] [KEEP-ALIVE ALERTA] Status HTTP: ${response.status}. Resposta: ${data}`,
        )
      }
    } catch (err: unknown) {
      const errTimestamp = new Date().toISOString()
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error(
        `[${errTimestamp}] [KEEP-ALIVE ERRO] Falha ao comunicar com a Edge Function: ${errorMessage}`,
      )
    }
  },

  /**
   * Handler HTTP para testes manuais e healthcheck do worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const timestamp = new Date().toISOString()

    if (request.method === 'GET' || request.method === 'POST') {
      try {
        const url = `${env.SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/keep-alive`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        const status = response.status
        const texto = await response.text()

        console.log(
          `[${timestamp}] [KEEP-ALIVE MANUAL TRIGGER] Edge Function Status: ${status}, Resposta: ${texto}`,
        )

        return new Response(
          JSON.stringify({
            status: response.ok ? 'ok' : 'error',
            worker: 'keep-alive-supabase',
            timestamp,
            edgeFunctionStatus: status,
            edgeFunctionResponse: JSON.parse(texto),
          }),
          {
            status: response.ok ? 200 : 502,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        return new Response(
          JSON.stringify({
            status: 'error',
            worker: 'keep-alive-supabase',
            timestamp,
            error: errorMessage,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
    }

    return new Response('Method Not Allowed', { status: 405 })
  },
}
