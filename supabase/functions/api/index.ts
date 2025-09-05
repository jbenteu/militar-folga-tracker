import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathname = url.pathname.replace('/api', '')
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Handle different API endpoints
    switch (pathname) {
      case '/militaries':
        return await handleMilitaries(req, supabase)
      case '/processes':
        return await handleProcesses(req, supabase)
      case '/sync-history':
        return await handleSyncHistory(supabase)
      default:
        return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handleMilitaries(req: Request, supabase: any) {
  const method = req.method
  
  switch (method) {
    case 'GET':
      const { data: militaries, error: getMilitariesError } = await supabase
        .from('militaries')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (getMilitariesError) throw getMilitariesError
      
      return new Response(JSON.stringify(militaries), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'POST':
      const militaryData = await req.json()
      
      if (Array.isArray(militaryData)) {
        // Bulk insert for CSV import
        const { data, error } = await supabase
          .from('militaries')
          .insert(militaryData)
          .select()
        
        if (error) throw error
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } else {
        // Single insert
        const { data, error } = await supabase
          .from('militaries')
          .insert(militaryData)
          .select()
          .single()
        
        if (error) throw error
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
    case 'PUT':
      const updateData = await req.json()
      const { id, ...militaryUpdateData } = updateData
      
      const { data, error } = await supabase
        .from('militaries')
        .update(militaryUpdateData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'DELETE':
      const deleteData = await req.json()
      
      const { data: deletedData, error: deleteError } = await supabase
        .from('militaries')
        .delete()
        .eq('id', deleteData.id)
        .select()
      
      if (deleteError) throw deleteError
      
      return new Response(JSON.stringify(deletedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }
}

async function handleProcesses(req: Request, supabase: any) {
  const method = req.method
  
  switch (method) {
    case 'GET':
      const { data: processes, error: getProcessesError } = await supabase
        .from('processes')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (getProcessesError) throw getProcessesError
      
      return new Response(JSON.stringify(processes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'POST':
      const processData = await req.json()
      
      const { data, error } = await supabase
        .from('processes')
        .insert(processData)
        .select()
        .single()
      
      if (error) throw error
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'PUT':
      const updateData = await req.json()
      const { id, ...processUpdateData } = updateData
      
      const { data, error } = await supabase
        .from('processes')
        .update(processUpdateData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    case 'DELETE':
      const deleteData = await req.json()
      
      const { data: deletedData, error: deleteError } = await supabase
        .from('processes')
        .delete()
        .eq('id', deleteData.id)
        .select()
      
      if (deleteError) throw deleteError
      
      return new Response(JSON.stringify(deletedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
      
    default:
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
  }
}

async function handleSyncHistory(supabase: any) {
  // Get all processes to update military process history
  const { data: processes, error: processesError } = await supabase
    .from('processes')
    .select('*')
  
  if (processesError) throw processesError
  
  // Get all militaries
  const { data: militaries, error: militariesError } = await supabase
    .from('militaries')
    .select('*')
  
  if (militariesError) throw militariesError
  
  let updatedCount = 0
  
  // Update each military's process history
  for (const military of militaries) {
    const processHistory: Record<string, string | null> = military.process_history || {}
    let hasChanges = false
    
    // Add processes this military participated in
    for (const process of processes) {
      if (process.assigned_militaries && Array.isArray(process.assigned_militaries)) {
        const isAssigned = process.assigned_militaries.some((am: any) => am.militaryId === military.id)
        
        if (isAssigned && !processHistory[process.id]) {
          processHistory[process.id] = process.start_date
          hasChanges = true
        }
      }
    }
    
    if (hasChanges) {
      const { error: updateError } = await supabase
        .from('militaries')
        .update({ process_history: processHistory })
        .eq('id', military.id)
      
      if (updateError) throw updateError
      updatedCount++
    }
  }
  
  return new Response(JSON.stringify({ updatedCount }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}