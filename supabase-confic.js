// استيراد مكتبة Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm'

// ⚠️ هنا ضع معلوماتك من ملف supabase-info.txt
const SUPABASE_URL = 'https://tewlugshhfcgkujgovjb.supabase.co' // 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2x1Z3NoaGZjZ2t1amdvdmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNjU5NTAsImV4cCI6MjA4MDg0MTk1MH0.ECW1RQ1tJveR0vc3R297nvG-jvCwKqmkCUaFHUEK2hc' 

// إنشاء عميل Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// دالة للتحقق من الاتصال
export async function checkConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1)
        if (error) throw error
        console.log('✅ الاتصال بـ Supabase نجح!')
        return true
    } catch (error) {
        console.error('❌ فشل الاتصال بـ Supabase:', error.message)
        return false
    }
}