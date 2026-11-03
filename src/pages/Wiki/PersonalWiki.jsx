import React, { useState } from 'react'
import { useFinanceStore } from '../../store/useFinanceStore'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { downloadFile } from '../../utils/fileDownloader'
import {
  BookOpen, Pin, PinOff, Search, Plus, Edit3, Trash2, X,
  Copy, Check, Download, Tag, FileText, Sparkles, ChevronRight,
  Code, Bold, List, Quote, Share2
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'Coding & Tech',
  'Business Concepts',
  'Work Docs',
  'Finance & Tax',
  'Cheat Sheets',
  'Personal',
]

const CATEGORY_COLORS = {
  'Coding & Tech': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Business Concepts': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Work Docs': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Finance & Tax': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Cheat Sheets': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Personal': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

export const PersonalWiki = () => {
  const wikiArticles = useFinanceStore((state) => state.wikiArticles) || []
  const addWikiArticle = useFinanceStore((state) => state.addWikiArticle)
  const updateWikiArticle = useFinanceStore((state) => state.updateWikiArticle)
  const deleteWikiArticle = useFinanceStore((state) => state.deleteWikiArticle)
  const toggleWikiPin = useFinanceStore((state) => state.toggleWikiPin)

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  // View / Read modal
  const [viewingArticle, setViewingArticle] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [articleToDelete, setArticleToDelete] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Coding & Tech',
    tagsInput: '',
    tags: [],
    content: '',
    isPinned: false,
  })

  // Filtered & Sorted Articles (Pinned first, then latest)
  const filteredArticles = wikiArticles
    .filter((a) => {
      const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory
      const matchesSearch =
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesTag = !selectedTag || (a.tags || []).includes(selectedTag)
      return matchesCategory && matchesSearch && matchesTag
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))

  // Unique tags
  const allTags = Array.from(
    new Set(wikiArticles.flatMap((a) => a.tags || []).filter(Boolean))
  )

  const handleOpenAdd = () => {
    setEditingArticle(null)
    setFormData({
      title: '',
      category: 'Coding & Tech',
      tagsInput: '',
      tags: [],
      content: '',
      isPinned: false,
    })
    setIsEditorOpen(true)
  }

  const handleOpenEdit = (article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      category: article.category || 'General',
      tagsInput: (article.tags || []).join(', '),
      tags: article.tags || [],
      content: article.content || '',
      isPinned: Boolean(article.isPinned),
    })
    setIsEditorOpen(true)
  }

  const handleAddTagChip = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = formData.tagsInput.trim().replace(/^#/, '').replace(/,/g, '')
      if (val && !formData.tags.includes(val)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, val],
          tagsInput: '',
        }))
      }
    }
  }

  const handleRemoveTagChip = (t) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== t),
    }))
  }

  const insertMarkdownSnippet = (prefix, suffix = '') => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + `\n${prefix} ${suffix}`,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    let finalTags = [...formData.tags]
    if (formData.tagsInput.trim()) {
      const extra = formData.tagsInput
        .split(',')
        .map((s) => s.trim().replace(/^#/, ''))
        .filter((s) => s && !finalTags.includes(s))
      finalTags = [...finalTags, ...extra]
    }

    if (editingArticle) {
      await updateWikiArticle(editingArticle.id, {
        title: formData.title.trim(),
        category: formData.category,
        tags: finalTags,
        content: formData.content,
        isPinned: formData.isPinned,
      })
      if (viewingArticle?.id === editingArticle.id) {
        setViewingArticle({
          ...viewingArticle,
          title: formData.title.trim(),
          category: formData.category,
          tags: finalTags,
          content: formData.content,
          isPinned: formData.isPinned,
        })
      }
    } else {
      await addWikiArticle({
        title: formData.title.trim(),
        category: formData.category,
        tags: finalTags,
        content: formData.content,
        isPinned: formData.isPinned,
      })
    }

    setIsEditorOpen(false)
  }

  const handleCopyContent = (article) => {
    navigator.clipboard.writeText(`${article.title}\n\n${article.content}`)
    setCopiedId(article.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExportMarkdown = async (article) => {
    const markdownText = `# ${article.title}\n\nCategory: ${article.category}\nTags: ${(article.tags || []).join(', ')}\n\n---\n\n${article.content}`
    await downloadFile({
      fileName: `${article.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`,
      textContent: markdownText,
      mimeType: 'text/markdown;charset=utf-8',
    })
  }

  // Simple Markdown-style visual formatter
  const renderFormattedContent = (content = '') => {
    const lines = content.split('\n')
    return (
      <div className="space-y-2 text-xs text-forest leading-relaxed font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="text-xs font-black text-forest mt-2 pt-1">{line.replace('### ', '')}</h4>
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="text-sm font-black text-forest mt-3 pt-1 border-b border-brand-border/40 pb-1">{line.replace('## ', '')}</h3>
          }
          if (line.startsWith('# ')) {
            return <h2 key={idx} className="text-base font-black text-forest mt-4 border-b border-brand-border pb-1">{line.replace('# ', '')}</h2>
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc pl-1 text-[11px] text-forest/90">
                {line.substring(2)}
              </li>
            )
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-sage bg-mint/10 pl-3 py-1 my-1.5 rounded-r-lg italic text-[11px] text-forest">
                {line.replace('> ', '')}
              </blockquote>
            )
          }
          if (line.startsWith('```')) {
            return (
              <div key={idx} className="font-mono text-[10px] bg-forest text-mint px-2 py-0.5 rounded">
                {line.replace(/```/g, '') || '// Code block'}
              </div>
            )
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />
          }
          return (
            <p key={idx} className="text-[11px] text-forest/90">
              {line}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-white border border-brand-border/80 rounded-card p-4 shadow-subtle flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-forest flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sage" /> Personal Wiki & Knowledge
          </h2>
          <p className="text-xs text-mutedgreen mt-0.5">
            React notes, business concepts, cheat sheets & work docs
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-forest text-mint hover:bg-forest/90 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> New Doc
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
            placeholder="Search notes, tech docs, concepts or tags..."
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
                ? wikiArticles.length
                : wikiArticles.filter((a) => a.category === cat).length
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
        {allTags.length > 0 && (
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
            {allTags
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

      {/* Articles Grid / List */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-2xl p-8 text-center space-y-3 shadow-subtle">
          <div className="w-14 h-14 mx-auto rounded-full bg-mint/40 text-forest flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-black text-forest">Your wiki is empty</h3>
            <p className="text-xs text-mutedgreen mt-1">
              {searchQuery || selectedCategory !== 'All' || selectedTag
                ? 'No notes match your active filter'
                : 'Start documenting your React cheat sheets, business formulas, workflows and important ideas'}
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-forest text-mint rounded-xl text-xs font-bold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create First Doc
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const catColors = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['Personal']

            return (
              <div
                key={article.id}
                onClick={() => setViewingArticle(article)}
                className={`bg-white border rounded-2xl p-4 shadow-subtle hover:border-sage transition-all space-y-2.5 cursor-pointer ${
                  article.isPinned ? 'border-sage/80 bg-[#FCFDFC]' : 'border-brand-border/80'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-forest truncate">{article.title}</h4>
                      {article.isPinned && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5 fill-amber-700" /> Pinned
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                        {article.category}
                      </span>
                      <span className="text-[10px] text-mutedgreen">
                        Updated {new Date(article.updatedAt || article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Pin button */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleWikiPin(article.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        article.isPinned ? 'text-amber-600 bg-amber-50' : 'text-mutedgreen hover:text-forest'
                      }`}
                      title={article.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className={`w-4 h-4 ${article.isPinned ? 'fill-amber-600' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(article)}
                      className="p-1.5 text-mutedgreen hover:text-forest rounded-lg hover:bg-brand-bg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content preview snippet */}
                <p className="text-xs text-forest/75 line-clamp-2 leading-relaxed">
                  {article.content || 'No content written yet.'}
                </p>

                {/* Tags & Quick Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-brand-border/40 text-xs">
                  <div className="flex items-center gap-1 flex-wrap">
                    {(article.tags || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-bold px-2 py-0.5 bg-mint/30 text-forest rounded"
                      >
                        #{t}
                      </span>
                    ))}
                    {(article.tags || []).length > 3 && (
                      <span className="text-[10px] text-mutedgreen font-bold">
                        +{article.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-forest hover:text-sage flex items-center gap-0.5">
                    Read Doc <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View Article Modal */}
      {viewingArticle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col space-y-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-brand-border">
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint/40 text-forest">
                    {viewingArticle.category}
                  </span>
                  {viewingArticle.isPinned && (
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      ★ Pinned
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-forest mt-1 truncate">
                  {viewingArticle.title}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyContent(viewingArticle)}
                  className="p-1.5 bg-brand-bg hover:bg-mint text-forest rounded-lg transition-colors"
                  title="Copy Document Text"
                >
                  {copiedId === viewingArticle.id ? <Check className="w-4 h-4 text-brand-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleExportMarkdown(viewingArticle)}
                  className="p-1.5 bg-brand-bg hover:bg-mint text-forest rounded-lg transition-colors"
                  title="Export Markdown File (.md)"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    handleOpenEdit(viewingArticle)
                  }}
                  className="p-1.5 bg-brand-bg hover:bg-mint text-forest rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewingArticle(null)}
                  className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-mutedgreen hover:text-forest ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tags bar */}
            {(viewingArticle.tags || []).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {viewingArticle.tags.map((t) => (
                  <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-mint/30 text-forest rounded-md">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Scrollable Formatted Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[60vh] bg-[#FAFBF9] border border-brand-border/60 rounded-2xl p-4">
              {renderFormattedContent(viewingArticle.content)}
            </div>

            {/* Footer with Delete and Done */}
            <div className="pt-2 flex items-center justify-between border-t border-brand-border text-xs">
              <button
                onClick={() => {
                  setArticleToDelete(viewingArticle)
                  setViewingArticle(null)
                }}
                className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Doc
              </button>
              <button
                onClick={() => setViewingArticle(null)}
                className="px-4 py-2 bg-forest text-mint font-bold rounded-xl shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] flex flex-col space-y-3.5 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <h3 className="text-base font-black text-forest flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sage" />
                {editingArticle ? 'Edit Wiki Article' : 'New Knowledge Document'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-mutedgreen hover:text-forest"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. React 19 State Architecture, Startup Tax Rules"
                  className="w-full px-3 py-2.5 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              {/* Category & Pin */}
              <div className="grid grid-cols-2 gap-2">
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

                <div>
                  <label className="block text-xs font-bold text-forest mb-1">
                    Pin to Top
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isPinned: !formData.isPinned })}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.isPinned
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-white border-brand-border text-mutedgreen hover:border-forest'
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${formData.isPinned ? 'fill-amber-700' : ''}`} />
                    <span>{formData.isPinned ? 'Pinned' : 'Not Pinned'}</span>
                  </button>
                </div>
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-bold text-forest mb-1">
                  Tags (Press Enter or comma to add)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-brand-border rounded-xl min-h-[38px] focus-within:ring-2 focus-within:ring-forest">
                  {formData.tags.map((chip) => (
                    <span
                      key={chip}
                      className="px-2 py-0.5 bg-mint/40 text-forest text-[11px] font-bold rounded-md flex items-center gap-1"
                    >
                      #{chip}
                      <button
                        type="button"
                        onClick={() => handleRemoveTagChip(chip)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={formData.tagsInput}
                    onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                    onKeyDown={handleAddTagChip}
                    placeholder={formData.tags.length === 0 ? "e.g. react, finance, notes" : "Add..."}
                    className="flex-1 min-w-[80px] text-xs bg-transparent focus:outline-none text-forest placeholder:text-mutedgreen/60"
                  />
                </div>
              </div>

              {/* Content with Markdown Helper Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-forest">
                    Content & Notes
                  </label>
                  {/* Markdown Helper buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('##')}
                      className="px-1.5 py-0.5 bg-brand-bg hover:bg-brand-border text-[10px] font-bold rounded text-forest"
                      title="Heading"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('-')}
                      className="p-1 bg-brand-bg hover:bg-brand-border rounded text-forest"
                      title="Bullet list"
                    >
                      <List className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('>')}
                      className="p-1 bg-brand-bg hover:bg-brand-border rounded text-forest"
                      title="Quote"
                    >
                      <Quote className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('```\n// code\n```')}
                      className="p-1 bg-brand-bg hover:bg-brand-border rounded text-forest"
                      title="Code block"
                    >
                      <Code className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your notes, code examples, concepts, or checklists here... Supports # Headers, - Bullets, > Quotes and ``` Code"
                  className="w-full px-3 py-2 bg-white border border-brand-border rounded-xl text-xs text-forest focus:outline-none focus:ring-2 focus:ring-forest font-mono leading-relaxed"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="flex-1 py-2.5 bg-brand-bg text-forest font-bold text-xs rounded-xl hover:bg-brand-border/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-forest text-mint font-black text-xs rounded-xl shadow-md hover:bg-forest/90"
                >
                  {editingArticle ? 'Save Changes' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {articleToDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Article"
          message={`Are you sure you want to permanently remove "${articleToDelete.title}"?`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            deleteWikiArticle(articleToDelete.id)
            setArticleToDelete(null)
          }}
          onCancel={() => setArticleToDelete(null)}
        />
      )}
    </div>
  )
}

