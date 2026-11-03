import React, { useState, useRef } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { VaultService } from '../../services/vault.service'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import {
  FileText, Shield, Award, FileCheck, Tag, Upload, Search,
  Download, Eye, Trash2, Edit3, Plus, X, Calendar, AlertCircle,
  ExternalLink, File, Check, ZoomIn
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'Certificates',
  'ID Documents',
  'Warranty Cards',
  'Important PDFs',
  'Bills & Receipts',
  'Other',
]

const CATEGORY_COLORS = {
  'Certificates': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'ID Documents': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Warranty Cards': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Important PDFs': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Bills & Receipts': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Other': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

export const DocumentVault = () => {
  const documents = useFinanceStore((state) => state.documents) || []
  const addDocument = useFinanceStore((state) => state.addDocument)
  const updateDocument = useFinanceStore((state) => state.updateDocument)
  const deleteDocument = useFinanceStore((state) => state.deleteDocument)

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  // Upload/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Certificates',
    labelsInput: '',
    labels: [],
    expiryDate: '',
    notes: '',
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  // Viewer Modal
  const [previewDoc, setPreviewDoc] = useState(null)

  // Delete Confirm
  const [docToDelete, setDocToDelete] = useState(null)

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.labels || []).some((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesTag = !selectedTag || (doc.labels || []).includes(selectedTag)
    return matchesCategory && matchesSearch && matchesTag
  })

  // Extract all unique labels across docs
  const allLabels = Array.from(
    new Set(documents.flatMap((d) => d.labels || []).filter(Boolean))
  )

  const handleOpenAdd = () => {
    setEditingDoc(null)
    setSelectedFile(null)
    setFormData({
      title: '',
      category: 'Certificates',
      labelsInput: '',
      labels: [],
      expiryDate: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc)
    setSelectedFile(null)
    setFormData({
      title: doc.title,
      category: doc.category || 'General',
      labelsInput: (doc.labels || []).join(', '),
      labels: doc.labels || [],
      expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
      notes: doc.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.title) {
        // Auto populate title from file name without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFormData((prev) => ({ ...prev, title: nameWithoutExt }))
      }
    }
  }

  const handleAddLabelChip = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = formData.labelsInput.trim().replace(/^#/, '').replace(/,/g, '')
      if (val && !formData.labels.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          labels: [...prev.labels, val],
          labelsInput: '',
        }))
      }
    }
  }

  const handleRemoveLabelChip = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.filter((t) => t !== tagToRemove),
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    // Include any trailing input in labels
    let finalLabels = [...formData.labels]
    if (formData.labelsInput.trim()) {
      const extra = formData.labelsInput
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''))
        .filter((s) => s && !finalLabels.includes(s))
      finalLabels = [...finalLabels, ...extra]
    }

    setIsUploading(true)
    try {
      if (editingDoc) {
        // Updating existing document metadata
        await updateDocument(editingDoc.id, {
          title: formData.title.trim(),
          category: formData.category,
          labels: finalLabels,
          expiryDate: formData.expiryDate || null,
          notes: formData.notes.trim(),
        })
      } else {
        // Creating new document
        if (!selectedFile) {
          alert('Please select a file to upload.')
          setIsUploading(false)
          return
        }

        const uploaded = await VaultService.uploadFile(selectedFile)

        await addDocument({
          title: formData.title.trim(),
          category: formData.category,
          labels: finalLabels,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          fileSize: uploaded.fileSize,
          expiryDate: formData.expiryDate || null,
          notes: formData.notes.trim(),
        })
      }

      setIsModalOpen(false)
    } catch (err) {
      console.error('Error saving document:', err)
      alert('Failed to save document. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = (doc) => {
    if (!doc.fileUrl) return
    const a = document.createElement('a')
    a.href = doc.fileUrl
    a.download = doc.fileName || `${doc.title}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Certificates':
        return Award
      case 'ID Documents':
        return Shield
      case 'Warranty Cards':
        return FileCheck
      case 'Important PDFs':
        return FileText
      default:
        return File
    }
  }

  const isImageFile = (type = '', name = '') => {
    return type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-white border border-brand-border/80 rounded-card p-4 shadow-subtle flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-forest flex items-center gap-2">
            <Shield className="w-5 h-5 text-sage" /> Document Vault
          </h2>
          <p className="text-xs text-mutedgreen mt-0.5">
            Securely store certificates, ID cards, warranty & PDFs
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-forest text-mint hover:bg-forest/90 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-mutedgreen" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, tag or filename..."
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest placeholder:text-mutedgreen/70 focus:outline-none focus:ring-2 focus:ring-sage/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-mutedgreen hover:text-forest"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const count =
              cat === 'All'
                ? documents.length
                : documents.filter((d) => d.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-forest text-mint shadow-sm'
                    : 'bg-white border border-brand-border text-mutedgreen hover:text-forest'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat ? 'bg-mint/20 text-mint' : 'bg-brand-bg text-forest'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tags Row */}
        {allLabels.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <span className="text-[10px] font-bold text-mutedgreen uppercase shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Tags:
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag('')}
                className="px-2 py-0.5 bg-forest text-mint text-[11px] font-bold rounded-lg flex items-center gap-1 shrink-0"
              >
                #{selectedTag} <X className="w-3 h-3" />
              </button>
            )}
            {allLabels
              .filter((t) => t !== selectedTag)
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className="px-2 py-0.5 bg-white border border-brand-border text-forest text-[11px] font-medium rounded-lg hover:border-forest shrink-0"
                >
                  #{tag}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-2xl p-8 text-center space-y-3 shadow-subtle">
          <div className="w-14 h-14 mx-auto rounded-full bg-mint/40 text-forest flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-black text-forest">No documents found</h3>
            <p className="text-xs text-mutedgreen mt-1">
              {searchQuery || selectedCategory !== 'All' || selectedTag
                ? 'Try adjusting your filters or search terms'
                : 'Upload your ID proofs, certificates, and warranty cards for easy access anytime'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest text-mint rounded-xl text-xs font-bold shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const Icon = getCategoryIcon(doc.category)
            const catColors = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS['Other']
            const isImage = isImageFile(doc.fileType, doc.fileName)

            return (
              <div
                key={doc.id}
                className="bg-white border border-brand-border/80 rounded-2xl p-4 shadow-subtle hover:border-sage transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-forest/5 text-forest flex items-center justify-center shrink-0 border border-brand-border">
                      <Icon className="w-5 h-5 text-forest" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-forest truncate">{doc.title}</h4>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                          {doc.category}
                        </span>
                        <span className="text-[10px] text-mutedgreen">
                          {formatFileSize(doc.fileSize)}
                        </span>
                        {doc.fileName && (
                          <span className="text-[10px] text-mutedgreen/80 truncate max-w-[120px]">
                            • {doc.fileName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Menu */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      className="p-1.5 text-mutedgreen hover:text-forest rounded-lg hover:bg-brand-bg transition-colors"
                      title="Edit details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDocToDelete(doc)}
                      className="p-1.5 text-mutedgreen hover:text-brand-error rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags / Labels */}
                {doc.labels && doc.labels.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {doc.labels.map((lbl) => (
                      <span
                        key={lbl}
                        onClick={() => setSelectedTag(lbl)}
                        className="text-[10px] font-bold px-2 py-0.5 bg-mint/30 text-forest rounded-md cursor-pointer hover:bg-mint/50 transition-colors"
                      >
                        #{lbl}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expiry / Notes info */}
                {(doc.expiryDate || doc.notes) && (
                  <div className="bg-[#FAFBF9] border border-brand-border/60 rounded-xl p-2.5 space-y-1 text-xs">
                    {doc.expiryDate && (
                      <div className="flex items-center gap-1.5 text-amber-800 font-medium text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Expires / Valid until: <strong>{new Date(doc.expiryDate).toLocaleDateString()}</strong></span>
                      </div>
                    )}
                    {doc.notes && (
                      <p className="text-mutedgreen text-[11px] line-clamp-2 leading-relaxed">
                        {doc.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Primary Action Buttons: View & Download */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-brand-border/40">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="w-full py-2 px-3 bg-mint/50 hover:bg-mint text-forest font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="w-full py-2 px-3 bg-forest text-mint hover:bg-forest/90 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <h3 className="text-base font-black text-forest flex items-center gap-2">
                <Shield className="w-5 h-5 text-sage" />
                {editingDoc ? 'Edit Document Details' : 'Upload to Vault'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-mutedgreen hover:text-forest"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* File input (required for new document) */}
              {!editingDoc && (
                <div>
                  <label className="block text-xs font-bold text-forest mb-1.5">
                    Select File (PDF, Image, Doc) *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,image/*,.doc,.docx,.txt"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                      selectedFile
                        ? 'border-forest bg-mint/10'
                        : 'border-brand-border hover:border-forest bg-[#FAFBF9]'
                    }`}
                  >
                    <Upload className="w-7 h-7 text-forest mb-1.5" />
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-xs font-black text-forest truncate max-w-[240px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-mutedgreen">
                          {formatFileSize(selectedFile.size)} • Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs font-bold text-forest">Click to browse file</p>
                        <p className="text-[10px] text-mutedgreen mt-0.5">
                          PDFs, JPGs, PNGs, Warranty cards, ID proofs
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Passport, Degree Certificate, MacBook Invoice"
                  className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Labels / Tags Input */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Labels & Tags (Press Enter or comma to add)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-brand-border rounded-xl min-h-[42px] focus-within:ring-2 focus-within:ring-forest">
                  {formData.labels.map((chip) => (
                    <span
                      key={chip}
                      className="px-2 py-0.5 bg-mint/40 text-forest text-[11px] font-bold rounded-md flex items-center gap-1"
                    >
                      #{chip}
                      <button
                        type="button"
                        onClick={() => handleRemoveLabelChip(chip)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={formData.labelsInput}
                    onChange={(e) => setFormData({ ...formData, labelsInput: e.target.value })}
                    onKeyDown={handleAddLabelChip}
                    placeholder={formData.labels.length === 0 ? "e.g. tax, identity, work" : "Add more..."}
                    className="flex-1 min-w-[100px] text-xs bg-transparent focus:outline-none text-forest placeholder:text-mutedgreen/60"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Expiry / Renewal Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Notes / Reference Numbers
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Document number, renewal portal, purchase store..."
                  className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-brand-bg text-forest font-bold text-xs rounded-xl hover:bg-brand-border/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2.5 bg-forest text-mint font-black text-xs rounded-xl shadow-md hover:bg-forest/90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isUploading ? (
                    <span>Uploading...</span>
                  ) : (
                    <span>{editingDoc ? 'Update Document' : 'Save to Vault'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document View / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-4 py-3 bg-forest text-white flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-sm font-black truncate">{previewDoc.title}</h3>
                <p className="text-[10px] text-mint/80 truncate">
                  {previewDoc.fileName} • {formatFileSize(previewDoc.fileSize)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="p-1.5 bg-mint text-forest rounded-lg hover:bg-white transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 bg-forest-light text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-2 min-h-[300px]">
              {isImageFile(previewDoc.fileType, previewDoc.fileName) ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : previewDoc.fileUrl?.startsWith('data:application/pdf') || previewDoc.fileUrl?.endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[65vh] border-0 rounded-lg bg-white"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <FileText className="w-16 h-16 text-mutedgreen mx-auto" />
                  <p className="text-xs font-bold text-forest">{previewDoc.fileName}</p>
                  <p className="text-[11px] text-mutedgreen">
                    Preview not directly supported in mobile frame for this file type.
                  </p>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="px-4 py-2 bg-forest text-mint font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </button>
                </div>
              )}
            </div>

            {/* Footer with Labels & Info */}
            <div className="p-3 bg-white border-t border-brand-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(previewDoc.labels || []).map((l) => (
                  <span key={l} className="text-[10px] font-bold px-2 py-0.5 bg-mint/30 text-forest rounded">
                    #{l}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleDownload(previewDoc)}
                className="px-3 py-1.5 bg-forest text-mint rounded-xl font-black text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {docToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Document"
          message={`Are you sure you want to permanently remove "${docToDelete.title}" from your vault?`}
          confirmLabel="Delete Document"
          variant="danger"
          onConfirm={() => {
            deleteDocument(docToDelete.id)
            setDocToDelete(null)
          }}
          onCancel={() => setDocToDelete(null)}
        />
      )}
    </div>
  )
}

