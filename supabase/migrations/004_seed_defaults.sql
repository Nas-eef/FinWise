-- ============================================================
-- 004_seed_defaults.sql
-- Seed system default categories
-- ============================================================

INSERT INTO public.categories (user_id, name, type, icon, color, is_default, is_active) VALUES
-- Expense Categories
(NULL, 'Food & Dining', 'expense', 'Utensils', '#FF7043', TRUE, TRUE),
(NULL, 'Transportation', 'expense', 'Car', '#42A5F5', TRUE, TRUE),
(NULL, 'Shopping', 'expense', 'ShoppingBag', '#AB47BC', TRUE, TRUE),
(NULL, 'Rent & Housing', 'expense', 'Home', '#26A69A', TRUE, TRUE),
(NULL, 'Bills & Utilities', 'expense', 'Zap', '#FFA726', TRUE, TRUE),
(NULL, 'Health & Medical', 'expense', 'HeartPulse', '#EF5350', TRUE, TRUE),
(NULL, 'Entertainment', 'expense', 'Film', '#8D6E63', TRUE, TRUE),
(NULL, 'Education', 'expense', 'GraduationCap', '#5C6BC0', TRUE, TRUE),
(NULL, 'Personal Care', 'expense', 'Sparkles', '#EC407A', TRUE, TRUE),
(NULL, 'Loans & EMI', 'expense', 'Landmark', '#78909C', TRUE, TRUE),
(NULL, 'Other Expenses', 'expense', 'MoreHorizontal', '#7C827C', TRUE, TRUE),

-- Income Categories
(NULL, 'Salary', 'income', 'Briefcase', '#43845A', TRUE, TRUE),
(NULL, 'Freelancing / Work', 'income', 'Laptop', '#8AAB8F', TRUE, TRUE),
(NULL, 'Business & Sales', 'income', 'Building2', '#2E7D32', TRUE, TRUE),
(NULL, 'Rental Income', 'income', 'Building', '#558B2F', TRUE, TRUE),
(NULL, 'Investments & Dividends', 'income', 'TrendingUp', '#00ACC1', TRUE, TRUE),
(NULL, 'Other Income', 'income', 'PlusCircle', '#689F38', TRUE, TRUE)
ON CONFLICT DO NOTHING;

