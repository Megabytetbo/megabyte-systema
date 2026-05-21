import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eghwilmbpklgyvsapbav.supabase.co'
const supabaseKey = 'sb_publishable_epXJrh0hujVLVrDHDav_5Q_5UJW7UaA'

export const supabase = createClient(supabaseUrl, supabaseKey)