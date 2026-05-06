const express = require('express');
const router = express.Router();
const { sendContactEmail } = require('../services/email');

router.post('/send', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, error: 'Nom, email et message requis' });
        }
        const result = await sendContactEmail({ name, email, phone, message });
        if (result.success) {
            res.json({ success: true, message: 'Message envoyé' });
        } else {
            res.status(500).json({ success: false, error: "Erreur d'envoi" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
