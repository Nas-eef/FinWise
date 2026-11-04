import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scheduleEmiNotification } from '../utils/nativeNotifications'
import { supabase } from '../lib/supabase'
import {
  AuthService,
  TransactionService,
  AccountService,
  CategoryService,
  BudgetService,
  SavingsService,
  LoanService,
  FriendNotesService,
  RecurringService,
  ReminderService,
  NotificationService,
  GroupService,
  VaultService,
  MeetingService,
  WikiService,
} from '../services'

// Locks to prevent concurrent / duplicate offline sync executions
const activeSyncTxIds = new Set()
let isSyncRunning = false

const initialCategories = [
  // Expense
  { id: '0f921730-0caa-4750-9a6e-8d0cbb429a15', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#FF7043' },
  { id: '576c7160-13e7-438d-a9ee-e49e557ac2d6', name: 'Transportation', type: 'expense', icon: 'Car', color: '#42A5F5' },
  { id: '6e9f9e76-4322-4fa7-a8ea-2aac071c4b42', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#AB47BC' },
  { id: '24018b63-b67b-4f87-a248-eb24c5e75cc6', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#26A69A' },
  { id: '51d3b94f-42e1-4ee4-8caf-3ed6c7ccae8c', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#FFA726' },
  { id: 'b41dac50-6ab2-4d8b-9fd2-5eedd3c502ba', name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#EF5350' },
  { id: '2769218b-41de-472a-83a3-2cf1e48d13e2', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8D6E63' },
  { id: '6c561752-6d71-40a5-99a6-9c6f07c41340', name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#5C6BC0' },
  { id: '334cccb0-bc4f-440c-98a8-a5f081f2a0d6', name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#EC407A' },
  { id: 'a388b235-8d71-4d26-8218-3ff8cdcc30bd', name: 'Loans & EMI', type: 'expense', icon: 'Landmark', color: '#78909C' },
  { id: '06e496f1-2829-4a5d-bbed-2e81c0589525', name: 'Other Expenses', type: 'expense', icon: 'MoreHorizontal', color: '#7C827C' },
  // Income
  { id: '4c20a5bc-1772-40ca-a9c2-5711e8e58879', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#43845A' },
  { id: 'd3c6b477-f929-4ba8-bc59-23b19b3fa7a6', name: 'Freelancing / Work', type: 'income', icon: 'Laptop', color: '#8AAB8F' },
  { id: '9226b944-9e8e-4c3b-95da-55fc012051dc', name: 'Business & Sales', type: 'income', icon: 'Building2', color: '#2E7D32' },
  { id: 'fc6b4204-1ce4-498c-96eb-702cdbfb7243', name: 'Rental Income', type: 'income', icon: 'Building', color: '#558B2F' },
  { id: 'af44ec5d-c37e-4f4a-b677-ce317efeaec2', name: 'Investments & Dividends', type: 'income', icon: 'TrendingUp', color: '#00ACC1' },
  { id: '10a59878-c625-4d37-b7f9-b492053c2ee6', name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#689F38' },
]

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      // User Profile (Rupees by default)
      currentUserId: null,
      user: {
        name: 'Guest User',
        email: '',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        notificationsEnabled: true,
        loanNotification1DayBefore: true,
        isAuthenticated: false,
      },

      totalBalance: 0.00,
      monthlyBudget: 0.00,

      // Core Entities (empty by default for clean fresh account)
      categories: initialCategories,
      expenseGroups: [],
      transactions: [],
      friendsNotes: [],
      loans: [],
      notifications: [],
      accounts: [
        { id: 'acc-default', name: 'Primary Bank Account', type: 'bank', balance: 0.00, isDefault: true, color: '#43845A' }
      ],
      budgets: {
        monthlyLimit: 0.00,
        categoryLimits: {},
      },
      savingsGoals: [],
      recurring: [],
      reminders: [],
      debts: [],
      documents: [],
      meetings: [],
      wikiArticles: [],


      // UI state
      isAddTransactionOpen: false,
      transactionToEdit: null,
      openAddTransaction: (initialData = null) => set({ isAddTransactionOpen: true, transactionToEdit: initialData }),
      closeAddTransaction: () => set({ isAddTransactionOpen: false, transactionToEdit: null }),

      // Update User
      updateUser: (updated) => set((state) => ({ user: { ...state.user, ...updated } })),

      // Switch or login user (preserves user data across app restarts & offline sessions)
      setUser: (userData) => {
        const state = get()
        const targetEmail = userData?.email || userData?.id || 'authenticated'
        
        // Only reset if an existing authenticated user logs out and a DIFFERENT user logs in
        const isSwitchingAccount = Boolean(
          state.currentUserId &&
          state.currentUserId !== targetEmail &&
          state.user?.isAuthenticated
        )

        if (isSwitchingAccount) {
          set({
            currentUserId: targetEmail,
            user: {
              name: userData?.name || userData?.full_name || targetEmail.split('@')[0],
              email: userData?.email || '',
              currency: 'INR',
              dateFormat: 'DD/MM/YYYY',
              notificationsEnabled: true,
              loanNotification1DayBefore: true,
              isAuthenticated: true,
            },
            totalBalance: 0.00,
            monthlyBudget: 0.00,
            transactions: [],
            expenseGroups: [],
            friendsNotes: [],
            loans: [],
            notifications: [],
            accounts: [
              { id: 'acc-default', name: 'Primary Bank Account', type: 'bank', balance: 0.00, isDefault: true, color: '#43845A' }
            ],
            budgets: {
              monthlyLimit: 0.00,
              categoryLimits: {},
            },
            savingsGoals: [],
            recurring: [],
            reminders: [],
            debts: [],
            documents: [],
            meetings: [],
            wikiArticles: [],
          })
          // Synchronize from Supabase for this authenticated user
          setTimeout(() => get().syncWithSupabase(), 100)
        } else {
          // Same user, re-opening app, or initial launch: PRESERVE ALL DATA!
          set((s) => ({
            currentUserId: targetEmail,
            user: {
              ...s.user,
              ...userData,
              name: userData?.name || userData?.full_name || s.user?.name || targetEmail.split('@')[0],
              email: userData?.email || s.user?.email || targetEmail,
              isAuthenticated: true,
            },
          }))
          setTimeout(() => get().syncWithSupabase(), 100)
        }
      },

      /**
       * Sync complete user financial data directly from Supabase
       */
      syncWithSupabase: async () => {
        if (isSyncRunning) return
        isSyncRunning = true

        try {
          const { data: sessionData } = await supabase.auth.getSession()
          const user = sessionData?.session?.user || (await supabase.auth.getUser()).data?.user
          if (!user) return

          const [
            accountsRes,
            txsRes,
            categoriesRes,
            budgetRes,
            savingsRes,
            loansRes,
            notesRes,
            recurringRes,
            remindersRes,
            notifsRes,
            groupsRes,
            vaultRes,
            meetingsRes,
            wikiRes,
          ] = await Promise.allSettled([
            AccountService.getAccounts(),
            TransactionService.getTransactions(),
            CategoryService.getCategories(),
            BudgetService.getActiveBudget(),
            SavingsService.getSavingsGoals(),
            LoanService.getLoans(),
            FriendNotesService.getNotes(),
            RecurringService.getRecurring(),
            ReminderService.getReminders(),
            NotificationService.getNotifications(),
            GroupService.getGroups(),
            VaultService.getDocuments(),
            MeetingService.getMeetings(),
            WikiService.getArticles(),
          ])

          const updates = {}

          // 1. Accounts
          if (accountsRes.status === 'fulfilled') {
            if (accountsRes.value && accountsRes.value.length > 0) {
              updates.accounts = accountsRes.value
              const totalAccBal = accountsRes.value.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
              updates.totalBalance = Math.round(totalAccBal * 100) / 100
            } else {
              // Automatically ensure at least one default account in Supabase
              AccountService.ensureDefaultAccount().then((acc) => {
                if (acc) set((s) => ({ accounts: [acc] }))
              }).catch(() => {})
            }
          }

          // 2. Transactions (with duplicate prevention)
          if (txsRes.status === 'fulfilled' && Array.isArray(txsRes.value)) {
            const dbTxs = txsRes.value
            const localTxs = get().transactions || []
            
            // Only sync items that are not currently being synced by another call
            const unsynced = localTxs.filter((t) =>
              typeof t.id === 'string' &&
              t.id.startsWith('tx-') &&
              !activeSyncTxIds.has(t.id)
            )

            if (unsynced.length > 0) {
              // Sequentially sync each item and guard against duplicates
              for (const localTx of unsynced) {
                activeSyncTxIds.add(localTx.id)
                try {
                  const saved = await TransactionService.createTransaction(localTx)
                  if (saved?.id) {
                    set((s) => ({
                      transactions: s.transactions.map((tx) =>
                        tx.id === localTx.id ? { ...tx, id: saved.id, synced: true } : tx
                      ),
                    }))
                  }
                } catch (err) {
                  console.warn('Background sync failed for tx:', localTx.id, err)
                } finally {
                  activeSyncTxIds.delete(localTx.id)
                }
              }
            }

            const currentLocal = get().transactions || []
            const currentUnsynced = currentLocal.filter((t) => typeof t.id === 'string' && t.id.startsWith('tx-'))
            const dbIds = new Set(dbTxs.map((t) => t.id))
            const stillUnsynced = currentUnsynced.filter((t) => !dbIds.has(t.id))
            updates.transactions = [...stillUnsynced, ...dbTxs]

            // Recalculate balance if not already derived from accounts
            if (updates.totalBalance === undefined) {
              let net = 0
              updates.transactions.forEach((t) => {
                const amt = Number(t.amount) || 0
                if (t.type === 'income' || t.type === 'refund') net += amt
                else if (t.type === 'expense') net -= amt
              })
              updates.totalBalance = Math.round(net * 100) / 100
            }
          }

          // 3. Groups
          if (groupsRes.status === 'fulfilled') {
            updates.expenseGroups = groupsRes.value || []
          }
          if (categoriesRes.status === 'fulfilled' && categoriesRes.value && categoriesRes.value.length > 0) {
            updates.categories = categoriesRes.value
          }
          if (budgetRes.status === 'fulfilled' && budgetRes.value) {
            const dbLimit = Number(budgetRes.value.monthlyLimit) || 0
            const localLimit = Number(get().monthlyBudget) || Number(get().budgets?.monthlyLimit) || 0

            if (dbLimit > 0) {
              updates.budgets = budgetRes.value
              updates.monthlyBudget = dbLimit
            } else if (localLimit > 0) {
              // Supabase has no limit recorded yet, but user set one locally: preserve it & sync to Supabase!
              updates.budgets = {
                ...budgetRes.value,
                monthlyLimit: localLimit,
              }
              updates.monthlyBudget = localLimit
              BudgetService.updateMonthlyBudgetLimit(localLimit).then((saved) => {
                if (saved?.id) {
                  set((s) => ({
                    budgets: { ...s.budgets, budgetId: saved.id, monthlyLimit: localLimit },
                  }))
                }
              }).catch(() => {})
            } else {
              updates.budgets = budgetRes.value
            }
          }
          if (savingsRes.status === 'fulfilled' && savingsRes.value) {
            updates.savingsGoals = savingsRes.value
          }
          if (loansRes.status === 'fulfilled' && loansRes.value) {
            updates.loans = loansRes.value
          }
          if (notesRes.status === 'fulfilled' && notesRes.value) {
            updates.friendsNotes = notesRes.value
          }
          if (recurringRes.status === 'fulfilled' && recurringRes.value) {
            updates.recurring = recurringRes.value
          }
          if (remindersRes.status === 'fulfilled' && remindersRes.value) {
            updates.reminders = remindersRes.value
          }
          if (notifsRes.status === 'fulfilled' && notifsRes.value) {
            updates.notifications = notifsRes.value
          }
          if (vaultRes.status === 'fulfilled' && vaultRes.value) {
            updates.documents = vaultRes.value
          }
          if (meetingsRes.status === 'fulfilled' && meetingsRes.value) {
            updates.meetings = meetingsRes.value
          }
          if (wikiRes.status === 'fulfilled' && wikiRes.value) {
            updates.wikiArticles = wikiRes.value
          }

          set((state) => ({ ...state, ...updates }))
        } catch (err) {
          console.warn('Sync with Supabase note:', err)
        } finally {
          isSyncRunning = false
        }
      },

      switchToUser: (userData) => get().setUser(userData),

      logoutUser: () => {
        localStorage.removeItem('finance_access_token')
        set({
          currentUserId: null,
          user: {
            name: 'Guest User',
            email: '',
            currency: 'INR',
            dateFormat: 'DD/MM/YYYY',
            notificationsEnabled: true,
            loanNotification1DayBefore: true,
            isAuthenticated: false,
          },
          totalBalance: 0.00,
          monthlyBudget: 0.00,
          transactions: [],
          expenseGroups: [],
          friendsNotes: [],
          loans: [],
          notifications: [],
          accounts: [
            { id: 'acc-default', name: 'Primary Bank Account', type: 'bank', balance: 0.00, isDefault: true, color: '#43845A' }
          ],
          budgets: {
            monthlyLimit: 0.00,
            categoryLimits: {},
          },
          savingsGoals: [],
          recurring: [],
          reminders: [],
          debts: [],
          documents: [],
          meetings: [],
          wikiArticles: [],
        })
      },

      // Reset to a clean fresh blank slate
      startFresh: () => {
        set(() => ({
          totalBalance: 0.00,
          monthlyBudget: 0.00,
          transactions: [],
          expenseGroups: [],
          friendsNotes: [],
          loans: [],
          notifications: [],
          accounts: [
            { id: 'acc-default', name: 'Primary Bank Account', type: 'bank', balance: 0.00, isDefault: true, color: '#43845A' }
          ],
          budgets: {
            monthlyLimit: 0.00,
            categoryLimits: {},
          },
          savingsGoals: [],
          recurring: [],
          reminders: [],
          debts: [],
          documents: [],
          meetings: [],
          wikiArticles: [],
        }))
      },

      // Balance & Budget Actions
      updateTotalBalance: (balance) => set({ totalBalance: Number(balance) || 0 }),
      updateMonthlyBudget: (budget) => get().updateMonthlyBudgetLimit(budget),

      // Expense Groups Actions
      addExpenseGroup: (group) => {
        const id = `grp-${Date.now()}`
        const newGroup = {
          id,
          name: group.name.trim(),
          icon: group.icon || 'Folder',
          color: group.color || '#26A69A',
          budget: Number(group.budget) || 0,
        }
        set((state) => ({ expenseGroups: [...state.expenseGroups, newGroup] }))

        // Persist directly to Supabase to obtain real database UUID
        GroupService.createGroup(group)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                expenseGroups: state.expenseGroups.map((g) =>
                  g.id === id ? { ...g, id: saved.id } : g
                ),
                // Update any transactions referencing this group
                transactions: state.transactions.map((t) =>
                  t.groupId === id ? { ...t, groupId: saved.id } : t
                ),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createGroup note:', err))

        return newGroup
      },
      deleteExpenseGroup: (id) => {
        set((state) => ({
          expenseGroups: state.expenseGroups.filter((g) => g.id !== id),
          transactions: state.transactions.map((t) => (t.groupId === id ? { ...t, groupId: null } : t)),
        }))
        if (id && !id.startsWith('grp-')) {
          GroupService.deleteGroup(id).catch((err) =>
            console.warn('Supabase deleteGroup note:', err)
          )
        }
      },

      // Transactions
      addTransaction: (tx) => {
        const id = tx.id || `tx-${Date.now()}`
        const amount = Number(tx.amount) || 0
        const isExpense = tx.type === 'expense'

        // 1. Instant optimistic local update (works offline immediately)
        set((state) => ({
          transactions: [{ ...tx, id, groupId: tx.groupId || null, synced: false }, ...state.transactions],
          totalBalance: Math.round((state.totalBalance + (isExpense ? -amount : amount)) * 100) / 100,
          isAddTransactionOpen: false,
          transactionToEdit: null,
        }))

        // Guard against duplicate sync while this direct call is in flight
        activeSyncTxIds.add(id)

        // 2. Direct Supabase persist with idempotency reference
        TransactionService.createTransaction({ ...tx, id })
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                transactions: state.transactions.map((t) =>
                  t.id === id ? { ...t, id: saved.id, synced: true } : t
                ),
              }))
              // Refresh accounts from Supabase so database trigger balance is in sync
              AccountService.getAccounts()
                .then((accs) => {
                  if (accs && accs.length > 0) {
                    const total = accs.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
                    set({ accounts: accs, totalBalance: Math.round(total * 100) / 100 })
                  }
                })
                .catch(() => {})
            }
          })
          .catch((err) => {
            console.error('Direct Supabase transaction insert error (will auto-sync safely):', err)
          })
          .finally(() => {
            activeSyncTxIds.delete(id)
          })
      },

      updateTransaction: (id, updated) => {
        set((state) => {
          const oldTx = state.transactions.find((t) => t.id === id)
          if (!oldTx) return {}
          const oldAmount = oldTx.type === 'expense' ? -oldTx.amount : oldTx.amount
          const newAmount = updated.type === 'expense' ? -updated.amount : updated.amount
          const balanceDiff = newAmount - oldAmount

          return {
            transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)),
            totalBalance: Math.round((state.totalBalance + balanceDiff) * 100) / 100,
            isAddTransactionOpen: false,
            transactionToEdit: null,
          }
        })

        if (id && !id.startsWith('tx-')) {
          TransactionService.updateTransaction(id, updated).catch((err) =>
            console.warn('Supabase updateTransaction note:', err)
          )
        }
      },

      deleteTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id)
          if (!tx) return {}
          const reverseAmount = tx.type === 'expense' ? tx.amount : -tx.amount
          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            totalBalance: Math.round((state.totalBalance + reverseAmount) * 100) / 100,
          }
        })

        if (id && !id.startsWith('tx-')) {
          TransactionService.deleteTransaction(id).catch((err) =>
            console.warn('Supabase deleteTransaction note:', err)
          )
        }
      },

      // Friends Notes (Borrowed / Lent)
      addFriendsNote: (item) => {
        const id = `fn-${Date.now()}`
        const newNote = {
          ...item,
          id,
          amount: Number(item.amount) || 0,
          paidAmount: 0,
          isSettled: false,
        }
        set((state) => ({ friendsNotes: [newNote, ...state.friendsNotes] }))

        FriendNotesService.createNote(item)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                friendsNotes: state.friendsNotes.map((n) => (n.id === id ? { ...n, id: saved.id } : n)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createNote note:', err))
      },

      updateFriendsNote: (id, updated) => {
        const current = get().friendsNotes.find((n) => n.id === id)
        const noteType = updated.type || current?.type || 'to_get'

        set((state) => ({
          friendsNotes: state.friendsNotes.map((n) => (n.id === id ? { ...n, ...updated } : n)),
        }))

        if (id && !id.startsWith('fn-')) {
          FriendNotesService.updateNote(id, noteType, updated).catch((err) =>
            console.warn('Supabase updateFriendsNote note:', err)
          )
        }
      },

      recordFriendsPayment: (id, amountPaid) => {
        const num = Number(amountPaid) || 0
        const current = get().friendsNotes.find((n) => n.id === id)
        set((state) => ({
          friendsNotes: state.friendsNotes.map((n) => {
            if (n.id === id) {
              const newPaid = (n.paidAmount || 0) + num
              const isSettled = newPaid >= n.amount
              return { ...n, paidAmount: newPaid, isSettled }
            }
            return n
          }),
        }))

        if (id && !id.startsWith('fn-') && current) {
          FriendNotesService.recordPayment(id, current.type, num).catch((err) =>
            console.warn('Supabase recordFriendsPayment note:', err)
          )
        }
      },

      toggleFriendsSettled: (id) => {
        const current = get().friendsNotes.find((n) => n.id === id)
        const nextSettled = !current?.isSettled
        set((state) => ({
          friendsNotes: state.friendsNotes.map((n) => {
            if (n.id === id) {
              return { ...n, isSettled: nextSettled, paidAmount: nextSettled ? n.amount : 0 }
            }
            return n
          }),
        }))

        if (id && !id.startsWith('fn-') && current) {
          FriendNotesService.toggleSettled(id, current.type, nextSettled).catch((err) =>
            console.warn('Supabase toggleFriendsSettled note:', err)
          )
        }
      },

      deleteFriendsNote: (id) => {
        const current = get().friendsNotes.find((n) => n.id === id)
        set((state) => ({
          friendsNotes: state.friendsNotes.filter((n) => n.id !== id),
        }))

        if (id && !id.startsWith('fn-') && current) {
          FriendNotesService.deleteNote(id, current.type).catch((err) =>
            console.warn('Supabase deleteFriendsNote note:', err)
          )
        }
      },

      // Loans & EMI
      addLoan: (loan) => {
        const id = `loan-${Date.now()}`
        const dueDate = loan.dueDate || '2026-11-15'
        const d = new Date(dueDate)
        d.setDate(d.getDate() - 1)
        const notificationDate = d.toISOString().split('T')[0]

        const newLoan = {
          ...loan,
          id,
          originalAmount: Number(loan.originalAmount) || 0,
          outstandingAmount: Number(loan.outstandingAmount) || Number(loan.originalAmount) || 0,
          emiAmount: Number(loan.emiAmount) || 0,
          pushNotification1DayBefore: true,
          notificationDate,
          schedule: loan.schedule || [
            { month: 'Next Due', emi: Number(loan.emiAmount) || 0, status: 'upcoming', date: dueDate }
          ],
        }

        const newNotification = {
          id: `notif-loan-${id}`,
          title: '⏰ 1-Day EMI Due Alert',
          message: `Reminder: ${loan.name} EMI of ₹${Number(loan.emiAmount).toLocaleString('en-IN')} is due tomorrow (${dueDate}).`,
          time: 'Scheduled (1 Day Before)',
          read: false,
          type: 'emi_reminder'
        }

        set((state) => ({
          loans: [...state.loans, newLoan],
          notifications: [newNotification, ...state.notifications]
        }))

        scheduleEmiNotification({
          id,
          title: '⏰ 1-Day EMI Due Alert',
          message: `Reminder: ${loan.name} EMI of ₹${Number(loan.emiAmount).toLocaleString('en-IN')} is due tomorrow (${dueDate}).`,
          dueDate,
        })

        LoanService.createLoan(loan)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                loans: state.loans.map((l) => (l.id === id ? { ...l, id: saved.id } : l)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createLoan note:', err))
      },

      recordEmiPayment: (loanId, emiAmount) => {
        const num = Number(emiAmount) || 0
        set((state) => {
          let loanName = 'Loan'
          const updatedLoans = state.loans.map((l) => {
            if (l.id === loanId) {
              loanName = l.name
              const newOutstanding = Math.max(0, l.outstandingAmount - num)
              const updatedSchedule = (l.schedule || []).map((s, idx) => {
                if (s.status === 'upcoming' && idx === l.schedule.findIndex(item => item.status === 'upcoming')) {
                  return { ...s, status: 'paid', paidDate: new Date().toISOString().split('T')[0] }
                }
                return s
              })
              return { ...l, outstandingAmount: newOutstanding, schedule: updatedSchedule }
            }
            return l
          })

          const emiTx = {
            id: `tx-${Date.now()}`,
            type: 'expense',
            amount: num,
            categoryId: 'cat-emi',
            date: new Date().toISOString().split('T')[0],
            description: `EMI Paid: ${loanName}`,
            notes: 'Recorded via Loans & EMI Manager (1-day alert active)',
          }

          return {
            loans: updatedLoans,
            totalBalance: Math.round((state.totalBalance - num) * 100) / 100,
            transactions: [emiTx, ...state.transactions],
          }
        })

        if (loanId && !loanId.startsWith('loan-')) {
          LoanService.recordPayment(loanId, num).catch((err) =>
            console.warn('Supabase recordPayment note:', err)
          )
        }
      },

      deleteLoan: (id) => {
        set((state) => ({
          loans: state.loans.filter((l) => l.id !== id),
        }))

        if (id && !id.startsWith('loan-')) {
          LoanService.deleteLoan(id).catch((err) =>
            console.warn('Supabase deleteLoan note:', err)
          )
        }
      },

      // Accounts Actions
      addAccount: (account) => {
        const id = `acc-${Date.now()}`
        const newAcc = {
          ...account,
          id,
          balance: Number(account.balance) || 0,
        }
        set((state) => ({ accounts: [...state.accounts, newAcc] }))

        AccountService.createAccount(account)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                accounts: state.accounts.map((a) => (a.id === id ? { ...a, id: saved.id } : a)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createAccount note:', err))
      },
      updateAccount: (id, updated) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updated } : a)),
        }))
        if (id && !id.startsWith('acc-')) {
          AccountService.updateAccount(id, updated).catch((err) =>
            console.warn('Supabase updateAccount note:', err)
          )
        }
      },
      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }))
        if (id && !id.startsWith('acc-')) {
          AccountService.deleteAccount(id).catch((err) =>
            console.warn('Supabase deleteAccount note:', err)
          )
        }
      },

      // Budget Actions
      updateMonthlyBudgetLimit: async (limit) => {
        const num = Math.max(0, Number(limit) || 0)
        set((state) => ({
          monthlyBudget: num,
          budgets: {
            ...state.budgets,
            monthlyLimit: num,
          },
        }))
        try {
          const saved = await BudgetService.updateMonthlyBudgetLimit(num)
          if (saved?.id) {
            set((state) => ({
              budgets: {
                ...state.budgets,
                budgetId: saved.id,
                monthlyLimit: num,
              },
            }))
          }
        } catch (err) {
          console.warn('Supabase updateMonthlyBudgetLimit note:', err)
        }
      },
      setCategoryBudget: async (catId, limit) => {
        const num = Math.max(0, Number(limit) || 0)
        set((state) => ({
          budgets: {
            ...state.budgets,
            categoryLimits: {
              ...(state.budgets?.categoryLimits || {}),
              [catId]: num,
            },
          },
        }))
        let budgetId = get().budgets?.budgetId
        if (!budgetId) {
          try {
            const currentTotal = Number(get().monthlyBudget) || Number(get().budgets?.monthlyLimit) || 0
            const saved = await BudgetService.updateMonthlyBudgetLimit(currentTotal)
            if (saved?.id) {
              budgetId = saved.id
              set((state) => ({
                budgets: {
                  ...state.budgets,
                  budgetId: saved.id,
                },
              }))
            }
          } catch (err) {
            console.warn('Failed to ensure budget before category limit:', err)
          }
        }
        if (budgetId) {
          BudgetService.setCategoryLimit(budgetId, catId, num).catch((err) =>
            console.warn('Supabase setCategoryLimit note:', err)
          )
        }
      },

      // Savings Goals Actions
      addSavingsGoal: (goal) => {
        const id = `sg-${Date.now()}`
        const newGoal = {
          ...goal,
          id,
          targetAmount: Number(goal.targetAmount) || 0,
          currentAmount: Number(goal.currentAmount) || 0,
        }
        set((state) => ({ savingsGoals: [...state.savingsGoals, newGoal] }))

        SavingsService.createSavingsGoal(goal)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                savingsGoals: state.savingsGoals.map((g) => (g.id === id ? { ...g, id: saved.id } : g)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createSavingsGoal note:', err))
      },
      updateSavingsGoal: (id, updated) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) => (g.id === id ? { ...g, ...updated } : g)),
        }))
        if (id && !id.startsWith('sg-')) {
          SavingsService.updateSavingsGoal(id, updated).catch((err) =>
            console.warn('Supabase updateSavingsGoal note:', err)
          )
        }
      },
      deleteGoal: (id) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
        }))
        if (id && !id.startsWith('sg-')) {
          SavingsService.deleteSavingsGoal(id).catch((err) =>
            console.warn('Supabase deleteSavingsGoal note:', err)
          )
        }
      },
      contributeToGoal: (goalId, amount) => {
        const num = Number(amount) || 0
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) => {
            if (g.id === goalId) {
              return { ...g, currentAmount: (g.currentAmount || 0) + num }
            }
            return g
          }),
        }))
        if (goalId && !goalId.startsWith('sg-')) {
          SavingsService.contribute({ goalId, amount: num, type: 'deposit' }).catch((err) =>
            console.warn('Supabase contribute note:', err)
          )
        }
      },
      withdrawFromGoal: (goalId, amount) => {
        const num = Number(amount) || 0
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) => {
            if (g.id === goalId) {
              return { ...g, currentAmount: Math.max(0, (g.currentAmount || 0) - num) }
            }
            return g
          }),
        }))
        if (goalId && !goalId.startsWith('sg-')) {
          SavingsService.contribute({ goalId, amount: num, type: 'withdrawal' }).catch((err) =>
            console.warn('Supabase withdraw note:', err)
          )
        }
      },

      // Categories Actions
      addCategory: (cat) => {
        const id = `cat-${Date.now()}`
        set((state) => ({
          categories: [...state.categories, { ...cat, id }],
        }))
        CategoryService.createCategory(cat)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                categories: state.categories.map((c) => (c.id === id ? { ...c, id: saved.id } : c)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createCategory note:', err))
      },
      updateCategory: (id, updated) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        }))
        if (id && !id.startsWith('cat-')) {
          CategoryService.updateCategory(id, updated).catch((err) =>
            console.warn('Supabase updateCategory note:', err)
          )
        }
      },
      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }))
        if (id && !id.startsWith('cat-')) {
          CategoryService.deleteCategory(id).catch((err) =>
            console.warn('Supabase deleteCategory note:', err)
          )
        }
      },

      // Recurring Subscriptions Actions
      addRecurring: (rec) => {
        const id = `rec-${Date.now()}`
        set((state) => ({
          recurring: [...state.recurring, { ...rec, id, amount: Number(rec.amount) || 0, status: rec.status || 'active' }],
        }))
        RecurringService.createRecurring(rec)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                recurring: state.recurring.map((r) => (r.id === id ? { ...r, id: saved.id } : r)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createRecurring note:', err))
      },
      updateRecurring: (id, updated) => {
        set((state) => ({
          recurring: state.recurring.map((r) => (r.id === id ? { ...r, ...updated } : r)),
        }))
        if (id && !id.startsWith('rec-')) {
          RecurringService.updateRecurring(id, updated).catch((err) =>
            console.warn('Supabase updateRecurring note:', err)
          )
        }
      },
      deleteRecurring: (id) => {
        set((state) => ({
          recurring: state.recurring.filter((r) => r.id !== id),
        }))
        if (id && !id.startsWith('rec-')) {
          RecurringService.deleteRecurring(id).catch((err) =>
            console.warn('Supabase deleteRecurring note:', err)
          )
        }
      },
      toggleRecurringStatus: (id) => {
        const item = get().recurring.find((r) => r.id === id)
        const nextStatus = item?.status === 'active' ? 'paused' : 'active'
        set((state) => ({
          recurring: state.recurring.map((r) =>
            r.id === id ? { ...r, status: nextStatus } : r
          ),
        }))
        if (id && !id.startsWith('rec-') && item) {
          RecurringService.toggleStatus(id, item.status).catch((err) =>
            console.warn('Supabase toggleRecurringStatus note:', err)
          )
        }
      },

      // Reminders Actions
      addReminder: (rem) => {
        const id = `rem-${Date.now()}`
        set((state) => ({
          reminders: [...state.reminders, { ...rem, id, amount: Number(rem.amount) || 0, completed: false }],
        }))
        ReminderService.createReminder(rem)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                reminders: state.reminders.map((r) => (r.id === id ? { ...r, id: saved.id } : r)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createReminder note:', err))
      },
      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }))
        if (id && !id.startsWith('rem-')) {
          ReminderService.deleteReminder(id).catch((err) =>
            console.warn('Supabase deleteReminder note:', err)
          )
        }
      },
      toggleReminder: (id) => {
        const item = get().reminders.find((r) => r.id === id)
        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
        }))
        if (id && !id.startsWith('rem-') && item) {
          ReminderService.toggleReminder(id, item.completed).catch((err) =>
            console.warn('Supabase toggleReminder note:', err)
          )
        }
      },

      // Debts Actions (Receivables / Payables)
      addDebt: (debt) => {
        const id = `deb-${Date.now()}`
        set((state) => ({
          debts: [...state.debts, { ...debt, id, amount: Number(debt.amount) || 0, paidAmount: 0, settled: false }],
        }))
      },
      deleteDebt: (id) => {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        }))
      },
      recordDebtPayment: (id, amount) => {
        const num = Number(amount) || 0
        set((state) => ({
          debts: state.debts.map((d) => {
            if (d.id === id) {
              const newPaid = (d.paidAmount || 0) + num
              return { ...d, paidAmount: newPaid, settled: newPaid >= d.amount }
            }
            return d
          }),
        }))
      },

      // Notifications
      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }))
        if (id && !id.startsWith('notif-')) {
          NotificationService.markAsRead(id).catch((err) =>
            console.warn('Supabase markAsRead note:', err)
          )
        }
      },
      markAllNotificationsAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
        NotificationService.markAllAsRead().catch((err) =>
          console.warn('Supabase markAllAsRead note:', err)
        )
      },

      // Document Vault Actions
      addDocument: async (docData) => {
        const tempId = `doc-${Date.now()}`
        const newDoc = {
          ...docData,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ documents: [newDoc, ...state.documents] }))

        VaultService.createDocument(newDoc).then((saved) => {
          if (saved?.id) {
            set((state) => ({
              documents: state.documents.map((d) => (d.id === tempId ? { ...d, id: saved.id } : d)),
            }))
          }
        }).catch((err) => console.warn('addDocument error:', err))
      },
      updateDocument: async (id, updates) => {
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)),
        }))
        if (id && !id.startsWith('doc-')) {
          VaultService.updateDocument(id, updates).catch((err) => console.warn('updateDocument error:', err))
        }
      },
      deleteDocument: async (id) => {
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }))
        if (id && !id.startsWith('doc-')) {
          VaultService.deleteDocument(id).catch((err) => console.warn('deleteDocument error:', err))
        }
      },

      // Meetings & Follow-ups Actions
      addMeeting: async (meetingData) => {
        const tempId = `meet-${Date.now()}`
        const newMeeting = {
          ...meetingData,
          id: tempId,
          status: meetingData.status || 'scheduled',
          priority: meetingData.priority || 'medium',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ meetings: [newMeeting, ...state.meetings] }))

        MeetingService.createMeeting(newMeeting).then((saved) => {
          if (saved?.id) {
            set((state) => ({
              meetings: state.meetings.map((m) => (m.id === tempId ? { ...m, id: saved.id } : m)),
            }))
          }
        }).catch((err) => console.warn('addMeeting error:', err))
      },
      updateMeeting: async (id, updates) => {
        set((state) => ({
          meetings: state.meetings.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m)),
        }))
        if (id && !id.startsWith('meet-')) {
          MeetingService.updateMeeting(id, updates).catch((err) => console.warn('updateMeeting error:', err))
        }
      },
      deleteMeeting: async (id) => {
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
        }))
        if (id && !id.startsWith('meet-')) {
          MeetingService.deleteMeeting(id).catch((err) => console.warn('deleteMeeting error:', err))
        }
      },
      toggleMeetingStatus: async (id) => {
        const current = get().meetings.find((m) => m.id === id)
        if (!current) return
        const nextStatus = current.status === 'completed' ? 'scheduled' : 'completed'
        get().updateMeeting(id, { status: nextStatus })
      },

      // Personal Wiki & Knowledge Base Actions
      addWikiArticle: async (articleData) => {
        const tempId = `wiki-${Date.now()}`
        const newArticle = {
          ...articleData,
          id: tempId,
          tags: Array.isArray(articleData.tags) ? articleData.tags : [],
          isPinned: Boolean(articleData.isPinned),
          color: articleData.color || '#242E25',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ wikiArticles: [newArticle, ...state.wikiArticles] }))

        WikiService.createArticle(newArticle).then((saved) => {
          if (saved?.id) {
            set((state) => ({
              wikiArticles: state.wikiArticles.map((a) => (a.id === tempId ? { ...a, id: saved.id } : a)),
            }))
          }
        }).catch((err) => console.warn('addWikiArticle error:', err))
      },
      updateWikiArticle: async (id, updates) => {
        set((state) => ({
          wikiArticles: state.wikiArticles.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)),
        }))
        if (id && !id.startsWith('wiki-')) {
          WikiService.updateArticle(id, updates).catch((err) => console.warn('updateWikiArticle error:', err))
        }
      },
      deleteWikiArticle: async (id) => {
        set((state) => ({
          wikiArticles: state.wikiArticles.filter((a) => a.id !== id),
        }))
        if (id && !id.startsWith('wiki-')) {
          WikiService.deleteArticle(id).catch((err) => console.warn('deleteWikiArticle error:', err))
        }
      },
      toggleWikiPin: async (id) => {
        const current = get().wikiArticles.find((a) => a.id === id)
        if (!current) return
        get().updateWikiArticle(id, { isPinned: !current.isPinned })
      },

      // Reset to fresh blank slate (clears both local store AND Supabase DB)
      resetAllData: async () => {
        // 1. Instantly reset local Zustand state & localStorage cache
        get().startFresh()

        // 2. Permanently delete user data from Supabase PostgreSQL tables
        try {
          await AuthService.clearAllUserData()
        } catch (err) {
          console.error('Supabase clearAllUserData error:', err)
        }
      }
    }),
    {
      name: 'finwise-v3-pure-db', // Completely clears any legacy mock records from browser localStorage
    }
  )
)


