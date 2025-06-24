
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      militaries: {
        Row: any
        Insert: any
        Update: any
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const method = req.method
    const militaryId = url.searchParams.get('id')

    console.log(`Processing ${method} request for militaries`)

    switch (method) {
      case 'GET': {
        if (militaryId) {
          // Get single military
          const { data, error } = await supabase
            .from('militaries')
            .select('*')
            .eq('id', militaryId)
            .single()

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // Get all militaries
          const { data, error } = await supabase
            .from('militaries')
            .select('*')
            .order('created_at', { ascending: true })

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      case 'POST': {
        const body = await req.json()
        
        if (Array.isArray(body)) {
          // Batch insert for CSV import
          const { data, error } = await supabase
            .from('militaries')
            .insert(body)
            .select()

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // Single insert
          const { data, error } = await supabase
            .from('militaries')
            .insert(body)
            .select()
            .single()

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      case 'PUT': {
        if (!militaryId) {
          throw new Error('Military ID is required for update')
        }

        const body = await req.json()
        const { data, error } = await supabase
          .from('militaries')
          .update(body)
          .eq('id', militaryId)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'DELETE': {
        if (!militaryId) {
          throw new Error('Military ID is required for delete')
        }

        const { error } = await supabase
          .from('militaries')
          .delete()
          .eq('id', militaryId)

        if (error) throw error
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error(`Method ${method} not allowed`)
    }
  } catch (error) {
    console.error('Error in militaries function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
