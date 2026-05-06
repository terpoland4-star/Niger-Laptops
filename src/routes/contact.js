const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/email');

// Middleware CORS
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

/**
 * POST /api/contact/send
 * Envoyer un message depuis le formulaire de contact
 */
router.post('/send', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nom, email et message sont obligatoires' 
            });
        }
        
        console.log(`📧 Message contact de ${name} (${email})`);
        
        // Envoyer l'email
        const result = await sendContactEmail({ name, email, phone, message });
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Votre message a été envoyé avec succès' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: "Erreur lors de l'envoi du message" 
            });
        }
        
    } catch (error) {
        console.error('❌ Erreur envoi contact:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur interne du serveur' 
        });
    }
});

module.exports = router;
