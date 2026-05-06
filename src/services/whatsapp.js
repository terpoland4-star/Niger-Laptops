const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '22791127870';

function generateWhatsAppLink(order) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(order.toTextFormat())}`;
}

async function sendWhatsAppOrder(order) {
    try {
        const whatsappUrl = generateWhatsAppLink(order);
        order.whatsappSent = true;
        await order.save();
        console.log(`📱 WhatsApp: ${order.orderNumber}`);
        return { success: true, url: whatsappUrl };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = { sendWhatsAppOrder, generateWhatsAppLink };
