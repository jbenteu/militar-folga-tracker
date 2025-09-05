// Server-side API client for database operations
const API_BASE_URL = 'https://tghmaigxcrnhyjzvjpvc.supabase.co/functions/v1/api'

class ApiClient {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnaG1haWd4Y3JuaHlqenZqcHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjM5MTAsImV4cCI6MjA2NDA5OTkxMH0.aE3SFUMpAeySqbSayZ4n7XjyoV3XSvr1GoKbP2G-voU`,
          ...options.headers
        }
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Military operations
  async getMilitaries() {
    return this.makeRequest('/militaries')
  }

  async addMilitary(military: any) {
    return this.makeRequest('/militaries', {
      method: 'POST',
      body: JSON.stringify(military)
    })
  }

  async addMilitariesFromCSV(militaries: any[]) {
    return this.makeRequest('/militaries', {
      method: 'POST',
      body: JSON.stringify(militaries)
    })
  }

  async updateMilitary(military: any) {
    return this.makeRequest('/militaries', {
      method: 'PUT',
      body: JSON.stringify(military)
    })
  }

  async deleteMilitary(id: string) {
    return this.makeRequest('/militaries', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    })
  }

  // Process operations
  async getProcesses() {
    return this.makeRequest('/processes')
  }

  async addProcess(process: any) {
    return this.makeRequest('/processes', {
      method: 'POST',
      body: JSON.stringify(process)
    })
  }

  async updateProcess(process: any) {
    return this.makeRequest('/processes', {
      method: 'PUT',
      body: JSON.stringify(process)
    })
  }

  async deleteProcess(id: string) {
    return this.makeRequest('/processes', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    })
  }

  // Sync operations
  async synchronizeProcessHistory() {
    return this.makeRequest('/sync-history')
  }
}

export const apiClient = new ApiClient()