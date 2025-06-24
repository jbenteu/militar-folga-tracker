
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

    console.log('Starting process history synchronization...')

    // Get all militaries and processes
    const { data: militaries, error: militariesError } = await supabase
      .from('militaries')
      .select('*')

    if (militariesError) throw militariesError

    const { data: processes, error: processesError } = await supabase
      .from('processes')
      .select('*')

    if (processesError) throw processesError

    const updatedMilitaries = militaries.map((military: any) => {
      const newProcessHistory: Record<string, string | null> = {}
      let hasChanges = false
      let mostRecentProcessDate: string | null = null

      // Get valid process types from existing processes
      const validProcessTypes = new Set(processes.map((process: any) => process.type))

      // Check if military has any process types in history that no longer exist
      Object.keys(military.process_history || {}).forEach((processType: string) => {
        const currentHistoryDate = military.process_history[processType]
        
        const hasValidProcessOfType = processes.some((process: any) => 
          process.type === processType && 
          process.assigned_militaries?.some((assigned: any) => assigned.militaryId === military.id)
        )

        if (!hasValidProcessOfType && currentHistoryDate) {
          console.log(`Removing invalid process type ${processType} from ${military.name}'s history`)
          hasChanges = true
        } else if (hasValidProcessOfType && currentHistoryDate) {
          newProcessHistory[processType] = currentHistoryDate
        }
      })

      // Update history based on existing processes
      processes.forEach((process: any) => {
        const isAssigned = process.assigned_militaries?.some((assigned: any) => assigned.militaryId === military.id)
        
        if (isAssigned) {
          const currentHistoryDate = newProcessHistory[process.type]
          
          if (!currentHistoryDate || new Date(process.start_date) > new Date(currentHistoryDate)) {
            newProcessHistory[process.type] = process.start_date
            hasChanges = true
          }

          if (!mostRecentProcessDate || new Date(process.start_date) > new Date(mostRecentProcessDate)) {
            mostRecentProcessDate = process.start_date
          }
        }
      })

      // Check if most recent date changed
      const oldMostRecentDate = military.last_process_date
      if (oldMostRecentDate !== mostRecentProcessDate) {
        hasChanges = true
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
        
        return military
      })

      await Promise.all(updatePromises)
    }

    console.log('Process history synchronization completed')

    return new Response(JSON.stringify({ 
      success: true, 
      updatedCount: militariesToUpdate.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error synchronizing process history:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
