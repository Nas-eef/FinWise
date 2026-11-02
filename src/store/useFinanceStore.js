import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { scheduleEmiNotification } from '../utils/nativeNotifications'
import { supabase } from '../lib/supabase'
import {
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
} from '../services'


const initialCategories = [
  // Expense
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#FF7043' },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#42A5F5' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#AB47BC' },
  { id: 'cat-rent', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#26A69A' },
  { id: 'cat-bills', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#FFA726' },
  { id: 'cat-health', name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#EF5350' },
  { id: 'cat-personal', name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#EC407A' },
  { id: 'cat-emi', name: 'Loans & EMI', type: 'expense', icon: 'Landmark', color: '#78909C' },
  { id: 'cat-other-exp', name: 'Other Expenses', type: 'expense', icon: 'MoreHorizontal', color: '#7C827C' },
  // Income
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#43845A' },
  { id: 'cat-freelance', name: 'Freelancing / Work', type: 'income', icon: 'Laptop', color: '#8AAB8F' },
  { id: 'cat-other-inc', name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#689F38' },
]

const initialTransactions = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 65000.00,
    categoryId: 'cat-salary',
    date: '2026-11-01',
    description: 'Monthly Tech Salary',
    notes: 'Direct salary transfer',
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 16500.00,
    categoryId: 'cat-rent',
    date: '2026-11-01',
    description: 'Apartment Rent',
    notes: 'November house rent paid via UPI',
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 2450.00,
    categoryId: 'cat-food',
    date: '2026-11-02',
    description: 'Grocery & Supermarket',
    notes: 'Weekly fresh vegetables and groceries',
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 850.00,
    categoryId: 'cat-transport',
    date: '2026-10-31',
    description: 'Fuel / Metro Recharge',
    notes: 'Weekly travel commute',
  },
  {
    id: 'tx-5',
    type: 'income',
    amount: 12000.00,
    categoryId: 'cat-freelance',
    date: '2026-10-29',
    description: 'Freelance UI Sprint',
    notes: 'Milestone payout from client',
  },
  {
    id: 'tx-6',
    type: 'expense',
    amount: 1650.00,
    categoryId: 'cat-bills',
    date: '2026-10-28',
    description: 'Wi-Fi & Electricity Bill',
    notes: 'Broadband and monthly electricity',
  }
]

// Friends Notes (Amount to get from friends vs Amount to pay to friends in Rupees)
const initialFriendsNotes = [
  {
    id: 'fn-1',
    type: 'to_get', // Lent: Friend borrowed from me, I have to get it
    personName: 'Rahul Sharma',
    amount: 3500.00,
    paidAmount: 1000.00,
    dueDate: '2026-11-10',
    note: 'Weekend trip resort booking split',
    isSettled: false,
  },
  {
    id: 'fn-2',
    type: 'to_get',
    personName: 'Priya Patel',
    amount: 1250.00,
    paidAmount: 0.00,
    dueDate: '2026-11-15',
    note: 'Concert passes advance booking',
    isSettled: false,
  },
  {
    id: 'fn-3',
    type: 'to_pay', // Borrowed: I have to pay to him
    personName: 'Amit Verma',
    amount: 2500.00,
    paidAmount: 1000.00,
    dueDate: '2026-11-12',
    note: 'Borrowed for restaurant dinner bill payment',
    isSettled: false,
  },
  {
    id: 'fn-4',
    type: 'to_pay',
    personName: 'Suresh Kumar',
    amount: 5000.00,
    paidAmount: 5000.00,
    dueDate: '2026-10-25',
    note: 'Borrowed for car tyre change emergency',
    isSettled: true,
  }
]

// Loans & EMI with 1-Day Before Push Notification in Rupees
const initialLoans = [
  {
    id: 'loan-1',
    name: 'Car Financing Loan',
    lender: 'HDFC Auto Finance',
    originalAmount: 550000,
    outstandingAmount: 280000,
    interestRate: 8.5,
    emiAmount: 9850.00,
    dueDate: '2026-11-15',
    pushNotification1DayBefore: true,
    notificationDate: '2026-11-14',
    schedule: [
      { month: 'Oct 2026', emi: 9850.00, status: 'paid', date: '2026-10-15' },
      { month: 'Nov 2026', emi: 9850.00, status: 'upcoming', date: '2026-11-15' },
      { month: 'Dec 2026', emi: 9850.00, status: 'upcoming', date: '2026-12-15' },
    ]
  },
  {
    id: 'loan-2',
    name: 'MacBook Pro EMI',
    lender: 'Bajaj Finserv',
    originalAmount: 75000,
    outstandingAmount: 25000,
    interestRate: 0,
    emiAmount: 4500.00,
    dueDate: '2026-11-20',
    pushNotification1DayBefore: true,
    notificationDate: '2026-11-19',
    schedule: [
      { month: 'Oct 2026', emi: 4500.00, status: 'paid', date: '2026-10-20' },
      { month: 'Nov 2026', emi: 4500.00, status: 'upcoming', date: '2026-11-20' },
      { month: 'Dec 2026', emi: 4500.00, status: 'upcoming', date: '2026-12-20' },
    ]
  }
]

const initialNotifications = [
  {
    id: 'notif-1',
    title: '⏰ 1-Day EMI Due Alert',
    message: 'Your Car Financing EMI of ₹9,850.00 is due tomorrow (Nov 15).',
    time: 'Auto-Scheduled (1 Day Before)',
    read: false,
    type: 'emi_reminder'
  },
  {
    id: 'notif-2',
    title: '⏰ 1-Day EMI Due Alert',
    message: 'MacBook Pro EMI of ₹4,500.00 is due in 1 day (Nov 20).',
    time: 'Upcoming',
    read: false,
    type: 'emi_reminder'
  },
  {
    id: 'notif-3',
    title: 'Budget Status',
    message: 'Your monthly spending is on track within your ₹45,000 budget.',
    time: 'Yesterday',
    read: true,
    type: 'info'
  }
]

const defaultExpenseGroups = [
  { id: 'grp-pg', name: 'PG Expenses', icon: 'Home', color: '#26A69A' },
  { id: 'grp-personal', name: 'Personal & Living', icon: 'User', color: '#43845A' },
  { id: 'grp-office', name: 'Office / Work', icon: 'Briefcase', color: '#42A5F5' },
]

// Sample Accounts
const sampleAccounts = [
  { id: 'acc-1', name: 'HDFC Bank Salary A/c', type: 'bank', balance: 48500.00, institution: 'HDFC Bank', isDefault: true, color: '#26A69A' },
  { id: 'acc-2', name: 'Paytm UPI Wallet', type: 'wallet', balance: 4250.00, institution: 'Paytm Payments', isDefault: false, color: '#42A5F5' },
  { id: 'acc-3', name: 'Cash in Hand', type: 'cash', balance: 11500.00, institution: 'Cash', isDefault: false, color: '#43845A' },
]

// Sample Savings Goals
const sampleSavingsGoals = [
  { id: 'sg-1', name: 'Emergency Vault', targetAmount: 150000.00, currentAmount: 45000.00, targetDate: '2026-12-31', icon: 'ShieldCheck', color: '#26A69A', notes: '6 months living expenses' },
  { id: 'sg-2', name: 'Goa Vacation Trip', targetAmount: 35000.00, currentAmount: 22000.00, targetDate: '2026-11-28', icon: 'Palmtree', color: '#FFA726', notes: 'Flights and resort booking' },
  { id: 'sg-3', name: 'MacBook M3 Upgrade', targetAmount: 120000.00, currentAmount: 65000.00, targetDate: '2027-02-15', icon: 'Laptop', color: '#AB47BC', notes: 'Work machine upgrade' },
]

// Sample Recurring Bills & Subscriptions
const sampleRecurring = [
  { id: 'rec-1', name: 'Netflix Premium (4K)', amount: 649.00, categoryId: 'cat-bills', frequency: 'monthly', nextBillingDate: '2026-11-14', status: 'active', autoPay: true },
  { id: 'rec-2', name: 'High-Speed Fiber Wi-Fi', amount: 999.00, categoryId: 'cat-bills', frequency: 'monthly', nextBillingDate: '2026-11-10', status: 'active', autoPay: false },
  { id: 'rec-3', name: 'Cult.fit Gym & Fitness', amount: 1500.00, categoryId: 'cat-health', frequency: 'monthly', nextBillingDate: '2026-11-25', status: 'active', autoPay: true },
  { id: 'rec-4', name: 'Spotify Music Family', amount: 179.00, categoryId: 'cat-bills', frequency: 'monthly', nextBillingDate: '2026-11-05', status: 'paused', autoPay: false },
]

// Sample Reminders
const sampleReminders = [
  { id: 'rem-1', title: 'Pay Electricity & Water Bill', amount: 1850.00, dueDate: '2026-11-08', completed: false, categoryId: 'cat-bills', notes: 'Due before late fee penalty' },
  { id: 'rem-2', title: 'Broadband Wi-Fi Payment', amount: 999.00, dueDate: '2026-11-10', completed: false, categoryId: 'cat-bills', notes: 'Airtel Fiber invoice' },
  { id: 'rem-3', title: 'Car EMI Bank Deduction', amount: 9850.00, dueDate: '2026-11-15', completed: false, categoryId: 'cat-emi', notes: 'Ensure sufficient balance in HDFC' },
]

// Sample Debts
const sampleDebts = [
  { id: 'deb-1', personName: 'Rahul Sharma', type: 'receivable', amount: 3500.00, paidAmount: 1000.00, dueDate: '2026-11-10', notes: 'Weekend resort booking split', settled: false },
  { id: 'deb-2', personName: 'Priya Patel', type: 'receivable', amount: 1250.00, paidAmount: 0.00, dueDate: '2026-11-15', notes: 'Concert passes advance booking', settled: false },
  { id: 'deb-3', personName: 'Amit Verma', type: 'payable', amount: 2500.00, paidAmount: 1000.00, dueDate: '2026-11-12', notes: 'Dinner restaurant bill split', settled: false },
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
      expenseGroups: defaultExpenseGroups,
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


      // UI state
      isAddTransactionOpen: false,
      transactionToEdit: null,
      openAddTransaction: (initialData = null) => set({ isAddTransactionOpen: true, transactionToEdit: initialData }),
      closeAddTransaction: () => set({ isAddTransactionOpen: false, transactionToEdit: null }),

      // Update User
      updateUser: (updated) => set((state) => ({ user: { ...state.user, ...updated } })),

      // Switch or login user (starts completely FRESH for new account)
      setUser: (userData) => {
        const state = get()
        const targetEmail = userData?.email || userData?.id || 'authenticated'
        const isNewUser = state.currentUserId !== targetEmail

        if (isNewUser) {
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
          })
          // Synchronize from Supabase for this authenticated user
          setTimeout(() => get().syncWithSupabase(), 100)
        } else {
          set({
            user: { ...state.user, ...userData, isAuthenticated: true }
          })
          setTimeout(() => get().syncWithSupabase(), 100)
        }
      },

      /**
       * Sync complete user financial data directly from Supabase
       */
      syncWithSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
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
          ])

          const updates = {}
          if (accountsRes.status === 'fulfilled' && accountsRes.value && accountsRes.value.length > 0) {
            updates.accounts = accountsRes.value
            const totalAccBal = accountsRes.value.reduce((sum, a) => sum + (Number(a.balance) || 0), 0)
            updates.totalBalance = Math.round(totalAccBal * 100) / 100
          }
          if (txsRes.status === 'fulfilled' && txsRes.value) {
            updates.transactions = txsRes.value
            // If total balance was not derived from accounts, calculate net ledger from transactions
            if (updates.totalBalance === undefined) {
              let net = 0
              txsRes.value.forEach((t) => {
                const amt = Number(t.amount) || 0
                if (t.type === 'income' || t.type === 'refund') net += amt
                else if (t.type === 'expense') net -= amt
              })
              updates.totalBalance = Math.round(net * 100) / 100
            }
          }
          if (categoriesRes.status === 'fulfilled' && categoriesRes.value && categoriesRes.value.length > 0) {
            updates.categories = categoriesRes.value
          }
          if (budgetRes.status === 'fulfilled' && budgetRes.value) {
            updates.budgets = budgetRes.value
            if (budgetRes.value.monthlyLimit > 0) {
              updates.monthlyBudget = budgetRes.value.monthlyLimit
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

          set((state) => ({ ...state, ...updates }))
        } catch (err) {
          console.warn('Sync with Supabase note:', err)
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
        })
      },

      // Reset to a clean fresh blank slate
      startFresh: () => {
        set(() => ({
          totalBalance: 0.00,
          monthlyBudget: 0.00,
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
        }))
      },

      // Load mock demo data for preview
      loadSampleData: () => {
        set({
          totalBalance: 64250.00,
          monthlyBudget: 45000.00,
          categories: initialCategories,
          transactions: initialTransactions,
          friendsNotes: initialFriendsNotes,
          loans: initialLoans,
          notifications: initialNotifications,
          accounts: sampleAccounts,
          budgets: {
            monthlyLimit: 45000.00,
            categoryLimits: {
              'cat-food': 8000,
              'cat-rent': 18000,
              'cat-transport': 3000,
              'cat-bills': 4000,
              'cat-shopping': 5000,
            },
          },
          savingsGoals: sampleSavingsGoals,
          recurring: sampleRecurring,
          reminders: sampleReminders,
          debts: sampleDebts,
        })
      },


      // Balance & Budget Actions
      updateTotalBalance: (balance) => set({ totalBalance: Number(balance) || 0 }),
      updateMonthlyBudget: (budget) => set({ monthlyBudget: Number(budget) || 0 }),

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
        return newGroup
      },
      deleteExpenseGroup: (id) => {
        set((state) => ({
          expenseGroups: state.expenseGroups.filter((g) => g.id !== id),
          transactions: state.transactions.map((t) => (t.groupId === id ? { ...t, groupId: null } : t)),
        }))
      },

      // Transactions
      addTransaction: (tx) => {
        const id = tx.id || `tx-${Date.now()}`
        const amount = Number(tx.amount) || 0
        const isExpense = tx.type === 'expense'

        set((state) => ({
          transactions: [{ ...tx, id, groupId: tx.groupId || null }, ...state.transactions],
          totalBalance: Math.round((state.totalBalance + (isExpense ? -amount : amount)) * 100) / 100,
          isAddTransactionOpen: false,
          transactionToEdit: null,
        }))

        // Direct Supabase persist
        TransactionService.createTransaction(tx)
          .then((saved) => {
            if (saved?.id) {
              set((state) => ({
                transactions: state.transactions.map((t) => (t.id === id ? { ...t, id: saved.id } : t)),
              }))
            }
          })
          .catch((err) => console.warn('Supabase createTransaction note:', err))
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
        set((state) => ({
          friendsNotes: state.friendsNotes.map((n) => (n.id === id ? { ...n, ...updated } : n)),
        }))
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
      updateMonthlyBudgetLimit: (limit) => {
        const num = Number(limit) || 0
        set((state) => ({
          monthlyBudget: num,
          budgets: {
            ...state.budgets,
            monthlyLimit: num,
          },
        }))
        BudgetService.updateMonthlyBudgetLimit(num).catch((err) =>
          console.warn('Supabase updateMonthlyBudgetLimit note:', err)
        )
      },
      setCategoryBudget: (catId, limit) => {
        const num = Number(limit) || 0
        const budgetId = get().budgets?.budgetId
        set((state) => ({
          budgets: {
            ...state.budgets,
            categoryLimits: {
              ...(state.budgets?.categoryLimits || {}),
              [catId]: num,
            },
          },
        }))
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

      // Reset to fresh blank slate
      resetAllData: () => {
        get().startFresh()
      }
    }),
    {
      name: 'finwise-live-user-data', // fresh store namespace: cleans all old mock records for real users
    }
  )
)


