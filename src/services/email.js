const nodemailer = require('nodemailer');

// Configuration optionnelle - ne plante pas si les variables manquent
let transporter = null;

try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: { 
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASSWORD 
            }
        });
        console.log('✅ Email service configuré');
    } else {
        console.log('⚠️ Email service désactivé (variables manquantes)');
    }
} catch (error) {
    console.log('⚠️ Email service non configuré:', error.message);
}

async function sendOrderConfirmationEmail(order) {
    if (!transporter) {
        console.log('📧 Email non envoyé (service désactivé)');
        return { success: false, error: 'Email service not configured' };
    }
    
    try {
        if (!order.customer.email) return { success: false };
        
        const html = `
            <h2>Confirmation commande - ${order.orderNumber}</h2>
            <p>Bonjour ${order.customer.name},</p>
            <p>Merci pour votre commande.</p>
            <p><strong>Total: ${order.total.toLocaleString('fr-FR')} FCFA</strong></p>
            <p>Livraison: ${order.delivery.type === 'express' ? 'Express (24-48h)' : 'Standard (3-5 jours)'}</p>
            <p>Paiement: Espèces à la livraison</p>
            <p>Un conseiller vous contactera sous 24h.</p>
            <p>Cordialement,<br>L'équipe Niger Laptop</p>
        `;
        
        await transporter.sendMail({
            from: `"Niger Laptop" <${process.env.EMAIL_USER}>`,
            to: order.customer.email,
            subject: `Confirmation commande - ${order.orderNumber}`,
            html: html
        });
        
        order.emailSent = true;
        await order.save();
        console.log(`📧 Email envoyé pour ${order.orderNumber}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur email:', error.message);
        return { success: false };
    }
}

async function sendContactEmail({ name, email, phone, message }) {
    if (!transporter) {
        console.log('📧 Email contact non envoyé (service désactivé)');
        return { success: false };
    }
    
    try {
        await transporter.sendMail({
            from: `"Formulaire Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `Nouveau message de ${name}`,
            html: `<h2>Message de ${name}</h2><p>Email: ${email}</p><p>Tél: ${phone || 'Non renseigné'}</p><p>Message: ${message}</p>`
        });
        console.log(`📧 Email contact de ${email}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur email contact:', error.message);
        return { success: false };
    }
}

module.exports = { sendOrderConfirmationEmail, sendContactEmail };
