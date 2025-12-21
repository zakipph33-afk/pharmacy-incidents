import { supabase } from './supabase-config.js'

// Éléments
const loginForm = document.getElementById('loginForm')
const signupForm = document.getElementById('signupForm')
const showSignupBtn = document.getElementById('showSignup')
const showLoginBtn = document.getElementById('showLogin')
const alertMessage = document.getElementById('alertMessage')
const loadingSpinner = document.getElementById('loadingSpinner')

// Fonction d'affichage des messages
function showAlert(message, type) {
    alertMessage.textContent = message
    alertMessage.className = `alert alert-${type}`
    alertMessage.classList.remove('hidden')
    
    setTimeout(() => {
        alertMessage.classList.add('hidden')
    }, 5000)
}

// Fonction d'affichage/masquage du Loading
function toggleLoading(show) {
    if (show) {
        loadingSpinner.classList.add('show')
    } else {
        loadingSpinner.classList.remove('show')
    }
}

// Basculer entre Connexion et Inscription
showSignupBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    loginForm.classList.add('hidden')
    signupForm.classList.remove('hidden')
})

showLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    signupForm.classList.add('hidden')
    loginForm.classList.remove('hidden')
})

// === Créer un nouveau compte ===
document.getElementById('signupFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    console.log('🔵 بدء عملية إنشاء الحساب...')
    
    const name = document.getElementById('signupName').value.trim()
    const email = document.getElementById('signupEmail').value.trim()
    const password = document.getElementById('signupPassword').value
    const department = document.getElementById('signupDepartment').value
    
    console.log('📝 البيانات المدخلة:', { name, email, department })
    
    // Vérification des données
    if (!name || !email || !password || !department) {
        console.log('❌ حقول فارغة!')
        showAlert('❌ Veuillez remplir tous les champs', 'danger')
        return
    }
    
    if (password.length < 6) {
        console.log('❌ كلمة المرور قصيرة!')
        showAlert('❌ Le mot de passe doit contenir au moins 6 caractères', 'danger')
        return
    }
    
    console.log('🔵 بدء الاتصال بـ Supabase...')
    toggleLoading(true)
    
    try {
        console.log('🔵 محاولة إنشاء حساب في Authentication...')
        
        // 1. Créer un compte dans Authentication
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password
        })
        
        console.log('📊 نتيجة Authentication:', { authData, authError })
        
        if (authError) {
            console.error('❌ خطأ في Authentication:', authError)
            throw authError
        }
        
        console.log('✅ تم إنشاء حساب في Authentication بنجاح!')
        console.log('🔵 الآن حفظ البيانات في جدول users...')
        
        // 2. Enregistrer les données utilisateur dans la table users
        const { data: dbData, error: dbError } = await supabase
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    email: email,
                    full_name: name,
                    department: department,
                    role: 'user'
                }
            ])
        
        console.log('📊 نتيجة حفظ البيانات:', { dbData, dbError })
        
        if (dbError) {
            console.error('❌ خطأ في حفظ البيانات:', dbError)
            throw dbError
        }
        
        console.log('✅ تم حفظ البيانات في جدول users بنجاح!')
        
        toggleLoading(false)
        showAlert('✅ Compte créé avec succès! Redirection en cours...', 'success')
        
        // Enregistrer les données utilisateur
        const userData = {
            id: authData.user.id,
            email: email,
            name: name,
            department: department
        }
        console.log('💾 حفظ البيانات في localStorage:', userData)
        localStorage.setItem('user', JSON.stringify(userData))
        
        console.log('🔵 التحويل إلى report.html بعد ثانيتين...')
        setTimeout(() => {
            console.log('➡️ الآن يتم التحويل...')
            window.location.href = 'report.html'
        }, 2000)
        
    } catch (error) {
        toggleLoading(false)
        console.error('❌❌❌ خطأ كبير:', error)
        console.error('تفاصيل الخطأ:', error.message)
        console.error('الكود:', error.code)
        
        if (error.message.includes('already registered')) {
            showAlert('❌ Cet email est déjà enregistré', 'danger')
        } else {
            showAlert('❌ Une erreur s\'est produite : ' + error.message, 'danger')
        }
    }
})

// === Connexion ===
document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const email = document.getElementById('loginEmail').value.trim()
    const password = document.getElementById('loginPassword').value
    
    if (!email || !password) {
        showAlert('❌ Veuillez remplir tous les champs', 'danger')
        return
    }
    
    toggleLoading(true)
    
    try {
        // 1. Connexion
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        })
        
        if (authError) throw authError
        
        // 2. Récupérer les données utilisateur de la table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()
        
        if (userError) throw userError
        
        toggleLoading(false)
        showAlert('✅ Connexion réussie !', 'success')
        
        // Enregistrer les données utilisateur
        localStorage.setItem('user', JSON.stringify({
            id: userData.id,
            email: userData.email,
            name: userData.full_name,
            department: userData.department,
            role: userData.role
        }))
        
        setTimeout(() => {
            // Si l'utilisateur est Admin, rediriger vers le tableau de bord
            if (userData.role === 'admin') {
                window.location.href = 'admin.html'
            } else {
                window.location.href = 'report.html'
            }
        }, 1500)
        
    } catch (error) {
        toggleLoading(false)
        console.error('Erreur lors de la connexion:', error)
        
        if (error.message.includes('Invalid login credentials')) {
            showAlert('❌ Email ou mot de passe incorrect', 'danger')
        } else {
            showAlert('❌ Une erreur s\'est produite : ' + error.message, 'danger')
        }
    }
})

// Vérifier si l'utilisateur est déjà connecté
window.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession()
    
    if (data.session) {
        const user = JSON.parse(localStorage.getItem('user'))
        if (user) {
            if (user.role === 'admin') {
                window.location.href = 'admin.html'
            } else {
                window.location.href = 'report.html'
            }
        }
    }
})