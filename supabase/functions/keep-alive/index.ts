import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [KEEP-ALIVE EDGE FUNCTION] Executando heartbeat no banco de dados...`)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Consulta real ao banco de dados: contagem da tabela profiles
    const { count, error, data } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: false })
      .limit(5)

    if (error) {
      console.error(`[${timestamp}] [KEEP-ALIVE ERRO]:`, error.message)
      return new Response(
        JSON.stringify({
          ok: false,
          error: error.message,
          timestamp,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const result = {
      message: 'Keep-alive executado com sucesso',
      totalProfiles: count ?? (data ? data.length : 0),
      queriedRows: data ? data.length : 0,
      dbStatus: 'healthy',
    }

    console.log(
      `[${timestamp}] [KEEP-ALIVE SUCESSO] Heartbeat concluído. Total profiles: ${result.totalProfiles}, Linhas obtidas: ${result.queriedRows}`,
    )

    return new Response(
      JSON.stringify({
        ok: true,
        timestamp,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[${timestamp}] [KEEP-ALIVE EXCEPTION]:`, errorMsg)
    return new Response(
      JSON.stringify({
        ok: false,
        error: errorMsg,
        timestamp,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
