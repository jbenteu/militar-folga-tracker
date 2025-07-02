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
      processes: {
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting enhanced process history synchronization...')

    // Get all militaries and processes
    const { data: militaries, error: militariesError } = await supabase
      .from('militaries')
      .select('*')

    if (militariesError) throw militariesError

    const { data: processes, error: processesError } = await supabase
      .from('processes')
      .select('*')

    if (processesError) throw processesError

    console.log(`Found ${militaries.length} militaries and ${processes.length} processes`)

    // Create a set of existing process types that actually have assigned militaries
    const existingProcessTypesWithAssignments = new Set<string>()
    
    processes.forEach((process: any) => {
      if (process.assigned_militaries && Array.isArray(process.assigned_militaries)) {
        if (process.assigned_militaries.length > 0) {
          existingProcessTypesWithAssignments.add(process.type)
        }
      }
    })

    console.log('Existing process types with assignments:', Array.from(existingProcessTypesWithAssignments))

    const updatedMilitaries = militaries.map((military: any) => {
      const newProcessHistory: Record<string, string | null> = {}
      let hasChanges = false
      let mostRecentProcessDate: string | null = null

      // First, check existing history for process types that no longer exist or have no assignments
      if (military.process_history && typeof military.process_history === 'object') {
        Object.keys(military.process_history).forEach((processType: string) => {
          const currentHistoryDate = military.process_history[processType]
          
          // Check if this process type still exists with actual assignments
          if (!existingProcessTypesWithAssignments.has(processType)) {
            console.log(`Removing obsolete process type "${processType}" from ${military.name}'s history (had date: ${currentHistoryDate})`)
            hasChanges = true
            // Don't add to newProcessHistory - effectively removing it
          } else {
            // Keep existing valid process types
            newProcessHistory[processType] = currentHistoryDate
          }
        })
      }

      // Then, update history based on current active processes
      processes.forEach((process: any) => {
        if (process.assigned_militaries && Array.isArray(process.assigned_militaries)) {
          const isAssigned = process.assigned_militaries.some((assigned: any) => 
            assigned && assigned.militaryId === military.id
          )
          
          if (isAssigned) {
            const currentHistoryDate = newProcessHistory[process.type]
            
            // Update if no date exists or if this process is more recent
            if (!currentHistoryDate || new Date(process.start_date) > new Date(currentHistoryDate)) {
              newProcessHistory[process.type] = process.start_date
              hasChanges = true
              console.log(`Updated ${military.name}'s history for ${process.type} to ${process.start_date}`)
            }

            // Update most recent process date
            if (!mostRecentProcessDate || new Date(process.start_date) > new Date(mostRecentProcessDate)) {
              mostRecentProcessDate = process.start_date
            }
          }
        }
      })

      // Check if most recent date changed
      const oldMostRecentDate = military.last_process_date
      if (oldMostRecentDate !== mostRecentProcessDate) {
        hasChanges = true
        console.log(`Updated ${military.name}'s most recent process date from ${oldMostRecentDate} to ${mostRecentProcessDate}`)
      }

      return {
        ...military,
        processHistory: newProcessHistory,
        lastProcessDate: mostRecentProcessDate,
        hasChanges
      }
    })

    // Update database for changed militaries
    const militariesToUpdate = updatedMilitaries.filter((military: any) => military.hasChanges)

    console.log(`Updating ${militariesToUpdate.length} militaries in database...`)

    if (militariesToUpdate.length > 0) {
      const updatePromises = militariesToUpdate.map(async (military: any) => {
        const { error } = await supabase
          .from('militaries')
          .update({
            last_process_date: military.lastProcessDate,
            process_history: military.processHistory
          })
          .eq('id', military.id)

        if (error) {
          console.error(`Error updating military ${military.name}:`, error)
          return null
        }
        
        console.log(`Successfully updated ${military.name}`)
        return military
      })

      await Promise.all(updatePromises)
    }

    console.log('Enhanced process history synchronization completed')

    return new Response(JSON.stringify({ 
      success: true, 
      updatedCount: militariesToUpdate.length,
      message: `Sincronização concluída. ${militariesToUpdate.length} militares tiveram seus históricos atualizados.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error synchronizing process history:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Erro durante a sincronização do histórico de processos'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
