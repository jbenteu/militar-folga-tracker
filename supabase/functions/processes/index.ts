import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      processes: {
        Row: any
        Insert: any
        Update: any
      }
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
    const id = url.searchParams.get('id')

    console.log(`Processing ${req.method} request for processes`)

    switch (req.method) {
      case 'GET': {
        if (id) {
          // Get single process
          const { data, error } = await supabase
            .from('processes')
            .select('*')
            .eq('id', id)
            .single()

          if (error) throw error
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // Get all processes
          const { data, error } = await supabase
            .from('processes')
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
        console.log('Creating process with data:', body)
        
        // Enhanced validation
        if (!body.type || !body.number || !body.start_date) {
          console.error('Missing required fields:', { type: body.type, number: body.number, start_date: body.start_date })
          return new Response(JSON.stringify({ 
            error: 'Missing required fields: type, number, and start_date are required' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Validate assigned_militaries format
        if (body.assigned_militaries && !Array.isArray(body.assigned_militaries)) {
          console.error('Invalid assigned_militaries format:', body.assigned_militaries)
          return new Response(JSON.stringify({ 
            error: 'assigned_militaries must be an array' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Validate each assigned military
        if (body.assigned_militaries) {
          for (const assigned of body.assigned_militaries) {
            if (!assigned.militaryId || !assigned.function) {
              console.error('Invalid assigned military:', assigned)
              return new Response(JSON.stringify({ 
                error: 'Each assigned military must have militaryId and function' 
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }
          }
        }

        try {
          const { data, error } = await supabase
            .from('processes')
            .insert({
              type: body.type,
              description: body.description || null,
              number: body.number.trim(),
              start_date: body.start_date,
              end_date: body.end_date || null,
              assigned_militaries: body.assigned_militaries || [],
              status: 'active'
            })
            .select()
            .single()

          if (error) {
            console.error('Database error creating process:', error)
            
            // Handle specific database errors
            let errorMessage = 'Failed to create process'
            if (error.message.includes('duplicate key')) {
              errorMessage = 'A process with this number already exists'
            } else if (error.message.includes('violates check constraint')) {
              errorMessage = 'Invalid data provided'
            }
            
            return new Response(JSON.stringify({ 
              error: errorMessage,
              details: error.message 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          console.log('Process created successfully:', data)
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } catch (dbError: any) {
          console.error('Unexpected database error:', dbError)
          return new Response(JSON.stringify({ 
            error: 'Database operation failed',
            details: dbError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      case 'PUT': {
        if (!id) {
          throw new Error('Process ID is required for update')
        }

        const body = await req.json()
        const { data, error } = await supabase
          .from('processes')
          .update(body)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'DELETE': {
        if (!id) {
          throw new Error('Process ID is required for delete')
        }

        // Get process before deletion
        const { data: processToDelete, error: getError } = await supabase
          .from('processes')
          .select('*')
          .eq('id', id)
          .single()

        if (getError) throw getError

        // Delete the process
        const { error: deleteError } = await supabase
          .from('processes')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError

        // Get remaining processes
        const { data: remainingProcesses, error: remainingError } = await supabase
          .from('processes')
          .select('*')

        if (remainingError) throw remainingError

        // Restore military process history
        if (processToDelete.assigned_militaries && Array.isArray(processToDelete.assigned_militaries)) {
          const militaryUpdates = processToDelete.assigned_militaries.map(async (assigned: any) => {
            const { data: military, error: getMilitaryError } = await supabase
              .from('militaries')
              .select('*')
              .eq('id', assigned.militaryId)
              .single()

            if (getMilitaryError || !military) return null

            // Recalculate process history based on remaining processes
            const newProcessHistory: Record<string, string | null> = {}
            let mostRecentDate: string | null = null

            remainingProcesses.forEach((process: any) => {
              const isAssignedToProcess = process.assigned_militaries?.some((am: any) => am.militaryId === assigned.militaryId)
              if (isAssignedToProcess) {
                const currentDate = newProcessHistory[process.type]
                if (!currentDate || new Date(process.start_date) > new Date(currentDate)) {
                  newProcessHistory[process.type] = process.start_date
                }

                if (!mostRecentDate || new Date(process.start_date) > new Date(mostRecentDate)) {
                  mostRecentDate = process.start_date
                }
              }
            })

            const { error: updateError } = await supabase
              .from('militaries')
              .update({
                last_process_date: mostRecentDate,
                process_history: newProcessHistory
              })
              .eq('id', assigned.militaryId)

            if (updateError) {
              console.error(`Error updating military ${assigned.militaryId}:`, updateError)
            }

            return assigned.militaryId
          })

          await Promise.all(militaryUpdates)
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error(`Method ${req.method} not allowed`)
    }
  } catch (error: any) {
    console.error('Process function error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
