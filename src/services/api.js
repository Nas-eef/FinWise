// DEPRECATED: All FinWise services communicate directly with Supabase via @supabase/supabase-js.
// No separate Node.js / Express backend is required.
import { supabase } from '../lib/supabase'
export { supabase }
export default supabase
