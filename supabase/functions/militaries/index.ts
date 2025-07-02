
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

        console.log(`Attempting to delete military with ID: ${militaryId}`)

        // First check if military is assigned to any active processes
        const { data: processes, error: processError } = await supabase
          .from('processes')
          .select('assigned_militaries')

        if (processError) {
          console.error('Error checking processes:', processError)
          throw new Error('Erro ao verificar processos ativos')
        }

        // Check if military is assigned to any process
        const isAssigned = processes?.some((process: any) => {
          if (process.assigned_militaries && Array.isArray(process.assigned_militaries)) {
            return process.assigned_militaries.some((assigned: any) => 
              assigned && assigned.militaryId === militaryId
            )
          }
          return false
        })

        if (isAssigned) {
          return new Response(JSON.stringify({ 
            error: 'Não é possível excluir este militar pois ele está designado em processos ativos.' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Proceed with deletion
        const { error: deleteError } = await supabase
          .from('militaries')
          .delete()
          .eq('id', militaryId)

        if (deleteError) {
          console.error('Error deleting military:', deleteError)
          throw new Error(`Erro ao excluir militar: ${deleteError.message}`)
        }

        console.log(`Successfully deleted military with ID: ${militaryId}`)
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
      status: error.message.includes('não é possível excluir') ? 400 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
