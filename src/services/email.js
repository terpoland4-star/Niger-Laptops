const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
});

async function sendOrderConfirmationEmail(order) {
    try {
        if (!order.customer.email) return { success: false };
        const itemsList = order.items.map(item => `
            <tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.price.toLocaleString('fr-FR')} FCFA</td><td>${item.total.toLocaleString('fr-FR')} FCFA</td</tr>
        `).join('');
        await transporter.sendMail({
            from: `"Niger Laptop" <${process.env.EMAIL_USER}>`,
            to: order.customer.email,
            subject: `Confirmation commande - ${order.orderNumber}`,
            html: `<h2>Confirmation commande ${order.orderNumber}</h2><p>Merci ${order.customer.name}</p><table border="1">${itemsList}</table><p>Total: ${order.total.toLocaleString('fr-FR')} FCFA</p>`
        });
        order.emailSent = true;
        await order.save();
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

async function sendContactEmail({ name, email, phone, message }) {
    try {
        await transporter.sendMail({
            from: `"Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `Message de ${name}`,
            html: `<h2>Message de ${name}</h2><p>Email: ${email}</p><p>Tél: ${phone || 'Non'}</p><p>Message: ${message}</p>`
        });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

module.exports = { sendOrderConfirmationEmail, sendContactEmail };
