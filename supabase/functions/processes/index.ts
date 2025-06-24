
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
    const method = req.method
    const processId = url.searchParams.get('id')

    console.log(`Processing ${method} request for processes`)

    switch (method) {
      case 'GET': {
        if (processId) {
          // Get single process
          const { data, error } = await supabase
            .from('processes')
            .select('*')
            .eq('id', processId)
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
        
        // Create process
        const { data: processData, error: processError } = await supabase
          .from('processes')
          .insert(body)
          .select()
          .single()

        if (processError) throw processError

        // Update military history for assigned militaries
        if (body.assigned_militaries && Array.isArray(body.assigned_militaries)) {
          const militaryUpdates = body.assigned_militaries.map(async (assigned: any) => {
            const { data: military, error: getMilitaryError } = await supabase
              .from('militaries')
              .select('*')
              .eq('id', assigned.militaryId)
              .single()

            if (getMilitaryError || !military) return null

            const updatedProcessHistory = { ...military.process_history }
            updatedProcessHistory[body.type] = body.start_date

            const processHistoryForStorage: Record<string, string | null> = {}
            Object.entries(updatedProcessHistory).forEach(([key, value]) => {
              processHistoryForStorage[key] = value ? new Date(value as string).toISOString() : null
            })

            const { error: updateError } = await supabase
              .from('militaries')
              .update({
                last_process_date: body.start_date,
                process_history: processHistoryForStorage
              })
              .eq('id', assigned.militaryId)

            if (updateError) {
              console.error(`Error updating military ${assigned.militaryId}:`, updateError)
            }

            return assigned.militaryId
          })

          await Promise.all(militaryUpdates)
        }

        return new Response(JSON.stringify(processData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'PUT': {
        if (!processId) {
          throw new Error('Process ID is required for update')
        }

        const body = await req.json()
        const { data, error } = await supabase
          .from('processes')
          .update(body)
          .eq('id', processId)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'DELETE': {
        if (!processId) {
          throw new Error('Process ID is required for delete')
        }

        // Get process before deletion
        const { data: processToDelete, error: getError } = await supabase
          .from('processes')
          .select('*')
          .eq('id', processId)
          .single()

        if (getError) throw getError

        // Delete the process
        const { error: deleteError } = await supabase
          .from('processes')
          .delete()
          .eq('id', processId)

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
        throw new Error(`Method ${method} not allowed`)
    }
  } catch (error) {
    console.error('Error in processes function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
