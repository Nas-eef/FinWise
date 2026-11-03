import { supabase, handleSupabaseError } from '../lib/supabase'

export const VaultService = {
  /**
   * Get all user documents
   */
  async getDocuments() {
    try {
      const { data, error } = await supabase
        .from('document_vault')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((doc) => ({
        id: doc.id,
        title: doc.title,
        category: doc.category || 'General',
        labels: Array.isArray(doc.labels) ? doc.labels : [],
        fileUrl: doc.file_url,
        fileName: doc.file_name,
        fileType: doc.file_type,
        fileSize: Number(doc.file_size) || 0,
        notes: doc.notes || '',
        expiryDate: doc.expiry_date,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
      }))
    } catch (err) {
      console.warn('VaultService.getDocuments warn/error:', err)
      return []
    }
  },

  /**
   * Helper to convert a File or Blob into base64 Data URL (fail-safe storage)
   */
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  },

  /**
   * Upload file to Supabase Storage (with fail-safe fallback to Data URL)
   */
  async uploadFile(file) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `${user?.id || 'guest'}/${Date.now()}_${sanitizedName}`

      // Attempt Supabase storage upload
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('vault-documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (!uploadErr && uploadData?.path) {
        const { data: { publicUrl } } = supabase.storage
          .from('vault-documents')
          .getPublicUrl(uploadData.path)
        if (publicUrl) {
          return {
            fileUrl: publicUrl,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
          }
        }
      }
    } catch (err) {
      console.warn('Supabase storage bucket upload failed, using local Data URL fallback:', err)
    }

    // Fallback: Read file as Data URL directly
    const dataUrl = await this.fileToDataUrl(file)
    return {
      fileUrl: dataUrl,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }
  },

  /**
   * Create document record in database
   */
  async createDocument(doc) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        user_id: user.id,
        title: doc.title?.trim() || doc.fileName || 'Untitled Document',
        category: doc.category || 'General',
        labels: Array.isArray(doc.labels) ? doc.labels : [],
        file_url: doc.fileUrl,
        file_name: doc.fileName || 'document',
        file_type: doc.fileType || 'application/octet-stream',
        file_size: Number(doc.fileSize) || 0,
        notes: doc.notes || '',
        expiry_date: doc.expiryDate || null,
      }

      const { data, error } = await supabase
        .from('document_vault')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        category: data.category,
        labels: Array.isArray(data.labels) ? data.labels : [],
        fileUrl: data.file_url,
        fileName: data.file_name,
        fileType: data.file_type,
        fileSize: Number(data.file_size) || 0,
        notes: data.notes,
        expiryDate: data.expiry_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    } catch (err) {
      console.warn('VaultService.createDocument error, falling back locally:', err)
      return null
    }
  },

  /**
   * Update document metadata
   */
  async updateDocument(id, updates) {
    try {
      const payload = {}
      if (updates.title !== undefined) payload.title = updates.title.trim()
      if (updates.category !== undefined) payload.category = updates.category
      if (updates.labels !== undefined) payload.labels = updates.labels
      if (updates.notes !== undefined) payload.notes = updates.notes
      if (updates.expiryDate !== undefined) payload.expiry_date = updates.expiryDate || null
      payload.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('document_vault')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.warn('VaultService.updateDocument error:', err)
      return null
    }
  },

  /**
   * Delete document
   */
  async deleteDocument(id) {
    try {
      const { error } = await supabase
        .from('document_vault')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.warn('VaultService.deleteDocument error:', err)
      return false
    }
  },
}

