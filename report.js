import { supabase } from './supabase-config.js'

// Vérification de la connexion
const user = JSON.parse(localStorage.getItem('user'))
if (!user) {
    window.location.href = 'index.html'
}

// Afficher le nom d'utilisateur
document.getElementById('userName').textContent = user.name

// Éléments
const alertMessage = document.getElementById('alertMessage')
const loadingSpinner = document.getElementById('loadingSpinner')
const imageUploadArea = document.getElementById('imageUploadArea')
const incidentImage = document.getElementById('incidentImage')
const imagePreview = document.getElementById('imagePreview')

// Fonction d'affichage des messages
function showAlert(message, type) {
    alertMessage.textContent = message
    alertMessage.className = `alert alert-${type}`
    alertMessage.classList.remove('hidden')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    setTimeout(() => {
        alertMessage.classList.add('hidden')
    }, 5000)
}

// Fonction Loading
function toggleLoading(show) {
    if (show) {
        loadingSpinner.classList.add('show')
    } else {
        loadingSpinner.classList.remove('show')
    }
}

// Télécharger l'image en cliquant sur la zone
imageUploadArea.addEventListener('click', () => {
    incidentImage.click()
})

// Aperçu de l'image
incidentImage.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
        // Vérifier la taille de l'image
        if (file.size > 5 * 1024 * 1024) {
            showAlert('❌ L\'image est trop volumineuse. Maximum 5MB', 'danger')
            incidentImage.value = ''
            return
        }
        
        // Aperçu de l'image
        const reader = new FileReader()
        reader.onload = (e) => {
            imagePreview.src = e.target.result
            imagePreview.classList.add('show')
        }
        reader.readAsDataURL(file)
    }
})

// Envoyer le rapport
document.getElementById('incidentForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    // Collecter les données
    const service = document.getElementById('service').value
    const drugName = document.getElementById('drugName').value.trim()
    const drugNumber = document.getElementById('drugNumber').value.trim()
    const incidentTime = document.getElementById('incidentTime').value
    const description = document.getElementById('incidentDescription').value.trim()
    
    // Équipements de protection
    const gloves = document.getElementById('gloves').checked
    const gown = document.getElementById('gown').checked
    const cap = document.getElementById('cap').checked
    const apron = document.getElementById('apron').checked
    const shoeCovers = document.getElementById('shoeCovers').checked
    
    toggleLoading(true)
    
    try {
        let imageUrl = null
        
        // 1. Télécharger l'image si elle existe
        if (incidentImage.files.length > 0) {
            const file = incidentImage.files[0]
            const fileName = `${Date.now()}_${file.name}`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('incident-images')
                .upload(fileName, file)
            
            if (uploadError) throw uploadError
            
            // Obtenir le lien de l'image
            const { data: urlData } = supabase.storage
                .from('incident-images')
                .getPublicUrl(fileName)
            
            imageUrl = urlData.publicUrl
        }
        
        // 2. Enregistrer le rapport dans la base de données
        const { error: insertError } = await supabase
            .from('incidents')
            .insert([
                {
                    user_id: user.id,
                    service: service,
                    drug_name: drugName,
                    drug_number: drugNumber,
                    incident_image_url: imageUrl,
                    incident_time: incidentTime,
                    incident_description: description,
                    wearing_gloves: gloves,
                    wearing_gown: gown,
                    wearing_cap: cap,
                    wearing_apron: apron,
                    wearing_shoe_covers: shoeCovers,
                    status: 'pending'
                }
            ])
        
        if (insertError) throw insertError
        
        toggleLoading(false)
        showAlert('✅ Rapport envoyé avec succès ! Il sera examiné par le responsable.', 'success')
        
        // Réinitialiser le formulaire
        document.getElementById('incidentForm').reset()
        imagePreview.classList.remove('show')
        
        // Redirection vers la page de confirmation après 2 secondes
        setTimeout(() => {
            window.location.href = 'confirmation.html'
        }, 2000)
        
    } catch (error) {
        toggleLoading(false)
        console.error('Erreur lors de l\'envoi du rapport:', error)
        showAlert('❌ Une erreur s\'est produite lors de l\'envoi du rapport : ' + error.message, 'danger')
    }
})

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
        localStorage.removeItem('user')
        window.location.href = 'index.html'
    }
})

// Voir les rapports précédents
document.getElementById('viewReportsBtn').addEventListener('click', () => {
    window.location.href = 'confirmation.html'
})

// Définir l'heure actuelle comme valeur par défaut
window.addEventListener('DOMContentLoaded', () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    document.getElementById('incidentTime').value = now.toISOString().slice(0, 16)
})