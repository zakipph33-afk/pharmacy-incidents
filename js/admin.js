import { supabase } from './supabase-config.js'

// Vérification des permissions d'administration
const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') {
    alert('❌ Vous n\'avez pas les permissions pour accéder à cette page')
    window.location.href = 'index.html'
}

// Afficher le nom d'utilisateur
document.getElementById('userName').textContent = user.name

// Éléments
const loadingSpinner = document.getElementById('loadingSpinner')
const reportsContainer = document.getElementById('reportsContainer')
const noReportsMessage = document.getElementById('noReportsMessage')
const reportsTableBody = document.getElementById('reportsTableBody')
const alertMessage = document.getElementById('alertMessage')
const filterStatus = document.getElementById('filterStatus')
const filterService = document.getElementById('filterService')

let currentIncidentId = null
let allIncidents = []

// Fonction d'affichage des messages
function showAlert(message, type) {
    alertMessage.textContent = message
    alertMessage.className = `alert alert-${type}`
    alertMessage.classList.remove('hidden')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => alertMessage.classList.add('hidden'), 5000)
}

// Fonction de conversion du nom du service en français
function getServiceNameFr(service) {
    const names = {
        'oncology': 'Oncologie',
        'hematology': 'Hématologie',
        'pediatric': 'Pédiatrie'
    }
    return names[service] || service
}

// Fonction de conversion du statut en français
function getStatusText(status) {
    const statuses = {
        'pending': { text: 'En attente', class: 'status-pending' },
        'reviewed': { text: 'Examiné', class: 'status-reviewed' },
        'resolved': { text: 'Résolu', class: 'status-resolved' }
    }
    return statuses[status] || { text: status, class: 'status-pending' }
}

// Fonction de formatage de la date
function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Fonction d'affichage des équipements de protection
function getPPEList(incident) {
    const ppe = []
    if (incident.wearing_gloves) ppe.push('🧤')
    if (incident.wearing_gown) ppe.push('👔')
    if (incident.wearing_cap) ppe.push('🧢')
    if (incident.wearing_apron) ppe.push('🦺')
    if (incident.wearing_shoe_covers) ppe.push('👟')
    return ppe.length > 0 ? ppe.join(' ') : '❌'
}

// Calculer les statistiques
function updateStats(incidents) {
    const total = incidents.length
    const pending = incidents.filter(i => i.status === 'pending').length
    const resolved = incidents.filter(i => i.status === 'resolved').length
    
    document.getElementById('totalIncidents').textContent = total
    document.getElementById('pendingIncidents').textContent = pending
    document.getElementById('resolvedIncidents').textContent = resolved
}

// Récupérer les rapports
async function loadReports() {
    try {
        loadingSpinner.classList.add('show')
        
        // Récupérer les rapports avec les données utilisateur
        const { data: incidents, error: incidentsError } = await supabase
            .from('incidents')
            .select(`
                *,
                users (full_name, email, department)
            `)
            .order('created_at', { ascending: false })

        if (incidentsError) throw incidentsError

        allIncidents = incidents || []
        
        loadingSpinner.classList.remove('show')

        if (allIncidents.length === 0) {
            noReportsMessage.classList.remove('hidden')
            reportsContainer.classList.add('hidden')
            return
        }

        updateStats(allIncidents)
        displayReports(allIncidents)

    } catch (error) {
        loadingSpinner.classList.remove('show')
        console.error('Erreur lors de la récupération des rapports:', error)
        showAlert('❌ Une erreur s\'est produite lors du chargement des rapports', 'danger')
    }
}

// Afficher les rapports
function displayReports(incidents) {
    if (incidents.length === 0) {
        noReportsMessage.classList.remove('hidden')
        reportsContainer.classList.add('hidden')
        return
    }

    noReportsMessage.classList.add('hidden')
    reportsContainer.classList.remove('hidden')
    
    reportsTableBody.innerHTML = incidents.map(incident => `
        <tr>
            <td>${formatDate(incident.incident_time)}</td>
            <td>
                <strong>${incident.users?.full_name || 'Inconnu'}</strong><br>
                <small style="color: #718096;">${incident.users?.email || ''}</small>
            </td>
            <td>${getServiceNameFr(incident.service)}</td>
            <td>
                <strong>${incident.drug_name}</strong><br>
                <small>${incident.drug_number}</small>
            </td>
            <td>${incident.incident_description ? (incident.incident_description.substring(0, 30) + '...') : 'Aucune'}</td>
            <td style="font-size: 18px;">${getPPEList(incident)}</td>
            <td>
                ${incident.incident_image_url ? 
                    `<a href="${incident.incident_image_url}" target="_blank" style="text-decoration: none;">📷 Voir</a>` 
                    : '❌'}
            </td>
            <td><span class="status-badge ${getStatusText(incident.status).class}">${getStatusText(incident.status).text}</span></td>
            <td>
                <button class="btn btn-primary" onclick="changeStatus('${incident.id}', '${incident.status}')" 
                        style="padding: 8px 15px; font-size: 14px; width: auto;">
                    🔄 Modifier
                </button>
            </td>
        </tr>
    `).join('')
}

// Appliquer les filtres
function applyFilters() {
    const statusFilter = filterStatus.value
    const serviceFilter = filterService.value
    
    let filtered = allIncidents
    
    if (statusFilter) {
        filtered = filtered.filter(i => i.status === statusFilter)
    }
    
    if (serviceFilter) {
        filtered = filtered.filter(i => i.service === serviceFilter)
    }
    
    displayReports(filtered)
}

// Changer le statut du rapport
window.changeStatus = function(id, currentStatus) {
    currentIncidentId = id
    document.getElementById('newStatus').value = currentStatus
    document.getElementById('statusModal').style.display = 'flex'
}

// Confirmer le changement de statut
document.getElementById('confirmStatusBtn').addEventListener('click', async () => {
    const newStatus = document.getElementById('newStatus').value
    
    try {
        const { error } = await supabase
            .from('incidents')
            .update({ status: newStatus })
            .eq('id', currentIncidentId)
        
        if (error) throw error
        
        document.getElementById('statusModal').style.display = 'none'
        showAlert('✅ Statut du rapport mis à jour avec succès', 'success')
        loadReports()
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error)
        showAlert('❌ Une erreur s\'est produite lors de la mise à jour du statut', 'danger')
    }
})

// Boutons et filtres
filterStatus.addEventListener('change', applyFilters)
filterService.addEventListener('change', applyFilters)

document.getElementById('refreshBtn').addEventListener('click', () => {
    filterStatus.value = ''
    filterService.value = ''
    loadReports()
})

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('user')
    window.location.href = 'index.html'
})

// Fermer le Modal en cliquant à l'extérieur
document.getElementById('statusModal').addEventListener('click', (e) => {
    if (e.target.id === 'statusModal') {
        e.target.style.display = 'none'
    }
})

// Charger les rapports à l'ouverture de la page
loadReports()